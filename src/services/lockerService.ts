import axios from 'axios';

const API_BASE_URL = 'https://smartbox-back-end.onrender.com/';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface SizeData {
  key: string;
  size_id: number;  // ✅ Keep as number
  name: string;
  width_cm: number;
  height_cm: number;
  depth_cm: number;
  price_per_hour: number;
}

export interface LockerData {
  key: string;
  locker_id: string;
  code: string;
  location_id: string;
  location_name: string;
  status: number;
  total_compartments: number;
  active_compartments: number;
  location?: {
    name: string;
    address?: string;
  };
}

export interface CompartmentData {
  key: string;
  compartment_id: number;
  code: string;
  locker_id: number;
  size_id: number;
  status: number; // 1: available, 0: occupied, 2: maintenance
  is_open: boolean;
  locker?: {
    code: string;
    location?: {
      name: string;
    };
  };
  size?: {
    name: string;
    price_per_hour: number;
  };
}

export interface LocationData {
  key?: string;
  location_id: number;
  name: string;
  address: string;
  ProvinceId?: number;
  DistrictId?: number;
  WardId?: number;
  latitude?: number;
  longitude?: number;
  multiplier: number;
  area_description?: string;
  total_lockers?: number;
  active_lockers?: number;
  full_address?: string;
  province?: {
    ProvinceName: string;
  };
  district?: {
    DistrictName: string;
  };
  ward?: {
    WardName: string;
  };
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const lockerService = {
  // Size Management
  getSizes: async (): Promise<SizeData[]> => {
    try {
      const response = await api.get<ApiResponse<SizeData[]>>('/sizes');
      console.log('API Response:', response.data); // ✅ Debug log
      
      const rawData = response.data.data || response.data || [];
      console.log('Raw sizes data:', rawData); // ✅ Debug log
      
      // ✅ Map data to ensure proper structure
      const mappedData = rawData.map((item: any) => ({
        key: item.size_id?.toString() || item.key,
        size_id: item.size_id,
        name: item.name,
        width_cm: item.width_cm || 0,
        height_cm: item.height_cm || 0,
        depth_cm: item.depth_cm || 0,
        price_per_hour: item.price_per_hour || 0,
      }));
      
      console.log('Mapped sizes data:', mappedData); // ✅ Debug log
      return mappedData;
    } catch (error) {
      console.error('Get sizes error:', error);
      throw new Error('Failed to get sizes');
    }
  },

  createSize: async (sizeData: { name: string; price_per_hour: number; width_cm: number; height_cm: number; depth_cm: number }): Promise<SizeData> => {
    try {
      const response = await api.post<ApiResponse<SizeData>>('/sizes', sizeData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Create size error:', error);
      throw error;
    }
  },

  updateSize: async (id: number, sizeData: { name: string; price_per_hour: number; width_cm: number; height_cm: number; depth_cm: number }): Promise<SizeData> => {
    try {
      const response = await api.patch<ApiResponse<SizeData>>(`/sizes/${id}`, sizeData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Update size error:', error);
      throw error;
    }
  },

  deleteSize: async (id: number): Promise<void> => {
    try {
      await api.delete(`/sizes/${id}`);
    } catch (error) {
      console.error('Delete size error:', error);
      throw error;
    }
  },

  // Locker Management
  getLockers: async (): Promise<LockerData[]> => {
    try {
      const response = await api.get<ApiResponse<LockerData[]>>('/locker');
      const rawData = response.data.data || response.data || [];
      
      return rawData.map((item: any) => ({
        key: item.locker_id?.toString(),
        locker_id: item.locker_id,
        code: item.code,
        location_id: item.location_id,
        location_name: item.location?.name || 'N/A',
        location: item.location,
        status: item.status,
        compartments: item.compartments || [],
        total_compartments: item.compartments?.length || 0,
        active_compartments: item.compartments?.filter((c: any) => c.status === 1).length || 0,
      }));
    } catch (error) {
      console.error('Get lockers error:', error);
      throw error;
    }
  },

  createLocker: async (lockerData: { 
    code: string; 
    location_id: number; 
    status: number;
    compartments?: { [key: string]: number };
  }): Promise<LockerData> => {
    try {
      const response = await api.post<ApiResponse<LockerData>>('/locker', {
        code: lockerData.code,
        location_id: Number(lockerData.location_id),
        status: lockerData.status,
        compartments: lockerData.compartments || {}
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Create locker error:', error);
      throw new Error('Failed to create locker');
    }
  },

  updateLocker: async (id: string, lockerData: { code: string; location_id: number; status: number }): Promise<LockerData> => {
    try {
      const response = await api.patch<ApiResponse<LockerData>>(`/locker/${id}`, {
        code: lockerData.code,
        location_id: Number(lockerData.location_id), // ✅ Ensure number
        status: lockerData.status
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Update locker error:', error);
      throw new Error('Failed to update locker');
    }
  },

  deleteLocker: async (id: string): Promise<void> => {
    try {
      await api.delete(`/locker/${id}`);
    } catch (error) {
      console.error('Delete locker error:', error);
      throw new Error('Failed to delete locker');
    }
  },

  // Compartment Management
  getCompartments: async (): Promise<CompartmentData[]> => {
    try {
      const response = await api.get<ApiResponse<CompartmentData[]>>('/compartments');
      const rawData = response.data.data || response.data || [];
      
      // ✅ Map dữ liệu để đảm bảo field names đúng
      const mappedData = rawData.map((item: any) => ({
        key: item.compartment_id?.toString(),
        compartment_id: item.compartment_id,
        code: item.code, // ✅ Đảm bảo field code được map đúng
        locker_id: item.locker_id,
        size_id: item.size_id,
        status: item.status,
        is_open: item.is_open || false,
        locker: item.locker,
        size: item.size,
      }));
      
      return mappedData;
    } catch (error) {
      console.error('Get compartments error:', error);
      throw new Error('Failed to fetch compartments');
    }
  },

  getCompartmentsByLocker: async (lockerId: string): Promise<CompartmentData[]> => {
    try {
      const response = await api.get<ApiResponse<CompartmentData[]>>(`/compartments/locker/${lockerId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Get compartments by locker error:', error);
      throw new Error('Failed to fetch compartments for locker');
    }
  },

  createCompartment: async (compartmentData: {
    code: string;
    locker_id: string;
    size_id: number;
    status: number;
  }): Promise<CompartmentData> => {
    try {
      const response = await api.post<ApiResponse<CompartmentData>>('/compartments', compartmentData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Create compartment error:', error);
      throw error;
    }
  },

  updateCompartment: async (compartmentId: number, compartmentData: {
    code?: string;
    locker_id?: string;
    size_id?: number;
    status?: number;
  }): Promise<CompartmentData> => {
    try {
      const response = await api.patch<ApiResponse<CompartmentData>>(`/compartments/${compartmentId}`, compartmentData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Update compartment error:', error);
      throw error;
    }
  },

  deleteCompartment: async (compartmentId: number): Promise<void> => {
    try {
      await api.delete(`/compartments/${compartmentId}`);
    } catch (error) {
      console.error('Delete compartment error:', error);
      throw new Error('Failed to delete compartment');
    }
  },

  // Location Management
  getLocations: async (): Promise<LocationData[]> => {
    try {
      const response = await api.get<ApiResponse<LocationData[]>>('/locations');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Get locations error:', error);
      throw new Error('Failed to fetch locations');
    }
  },

  createLocation: async (locationData: Omit<LocationData, 'key' | 'location_id' | 'total_lockers' | 'active_lockers'>): Promise<LocationData> => {
    try {
      const response = await api.post<ApiResponse<LocationData>>('/locations', {
        name: locationData.name,
        address: locationData.address,
        ProvinceId: locationData.ProvinceId,     // ✅ Khớp với DB schema
        DistrictId: locationData.DistrictId,     // ✅ Khớp với DB schema  
        WardId: locationData.WardId,             // ✅ Khớp với DB schema
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        multiplier: locationData.multiplier,
        area_description: locationData.area_description,
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Create location error:', error);
      throw new Error('Failed to create location');
    }
  },

  updateLocation: async (id: number, locationData: Omit<LocationData, 'key' | 'location_id' | 'total_lockers' | 'active_lockers'>): Promise<LocationData> => {
    try {
      // Use PATCH method as per backend controller
      const response = await api.patch<ApiResponse<LocationData>>(`/locations/${id}`, {
        name: locationData.name,
        address: locationData.address,
        ProvinceId: locationData.ProvinceId,
        DistrictId: locationData.DistrictId,
        WardId: locationData.WardId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        multiplier: locationData.multiplier,
        area_description: locationData.area_description,
      });
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Update location error:', error);
      console.error('Request URL:', `/locations/${id}`);
      console.error('Request data:', locationData);
      
      if (error.response?.status === 404) {
        throw new Error(`Location with ID ${id} not found`);
      }
      throw new Error('Failed to update location');
    }
  },

  deleteLocation: async (locationId: number): Promise<void> => {
    try {
      await api.delete(`/locations/${locationId}`);
    } catch (error) {
      console.error('Delete location error:', error);
      throw new Error('Failed to delete location');
    }
  },

  // Utility methods
  getLockerStats: async (): Promise<{
    totalLockers: number;
    activeLockers: number;
    totalCompartments: number;
    availableCompartments: number;
    occupiedCompartments: number;
  }> => {
    try {
      const response = await api.get<any>('/locker/stats');
      console.log('Get locker stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get locker stats error:', error);
      throw new Error('Failed to fetch locker statistics');
    }
  },
};

export default lockerService;

































