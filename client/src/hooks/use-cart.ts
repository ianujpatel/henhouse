import { useState, useEffect } from "react";

export interface CartItem {
  product_type: "chicken" | "feed";
  listing_id?: string;
  feed_product_id?: string;
  quantity: number;
  weight?: number; // for feed items (in kg)
  details: {
    title: string; // name for feed products
    image_urls: string[];
    price: number; // for chicken: buyer_price; for feed: price_per_kg * weight
    unit?: string;
    stock: number; // max available stock
  };
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("henhouse_cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  // Save to localStorage when items change
  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("henhouse_cart", JSON.stringify(newItems));
  };

  const addToCart = (newItem: CartItem) => {
    const newItems = [...items];
    const existingIndex = newItems.findIndex((item) => {
      if (item.product_type !== newItem.product_type) return false;
      if (item.product_type === "chicken") {
        return item.listing_id === newItem.listing_id;
      } else {
        return item.feed_product_id === newItem.feed_product_id && item.weight === newItem.weight;
      }
    });

    if (existingIndex > -1) {
      const existingItem = newItems[existingIndex];
      const potentialQty = existingItem.quantity + newItem.quantity;
      existingItem.quantity = Math.min(potentialQty, newItem.details.stock);
    } else {
      newItems.push(newItem);
    }

    saveCart(newItems);
  };

  const removeFromCart = (id: string, weight?: number) => {
    const newItems = items.filter((item) => {
      if (item.product_type === "chicken") {
        return item.listing_id !== id;
      } else {
        return !(item.feed_product_id === id && item.weight === weight);
      }
    });
    saveCart(newItems);
  };

  const updateQuantity = (id: string, qty: number, weight?: number) => {
    const newItems = items.map((item) => {
      const matches = item.product_type === "chicken" 
        ? item.listing_id === id 
        : item.feed_product_id === id && item.weight === weight;
      
      if (matches) {
        return {
          ...item,
          quantity: Math.max(1, Math.min(qty, item.details.stock)),
        };
      }
      return item;
    });
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = items.reduce((acc, item) => acc + item.details.price * item.quantity, 0);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  };
}
