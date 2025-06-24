import axios from 'axios';
import { ApiResponse, Product, Flavor, Order, Announcement, LoginForm, OrderForm, User } from '../types';

// API基礎配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加認證token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 響應攔截器 - 處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// 認證API
export const authAPI = {
  login: async (credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  }
};

// 產品API
export const productAPI = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/products');
    return response.data;
  },
  
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    const response = await api.post('/products', product);
    return response.data;
  },
  
  update: async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  
  uploadImage: async (productId: string, file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('productId', productId);
    
    const response = await api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  deleteImage: async (imageId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/products/images/${imageId}`);
    return response.data;
  }
};

// 口味API
export const flavorAPI = {
  getAll: async (): Promise<ApiResponse<Flavor[]>> => {
    const response = await api.get('/flavors');
    return response.data;
  },
  
  create: async (flavor: Omit<Flavor, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Flavor>> => {
    const response = await api.post('/flavors', flavor);
    return response.data;
  },
  
  update: async (id: string, flavor: Partial<Flavor>): Promise<ApiResponse<Flavor>> => {
    const response = await api.put(`/flavors/${id}`, flavor);
    return response.data;
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/flavors/${id}`);
    return response.data;
  }
};

// 訂單API
export const orderAPI = {
  getAll: async (status?: Order['status']): Promise<ApiResponse<Order[]>> => {
    const params = status ? { status } : {};
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  getById: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  create: async (orderData: OrderForm): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  updateStatus: async (id: string, status: Order['status']): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
  
  export: async (orderIds: string[]): Promise<Blob> => {
    const response = await api.post('/orders/export', { orderIds }, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  verifyOrder: async (orderNumber: string, verificationCode: string): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders/verify', { orderNumber, verificationCode });
    return response.data;
  }
};

// 公告API
export const announcementAPI = {
  getAll: async (): Promise<ApiResponse<Announcement[]>> => {
    const response = await api.get('/announcements');
    return response.data;
  },
  
  getActive: async (): Promise<ApiResponse<Announcement[]>> => {
    const response = await api.get('/announcements/active');
    return response.data;
  },
  
  create: async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Announcement>> => {
    const response = await api.post('/announcements', announcement);
    return response.data;
  },
  
  update: async (id: string, announcement: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
    const response = await api.put(`/announcements/${id}`, announcement);
    return response.data;
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};

// 7-11店鋪API
export const storeAPI = {
  searchStores: async (query: string): Promise<ApiResponse<{ storeNumber: string; storeName: string; address: string }[]>> => {
    const response = await api.get('/stores/search', { params: { query } });
    return response.data;
  },
  
  getStoreInfo: async (storeNumber: string): Promise<ApiResponse<{ storeNumber: string; storeName: string; address: string }>> => {
    const response = await api.get(`/stores/${storeNumber}`);
    return response.data;
  }
};

// Telegram通知API
export const telegramAPI = {
  sendOrderNotification: async (order: Order): Promise<ApiResponse> => {
    const response = await api.post('/telegram/notify-order', { order });
    return response.data;
  }
};

// 統計API
export const statsAPI = {
  getDashboardStats: async (): Promise<ApiResponse<{
    todayOrders: number;
    todayRevenue: number;
    pendingOrders: number;
    totalProducts: number;
    orderGrowth: number;
    revenueGrowth: number;
    pendingGrowth: number;
    productGrowth: number;
  }>> => {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },
  
  getOrderStats: async (period: 'day' | 'week' | 'month' | 'year'): Promise<ApiResponse<{
    labels: string[];
    orders: number[];
    revenue: number[];
  }>> => {
    const response = await api.get('/stats/orders', { params: { period } });
    return response.data;
  },
  
  getPopularProducts: async (): Promise<ApiResponse<{
    productName: string;
    totalSold: number;
    revenue: number;
  }[]>> => {
    const response = await api.get('/stats/popular-products');
    return response.data;
  }
};

export default api;
