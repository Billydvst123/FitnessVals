import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../context/authStore';
import { memberService, MemberDashboardResponse } from '../../services/memberService';
import { Flame, Activity, Camera, CheckCircle2 } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<MemberDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await memberService.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Gagal mengambil data dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#f85a65" />
      </View>
    );
  }

  const calorieSummary = data?.calorie_summary || {
    daily_target: user?.daily_calorie_target || 2000,
    calories_consumed: 0,
    remaining_calorie: user?.daily_calorie_target || 2000,
  };

  const consumedPercent = Math.min(
    Math.round((calorieSummary.calories_consumed / calorieSummary.daily_target) * 100),
    100
  );

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - consumedPercent / 100);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  const bmi = user?.current_bmi || 0;
  const bmiCategory = user?.bmi_category || 'Not Set';

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-5 pt-5 pb-28">
        {/* Date & Greeting */}
        <View className="mb-5">
          <Text className="text-sm text-slate-400 font-medium">{today}</Text>
          <Text className="text-2xl font-extrabold text-slate-900 mt-1">Today's Summary</Text>
        </View>

        {/* Calorie Ring Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center mb-5">
          {/* Ring Chart */}
          <View className="w-48 h-48 mb-6 items-center justify-center">
            <Svg width={192} height={192} viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Defs>
                <LinearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FF4655" />
                  <Stop offset="100%" stopColor="#FF6B77" />
                </LinearGradient>
              </Defs>
              {/* Background Track */}
              <Circle cx="50" cy="50" r={radius} fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
              {/* Progress Fill */}
              <Circle
                cx="50" cy="50" r={radius}
                fill="transparent"
                stroke="url(#gradient-primary)"
                strokeWidth="12"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
            {/* Center Text */}
            <View className="absolute items-center justify-center">
              <Text className="text-4xl font-extrabold text-slate-900">{calorieSummary.remaining_calorie}</Text>
              <Text className="text-sm font-medium text-slate-500 mt-1">kcal left</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="w-full flex-row gap-4">
            <View className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100 items-center">
              <View className="flex-row items-center gap-1 mb-1">
                <Flame size={14} color="#ef4444" />
                <Text className="text-xs text-slate-500 font-semibold uppercase">Consumed</Text>
              </View>
              <Text className="text-xl font-bold text-slate-900">{calorieSummary.calories_consumed}</Text>
            </View>
            <View className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100 items-center">
              <View className="flex-row items-center gap-1 mb-1">
                <Activity size={14} color="#64748b" />
                <Text className="text-xs text-slate-500 font-semibold uppercase">Target</Text>
              </View>
              <Text className="text-xl font-bold text-slate-900">{calorieSummary.daily_target}</Text>
            </View>
          </View>
        </View>

        {/* Scan Food Button */}
        <TouchableOpacity
          className="w-full py-4 rounded-2xl bg-slate-900 flex-row justify-center items-center shadow-lg mb-5"
          onPress={() => router.push('/(member)/nutrition')}
          activeOpacity={0.8}
        >
          <Camera size={20} color="#ffffff" />
          <Text className="text-white text-base font-bold ml-2">Scan Food</Text>
        </TouchableOpacity>

        {/* BMI Card */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 overflow-hidden">
          <View className="absolute top-0 right-0 w-1.5 h-full bg-amber-400" />
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Current BMI</Text>
              <Text className="text-3xl font-extrabold text-slate-900">{bmi > 0 ? bmi.toFixed(1) : '-'}</Text>
            </View>
            <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50">
              <CheckCircle2 size={14} color="#10b981" />
              <Text className="text-emerald-600 font-bold text-xs">{bmiCategory}</Text>
            </View>
          </View>

          <View className="bg-slate-50 rounded-xl p-3 flex-row justify-between items-center mt-4">
            <Text className="text-slate-500 text-sm">Height: <Text className="text-slate-900 font-bold">{user?.height || 0} cm</Text></Text>
            <Text className="text-slate-200">|</Text>
            <Text className="text-slate-500 text-sm">Weight: <Text className="text-slate-900 font-bold">{user?.weight || 0} kg</Text></Text>
          </View>

          <TouchableOpacity
            className="mt-3 items-center"
            onPress={() => router.push('/(member)/profile')}
          >
            <Text className="text-primary-500 font-semibold text-sm">Update Physical Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
