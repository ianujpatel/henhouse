import { api } from "./api-client";

/** Returns the current user's profile, roles, and status. */
export const getMe = async () => {
  const res = await api.get("/api/auth/me");
  return res.data;
};

export const updateMyProfile = async ({ data }: { data: { full_name: string; phone?: string | null; farm_name?: string | null } }) => {
  const res = await api.post("/api/auth/update-profile", data);
  return res.data;
};
