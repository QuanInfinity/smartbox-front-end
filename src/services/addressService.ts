import axios from 'axios';

const API_BASE_URL = 'https://smartbox-back-end.onrender.com/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface Province {
  ProvinceId: number;
  ProvinceName: string;
  StateCode: string;
}

export interface District {
  DistrictId: number;
  ProvinceId: number;
  DistrictName: string;
  IsActive: number;
}

export interface Ward {
  WardId: number;
  DistrictId: number;
  WardName: string;
  IsActive: number;
}

export const addressService = {
  getProvinces: async (): Promise<Province[]> => {
    const response = await api.get('/provinces');
    return response.data.data || response.data;
  },

  getDistrictsByProvince: async (provinceId: number): Promise<District[]> => {
    const response = await api.get(`/districts/province/${provinceId}`);
    return response.data.data || response.data;
  },

  getWardsByDistrict: async (districtId: number): Promise<Ward[]> => {
    const response = await api.get(`/wards/district/${districtId}`);
    return response.data.data || response.data;
  },
};

export default addressService;

