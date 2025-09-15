import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for debugging


export interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  password?: string; // Thêm password field
  role_id: number;
  createTime: string;
  status?: number;
  wallet?: number;
}

export interface Permission {
  id: number;
  rentId: string;
  senderId: number;
  receiverId: number;
  receiverPhone: string;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
}

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/user');
    return response.data.map((user: any) => ({
      id: user.user_id,
      name: user.name,
      phone: user.phone_number,
      email: user.email,
      password: user.password, // Thêm password mapping
      role_id: user.role_id ,
      createTime: new Date(user.created_at).toLocaleString(),
      status: user.status,
      wallet: user.wallet
    }));
  },

  createUser: async (userData: Omit<User, 'id' | 'createTime'>) => {
    const mappedData = {
      name: userData.name,
      phone_number: userData.phone,
      email: userData.email,
      password: userData.password || 'defaultPassword123', // Sử dụng password từ form
      role_id: userData.role_id,
      status: userData.status
    };
    const response = await api.post('/user', mappedData);
    return response.data;

  },

  updateUser: async (id: number, userData: Partial<User>) => {
    const mappedData: any = {};
    if (userData.name) mappedData.name = userData.name;
    if (userData.phone) mappedData.phone_number = userData.phone;
    if (userData.email) mappedData.email = userData.email;
    if (userData.password) mappedData.password = userData.password; // Thêm password update
    if (userData.role_id) mappedData.role_id ;
    if (userData.status !== undefined) mappedData.status = userData.status;
    
    const response = await api.patch(`/user/${id}`, mappedData);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/permissions');
    return response.data.map((permission: any) => ({
      id: permission.id,
      rentId: permission.rent_id,
      senderId: permission.sender_id,
      receiverId: permission.receiver_id,
      receiverPhone: permission.receiver_phone,
      expiresAt: permission.expires_at,
      usedAt: permission.used_at,
      createdAt: new Date(permission.created_at).toLocaleString(),
    }));
  }
};






