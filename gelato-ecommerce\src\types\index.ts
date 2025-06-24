// 產品類型定義
export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: 'base' | 'topping';
  stock: number;
  status: 'active' | 'inactive';
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  imageOrder: number;
}

// 口味類型定義
export interface Flavor {
  id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 訂單類型定義
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  storeNumber: string;
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  verificationCode: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  flavorIds: string[];
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
  flavors?: Flavor[];
}

// 購物車類型定義
export interface CartItem {
  id: string;
  product: Product;
  flavors: Flavor[];
  quantity: number;
  subtotal: number;
}

// 用戶類型定義
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'customer';
  createdAt: string;
  updatedAt: string;
}

// 公告類型定義
export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 優惠規則類型定義
export interface DiscountRule {
  id: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API響應類型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 表單類型
export interface LoginForm {
  username: string;
  password: string;
}

export interface OrderForm {
  customerName: string;
  customerPhone: string;
  storeNumber: string;
  items: CartItem[];
}

export interface ProductForm {
  name: string;
  description: string;
  basePrice: number;
  category: 'base' | 'topping';
  stock: number;
  status: 'active' | 'inactive';
}

export interface FlavorForm {
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}

export interface AnnouncementForm {
  title: string;
  content: string;
  isActive: boolean;
}
