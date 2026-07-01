import { api } from "./api-client";

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  farm_name?: string;
  roles?: string[];
  status?: string;
}

export const auth = {
  signUp: async ({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: any;
  }) => {
    try {
      const payload = {
        email,
        password,
        full_name: options?.data?.full_name,
        phone: options?.data?.phone,
        farm_name: options?.data?.farm_name,
        role: options?.data?.role,
      };

      const res = await api.post("/api/auth/register", payload);
      const { user, session } = res.data;

      // Save session locally
      localStorage.setItem("henhouse_token", session.access_token);
      localStorage.setItem("henhouse_user", JSON.stringify(user));

      return { data: { user }, error: null };
    } catch (err: any) {
      return { data: { user: null }, error: { message: err.message } };
    }
  },

  signInWithPassword: async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { user, session } = res.data;

      // Save session locally
      localStorage.setItem("henhouse_token", session.access_token);
      localStorage.setItem("henhouse_user", JSON.stringify(user));

      return { data: { session, user }, error: null };
    } catch (err: any) {
      return { data: { session: null, user: null }, error: { message: err.message } };
    }
  },

  signOut: async () => {
    localStorage.removeItem("henhouse_token");
    localStorage.removeItem("henhouse_user");
    return { error: null };
  },

  getSession: async () => {
    const token = localStorage.getItem("henhouse_token");
    const userStr = localStorage.getItem("henhouse_user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          data: {
            session: {
              access_token: token,
              user,
            },
          },
          error: null,
        };
      } catch (e) {
        return { data: { session: null }, error: null };
      }
    }
    return { data: { session: null }, error: null };
  },

  getUser: async () => {
    const token = localStorage.getItem("henhouse_token");
    if (!token) {
      return { data: { user: null }, error: new Error("No session token found") };
    }

    try {
      // Fetch fresh profile from getMe endpoint which verifies the token
      const res = await api.get("/api/auth/me");
      const { userId, profile, roles } = res.data;

      const user: User = {
        id: userId,
        email: profile.email || "", // Default if not directly stored in profile
        full_name: profile.full_name,
        phone: profile.phone,
        farm_name: profile.farm_name,
        roles,
        status: profile.status,
      };

      // Cache user info in localStorage
      localStorage.setItem("henhouse_user", JSON.stringify(user));

      return { data: { user }, error: null };
    } catch (err: any) {
      // Fallback to locally cached user if backend fails/offline
      const userStr = localStorage.getItem("henhouse_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return { data: { user }, error: null };
        } catch (e) {
          // Ignore
        }
      }
      return { data: { user: null }, error: err };
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      return { data: res.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.response?.data || { message: err.message } };
    }
  },

  resetPassword: async (token: string, password: string) => {
    try {
      const res = await api.post("/api/auth/reset-password", { token, password });
      return { data: res.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.response?.data || { message: err.message } };
    }
  },
};
