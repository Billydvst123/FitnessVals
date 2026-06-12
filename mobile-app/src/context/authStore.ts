import { create } from 'zustand';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  user_id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  daily_calorie_target: number;
  dietary_preferences: string;
  medical_history: string;
  current_bmi: number;
  bmi_category: string;
  updated_at: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<UserProfile | null>;
  updateProfile: (profileData: Omit<UserProfile, 'user_id' | 'name' | 'email' | 'role' | 'current_bmi' | 'bmi_category' | 'updated_at'>) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,

  init: async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      set({ token, isAuthenticated: true });
      await get().fetchProfile();
    }
    set({ isInitialized: true });
  },

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;
      
      await AsyncStorage.setItem('token', token);
      set({ token, isAuthenticated: true });

      const profile = await get().fetchProfile();
      if (profile) {
        set({ isLoading: false });
        return true;
      } else {
        throw new Error('Gagal mendapatkan profil pengguna.');
      }
    } catch (err: any) {
      await AsyncStorage.removeItem('token');
      set({ 
        token: null, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: err.response?.data?.error || err.message || 'Login gagal.' 
      });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user_role');
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  fetchProfile: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return null;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/users/profile');
      const profile: UserProfile = response.data.data;
      await AsyncStorage.setItem('user_role', profile.role);
      set({ user: profile, isAuthenticated: true, isLoading: false });
      return profile;
    } catch (err: any) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user_role');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/users/profile', profileData);
      const updatedProfile: UserProfile = response.data.data;
      set({ user: updatedProfile, isLoading: false });
      return true;
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.response?.data?.error || 'Gagal memperbarui profil.' 
      });
      return false;
    }
  }
}));
