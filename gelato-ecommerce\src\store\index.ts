import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, User, Product, Flavor, Order, Announcement } from '../types';

// 購物車狀態管理
interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existingItem = get().items.find(i => 
          i.product.id === item.product.id && 
          JSON.stringify(i.flavors.map(f => f.id).sort()) === JSON.stringify(item.flavors.map(f => f.id).sort())
        );
        
        if (existingItem) {
          set(state => ({
            items: state.items.map(i => 
              i.id === existingItem.id 
                ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.product.basePrice }
                : i
            )
          }));
        } else {
          set(state => ({ items: [...state.items, item] }));
        }
      },
      removeItem: (id) => {
        set(state => ({ items: state.items.filter(item => item.id !== id) }));
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set(state => ({
          items: state.items.map(item => 
            item.id === id 
              ? { ...item, quantity, subtotal: quantity * item.product.basePrice }
              : item
          )
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.subtotal, 0);
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);

// 用戶認證狀態管理
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// 應用狀態管理
interface AppStore {
  products: Product[];
  flavors: Flavor[];
  orders: Order[];
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
  
  // 產品相關
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // 口味相關
  setFlavors: (flavors: Flavor[]) => void;
  addFlavor: (flavor: Flavor) => void;
  updateFlavor: (id: string, flavor: Partial<Flavor>) => void;
  deleteFlavor: (id: string) => void;
  
  // 訂單相關
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  
  // 公告相關
  setAnnouncements: (announcements: Announcement[]) => void;
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  
  // 通用狀態
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  products: [],
  flavors: [],
  orders: [],
  announcements: [],
  isLoading: false,
  error: null,
  
  // 產品相關
  setProducts: (products) => set({ products }),
  addProduct: (product) => set(state => ({ products: [...state.products, product] })),
  updateProduct: (id, product) => set(state => ({
    products: state.products.map(p => p.id === id ? { ...p, ...product } : p)
  })),
  deleteProduct: (id) => set(state => ({
    products: state.products.filter(p => p.id !== id)
  })),
  
  // 口味相關
  setFlavors: (flavors) => set({ flavors }),
  addFlavor: (flavor) => set(state => ({ flavors: [...state.flavors, flavor] })),
  updateFlavor: (id, flavor) => set(state => ({
    flavors: state.flavors.map(f => f.id === id ? { ...f, ...flavor } : f)
  })),
  deleteFlavor: (id) => set(state => ({
    flavors: state.flavors.filter(f => f.id !== id)
  })),
  
  // 訂單相關
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set(state => ({ orders: [...state.orders, order] })),
  updateOrderStatus: (id, status) => set(state => ({
    orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
  })),
  
  // 公告相關
  setAnnouncements: (announcements) => set({ announcements }),
  addAnnouncement: (announcement) => set(state => ({
    announcements: [...state.announcements, announcement]
  })),
  updateAnnouncement: (id, announcement) => set(state => ({
    announcements: state.announcements.map(a => a.id === id ? { ...a, ...announcement } : a)
  })),
  deleteAnnouncement: (id) => set(state => ({
    announcements: state.announcements.filter(a => a.id !== id)
  })),
  
  // 通用狀態
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));

// 管理員隱藏入口狀態
interface AdminEntryStore {
  clickCount: number;
  increment: () => void;
  reset: () => void;
}

export const useAdminEntryStore = create<AdminEntryStore>((set) => ({
  clickCount: 0,
  increment: () => set(state => ({ clickCount: state.clickCount + 1 })),
  reset: () => set({ clickCount: 0 })
}));
