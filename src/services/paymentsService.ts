import axios from 'axios';

const API_BASE_URL = 'https://smartbox-back-end.onrender.com/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PaymentItem {
  payment_id: number;
  rent_id: number;
  amount: number;
  method: 'card' | 'momo' | 'zalopay' | 'payos' | 'cash';
  status: 'paid' | 'pending' | 'failed';
  payment_time: string;
}

type ApiResponse<T> = { success?: boolean; data: T } | T;

function unwrap<T>(res: ApiResponse<T>): T {
  if ((res as any)?.data !== undefined) return (res as any).data as T;
  return res as T;
}

const paymentsService = {
  async list(): Promise<PaymentItem[]> {
    const res = await api.get<ApiResponse<PaymentItem[]>>('/payments');
    return unwrap(res.data);
  },
};

export default paymentsService;




