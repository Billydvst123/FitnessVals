import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Platform-aware API URL:
// - Web: same machine, use localhost
// - Android Emulator: 10.0.2.2 maps to host machine's localhost
// - iOS Simulator: localhost works directly
// - Physical device: replace with your computer's local IP
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  } else if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  } else {
    return 'http://localhost:3000/api';
  }
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user_role');
    }
    return Promise.reject(error);
  }
);

export default api;
