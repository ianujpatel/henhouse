import { api } from "./api-client";

export interface GlobalSettings {
  banner_show: boolean;
  banner_visibility: "home" | "buyer" | "farmer" | "all" | "hidden";
  banner_text: string;
  banner_image_url: string;
  banner_redirect_url: string;
  prices_show: boolean;
  prices_visibility: "home" | "buyer" | "farmer" | "all" | "hidden";
  chicks_price: number;
  birds_price: number;
  prices_updated_at: string;
}


export const getGlobalSettings = async (): Promise<GlobalSettings> => {
  const res = await api.get("/api/global-settings");
  return res.data;
};

export const updateGlobalSettings = async ({ data }: { data: Partial<GlobalSettings> }): Promise<any> => {
  const res = await api.post("/api/global-settings", data);
  return res.data;
};
