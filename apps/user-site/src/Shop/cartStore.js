import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set) => ({
      items: [], // [{ productId, quantity }] — только id и количество

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
    { name: "sportclub-cart" }, // ключ в localStorage
  ),
);

export const cartTotalCount = (items) =>
  items.reduce((sum, i) => sum + i.quantity, 0);

// Разовая миграция старой корзины (ключ "cart" из ранней версии с мок-данными,
// формат [{uuid, id, name, ...}]) в этот стор. Позиции без числового id
// отбрасываются. После вызова старый ключ удаляется.
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
    // повреждённый JSON — просто забываем старую корзину
  }
  localStorage.removeItem("cart");
};
