import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Listing from "../models/Listing";
import FeedProduct from "../models/FeedProduct";
import InventoryMovement from "../models/InventoryMovement";
import Notification from "../models/Notification";
import User from "../models/User";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export const placeOrder = async (req: AuthRequest, res: Response): Promise<any> => {
  return res.status(400).json({ message: "Use checkout endpoints instead" });
};

// Create Checkout Session (supports Razorpay and COD)
export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!req.user.roles.includes("buyer")) {
      return res.status(403).json({ message: "Forbidden: Only buyers can place orders" });
    }

    const { items, notes, delivery, paymentMethod = "razorpay" } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid order items" });
    }

    if (!delivery || !delivery.fullName || !delivery.mobile || !delivery.address || !delivery.city || !delivery.state || !delivery.district || !delivery.pincode) {
      return res.status(400).json({ message: "Missing required delivery details" });
    }

    if (paymentMethod !== "razorpay" && paymentMethod !== "cod") {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    let total = 0;
    const orderItemsToCreate: any[] = [];

    // Verify stock and calculate total (All products are in Listing collection now!)
    for (const item of items) {
      const listingId = item.listing_id || item.feed_product_id;
      if (!listingId) {
        throw new Error("Missing listing_id in item");
      }

      const listing = await Listing.findById(listingId).session(session);
      if (!listing) {
        throw new Error(`Product not found: ${listingId}`);
      }
      if (listing.status !== "live") {
        throw new Error(`Product is no longer available: ${listing.title}`);
      }
      if (listing.buyer_price === undefined || listing.buyer_price === null) {
        throw new Error(`Product is not priced: ${listing.title}`);
      }
      if (item.quantity > listing.quantity) {
        throw new Error(`Only ${listing.quantity} available for ${listing.title}`);
      }

      total += listing.buyer_price * item.quantity;

      orderItemsToCreate.push({
        product_type: listing.category === "feed" ? "feed" : "chicken",
        listing_id: listing._id,
        farmer_id: listing.farmer_id,
        quantity: item.quantity,
        unit_buyer_price: listing.buyer_price,
        unit_farmer_price: listing.farmer_price,
      });
    }

    // Add ₹60 fixed shipping fee
    total += 60;

    const isCod = paymentMethod === "cod";

    // Create Order in DB
    const orderResult = await Order.create(
      [
        {
          buyer_id: req.user.id,
          total,
          notes: notes || undefined,
          status: isCod ? "placed" : "pending",
          payment_status: "pending",
          payment_method: paymentMethod,
          delivery_full_name: delivery.fullName,
          delivery_mobile: delivery.mobile,
          delivery_alternate_mobile: delivery.alternateMobile || undefined,
          delivery_address: delivery.address,
          delivery_landmark: delivery.landmark || undefined,
          delivery_city: delivery.city,
          delivery_state: delivery.state,
          delivery_district: delivery.district,
          delivery_pincode: delivery.pincode,
          delivery_notes: delivery.notes || undefined,
        },
      ],
      { session }
    );
    const newOrder = orderResult[0];

    // Create Order Items
    const itemsWithOrderId = orderItemsToCreate.map((oi) => ({
      ...oi,
      order_id: newOrder._id,
    }));
    await OrderItem.insertMany(itemsWithOrderId, { session });

    if (isCod) {
      // For COD, finalize inventory immediately since order is placed directly
      for (const item of orderItemsToCreate) {
        const listing = await Listing.findById(item.listing_id).session(session);
        if (!listing) throw new Error("Listing not found");

        if (item.quantity > listing.quantity) {
          throw new Error(`Not enough stock for ${listing.title}`);
        }

        listing.quantity -= item.quantity;
        if (listing.quantity === 0) {
          listing.status = "sold_out";
        }
        await listing.save({ session });

        // Log movement
        await InventoryMovement.create(
          [
            {
              listing_id: listing._id,
              delta: -item.quantity,
              reason: "sold",
            },
          ],
          { session }
        );

        // Notify seller
        await Notification.create(
          [
            {
              user_id: listing.farmer_id,
              type: "order.new",
              title: "New order received (COD)",
              body: `${item.quantity} × ${listing.title}`,
            },
          ],
          { session }
        );
      }

      // Notify admins
      const admins = await User.find({ roles: "admin" }).session(session);
      if (admins.length > 0) {
        const adminNotifications = admins.map((admin) => ({
          user_id: admin._id,
          type: "order.placed",
          title: "New COD order placed",
          body: `Order #${newOrder._id.toString().slice(-8)}`,
        }));
        await Notification.insertMany(adminNotifications, { session });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        paymentMethod: "cod",
        order_id: newOrder._id.toString(),
        total,
      });
    } else {
      // For Razorpay, generate key and session (no inventory deduction yet, that's done on verification)
      let razorpayOrder;
      try {
        const options = {
          amount: Math.round(total * 100), // paisa
          currency: "INR",
          receipt: newOrder._id.toString(),
        };
        razorpayOrder = await razorpay.orders.create(options);
      } catch (rzpErr: any) {
        throw new Error(`Razorpay Order creation failed: ${rzpErr.message}`);
      }

      newOrder.razorpay_order_id = razorpayOrder.id;
      await newOrder.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        paymentMethod: "razorpay",
        key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
        razorpay_order_id: razorpayOrder.id,
        order_id: newOrder._id.toString(),
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        total,
      });
    }
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(400).json({ message: error.message || "Failed to initiate checkout" });
  }
};

// Verify Razorpay Payment
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return res.status(400).json({ message: "Missing verification details" });
    }

    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const key = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    const generatedSignature = crypto
      .createHmac("sha256", key)
      .update(text)
      .digest("hex");

    const order = await Order.findById(order_id).session(session);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order is already processed" });
    }

    if (generatedSignature !== razorpay_signature) {
      order.payment_status = "failed";
      await order.save({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Success
    order.status = "placed";
    order.payment_status = "paid";
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    await order.save({ session });

    // Fetch order items to adjust inventory
    const orderItems = await OrderItem.find({ order_id: order._id }).session(session);

    for (const item of orderItems) {
      const listingId = item.listing_id || item.feed_product_id;
      if (!listingId) continue;

      const listing = await Listing.findById(listingId).session(session);
      if (!listing) throw new Error("Listing not found");

      if (item.quantity > listing.quantity) {
        throw new Error(`Not enough stock for ${listing.title}`);
      }

      listing.quantity -= item.quantity;
      if (listing.quantity === 0) {
        listing.status = "sold_out";
      }
      await listing.save({ session });

      // Log movement
      await InventoryMovement.create(
        [
          {
            listing_id: listing._id,
            delta: -item.quantity,
            reason: "sold",
          },
        ],
        { session }
      );

      // Notify seller
      await Notification.create(
        [
          {
            user_id: listing.farmer_id,
            type: "order.new",
            title: "New order received (Paid)",
            body: `${item.quantity} × ${listing.title}`,
          },
        ],
        { session }
      );
    }

    // Notify admins
    const admins = await User.find({ roles: "admin" }).session(session);
    if (admins.length > 0) {
      const adminNotifications = admins.map((admin) => ({
        user_id: admin._id,
        type: "order.placed",
        title: "New paid order placed",
        body: `Order #${order._id.toString().slice(-8)}`,
      }));
      await Notification.insertMany(adminNotifications, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true, order_id: order._id.toString() });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(400).json({ message: error.message || "Failed to verify payment" });
  }
};

// Retry Payment
export const retryPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { order_id } = req.body;
    const order = await Order.findById(order_id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order is already paid/processed" });
    }

    const options = {
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order._id.toString(),
    };
    const razorpayOrder = await razorpay.orders.create(options);

    order.razorpay_order_id = razorpayOrder.id;
    await order.save();

    return res.json({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      razorpay_order_id: razorpayOrder.id,
      order_id: order._id.toString(),
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      total: order.total,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// Get Invoice
export const getInvoice = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;
    const order = await Order.findById(id).populate("buyer_id", "full_name email phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.buyer_id._id.toString() !== req.user.id && !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const items = await OrderItem.find({ order_id: order._id })
      .populate("listing_id", "title breed category");

    return res.json({
      order,
      items,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// List My Orders
export const listMyOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const orders = await Order.find({ buyer_id: req.user.id })
      .select("id status total placed_at notes payment_status payment_method razorpay_payment_id")
      .sort({ placed_at: -1 });

    const orderIds = orders.map((o) => o._id);
    const orderItems = await OrderItem.find({ order_id: { $in: orderIds } })
      .populate("listing_id", "title breed image_urls unit category");

    const itemsMap = new Map<string, any[]>();
    for (const item of orderItems) {
      const oId = item.order_id.toString();
      itemsMap.set(oId, [...(itemsMap.get(oId) ?? []), item]);
    }

    const result = orders.map((order) => {
      const json = order.toJSON();
      return {
        ...json,
        items: itemsMap.get(order._id.toString()) ?? [],
      };
    });

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// List Farmer Orders
export const listFarmerOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!req.user.roles.includes("farmer") && !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const orderItems = await OrderItem.find({ farmer_id: req.user.id })
      .populate({
        path: "order_id",
        select: "status delivery_full_name delivery_mobile delivery_alternate_mobile delivery_address delivery_landmark delivery_city delivery_state delivery_district delivery_pincode delivery_notes total payment_method payment_status"
      })
      .populate("listing_id", "title image_urls breed unit category")
      .sort({ created_at: -1 });

    const result = orderItems.map((item) => {
      const itemJson = item.toJSON() as any;
      const order = itemJson.order_id;
      return {
        ...itemJson,
        order_id: order ? order._id.toString() : itemJson.order_id,
        status: order ? order.status : "placed",
        delivery: order ? {
          full_name: order.delivery_full_name,
          mobile: order.delivery_mobile,
          alternate_mobile: order.delivery_alternate_mobile,
          address: order.delivery_address,
          landmark: order.delivery_landmark,
          city: order.delivery_city,
          state: order.delivery_state,
          district: order.delivery_district,
          pincode: order.delivery_pincode,
          notes: order.delivery_notes,
        } : null
      };
    });

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
