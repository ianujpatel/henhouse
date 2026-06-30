import { api } from "./api-client";

export const placeOrder = async ({ data }: { data: any }) => {
  // Deprecated: use checkout + verify instead
  const res = await api.post("/api/orders/checkout", data);
  return res.data;
};

export const createCheckoutSession = async ({ data }: { data: any }) => {
  const res = await api.post("/api/orders/checkout", data);
  return res.data;
};

export const verifyPayment = async ({ data }: { data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; order_id: string } }) => {
  const res = await api.post("/api/orders/verify", data);
  return res.data;
};

export const retryPayment = async ({ data }: { data: { order_id: string } }) => {
  const res = await api.post("/api/orders/retry", data);
  return res.data;
};

export const getInvoice = async ({ data }: { data: { id: string } }) => {
  const res = await api.get(`/api/orders/${data.id}/invoice`);
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
