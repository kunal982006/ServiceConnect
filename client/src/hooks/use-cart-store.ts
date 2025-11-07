// client/src/hooks/use-cart-store.ts (FIXED)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the type for a single item in the cart
interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

// Define the state and actions for our cart store
interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  // --- YEH NAINA ACTION ADD KIYA ---
  updateQuantity: (itemId: string, amount: number) => void; 
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Action to add an item to the cart
      addItem: (newItem) => {
        const existingItem = get().items.find((item) => item.id === newItem.id);

        if (existingItem) {
          // Agar item pehle se hai, toh updateQuantity ko call karo
          get().updateQuantity(newItem.id, 1);
        } else {
          // Naya item hai, quantity 1 ke saath add karo
          set((state) => ({
            items: [...state.items, { ...newItem, quantity: 1 }],
          }));
        }
      },

      // Action to remove an item from the cart
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      // --- YEH HAI POORA NAYA LOGIC ---
      // Action to update quantity (increase or decrease)
      updateQuantity: (itemId, amount) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.id === itemId) {
                const newQuantity = item.quantity + amount;
                // Agar quantity 0 ya usse kam ho jaye, toh item ko remove kar do
                if (newQuantity <= 0) {
                  return null; // Isko baad me filter kar denge
                }
                return { ...item, quantity: newQuantity };
              }
              return item;
            })
            .filter((item): item is CartItem => item !== null), // null items ko hata do
        }));
      },
      // --- NAYA LOGIC YAHAN KHATAM ---

      // Action to clear the entire cart
      clearCart: () => {
        set({ items: [] });
      },

      // Function to get the total number of items in the cart
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Function to calculate the total price of all items
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage', // This name is used for saving the cart in local storage
    }
  )
);