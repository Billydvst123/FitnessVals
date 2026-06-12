import api from './api';

export interface CalorieSummary {
  daily_target: number;
  calories_consumed: number;
  calories_burned: number;
  remaining_calorie: number;
}

export interface MemberDashboardResponse {
  calorie_summary: CalorieSummary;
}

export interface NutritionLogRequest {
  food_name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  meal_time: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface NutritionLogData extends NutritionLogRequest {
  id: number;
  member_id: number;
  log_date: string;
  created_at: string;
}

export interface FoodAnalysisResponse {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WorkoutLogRequest {
  workout_type: 'cardio' | 'weightlifting';
  workout_name: string;
  duration_minutes?: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  calories_burned?: number;
}

export interface WorkoutLogData extends WorkoutLogRequest {
  id: number;
  user_id: number;
  date: string;
}

export const memberService = {
  getDashboard: async (): Promise<MemberDashboardResponse> => {
    const response = await api.get('/member/dashboard');
    return response.data;
  },

  createNutritionLog: async (data: NutritionLogRequest): Promise<NutritionLogData> => {
    const response = await api.post('/member/nutrition', data);
    return response.data.data;
  },

  getNutritionLogs: async (): Promise<NutritionLogData[]> => {
    const response = await api.get('/member/nutrition');
    return response.data.data || [];
  },

  getWorkoutLogs: async (): Promise<WorkoutLogData[]> => {
    const response = await api.get('/member/workout-logs');
    return response.data.data || [];
  },

  createWorkoutLog: async (data: WorkoutLogRequest): Promise<WorkoutLogData> => {
    const response = await api.post('/member/workout-logs', data);
    return response.data.data;
  },

  getMealRecommendations: async (): Promise<string> => {
    const response = await api.get('/member/meals/recommendations');
    return response.data.recommendation || '';
  },

  analyzeFoodImage: async (imageBase64: string): Promise<FoodAnalysisResponse> => {
    const response = await api.post('/member/meals/analyze', { image_base64: imageBase64 });
    return response.data.data;
  },

  analyzeFoodText: async (foodName: string): Promise<FoodAnalysisResponse> => {
    const response = await api.post('/member/meals/analyze-text', { food_name: foodName });
    return response.data.data;
  },
};
