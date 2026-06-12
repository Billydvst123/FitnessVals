import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { memberService, WorkoutLogData, WorkoutLogRequest } from '../../services/memberService';
import { Dumbbell, Activity, Plus, X, Calendar, AlertCircle, CheckCircle } from 'lucide-react-native';

export default function WorkoutLogScreen() {
  const [logs, setLogs] = useState<WorkoutLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [workoutType, setWorkoutType] = useState<'cardio' | 'weightlifting'>('weightlifting');
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
      
      // Reset form
      setWorkoutName('');
      setDuration('');
      setSets('');
      setReps('');
      setWeightKg('');
      setCalories('');
      
      fetchLogs(); // refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan data latihan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-5 pt-5 pb-28">
        
        {/* Header */}
        <View className="bg-slate-900 p-6 rounded-3xl items-center shadow-sm mb-5">
          <Dumbbell size={32} color="#10b981" />
          <Text className="text-xl font-bold text-white mt-2">Log Latihan</Text>
          <Text className="text-xs text-slate-400 mt-1 text-center">
            Catat aktivitas Anda, AI akan otomatis menyesuaikan kebutuhan kalori & nutrisi harian.
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="font-bold text-slate-900 uppercase text-sm tracking-wider">Riwayat Terakhir</Text>
          <TouchableOpacity 
            className="flex-row items-center bg-primary-100 px-3 py-1.5 rounded-full"
            onPress={() => setModalVisible(true)}
          >
            <Plus size={16} color="#f85a65" />
            <Text className="text-xs font-bold text-primary-500 ml-1">Tambah</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#f85a65" />
          </View>
        ) : logs.length > 0 ? (
          logs.map(log => (
            <View key={log.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3 flex-row items-center">
              <View className={`w-12 h-12 rounded-full items-center justify-center ${log.workout_type === 'cardio' ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                {log.workout_type === 'cardio' ? (
                  <Activity size={20} color="#f97316" />
                ) : (
                  <Dumbbell size={20} color="#10b981" />
                )}
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-bold text-slate-900">{log.workout_name}</Text>
                <View className="flex-row mt-1 gap-2">
                  {log.workout_type === 'cardio' && log.duration_minutes ? (
                    <Text className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {log.duration_minutes} Menit
                    </Text>
                  ) : null}
                  {log.workout_type === 'weightlifting' && log.sets && log.reps ? (
                    <Text className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {log.sets} Set × {log.reps} Reps {log.weight_kg ? `(${log.weight_kg}kg)` : ''}
                    </Text>
                  ) : null}
                </View>
                {log.calories_burned ? (
                  <Text className="text-xs text-orange-600 font-bold mt-1">🔥 {log.calories_burned} kcal</Text>
                ) : null}
              </View>
              <View className="items-end">
                <Calendar size={14} color="#94a3b8" className="mb-1" />
                <Text className="text-[10px] font-bold text-slate-400">{formatDate(log.date)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View className="bg-white rounded-3xl p-6 items-center border border-slate-100 shadow-sm mt-2">
            <Dumbbell size={40} color="#cbd5e1" className="mb-3" />
            <Text className="font-bold text-slate-900">Belum Ada Latihan</Text>
            <Text className="text-xs text-slate-500 text-center mt-1">
              Catat sesi gym atau cardio Anda hari ini.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal Form Tambah Latihan */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pt-8 pb-10">
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
                className={`flex-1 py-2.5 items-center rounded-lg ${workoutType === 'weightlifting' ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setWorkoutType('weightlifting')}
              >
                <Text className={`font-bold text-sm ${workoutType === 'weightlifting' ? 'text-emerald-600' : 'text-slate-500'}`}>Angkat Beban</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-2.5 items-center rounded-lg ${workoutType === 'cardio' ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setWorkoutType('cardio')}
              >
                <Text className={`font-bold text-sm ${workoutType === 'cardio' ? 'text-orange-600' : 'text-slate-500'}`}>Cardio</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Nama Latihan</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                placeholder={workoutType === 'cardio' ? "Contoh: Lari, Sepeda, Renang" : "Contoh: Bench Press, Squat"}
                value={workoutName}
                onChangeText={setWorkoutName}
              />
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
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Sets</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                    placeholder="4"
                    keyboardType="numeric"
                    value={sets}
                    onChangeText={setSets}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Reps per Set</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
                    placeholder="10"
                    keyboardType="numeric"
                    value={reps}
                    onChangeText={setReps}
                  />
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
              className="bg-slate-900 py-4 rounded-2xl flex-row justify-center items-center shadow-sm"
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#ffffff" />
                  <Text className="text-white font-bold ml-2">Simpan Latihan</Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}
