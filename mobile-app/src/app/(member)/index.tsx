import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../context/authStore';
import { memberService, MemberDashboardResponse } from '../../services/memberService';
import { Flame, Target, Trophy, Plus, Calendar, Utensils, Dumbbell, ActivitySquare, ChevronRight, Bell, AlertCircle, Zap, Activity } from 'lucide-react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  const calorieSummary = data?.calorie_summary || {
    daily_target: user?.daily_calorie_target || 2000,
    calories_consumed: 0,
    remaining_calorie: user?.daily_calorie_target || 2000,
  };

  const bmiProgress = data?.bmi_progress || [];
  const chartData = bmiProgress.slice().reverse().map(log => {
    return { value: log.weight };
  });
  const hasEnoughData = chartData.length > 1;

  const currentWeight = user?.weight || 0;
  const targetWeight = user?.target_weight || (currentWeight > 0 ? currentWeight - 5 : 70);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 py-4 flex-row justify-between items-center bg-[#F8FAFC]">
          <View className="flex-row items-center">
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }}
              className="w-12 h-12 rounded-full mr-3"
            />
            <View>
              <Text className="text-slate-900 font-bold text-lg">Dashboard</Text>
              <Text className="text-slate-500 text-xs">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity>
              <Bell size={24} color="#64748b" />
            </TouchableOpacity>
            <View className="w-10 h-10 rounded-full bg-red-600 items-center justify-center">
              <Text className="text-white font-bold text-sm">
                {(user?.name || 'U').substring(0, 2).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 pb-28">
          {/* Main Dark Card */}
          <View className="bg-[#1C1C1E] rounded-3xl p-6 shadow-lg shadow-slate-900/20 mb-6 relative overflow-hidden">
            {/* Background pattern placeholder */}
            <View className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mt-10 -mr-10" />
            
            <Text className="text-red-500 font-bold text-[10px] tracking-widest uppercase mb-2">Hari ke-1 Fitness Journey</Text>
            
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-white text-3xl font-extrabold flex-1 leading-tight">
                Good Afternoon,{'\n'}{user?.name?.split(' ')[0] || 'User'}!
              </Text>
              <View className="p-2 bg-red-500/20 rounded-full">
                <Trophy size={20} color="#ef4444" />
              </View>
            </View>

            <View className="bg-red-500/20 self-start px-3 py-1 rounded-full mb-4 flex-row items-center">
              <Trophy size={12} color="#ef4444" />
              <Text className="text-red-500 text-xs font-bold ml-1">MEMBER PRO</Text>
            </View>

            <Text className="text-slate-300 text-sm leading-relaxed mb-6">
              Konsistensi adalah kunci. Kamu sudah 75% menuju target bulanan. Ayo lanjutkan!
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 bg-red-600 rounded-xl py-3 flex-row justify-center items-center"
                onPress={() => router.push('/(member)/nutrition')}>
                <Plus size={16} color="#ffffff" />
                <Text className="text-white font-bold ml-2 text-sm">Log Makanan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <View className="flex-row justify-between items-start mb-4">
                <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center">
                  <Flame size={20} color="#3b82f6" />
                </View>
                <Text className="text-[10px] font-bold text-emerald-500 tracking-wider">Total Konsumsi</Text>
              </View>
              <Text className="text-3xl font-black text-slate-900 tracking-tighter">{calorieSummary.calories_consumed} <Text className="text-xs text-slate-400 font-medium">kcal</Text></Text>
              <Text className="text-xs text-slate-400 mt-1">Kalori Hari Ini</Text>
              
              <View className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                <View className="h-full bg-red-600 rounded-full" style={{ width: `${Math.min((calorieSummary.calories_consumed / calorieSummary.daily_target) * 100, 100)}%` }} />
              </View>
            </View>

            <View className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <View className="flex-row justify-between items-start mb-4">
                <View className="w-10 h-10 rounded-2xl bg-amber-50 items-center justify-center">
                  <Target size={20} color="#f59e0b" />
                </View>
                <Text className="text-[10px] font-bold text-slate-800 tracking-wider">Target</Text>
              </View>
              <Text className="text-3xl font-black text-slate-900 tracking-tighter">{calorieSummary.daily_target}</Text>
              <Text className="text-xs text-slate-400 mt-1">{calorieSummary.remaining_calorie} kcal remaining</Text>
              
              <View className="flex-row justify-between mt-4">
                <Text className="text-[9px] text-slate-500 font-bold tracking-wider">LOW</Text>
                <Text className="text-[9px] text-slate-800 font-bold tracking-wider">DAILY GOAL</Text>
                <Text className="text-[9px] text-slate-500 font-bold tracking-wider">HIGH</Text>
              </View>
            </View>
          </View>

          {/* Weight Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <ActivitySquare size={20} color="#ef4444" />
                <Text className="text-base font-bold text-slate-900 ml-2">Berat Badan</Text>
              </View>
              <View className="flex-row bg-slate-100 rounded-lg p-1">
                <Text className="px-3 py-1 text-xs text-slate-500 font-bold">7D</Text>
                <View className="bg-red-500 rounded-md px-3 py-1 shadow-sm">
                  <Text className="text-xs text-white font-bold">30D</Text>
                </View>
                <Text className="px-3 py-1 text-xs text-slate-500 font-bold">90D</Text>
              </View>
            </View>

            <View className="items-center w-full mb-4">
              <LineChart
                data={hasEnoughData ? chartData : [{value: currentWeight}, {value: currentWeight - 1}]}
                width={280}
                height={100}
                thickness={2}
                color="#b91c1c"
                dataPointsColor="#dc2626"
                dataPointsRadius={3}
                hideYAxisText
                hideRules
                hideDataPoints={false}
                xAxisColor="transparent"
                yAxisColor="transparent"
                curved
                initialSpacing={10}
                endSpacing={10}
              />
              <View className="flex-row justify-between w-full mt-2 px-2">
                {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((label, idx) => (
                  <Text key={idx} className="text-[10px] text-slate-400 font-medium">{label}</Text>
                ))}
              </View>
            </View>

            <View className="flex-row justify-between items-end border-t border-slate-100 pt-4">
              <View>
                <Text className="text-xs text-slate-500 font-medium">Saat Ini</Text>
                <Text className="text-xl font-bold text-slate-900 mt-1">{currentWeight.toFixed(1)} kg</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-slate-500 font-medium">Target</Text>
                <Text className="text-xl font-bold text-red-600 mt-1">{targetWeight.toFixed(1)} kg</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Zap size={20} color="#ef4444" />
              <Text className="text-base font-bold text-slate-900 ml-2">Quick Actions</Text>
            </View>
            <View className="flex-row justify-between">
              <TouchableOpacity className="bg-white rounded-3xl w-[31%] aspect-square items-center justify-center shadow-sm border border-slate-100"
                onPress={() => router.push('/(member)/nutrition')}>
                <Utensils size={24} color="#b91c1c" />
                <Text className="text-[10px] font-bold text-slate-700 mt-3">Catat Makan</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white rounded-3xl w-[31%] aspect-square items-center justify-center shadow-sm border border-slate-100"
                onPress={() => router.push('/(member)/workout-logs')}>
                <Dumbbell size={24} color="#b91c1c" />
                <Text className="text-[10px] font-bold text-slate-700 mt-3">Log Latihan</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white rounded-3xl w-[31%] aspect-square items-center justify-center shadow-sm border border-slate-100"
                onPress={() => router.push('/(member)/profile')}>
                <Activity size={24} color="#b91c1c" />
                <Text className="text-[10px] font-bold text-slate-700 mt-3">Cek BMI</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Kelas Mendatang removed as per user request */}

          {/* Target Bulanan */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
            <View className="flex-row items-center mb-6">
              <Trophy size={20} color="#ef4444" />
              <Text className="text-base font-bold text-slate-900 ml-2">Target Bulanan</Text>
            </View>

            <View className="mb-4">
              <View className="flex-row justify-between items-end mb-2">
                <Text className="text-xs font-bold text-slate-700">Sesi Latihan</Text>
                <Text className="text-xs font-bold text-red-600">1/24</Text>
              </View>
              <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full bg-red-600 rounded-full" style={{ width: '4%' }} />
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row justify-between items-end mb-2">
                <Text className="text-xs font-bold text-slate-700">Kalori Harian Terpenuhi</Text>
                <Text className="text-xs font-bold text-red-600">0/30</Text>
              </View>
              <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full bg-red-600 rounded-full" style={{ width: '0%' }} />
              </View>
            </View>

            <View className="mb-6">
              <View className="flex-row justify-between items-end mb-2">
                <Text className="text-xs font-bold text-slate-700">Langkah 10K/hari</Text>
                <Text className="text-xs font-bold text-red-600">0/30</Text>
              </View>
              <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full bg-red-600 rounded-full" style={{ width: '0%' }} />
              </View>
            </View>

            <View className="bg-red-50 rounded-xl p-3 flex-row items-start">
              <AlertCircle size={14} color="#ef4444" className="mt-0.5" />
              <Text className="text-xs text-red-800 ml-2 flex-1">Kamu sudah 75% menuju target bulan ini. Terus semangat!</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
