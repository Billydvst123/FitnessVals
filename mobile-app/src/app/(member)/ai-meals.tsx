import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../context/authStore';
import { memberService } from '../../services/memberService';
import { RefreshCw, AlertCircle, Search, Bell, Plus, Flame } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MealBlock {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  menu: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const MEAL_IMAGES: Record<string, string> = {
  breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
  dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
  snack: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=800&auto=format&fit=crop',
};

const FILTERS = ['Semua', 'Sarapan', 'Makan Siang', 'Malam', 'Snack'];

export default function AIMealsScreen() {
  const [recommendation, setRecommendation] = useState<string>('');
  const [meals, setMeals] = useState<MealBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('Semua');
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

  const filteredMeals = meals.filter(m => {
    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Sarapan' && m.type === 'breakfast') return true;
    if (activeFilter === 'Makan Siang' && m.type === 'lunch') return true;
    if (activeFilter === 'Malam' && m.type === 'dinner') return true;
    if (activeFilter === 'Snack' && m.type === 'snack') return true;
    return false;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-center bg-[#F8FAFC]">
        <View className="flex-row items-center">
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }}
            className="w-12 h-12 rounded-full mr-3"
          />
          <View>
            <Text className="text-red-600 font-bold text-lg">AI Meals</Text>
            <Text className="text-slate-500 text-xs">Rekomendasi Makanan</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity><Search size={24} color="#64748b" /></TouchableOpacity>
          <TouchableOpacity><Bell size={24} color="#64748b" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-28">

          {/* Profil Nutrisi Card */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border-2 border-red-100 mb-6 mt-2 relative overflow-hidden">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="bg-red-100 p-2 rounded-xl mr-3">
                  <Flame size={20} color="#ef4444" />
                </View>
                <View>
                  <Text className="text-xs text-slate-500 font-bold tracking-wider">TARGET HARIAN</Text>
                  <Text className="text-xl font-black text-slate-900">{user?.daily_calorie_target || 2000} <Text className="text-sm text-slate-500">kcal</Text></Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-red-50 p-2.5 rounded-full"
                onPress={() => fetchMeals(true)}
                disabled={loading}
              >
                <RefreshCw size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mt-2 pt-4 border-t border-slate-100">
              <View className="items-center">
                <Text className="text-[10px] text-slate-500 font-bold mb-1">PROTEIN</Text>
                <Text className="text-sm font-bold text-slate-900">120g</Text>
              </View>
              <View className="items-center">
                <Text className="text-[10px] text-slate-500 font-bold mb-1">CARBS</Text>
                <Text className="text-sm font-bold text-slate-900">200g</Text>
              </View>
              <View className="items-center">
                <Text className="text-[10px] text-slate-500 font-bold mb-1">FATS</Text>
                <Text className="text-sm font-bold text-slate-900">55g</Text>
              </View>
            </View>
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 overflow-visible">
            <View className="flex-row pr-5">
              {FILTERS.map((filter, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setActiveFilter(filter)}
                  className={`px-5 py-2.5 rounded-full mr-3 border ${
                    activeFilter === filter 
                      ? 'bg-red-600 border-red-600' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className={`font-bold text-sm ${
                    activeFilter === filter ? 'text-white' : 'text-slate-600'
                  }`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Meals List */}
          {loading ? (
            <View className="items-center py-16 bg-white rounded-3xl border border-slate-100">
              <ActivityIndicator size="large" color="#ef4444" />
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
              {filteredMeals.map((meal, idx) => {
                const imgUrl = MEAL_IMAGES[meal.type] || MEAL_IMAGES.lunch;
                return (
                  <View key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 mb-6">
                    <Image source={{ uri: imgUrl }} className="w-full h-48" resizeMode="cover" />
                    
                    <View className="p-5">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 pr-3">
                          <Text className="font-bold text-slate-900 text-lg mb-1">{meal.menu.split(',')[0] || meal.menu}</Text>
                          <Text className="text-xs text-slate-500">{meal.title}</Text>
                        </View>
                        <View className="bg-red-50 px-3 py-1 rounded-full border border-red-100">
                          <Text className="text-xs font-bold text-red-600">{meal.calories}</Text>
                        </View>
                      </View>

                      {/* Tags */}
                      <View className="flex-row flex-wrap gap-2 mb-4 mt-2">
                        <View className="bg-slate-100 px-2.5 py-1 rounded-md">
                          <Text className="text-[10px] font-bold text-slate-600 tracking-wider">PROTEIN {meal.protein}</Text>
                        </View>
                        <View className="bg-slate-100 px-2.5 py-1 rounded-md">
                          <Text className="text-[10px] font-bold text-slate-600 tracking-wider">CARBS {meal.carbs}</Text>
                        </View>
                        <View className="bg-slate-100 px-2.5 py-1 rounded-md">
                          <Text className="text-[10px] font-bold text-slate-600 tracking-wider">FAT {meal.fat}</Text>
                        </View>
                        <View className="bg-green-50 px-2.5 py-1 rounded-md border border-green-100">
                          <Text className="text-[10px] font-bold text-green-700 tracking-wider">HEALTHY</Text>
                        </View>
                      </View>

                      <TouchableOpacity className="w-full py-3.5 rounded-2xl border-2 border-red-600 flex-row justify-center items-center mt-2">
                        <Plus size={18} color="#dc2626" />
                        <Text className="text-red-600 font-bold ml-2">Tambah ke Log</Text>
                      </TouchableOpacity>
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
    </SafeAreaView>
  );
}
