import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import Listing from "../models/Listing";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Notification from "../models/Notification";
import Settings from "../models/Settings";

export const adminListUsers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const users = await User.find({}).select("-password").sort({ created_at: -1 });

    const result = users.map((user) => ({
      id: user._id.toString(),
      full_name: user.full_name,
      phone: user.phone,
      farm_name: user.farm_name,
      status: user.status,
      roles: user.roles,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminSetUserStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId, status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;
    await user.save();

    // Create Notification
    await Notification.create({
      user_id: user._id,
      type: "account." + status,
      title:
        status === "approved"
          ? "Your account has been approved"
          : status === "rejected"
          ? "Your account was not approved"
          : "Account marked pending",
      body:
        status === "approved"
          ? "Welcome aboard — you can now use the marketplace."
          : null,
    });

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminListAllListings = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const listings = await Listing.find({})
      .populate("farmer_id", "full_name farm_name")
      .sort({ created_at: -1 });

    // Format population to include profiles: `{ ..., profiles: { full_name, farm_name } }`
    const result = listings.map((listing) => {
      const lJson = listing.toJSON() as any;
      const farmer: any = lJson.farmer_id;
      delete lJson.farmer_id;
      return {
        ...lJson,
        farmer_id: farmer ? farmer._id.toString() : null,
        profiles: farmer
          ? {
              full_name: farmer.full_name,
              farm_name: farmer.farm_name,
            }
          : null,
      };
    });

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminSetBuyerPrice = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id, buyer_price, publish } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.buyer_price = buyer_price;
    listing.status = publish ? "live" : "pending_pricing";
    await listing.save();

    if (publish) {
      await Notification.create({
        user_id: listing.farmer_id,
        type: "listing.live",
        title: "Your listing is now live",
        body: listing.title,
      });
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminListAllOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const orders = await Order.find({})
      .populate("buyer_id", "full_name")
      .sort({ placed_at: -1 });

    const orderIds = orders.map((o) => o._id);
    const orderItems = await OrderItem.find({ order_id: { $in: orderIds } });

    // Group items by order_id
    const itemsMap = new Map<string, any[]>();
    for (const item of orderItems) {
      const oId = item.order_id.toString();
      itemsMap.set(oId, [...(itemsMap.get(oId) ?? []), item.toJSON()]);
    }

    const result = orders.map((order) => {
      const oJson = order.toJSON() as any;
      const buyer: any = oJson.buyer_id;
      delete oJson.buyer_id;

      return {
        ...oJson,
        buyer_id: buyer ? buyer._id.toString() : null,
        buyer: buyer ? { full_name: buyer.full_name } : null,
        items: itemsMap.get(order._id.toString()) ?? [],
      };
    });

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminSetOrderStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id, status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    await Notification.create({
      user_id: order.buyer_id,
      type: "order." + status,
      title: `Order ${status}`,
      body: `Your order is now ${status}.`,
    });

    if (oldStatus === "pending" && status === "placed") {
      const items = await OrderItem.find({ order_id: order._id });
      for (const item of items) {
        await Notification.create({
          user_id: item.farmer_id,
          type: "order.approved",
          title: "Order Approved by Admin",
          body: `Order #${order._id.toString().slice(-8)} has been approved by the admin.`,
        });
      }
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminAnalytics = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [orderItems, orders, listings, users] = await Promise.all([
      OrderItem.find({}),
      Order.find({}),
      Listing.find({}),
      User.find({}).select("id status full_name farm_name"),
    ]);

    let revenue = 0;
    let margin = 0;
    const farmerTotals = new Map<string, number>();

    const fulfilledOrderIds = new Set(
      orders
        .filter((o) => o.status === "fulfilled")
        .map((o) => o._id.toString())
    );

    for (const it of orderItems) {
      if (!fulfilledOrderIds.has(it.order_id.toString())) {
        continue;
      }
      const r = it.unit_buyer_price * it.quantity;
      const f = it.unit_farmer_price * it.quantity;
      revenue += r;
      margin += r - f;

      const fId = it.farmer_id.toString();
      farmerTotals.set(fId, (farmerTotals.get(fId) ?? 0) + r);
    }

    // Sales by day (last 14 days)
    const byDay = new Map<string, number>();
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      byDay.set(d, 0);
    }

    for (const o of orders) {
      if (o.status !== "fulfilled") {
        continue;
      }
      const d = new Date(o.placed_at).toISOString().slice(0, 10);
      if (byDay.has(d)) {
        byDay.set(d, (byDay.get(d) ?? 0) + o.total);
      }
    }

    const profilesById = new Map(users.map((u) => [u._id.toString(), u]));

    const topFarmers = [...farmerTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, total]) => {
        const profile = profilesById.get(id);
        return {
          id,
          total,
          name: profile?.farm_name || profile?.full_name || "Unknown",
        };
      });

    return res.json({
      counts: {
        users: users.length,
        pendingUsers: users.filter((u) => u.status === "pending").length,
        listings: listings.length,
        liveListings: listings.filter((l) => l.status === "live").length,
        pendingPricing: listings.filter((l) => l.status === "pending_pricing").length,
        orders: orders.length,
      },
      revenue,
      margin,
      salesByDay: [...byDay.entries()].map(([date, total]) => ({ date, total })),
      topFarmers,
      lowStock: listings.filter((l) => l.status === "live" && l.quantity <= 5).length,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminGetSettings = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const autoApproveSetting = await Settings.findOne({ key: "auto_approve_users" });
    const autoApprove = autoApproveSetting ? !!autoApproveSetting.value : false;
    return res.json({ auto_approve_users: autoApprove });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminUpdateSettings = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { auto_approve_users } = req.body;
    if (typeof auto_approve_users !== "boolean") {
      return res.status(400).json({ message: "Invalid settings data" });
    }
    await Settings.findOneAndUpdate(
      { key: "auto_approve_users" },
      { value: auto_approve_users },
      { upsert: true, new: true }
    );
    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

