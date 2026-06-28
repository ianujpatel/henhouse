import { api } from "./api-client";

export const adminListUsers = async () => {
  const res = await api.get("/api/admin/users");
  return res.data;
};

export const adminSetUserStatus = async ({ data }: { data: { userId: string; status: "pending" | "approved" | "rejected" } }) => {
  const res = await api.post("/api/admin/set-user-status", data);
  return res.data;
};

/** Admin sees everything including farmer_price. */
export const adminListAllListings = async () => {
  const res = await api.get("/api/admin/listings");
  return res.data;
};

export const adminSetBuyerPrice = async ({ data }: { data: { id: string; buyer_price: number; publish?: boolean } }) => {
  const res = await api.post("/api/admin/set-buyer-price", data);
  return res.data;
};

export const adminListAllOrders = async () => {
  const res = await api.get("/api/admin/orders");
  return res.data;
};

export const adminSetOrderStatus = async ({ data }: { data: { id: string; status: "placed" | "confirmed" | "fulfilled" | "cancelled" } }) => {
  const res = await api.post("/api/admin/set-order-status", data);
  return res.data;
};

export const adminAnalytics = async () => {
  const res = await api.get("/api/admin/analytics");
  return res.data;
};

export const adminGetSettings = async () => {
  const res = await api.get("/api/admin/settings");
  return res.data;
};

export const adminUpdateSettings = async ({ data }: { data: { auto_approve_users: boolean } }) => {
  const res = await api.post("/api/admin/settings", data);
  return res.data;
};

