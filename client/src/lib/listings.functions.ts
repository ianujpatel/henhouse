import { api } from "./api-client";

export const createListing = async ({ data }: { data: any }) => {
  const res = await api.post("/api/listings/create", data);
  return res.data;
};

export const updateListing = async ({ data }: { data: any }) => {
  const { id, ...patch } = data;
  const res = await api.post(`/api/listings/update/${id}`, patch);
  return res.data;
};

export const archiveListing = async ({ data }: { data: { id: string } }) => {
  const res = await api.post(`/api/listings/archive/${data.id}`);
  return res.data;
};

/** Farmer view: never returns buyer_price. */
export const listMyListings = async () => {
  const res = await api.get("/api/listings/my-listings");
  return res.data;
};

/** Buyer marketplace: never returns farmer_price. */
export const listMarketplace = async ({ data }: { data?: { category?: string; search?: string } } = {}) => {
  const queryParams = new URLSearchParams();
  if (data?.category) queryParams.append("category", data.category);
  if (data?.search) queryParams.append("search", data.search);

  const res = await api.get(`/api/listings/marketplace?${queryParams.toString()}`);
  return res.data;
};

export const getListingForBuyer = async ({ data }: { data: { id: string } }) => {
  const res = await api.get(`/api/listings/buyer/${data.id}`);
  return res.data;
};

export const getListingForEdit = async ({ data }: { data: { id: string } }) => {
  const res = await api.get(`/api/listings/detail/${data.id}`);
  return res.data;
};
