export type UserStatus = "pending" | "approved" | "rejected";
export type UserRole = "buyer" | "farmer" | "admin";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  farm_name?: string;
  roles?: UserRole[];
  status?: UserStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ListingImage {
  public_id: string;
  secure_url: string;
}

export interface Listing {
  id: string;
  title: string;
  category: "broiler" | "layer" | "chick" | "egg" | "feed" | "other";
  breed?: string | null;
  quantity: number;
  unit: string;
  farmer_price: number;
  buyer_price: number;
  location?: string | null;
  description?: string | null;
  images?: ListingImage[];
  status: "pending_pricing" | "live" | "archived";
  brand?: string | null;
  is_featured_banner?: boolean;
  specifications?: string | null;
  target_audience?: "buyer" | "farmer" | "both";
  farmer_id?: string | null;
  profiles?: {
    full_name: string;
    farm_name?: string;
    roles: string[];
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_type: "chicken" | "feed";
  listing_id?: any;
  feed_product_id?: any;
  quantity: number;
  weight?: number;
  unit_farmer_price: number;
  unit_buyer_price: number;
  farmer_id: string;
}

export interface Order {
  id: string;
  buyer_id: string | any;
  status: "pending" | "placed" | "confirmed" | "fulfilled" | "cancelled";
  total: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  delivery_full_name: string;
  delivery_mobile: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  placed_at: string;
  items?: OrderItem[];
}
