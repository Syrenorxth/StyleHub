import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { getSalePrice } from '../utils/helpers';

const CartContext = createContext(null);
const STORAGE_KEY = 'stylehub_cart';

// Mỗi dòng giỏ hàng được xác định bởi sản phẩm + size + màu
const makeKey = (productId, size, color) => `${productId}|${size}|${color}`;

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { item } = action;
      const existing = state.find((i) => i.key === item.key);
      if (existing) {
        return state.map((i) =>
          i.key === item.key
            ? { ...i, stock: item.stock, quantity: Math.min(i.quantity + item.quantity, item.stock) }
            : i
        );
      }
      return [...state, item];
    }
    case 'UPDATE_QUANTITY':
      return state.map((i) =>
        i.key === action.key ? { ...i, quantity: Math.max(1, Math.min(action.quantity, i.stock)) } : i
      );
    case 'REMOVE':
      return state.filter((i) => i.key !== action.key);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => {
    const addItem = (product, { size, color, quantity }) =>
      dispatch({
        type: 'ADD',
        item: {
          key: makeKey(product.id, size, color),
          productId: product.id,
          name: product.name,
          image: product.image,
          price: getSalePrice(product),
          originalPrice: product.price,
          size,
          color,
          quantity,
          stock: product.stock,
        },
      });

    return {
      items,
      addItem,
      updateQuantity: (key, quantity) => dispatch({ type: 'UPDATE_QUANTITY', key, quantity }),
      removeItem: (key) => dispatch({ type: 'REMOVE', key }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
