import { api } from "./api-client";

// ==========================================
// Buyer Feed APIs
// ==========================================

export const getFeedMarketplace = async ({ data }: { data?: { category?: string; brand?: string; search?: string } } = {}) => {
  const queryParams = new URLSearchParams();
  if (data?.category) queryParams.append("category", data.category);
  if (data?.brand) queryParams.append("brand", data.brand);
  if (data?.search) queryParams.append("search", data.search);

  const res = await api.get(`/api/feeds/marketplace?${queryParams.toString()}`);
  return res.data;
};

export const getFeedProduct = async ({ data }: { data: { id: string } }) => {
  const res = await api.get(`/api/feeds/product/${data.id}`);
  return res.data;
};

export const createProductReview = async ({ data }: { data: { id: string; rating: number; review?: string } }) => {
  const { id, ...body } = data;
  const res = await api.post(`/api/feeds/product/${id}/review`, body);
  return res.data;
};

// ==========================================
// Admin Category APIs
// ==========================================

export const adminCreateCategory = async ({ data }: { data: { name: string; slug: string; description?: string } }) => {
  const res = await api.post("/api/feeds/admin/categories", data);
  return res.data;
};

export const adminUpdateCategory = async ({ data }: { data: { id: string; name?: string; slug?: string; description?: string } }) => {
  const { id, ...body } = data;
  const res = await api.post(`/api/feeds/admin/categories/${id}`, body);
  return res.data;
};

export const adminDeleteCategory = async ({ data }: { data: { id: string } }) => {
  const res = await api.delete(`/api/feeds/admin/categories/${data.id}`);
  return res.data;
};

export const adminListCategories = async () => {
  const res = await api.get("/api/feeds/admin/categories");
  return res.data;
};

// ==========================================
// Admin Brand APIs
// ==========================================

export const adminCreateBrand = async ({ data }: { data: { name: string; slug: string; description?: string } }) => {
  const res = await api.post("/api/feeds/admin/brands", data);
  return res.data;
};

export const adminUpdateBrand = async ({ data }: { data: { id: string; name?: string; slug?: string; description?: string } }) => {
  const { id, ...body } = data;
  const res = await api.post(`/api/feeds/admin/brands/${id}`, body);
  return res.data;
};

export const adminDeleteBrand = async ({ data }: { data: { id: string } }) => {
  const res = await api.delete(`/api/feeds/admin/brands/${data.id}`);
  return res.data;
};

export const adminListBrands = async () => {
  const res = await api.get("/api/feeds/admin/brands");
  return res.data;
};

// ==========================================
// Admin Product APIs
// ==========================================

export const adminCreateFeedProduct = async ({ data }: { data: any }) => {
  const res = await api.post("/api/feeds/admin/products", data);
  return res.data;
};

export const adminUpdateFeedProduct = async ({ data }: { data: any }) => {
  const { id, ...body } = data;
  const res = await api.post(`/api/feeds/admin/products/${id}`, body);
  return res.data;
};

export const adminDeleteFeedProduct = async ({ data }: { data: { id: string } }) => {
  const res = await api.delete(`/api/feeds/admin/products/${data.id}`);
  return res.data;
};

export const adminListFeedProducts = async () => {
  const res = await api.get("/api/feeds/admin/products");
  return res.data;
};

// ==========================================
// Admin Banner APIs
// ==========================================

export const adminCreateBanner = async ({ data }: { data: { title?: string; image_url: string; link?: string; active?: boolean } }) => {
  const res = await api.post("/api/feeds/admin/banners", data);
  return res.data;
};

export const adminUpdateBanner = async ({ data }: { data: { id: string; title?: string; image_url?: string; link?: string; active?: boolean } }) => {
  const { id, ...body } = data;
  const res = await api.post(`/api/feeds/admin/banners/${id}`, body);
  return res.data;
};

export const adminDeleteBanner = async ({ data }: { data: { id: string } }) => {
  const res = await api.delete(`/api/feeds/admin/banners/${data.id}`);
  return res.data;
};

export const adminListBanners = async () => {
  const res = await api.get("/api/feeds/admin/banners");
  return res.data;
};
