import { api } from "./api-client";

export const listMyNotifications = async () => {
  const res = await api.get("/api/notifications/my-notifications");
  return res.data;
};

export const markNotificationRead = async ({ data }: { data: { id: string } }) => {
  const res = await api.post(`/api/notifications/mark-read/${data.id}`);
  return res.data;
};
