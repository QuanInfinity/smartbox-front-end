import axios from 'axios';

const API_BASE_URL = 'https://smartbox-back-end.onrender.com/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface UserInfo {
  user_id: number;
  name: string;
  email: string;
  role_id: number;
  phone_number: string;
}

class AuthService {
  private tokenKey = 'token';
  private userKey = 'user_info';

  setAuthData(token: string, userInfo: UserInfo): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(userInfo));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserInfo(): UserInfo | null {
    const userInfoString = localStorage.getItem(this.userKey);

    // KIỂM TRA: Đảm bảo chuỗi không phải là null, undefined, hoặc chuỗi "undefined"
    if (!userInfoString || userInfoString === 'undefined') {
      return null;
    }

    // Bọc trong try-catch để phòng trường hợp chuỗi JSON bị hỏng
    try {
      return JSON.parse(userInfoString) as UserInfo;
    } catch (error) {
      console.error("Lỗi khi parse thông tin người dùng từ localStorage:", error);
      // Nếu lỗi, xóa dữ liệu hỏng để tránh lặp lại lỗi
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getUserInfo();
    return user?.role_id === 1;
  }

  isTechnician(): boolean {
    const user = this.getUserInfo();
    return user?.role_id === 2;
  }

  hasPermission(requiredRole: number[]): boolean {
    const user = this.getUserInfo();
    return user ? requiredRole.includes(user.role_id) : false;
  }

  async login(credentials: { email: string; password: string }) {
    try {
      const response = await fetch('https://smartbox-back-end.onrender.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (data.access_token && data.user) {
        this.setAuthData(data.access_token, data.user);
        return data;
      }
      
      throw new Error('Login failed');
    } catch (error) {
      throw error;
    }
  }
}

export const authService = new AuthService();




