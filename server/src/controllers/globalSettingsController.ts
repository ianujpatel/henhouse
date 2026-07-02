import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Settings from "../models/Settings";

export const getGlobalSettings = async (req: Request, res: Response): Promise<any> => {
  try {
    const settingsDoc = await Settings.findOne({ key: "global_settings" });
    if (!settingsDoc) {
      // Return default settings if none exist
      return res.json({
        banner_show: false,
        banner_visibility: "hidden",
        banner_text: "",
        banner_image_url: "",
        banner_redirect_url: "",
        prices_show: false,
        prices_visibility: "hidden",
        chicks_price: 0,
        birds_price: 0,
        prices_updated_at: new Date(),
      });
    }
    
    // Ensure visibility fields are returned, mapping from old schema if needed
    const val = settingsDoc.value || {};
    const banner_visibility = val.banner_visibility || (val.banner_show ? "all" : "hidden");
    const prices_visibility = val.prices_visibility || (val.prices_show ? "all" : "hidden");

    return res.json({
      ...val,
      banner_visibility,
      prices_visibility,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const updateGlobalSettings = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      banner_visibility,
      banner_text,
      banner_image_url,
      banner_redirect_url,
      prices_visibility,
      chicks_price,
      birds_price,
    } = req.body;

    // Fetch existing settings to check if prices have changed (so we only update prices_updated_at when prices change)
    const existing = await Settings.findOne({ key: "global_settings" });
    let prices_updated_at = new Date();

    if (existing && existing.value) {
      const oldChicks = Number(existing.value.chicks_price);
      const oldBirds = Number(existing.value.birds_price);
      const newChicks = Number(chicks_price);
      const newBirds = Number(birds_price);

      // If price values are the same, keep the old timestamp
      if (oldChicks === newChicks && oldBirds === newBirds) {
        prices_updated_at = existing.value.prices_updated_at
          ? new Date(existing.value.prices_updated_at)
          : new Date();
      }
    }

    const finalBannerVisibility = banner_visibility || "hidden";
    const finalPricesVisibility = prices_visibility || "hidden";

    const updatedValue = {
      banner_show: finalBannerVisibility !== "hidden",
      banner_visibility: finalBannerVisibility,
      banner_text: banner_text || "",
      banner_image_url: banner_image_url || "",
      banner_redirect_url: banner_redirect_url || "",
      prices_show: finalPricesVisibility !== "hidden",
      prices_visibility: finalPricesVisibility,
      chicks_price: Number(chicks_price) || 0,
      birds_price: Number(birds_price) || 0,
      prices_updated_at,
    };

    await Settings.findOneAndUpdate(
      { key: "global_settings" },
      { value: updatedValue },
      { upsert: true, new: true }
    );

    return res.json({ ok: true, settings: updatedValue });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

