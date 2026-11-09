/**
 * context/WishlistContext.jsx — Danh sách sản phẩm yêu thích, lưu id sản phẩm vào localStorage (key "stylehub_wishlist").
 * Hàm cung cấp qua useWishlist():
 *   - ids, count       : danh sách id và số lượng sản phẩm yêu thích (hiện badge trên Header).
 *   - has(id)          : sản phẩm đã được thả tim chưa.
 *   - toggle(id)       : thả tim / bỏ tim.
 *   - remove(id)       : bỏ một sản phẩm khỏi danh sách.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'stylehub_wishlist';

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const value = useMemo(
    () => ({
      ids,
      count: ids.length,
      has: (id) => ids.includes(Number(id)),
      toggle: (id) =>
        setIds((prev) =>
          prev.includes(Number(id)) ? prev.filter((x) => x !== Number(id)) : [...prev, Number(id)]
        ),
      remove: (id) => setIds((prev) => prev.filter((x) => x !== Number(id))),
    }),
    [ids]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
