import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Listing from "../models/Listing";
import InventoryMovement from "../models/InventoryMovement";
import Notification from "../models/Notification";
import User from "../models/User";

export const placeOrder = async (req: AuthRequest, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Role check (must be buyer)
    if (!req.user.roles.includes("buyer")) {
      return res.status(403).json({ message: "Forbidden: Only buyers can place orders" });
    }

    // Approval check
    if (req.user.status !== "approved") {
      return res.status(403).json({ message: "Forbidden: Account not approved" });
    }

    const { items, notes, delivery } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid order items" });
    }

    if (!delivery || !delivery.fullName || !delivery.mobile || !delivery.address || !delivery.city || !delivery.state || !delivery.district || !delivery.pincode) {
      return res.status(400).json({ message: "Missing required delivery details" });
    }

    const listingIds = items.map((i: any) => i.listing_id);
    const listings = await Listing.find({ _id: { $in: listingIds } }).session(session);
    const listingsMap = new Map(listings.map((l) => [l._id.toString(), l]));

    let total = 0;
    const orderItemsToCreate = [];

    // Verify stock and price
    for (const item of items) {
      const listing = listingsMap.get(item.listing_id);
      if (!listing) {
        throw new Error(`Listing not found: ${item.listing_id}`);
      }
      if (listing.status !== "live") {
        throw new Error(`Listing is not live: ${listing.title}`);
      }
      if (listing.buyer_price === undefined || listing.buyer_price === null) {
        throw new Error(`Listing is not priced: ${listing.title}`);
      }
      if (item.quantity > listing.quantity) {
        throw new Error(`Only ${listing.quantity} available for ${listing.title}`);
      }

      total += listing.buyer_price * item.quantity;

      orderItemsToCreate.push({
        listing_id: listing._id,
        farmer_id: listing.farmer_id,
        quantity: item.quantity,
        unit_buyer_price: listing.buyer_price,
        unit_farmer_price: listing.farmer_price,
      });
    }

    // Create Order
    const order = await Order.create(
      [
        {
          buyer_id: req.user.id,
          total,
          notes: notes || undefined,
          status: "pending",
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
    const newOrderId = order[0]._id;

    // Create Order Items
    const itemsWithOrderId = orderItemsToCreate.map((oi) => ({
      ...oi,
      order_id: newOrderId,
    }));
    await OrderItem.insertMany(itemsWithOrderId, { session });

    // Decrement inventory and log movements
    for (const item of items) {
      const listing = listingsMap.get(item.listing_id)!;
      const newQty = listing.quantity - item.quantity;
      listing.quantity = newQty;
      if (newQty === 0) {
        listing.status = "sold_out";
      }
      await listing.save({ session });

      // Inventory movement log
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

      // Notify farmer
      await Notification.create(
        [
          {
            user_id: listing.farmer_id,
            type: "order.new",
            title: "New order received",
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
        title: "New order placed",
        body: `Order #${newOrderId.toString().slice(-8)}`,
      }));
      await Notification.insertMany(adminNotifications, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ id: newOrderId.toString(), total });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(400).json({ message: error.message || "Failed to place order" });
  }
};

export const listMyOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const orders = await Order.find({ buyer_id: req.user.id })
      .select("id status total placed_at notes")
      .sort({ placed_at: -1 });

    const orderIds = orders.map((o) => o._id);
    const orderItems = await OrderItem.find({ order_id: { $in: orderIds } })
      .select("id quantity unit_buyer_price listing_id order_id");

    // Group items by order_id
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

export const listFarmerOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!req.user.roles.includes("farmer")) {
      return res.status(403).json({ message: "Forbidden: Only farmers can view their orders" });
    }

    const orderItems = await OrderItem.find({ farmer_id: req.user.id })
      .populate({
        path: "order_id",
        select: "status delivery_full_name delivery_mobile delivery_alternate_mobile delivery_address delivery_landmark delivery_city delivery_state delivery_district delivery_pincode delivery_notes"
      })
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
