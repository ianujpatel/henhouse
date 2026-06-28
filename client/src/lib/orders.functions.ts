import { api } from "./api-client";

export const placeOrder = async ({ data }: { data: any }) => {
  const res = await api.post("/api/orders/place", data);
  return res.data;
};

export const listMyOrders = async () => {
  const res = await api.get("/api/orders/my-orders");
  return res.data;
};

export const listFarmerOrders = async () => {
  const res = await api.get("/api/orders/farmer-orders");
  return res.data;
};
