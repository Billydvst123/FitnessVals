import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { memberService, WorkoutLogData, WorkoutLogRequest } from '../../services/memberService';
import { Dumbbell, Activity, Plus, X, Calendar, AlertCircle, CheckCircle, ChevronDown, Bell, Settings, TrendingUp, Zap, Trophy, Star, ArrowRight, CheckCircle2, Flame } from 'lucide-react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const WEIGHTLIFTING_OPTIONS = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull Up", "Bicep Curl", "Leg Press", "Lainnya"];
const CARDIO_OPTIONS = ["Lari (Treadmill)", "Lari (Outdoor)", "Sepeda Statis", "Sepeda Outdoor", "Renang", "Lompat Tali", "Elliptical", "Lainnya"];

export default function WorkoutLogScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<WorkoutLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [workoutType, setWorkoutType] = useState<'cardio' | 'weightlifting'>('weightlifting');
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [isCustomName, setIsCustomName] = useState(false);
  const [showSetsDropdown, setShowSetsDropdown] = useState(false);
  const [showRepsDropdown, setShowRepsDropdown] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [calories, setCalories] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await memberService.getWorkoutLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch workout logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSubmit = async () => {
    if (!workoutName) {
      setError('Nama latihan tidak boleh kosong');
      return;
    }
    if (workoutType === 'cardio' && !duration) {
      setError('Durasi wajib diisi untuk Cardio');
      return;
    }
    if (workoutType === 'weightlifting' && (!sets || !reps)) {
      setError('Sets dan Reps wajib diisi untuk Angkat Beban');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: WorkoutLogRequest = {
      workout_type: workoutType,
      workout_name: workoutName,
    };

    if (workoutType === 'cardio') payload.duration_minutes = parseInt(duration, 10);
    if (workoutType === 'weightlifting') {
      payload.sets = parseInt(sets, 10);
      payload.reps = parseInt(reps, 10);
      if (weightKg) payload.weight_kg = parseFloat(weightKg);
    }
    if (calories) payload.calories_burned = parseInt(calories, 10);

    try {
      await memberService.createWorkoutLog(payload);
      setModalVisible(false);
      setWorkoutName('');
      setDuration('');
      setSets('');
      setReps('');
      setWeightKg('');
      setCalories('');
      fetchLogs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan data latihan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

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
              <Text className="text-red-600 font-bold text-lg">Progress Latihan</Text>
              <Text className="text-slate-500 text-xs">{todayStr}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity><Bell size={24} color="#64748b" /></TouchableOpacity>
            <TouchableOpacity><Settings size={24} color="#64748b" /></TouchableOpacity>
          </View>
        </View>

        <View className="px-5 pb-28">
          {/* Top Stats */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-[1.5] bg-white rounded-2xl p-4 border border-slate-100 items-start">
              <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center mb-3">
                <TrendingUp size={16} color="#ef4444" />
              </View>
              <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Sesi</Text>
              <Text className="text-2xl font-black text-slate-900 mt-1">1</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 items-start">
              <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center mb-3">
                <Calendar size={16} color="#10b981" />
              </View>
              <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aktif Bulan Ini</Text>
              <Text className="text-2xl font-black text-slate-900 mt-1">1</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 items-start">
              <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mb-3">
                <Zap size={16} color="#3b82f6" />
              </View>
              <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Streak</Text>
              <Text className="text-2xl font-black text-slate-900 mt-1">1 <Text className="text-xs font-bold text-slate-400">Hari</Text></Text>
            </View>
          </View>

          {/* Log Latihan Harian (Dipindah ke atas) */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-base font-bold text-slate-900">Log Latihan Harian</Text>
              <TouchableOpacity className="bg-red-700 px-4 py-2 rounded-xl flex-row items-center" onPress={() => setModalVisible(true)}>
                <Plus size={14} color="white" />
                <Text className="text-xs font-bold text-white ml-1">Catat Latihan</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#ef4444" />
            ) : logs.length > 0 ? (
              logs.map((log, index) => (
                <View key={log.id} className="flex-row mb-6 relative">
                  {/* Timeline line */}
                  {index !== logs.length - 1 && <View className="absolute left-[3.5px] top-4 bottom-[-24px] w-[1px] bg-red-200" />}
                  
                  <View className="w-2 h-2 rounded-full bg-red-600 mt-1.5 mr-4" />
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="font-bold text-slate-900 text-base">{log.workout_name}</Text>
                      <Text className="text-[10px] text-slate-500 font-medium">{formatDate(log.date)}</Text>
                    </View>
                    
                    {log.workout_type === 'weightlifting' && log.sets && log.reps ? (
                      <View className="flex-row items-center mb-1">
                        <CheckCircle2 size={12} color="#64748b" className="mr-2" />
                        <Text className="text-xs text-slate-600">{log.sets} Sets × {log.reps} Reps {log.weight_kg ? `(${log.weight_kg}kg)` : ''}</Text>
                      </View>
                    ) : null}
                    
                    {log.workout_type === 'cardio' && log.duration_minutes ? (
                      <View className="flex-row items-center mb-1">
                        <CheckCircle2 size={12} color="#64748b" className="mr-2" />
                        <Text className="text-xs text-slate-600">{log.duration_minutes} Menit Cardio</Text>
                      </View>
                    ) : null}

                    {log.calories_burned ? (
                      <View className="flex-row items-center mt-1">
                        <Flame size={12} color="#f59e0b" className="mr-2" />
                        <Text className="text-xs font-bold text-amber-600">{log.calories_burned} kcal terbakar</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-6">
                <Text className="text-slate-400 text-sm">Belum ada latihan yang dicatat.</Text>
              </View>
            )}
          </View>

          {/* Berat Badan Graph (Placeholder) */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
            <Text className="text-base font-bold text-slate-900 mb-6">Berat Badan</Text>
            <View className="h-32 justify-center items-center">
              <View className="absolute left-0 top-0 bottom-0 justify-between items-end pr-2 border-r border-slate-100">
                <Text className="text-[9px] text-slate-400">95</Text>
                <Text className="text-[9px] text-slate-400">93</Text>
                <Text className="text-[9px] text-slate-400">91</Text>
                <Text className="text-[9px] text-slate-400">89</Text>
                <Text className="text-[9px] text-slate-400">87</Text>
                <Text className="text-[9px] text-slate-400">85</Text>
              </View>
              <View className="w-full h-full pl-6">
                {/* Horizontal grid lines */}
                <View className="border-t border-slate-50 w-full mb-[18%]" />
                <View className="border-t border-slate-50 w-full mb-[18%]" />
                <View className="border-t border-slate-50 w-full mb-[18%]" />
                <View className="border-t border-slate-50 w-full mb-[18%]" />
                <View className="border-t border-slate-100 w-full" />
                {/* Dot */}
                <View className="absolute left-8 bottom-6 w-2 h-2 rounded-full bg-red-600" />
              </View>
            </View>
            <Text className="text-[10px] text-slate-400 mt-2 ml-6">09 Jun</Text>
          </View>

          {/* Fitur Rencana & Frekuensi Latihan removed as per user request */}

          {/* Pencapaian (Dipindah ke bawah) */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Trophy size={18} color="#ef4444" />
              <Text className="text-base font-bold text-slate-900 ml-2">Pencapaian</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
              <View className="bg-white border-b-2 border-red-600 rounded-2xl p-4 mr-3 w-36 items-center shadow-sm border-t border-x border-slate-100">
                <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-3">
                  <Flame size={24} color="#64748b" />
                </View>
                <Text className="text-xs font-bold text-slate-900 mb-1">10 Sesi Pertama</Text>
                <Text className="text-xs text-slate-400">1 / 10</Text>
              </View>
              <View className="bg-white border-b-2 border-red-600 rounded-2xl p-4 mr-3 w-36 items-center shadow-sm border-t border-x border-slate-100">
                <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-3">
                  <Trophy size={20} color="#64748b" />
                </View>
                <Text className="text-xs font-bold text-slate-900 mb-1 text-center">1 Bulan Konsisten</Text>
                <Text className="text-xs text-slate-400">1 / 8</Text>
              </View>
              <View className="bg-white rounded-2xl p-4 mr-3 w-36 items-center shadow-sm border border-slate-100">
                <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-3">
                  <Star size={20} color="#cbd5e1" />
                </View>
                <Text className="text-xs font-bold text-slate-400 mb-1">50 Sesi</Text>
                <Text className="text-xs text-slate-300">1 / 50</Text>
              </View>
            </ScrollView>
          </View>

          {/* AI Nutrition CTA */}
          <View className="bg-[#4a3939] rounded-3xl p-6 shadow-lg mb-6">
            <View className="bg-white/10 self-start px-3 py-1.5 rounded-full flex-row items-center mb-4 border border-white/10">
              <Activity size={12} color="#e5e5e5" />
              <Text className="text-[10px] font-bold text-slate-200 ml-2 tracking-wider">AI NUTRITION</Text>
            </View>
            <Text className="text-xl font-bold text-white mb-2">Latihan Hari Ini Selesai?</Text>
            <Text className="text-sm text-slate-300 mb-6 leading-relaxed">
              Dapatkan rekomendasi asupan makanan optimal berdasarkan progress workout kamu hari ini.
            </Text>
            <TouchableOpacity 
              className="bg-white py-3.5 rounded-xl flex-row justify-center items-center"
              onPress={() => router.push('/(member)/ai-meals')}
            >
              <Text className="text-slate-900 font-bold text-sm mr-2">Lihat Rekomendasi Makanan</Text>
              <ArrowRight size={16} color="#0f172a" />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Modal Form Tambah Latihan (Kept same logic, slightly restyled) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-extrabold text-slate-900">Tambah Latihan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {error && (
              <View className="bg-red-50 p-3 rounded-xl flex-row items-center gap-2 mb-4">
                <AlertCircle size={16} color="#ef4444" />
                <Text className="text-red-600 text-xs flex-1">{error}</Text>
              </View>
            )}

            <View className="flex-row bg-slate-50 rounded-xl p-1 mb-5">
              <TouchableOpacity 
                className={`flex-1 py-2.5 items-center rounded-lg ${workoutType === 'weightlifting' ? 'bg-white border border-slate-100' : ''}`}
                style={workoutType === 'weightlifting' ? { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 } : {}}
                onPress={() => {
                  setWorkoutType('weightlifting');
                  setWorkoutName('');
                  setIsCustomName(false);
                  setShowNameDropdown(false);
                }}
              >
                <Text className={`font-bold text-sm ${workoutType === 'weightlifting' ? 'text-red-600' : 'text-slate-500'}`}>Angkat Beban</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-2.5 items-center rounded-lg ${workoutType === 'cardio' ? 'bg-white border border-slate-100' : ''}`}
                style={workoutType === 'cardio' ? { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 } : {}}
                onPress={() => {
                  setWorkoutType('cardio');
                  setWorkoutName('');
                  setIsCustomName(false);
                  setShowNameDropdown(false);
                }}
              >
                <Text className={`font-bold text-sm ${workoutType === 'cardio' ? 'text-orange-600' : 'text-slate-500'}`}>Cardio</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4 z-50 relative">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Nama Latihan</Text>
              
              {!isCustomName ? (
                <TouchableOpacity 
                  className={`bg-slate-50 border ${showNameDropdown ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3 flex-row justify-between items-center`}
                  onPress={() => {
                    setShowNameDropdown(!showNameDropdown);
                    setShowSetsDropdown(false);
                    setShowRepsDropdown(false);
                  }}
                >
                  <Text className={workoutName ? "text-slate-900 font-medium" : "text-slate-400"}>
                    {workoutName ? workoutName : (workoutType === 'cardio' ? "Pilih Jenis Cardio" : "Pilih Jenis Angkat Beban")}
                  </Text>
                  <ChevronDown size={16} color="#64748b" style={{ transform: [{ rotate: showNameDropdown ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>
              ) : (
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                    placeholder="Ketik nama latihan..."
                    value={workoutName}
                    onChangeText={setWorkoutName}
                    autoFocus
                  />
                  <TouchableOpacity 
                    className="p-3 bg-slate-100 border border-slate-200 rounded-xl"
                    onPress={() => {
                      setIsCustomName(false);
                      setWorkoutName('');
                    }}
                  >
                    <X size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}

              {showNameDropdown && !isCustomName && (
                <View className="absolute top-[72px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <ScrollView className="max-h-48" nestedScrollEnabled>
                    {(workoutType === 'cardio' ? CARDIO_OPTIONS : WEIGHTLIFTING_OPTIONS).map((item) => (
                      <TouchableOpacity
                        key={`workout-${item}`}
                        onPress={() => {
                          if (item === 'Lainnya') {
                            setIsCustomName(true);
                            setWorkoutName('');
                          } else {
                            setWorkoutName(item);
                          }
                          setShowNameDropdown(false);
                        }}
                        className={`px-4 py-3 border-b border-slate-50 ${workoutName === item ? 'bg-red-50' : ''}`}
                      >
                        <Text className={`font-medium ${workoutName === item ? 'text-red-700' : 'text-slate-600'}`}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {workoutType === 'cardio' ? (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Durasi (Menit)</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                  placeholder="30"
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
            ) : (
              <>
              <View className="flex-row gap-3 mb-4 z-40 relative">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Sets</Text>
                  <TouchableOpacity 
                    className={`bg-slate-50 border ${showSetsDropdown ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3 flex-row justify-between items-center`}
                    onPress={() => {
                      setShowSetsDropdown(!showSetsDropdown);
                      setShowRepsDropdown(false);
                    }}
                  >
                    <Text className={sets ? "text-slate-900 font-medium" : "text-slate-400"}>{sets ? `${sets}` : "Pilih"}</Text>
                    <ChevronDown size={16} color="#64748b" style={{ transform: [{ rotate: showSetsDropdown ? '180deg' : '0deg' }] }} />
                  </TouchableOpacity>

                  {showSetsDropdown && (
                    <View className="absolute top-[72px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <ScrollView className="max-h-40" nestedScrollEnabled>
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                          <TouchableOpacity
                            key={`set-${item}`}
                            onPress={() => {
                              setSets(item.toString());
                              setShowSetsDropdown(false);
                            }}
                            className={`px-4 py-3 border-b border-slate-50 ${sets === item.toString() ? 'bg-red-50' : ''}`}
                          >
                            <Text className={`font-medium text-center ${sets === item.toString() ? 'text-red-700' : 'text-slate-600'}`}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Reps</Text>
                  <TouchableOpacity 
                    className={`bg-slate-50 border ${showRepsDropdown ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3 flex-row justify-between items-center`}
                    onPress={() => {
                      setShowRepsDropdown(!showRepsDropdown);
                      setShowSetsDropdown(false);
                    }}
                  >
                    <Text className={reps ? "text-slate-900 font-medium" : "text-slate-400"}>{reps ? `${reps}` : "Pilih"}</Text>
                    <ChevronDown size={16} color="#64748b" style={{ transform: [{ rotate: showRepsDropdown ? '180deg' : '0deg' }] }} />
                  </TouchableOpacity>

                  {showRepsDropdown && (
                    <View className="absolute top-[72px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <ScrollView className="max-h-40" nestedScrollEnabled>
                        {[4, 6, 8, 10, 12, 15, 20].map((item) => (
                          <TouchableOpacity
                            key={`rep-${item}`}
                            onPress={() => {
                              setReps(item.toString());
                              setShowRepsDropdown(false);
                            }}
                            className={`px-4 py-3 border-b border-slate-50 ${reps === item.toString() ? 'bg-red-50' : ''}`}
                          >
                            <Text className={`font-medium text-center ${reps === item.toString() ? 'text-red-700' : 'text-slate-600'}`}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              <View className="mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Beban / Weight (Kg)</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                  placeholder="50"
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={setWeightKg}
                />
              </View>
              </>
            )}

            <View className="mb-6">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Kalori Terbakar (Kosongkan agar AI Otomatis Hitung)</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                placeholder="Misal: 250 (Opsional)"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>

            <TouchableOpacity
              className="bg-red-700 py-4 rounded-2xl flex-row justify-center items-center shadow-sm"
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#ffffff" />
                  <Text className="text-white font-bold ml-2 text-base">Simpan Latihan</Text>
                </>
              )}
            </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
