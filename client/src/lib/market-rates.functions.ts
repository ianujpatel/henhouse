import { api } from "./api-client";

export interface MarketRate {
  _id: string;
  weight_category: string;
  today_price: number;
  yesterday_price: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MarketMetadata {
  date: string;
  name: string;
  vehicles_arrived: number;
}

export interface MarketHistory {
  _id: string;
  date: string;
  market_name: string;
  vehicles_arrived?: number;
  rates: {
    weight_category: string;
    price: number;
  }[];
  created_at: string;
  updated_at: string;
}

export interface MarketRatesData {
  rates: MarketRate[];
  metadata: MarketMetadata;
  history: MarketHistory[];
}

export const getMarketRatesData = async (): Promise<MarketRatesData> => {
  const res = await api.get("/api/market-rates");
  return res.data;
};

export const saveMarketMetadata = async ({ data }: { data: MarketMetadata }) => {
  const res = await api.post("/api/market-rates/metadata", data);
  return res.data;
};

export const createMarketRate = async ({ data }: { data: Partial<MarketRate> }) => {
  const res = await api.post("/api/market-rates/rate", data);
  return res.data;
};

export const updateMarketRate = async ({ data }: { data: { id: string } & Partial<MarketRate> }) => {
  const { id, ...patch } = data;
  const res = await api.put(`/api/market-rates/rate/${id}`, patch);
  return res.data;
};

export const deleteMarketRate = async ({ data }: { data: { id: string } }) => {
  const res = await api.delete(`/api/market-rates/rate/${data.id}`);
  return res.data;
};

export const reorderMarketRates = async ({ data }: { data: { orders: { id: string; sort_order: number }[] } }) => {
  const res = await api.post("/api/market-rates/reorder", data);
  return res.data;
};

export const saveMarketRateHistorySnapshot = async ({ data }: { data: { date: string; name: string; vehicles_arrived: number } }) => {
  const res = await api.post("/api/market-rates/history", data);
  return res.data;
};

export const deleteMarketRateHistory = async ({ data }: { data: { id: string } }) => {
  const res = await api.delete(`/api/market-rates/history/${data.id}`);
  return res.data;
};
