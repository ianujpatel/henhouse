import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import MarketRate from "../models/MarketRate";
import MarketRateHistory from "../models/MarketRateHistory";
import Settings from "../models/Settings";

// Seeding function to populate default weight categories
export const seedDefaultMarketRates = async () => {
  try {
    const count = await MarketRate.countDocuments();
    if (count === 0) {
      const defaults = [
        { weight_category: "2.8–3.5 Kg", today_price: 110, yesterday_price: 108, sort_order: 0 },
        { weight_category: "2.2–2.6 Kg", today_price: 108, yesterday_price: 105, sort_order: 1 },
        { weight_category: "2.0–2.2 Kg", today_price: 105, yesterday_price: 103, sort_order: 2 },
        { weight_category: "1.6–1.8 Kg", today_price: 102, yesterday_price: 100, sort_order: 3 },
        { weight_category: "1.4–1.5 Kg", today_price: 98, yesterday_price: 95, sort_order: 4 },
        { weight_category: "1.3–1.4 Kg", today_price: 95, yesterday_price: 93, sort_order: 5 },
        { weight_category: "1.2–1.3 Kg", today_price: 92, yesterday_price: 90, sort_order: 6 },
        { weight_category: "Loose / Underweight", today_price: 85, yesterday_price: 85, sort_order: 7 },
        { weight_category: "Cull Parent", today_price: 80, yesterday_price: 78, sort_order: 8 },
      ];
      await MarketRate.insertMany(defaults);
      console.log("Seeded default market rates successfully");
    }
  } catch (error) {
    console.error("Error seeding default market rates:", error);
  }
};

// GET /api/market-rates - Public route to fetch active rates, metadata, and history
export const getMarketRatesPublicData = async (req: Request, res: Response): Promise<any> => {
  try {
    // Make sure we have defaults seeded
    await seedDefaultMarketRates();

    const rates = await MarketRate.find({}).sort({ sort_order: 1 });
    const metadataDoc = await Settings.findOne({ key: "bihar_market_metadata" });
    const metadata = metadataDoc?.value || {
      date: new Date().toISOString().split("T")[0],
      name: "Bihar Market Rates",
      vehicles_arrived: 0,
    };
    const history = await MarketRateHistory.find({}).sort({ date: -1 });

    return res.json({ rates, metadata, history });
  } catch (error: any) {
    console.error("Failed to fetch public market rates data:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// POST /api/market-rates/save-metadata - Save market date, name, and vehicle count
export const saveMarketMetadata = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { date, name, vehicles_arrived } = req.body;
    const metadata = {
      date: date || new Date().toISOString().split("T")[0],
      name: name || "Bihar Market Rates",
      vehicles_arrived: Number(vehicles_arrived) || 0,
    };
    const updated = await Settings.findOneAndUpdate(
      { key: "bihar_market_metadata" },
      { value: metadata },
      { new: true, upsert: true }
    );
    return res.json({ ok: true, metadata: updated.value });
  } catch (error: any) {
    console.error("Failed to save market metadata:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// POST /api/market-rates/rate - Admin create new weight category
export const createMarketRate = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { weight_category, today_price, yesterday_price, sort_order } = req.body;
    
    // Auto-calculate sort_order if not provided
    let order = sort_order;
    if (order === undefined) {
      const maxRate = await MarketRate.findOne({}).sort({ sort_order: -1 });
      order = maxRate ? maxRate.sort_order + 1 : 0;
    }

    const rate = await MarketRate.create({
      weight_category,
      today_price: Number(today_price) || 0,
      yesterday_price: Number(yesterday_price) || 0,
      sort_order: Number(order) || 0,
    });
    return res.status(201).json(rate);
  } catch (error: any) {
    console.error("Failed to create market rate category:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// PUT /api/market-rates/rate/:id - Admin update rate category
export const updateMarketRate = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { weight_category, today_price, yesterday_price, sort_order } = req.body;
    const rate = await MarketRate.findById(id);
    if (!rate) {
      return res.status(404).json({ message: "Rate category not found" });
    }
    if (weight_category !== undefined) rate.weight_category = weight_category;
    if (today_price !== undefined) rate.today_price = Number(today_price) || 0;
    if (yesterday_price !== undefined) rate.yesterday_price = Number(yesterday_price) || 0;
    if (sort_order !== undefined) rate.sort_order = Number(sort_order) || 0;
    
    await rate.save();
    return res.json(rate);
  } catch (error: any) {
    console.error("Failed to update market rate category:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// DELETE /api/market-rates/rate/:id - Admin delete rate category
export const deleteMarketRate = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await MarketRate.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to delete market rate category:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// POST /api/market-rates/reorder - Admin reorder rate categories
export const reorderMarketRates = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { orders } = req.body; // array of { id, sort_order }
    if (Array.isArray(orders)) {
      for (const item of orders) {
        await MarketRate.findByIdAndUpdate(item.id, { sort_order: item.sort_order });
      }
    }
    return res.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to reorder market rates:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// POST /api/market-rates/save-history - Save snapshot of current rates as history
export const saveMarketRateHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { date, name, vehicles_arrived } = req.body;
    const activeRates = await MarketRate.find({}).sort({ sort_order: 1 });
    
    const formattedDate = new Date(date);
    formattedDate.setUTCHours(0, 0, 0, 0);

    const ratesSnapshot = activeRates.map(r => ({
      weight_category: r.weight_category,
      price: r.today_price,
    }));

    const history = await MarketRateHistory.findOneAndUpdate(
      { date: formattedDate },
      {
        market_name: name || "Bihar Market Rates",
        vehicles_arrived: Number(vehicles_arrived) || 0,
        rates: ratesSnapshot,
      },
      { new: true, upsert: true }
    );

    return res.json({ ok: true, history });
  } catch (error: any) {
    console.error("Failed to save market rate history snapshot:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// DELETE /api/market-rates/history/:id - Delete a historical record
export const deleteMarketRateHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await MarketRateHistory.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to delete market rate history:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
