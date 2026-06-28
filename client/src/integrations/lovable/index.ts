import { toast } from "sonner";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      toast.info("Google OAuth is not configured. Please sign in with email/password.");
      return { redirected: false, error: new Error("OAuth not configured in MERN stack.") };
    },
  },
};
