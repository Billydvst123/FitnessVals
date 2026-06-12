import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../context/authStore';
import { memberService } from '../../services/memberService';
import { RefreshCw, AlertCircle, Sparkles, Sun, Utensils, Moon, Coffee } from 'lucide-react-native';

interface MealBlock {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  menu: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const MEAL_ICONS: Record<string, typeof Sun> = {
  breakfast: Sun,
  lunch: Utensils,
  dinner: Moon,
  snack: Coffee,
};

const MEAL_COLORS: Record<string, { bg: string; text: string }> = {
  breakfast: { bg: 'bg-amber-50', text: '#f59e0b' },
  lunch: { bg: 'bg-primary-50', text: '#f85a65' },
  dinner: { bg: 'bg-indigo-50', text: '#6366f1' },
  snack: { bg: 'bg-emerald-50', text: '#10b981' },
};

export default function AIMealsScreen() {
  const [recommendation, setRecommendation] = useState<string>('');
  const [meals, setMeals] = useState<MealBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const parseMealsFromMarkdown = (text: string): MealBlock[] => {
    const mealList: MealBlock[] = [];
    const lines = text.split('\n');

    const mealPatterns = [
      { key: 'Sarapan', type: 'breakfast' as const, title: 'Sarapan' },
      { key: 'Siang', type: 'lunch' as const, title: 'Makan Siang' },
      { key: 'Malam', type: 'dinner' as const, title: 'Makan Malam' },
      { key: 'Camilan', type: 'snack' as const, title: 'Camilan' },
    ];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*')) {
        const pattern = mealPatterns.find(p => trimmed.toLowerCase().includes(p.key.toLowerCase()));
        if (pattern) {
          const parts = trimmed.split(':');
          if (parts.length >= 2) {
            let menu = parts.slice(1).join(':').trim();

            let calories = 'TBA';
            const kcalMatch = menu.match(/~(\d+)\s*kcal/);
            if (kcalMatch && kcalMatch[1]) {
              calories = `${kcalMatch[1]} kcal`;
              menu = menu.replace(/\(~.*?\)/g, '').trim();
            }

            const calNum = parseInt(calories) || 400;
            const proteinVal = `${Math.round(calNum * 0.07)}g`;
            const carbsVal = `${Math.round(calNum * 0.09)}g`;
            const fatVal = `${Math.round(calNum * 0.025)}g`;

            mealList.push({
              type: pattern.type,
              title: pattern.title,
              menu: menu.replace(/\*\*/g, ''),
              calories,
              protein: proteinVal,
              carbs: carbsVal,
              fat: fatVal,
            });
          }
        }
      }
    });

    return mealList;
  };

  const fetchMeals = async (forceRefresh = false) => {
    const today = new Date().toLocaleDateString('en-CA');
    const cachedData = await AsyncStorage.getItem('daily_meal_recommendation');
    const cachedDate = await AsyncStorage.getItem('daily_meal_date');

    if (!forceRefresh && cachedData && cachedDate === today) {
      setRecommendation(cachedData);
      setMeals(parseMealsFromMarkdown(cachedData));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await memberService.getMealRecommendations();
      setRecommendation(data);
      setMeals(parseMealsFromMarkdown(data));

      await AsyncStorage.setItem('daily_meal_recommendation', data);
      await AsyncStorage.setItem('daily_meal_date', today);
    } catch (err) {
      setError('Gagal memuat rekomendasi makanan AI. Pastikan profil fisik Anda sudah diisi lengkap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals(false);
  }, []);

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-5 pt-5 pb-28">

        {/* Header */}
        <View className="bg-slate-900 rounded-3xl p-6 items-center mb-5 shadow-sm overflow-hidden">
          <Sparkles size={32} color="#f85a65" />
          <Text className="text-xl font-bold text-white mt-2 tracking-tight">AI Nutritionist</Text>
          <Text className="text-xs text-slate-400 mt-1 text-center max-w-[240px]">
            Saran makanan dipersonalisasi berdasarkan kondisi medis dan preferensi diet Anda.
          </Text>
        </View>

        {/* Target & Refresh */}
        <View className="flex-row justify-between items-center px-1 mb-4">
          <View>
            <Text className="font-bold text-slate-900">Menu Hari Ini</Text>
            <Text className="text-xs text-slate-500 mt-0.5">Target: {user?.daily_calorie_target || 2000} kcal</Text>
          </View>
          <TouchableOpacity
            className="p-2.5 rounded-full bg-white shadow-sm border border-slate-100"
            onPress={() => fetchMeals(true)}
            disabled={loading}
          >
            <RefreshCw size={16} color="#f85a65" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="items-center py-16 bg-white rounded-3xl border border-slate-100">
            <ActivityIndicator size="large" color="#f85a65" />
            <Text className="text-slate-500 text-xs font-semibold mt-4">Meracik menu khusus untuk Anda...</Text>
          </View>
        ) : error ? (
          <View className="bg-red-50 border border-red-100 p-5 rounded-3xl items-center shadow-sm">
            <AlertCircle size={32} color="#f87171" />
            <Text className="font-bold text-red-600 text-sm mt-3 mb-1">Gagal Memuat Menu</Text>
            <Text className="text-xs text-red-500 text-center max-w-[250px]">{error}</Text>
          </View>
        ) : meals.length > 0 ? (
          <View>
            {meals.map((meal, idx) => {
              const Icon = MEAL_ICONS[meal.type] || Coffee;
              const colors = MEAL_COLORS[meal.type] || MEAL_COLORS.snack;
              return (
                <View key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row gap-4 mb-3">
                  <View className={`w-12 h-12 rounded-full ${colors.bg} items-center justify-center`}>
                    <Icon size={20} color={colors.text} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="font-bold text-slate-900 text-sm">{meal.title}</Text>
                      <View className="bg-red-50 px-2 py-0.5 rounded-full">
                        <Text className="text-xs font-bold text-red-500">{meal.calories}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-600 leading-relaxed mb-3 pr-2">{meal.menu}</Text>
                    <View className="flex-row gap-2">
                      <View className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        <Text className="text-[10px] text-slate-500">Protein <Text className="text-slate-900 font-bold">{meal.protein}</Text></Text>
                      </View>
                      <View className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        <Text className="text-[10px] text-slate-500">Carbs <Text className="text-slate-900 font-bold">{meal.carbs}</Text></Text>
                      </View>
                      <View className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        <Text className="text-[10px] text-slate-500">Fat <Text className="text-slate-900 font-bold">{meal.fat}</Text></Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <Text className="text-sm leading-relaxed text-slate-700">{recommendation}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
