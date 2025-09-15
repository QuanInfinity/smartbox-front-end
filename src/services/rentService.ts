import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RentItem {
  rent_id: number;
  user_id: number;
  compartment_id: number;
  start_time: string;
  end_time: string | null;
  pickup_time: string | null;
  price_per_hour: number | null;
  total_cost: number | null;
  status: number;
  rental_type?: string | null;
  receiver_phone?: string | null;
  payment_method?: string | null;
  payment_status?: number | null;
  user_phone?: string | null;
  // Optional denormalized fields for UI
  user_name?: string;
  locker_code?: string;
  compartment_code?: string;
  // Relations from backend
  user?: {
    user_id: number;
    name: string;
    phone_number: string;
    email: string;
  };
  compartment?: {
    compartment_id: number;
    code: string;
    locker?: {
      locker_id: number;
      code: string;
    };
  };
}

type ApiResponse<T> = { success?: boolean; data: T } | T;

function unwrap<T>(res: ApiResponse<T>): T {
  // Some endpoints return { success, data }, others may return raw
  if ((res as any)?.data !== undefined) return (res as any).data as T;
  return res as T;
}

export const rentService = {
  async list(): Promise<RentItem[]> {
    const res = await api.get<ApiResponse<RentItem[]>>('/rents');
    return unwrap(res.data);
  },

  async get(id: number): Promise<RentItem> {
    const res = await api.get<ApiResponse<RentItem>>(`/rents/${id}`);
    return unwrap(res.data);
  },

  async create(payload: { user_id: number; compartment_id: number; rental_type?: string; rental_hours?: number; receiver_phone?: string; }): Promise<RentItem> {
    const res = await api.post<ApiResponse<RentItem>>('/rents', payload);
    return unwrap(res.data);
  },

  async update(id: number, payload: Partial<RentItem>): Promise<RentItem> {
    const res = await api.patch<ApiResponse<RentItem>>(`/rents/${id}`, payload);
    return unwrap(res.data);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/rents/${id}`);
  },

  async complete(id: number): Promise<RentItem> {
    const res = await api.put<ApiResponse<RentItem>>(`/rents/${id}/complete`);
    return unwrap(res.data);
  },

  async pickup(id: number): Promise<RentItem> {
    const res = await api.put<ApiResponse<RentItem>>(`/rents/${id}/pickup`);
    return unwrap(res.data);
  },

  async open(id: number): Promise<RentItem> {
    const res = await api.put<ApiResponse<RentItem>>(`/rents/${id}/open`);
    return unwrap(res.data);
  },

  async myRents(): Promise<RentItem[]> {
    const res = await api.get<ApiResponse<RentItem[]>>('/rents/my-rents');
    return unwrap(res.data);
  },

  async deliveriesForMe(): Promise<RentItem[]> {
    const res = await api.get<ApiResponse<RentItem[]>>('/rents/deliveries-for-me');
    return unwrap(res.data);
  },

  async createDelivery(payload: { compartment_id: number; receiver_phone: string }): Promise<{ rent_id: number }> {
    const res = await api.post<ApiResponse<{ rent_id: number }>>('/rents/delivery', payload);
    return unwrap(res.data);
  },

  async acceptDelivery(id: number): Promise<{ payment_url: string; total_cost: number; rent_id: number }> {
    const res = await api.put<ApiResponse<{ payment_url: string; total_cost: number; rent_id: number }>>(`/rents/${id}/accept-delivery`);
    return unwrap(res.data);
  },
};

export default rentService;


