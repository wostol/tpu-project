import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CART_STORAGE_KEY = "sportclub-cart";
export const CART_CHANGE_EVENT = "cart:change";

export const useCartStore = create(
  persist(
    (set) => ({
      items: [], // [{ productId, quantity }]
      add: (productId, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { productId, quantity }] };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
        })),
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: CART_STORAGE_KEY },
  ),
);

export const cartTotalCount = (items) =>
  items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

/** Мгновенно уведомляем Header об изменении корзины */
useCartStore.subscribe((state, prevState) => {
  if (state.items !== prevState.items) {
    window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  }
});

/** Миграция старой корзины (ключ "cart") в zustand стор */
export const migrateLegacyCart = () => {
  try {
    const legacy = JSON.parse(localStorage.getItem("cart") || "[]");
    if (Array.isArray(legacy)) {
      legacy.forEach((item) => {
        const productId = Number(item.productId ?? item.id);
        if (Number.isInteger(productId) && productId > 0) {
          useCartStore
            .getState()
            .add(productId, Math.max(1, item.quantity || 1));
        }
      });
    }
  } catch {
    // битый JSON — игнорируем
  }
  localStorage.removeItem("cart");
};
