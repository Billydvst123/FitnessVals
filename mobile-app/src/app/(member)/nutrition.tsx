import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { memberService, NutritionLogData, NutritionLogRequest, FoodAnalysisResponse } from '../../services/memberService';
import { Plus, AlertCircle, CheckCircle, ClipboardList, Flame, Camera, ImageIcon, Sparkles, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const MEAL_TIMES = [
  { value: 'breakfast' as const, label: 'Sarapan' },
  { value: 'lunch' as const, label: 'Siang' },
  { value: 'dinner' as const, label: 'Malam' },
  { value: 'snack' as const, label: 'Camilan' },
];

export default function NutritionScreen() {
  const [logs, setLogs] = useState<NutritionLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealTime, setMealTime] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [predicting, setPredicting] = useState(false);

  // Scanner state
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<FoodAnalysisResponse | null>(null);
  const [savingScan, setSavingScan] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await memberService.getNutritionLogs();
      setLogs(data);
    } catch (err) {
      console.error('Gagal memuat log nutrisi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSubmit = async () => {
    if (!foodName || !calories) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const logData: NutritionLogRequest = {
      food_name: foodName,
      calories: parseInt(calories),
      protein: protein ? parseFloat(protein) : 0,
      carbs: carbs ? parseFloat(carbs) : 0,
      fat: fat ? parseFloat(fat) : 0,
      meal_time: mealTime,
    };

    try {
      await memberService.createNutritionLog(logData);
      setSuccess('Log nutrisi berhasil ditambahkan!');
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setMealTime('breakfast');
      fetchLogs();
      setTimeout(() => {
        setSuccess(null);
        setShowManualForm(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menambahkan log makanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIPredict = async () => {
    if (foodName.length < 3) return;
    setPredicting(true);
    setError(null);
    try {
      const data = await memberService.analyzeFoodText(foodName);
      setCalories(data.calories.toString());
      setProtein(data.protein.toString());
      setCarbs(data.carbs.toString());
      setFat(data.fat.toString());
      setFoodName(data.food_name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memprediksi nutrisi.');
    } finally {
      setPredicting(false);
    }
  };

  // --- Scanner Functions ---
  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Izin Diperlukan', useCamera ? 'Izin kamera diperlukan.' : 'Izin galeri diperlukan.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setScanImage(asset.uri);
      setScanError(null);
      setScanResult(null);
      analyzeImage(asset.base64 || '');
    }
  };

  const analyzeImage = async (base64Data: string) => {
    setScanning(true);
    setScanError(null);
    try {
      const result = await memberService.analyzeFoodImage(base64Data);
      setScanResult(result);
    } catch (err: any) {
      const backendErr = err.response?.data?.error || '';
      if (backendErr.startsWith('GAMBAR_BUKAN_MAKANAN:')) {
        setScanError(`Bukan Makanan: ${backendErr.split(':')[1]}`);
      } else {
        setScanError('Gagal menganalisis gambar. Silakan coba lagi.');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleSaveScan = async () => {
    if (!scanResult) return;
    setSavingScan(true);
    try {
      await memberService.createNutritionLog({
        food_name: scanResult.food_name,
        calories: scanResult.calories,
        protein: scanResult.protein,
        carbs: scanResult.carbs,
        fat: scanResult.fat,
        meal_time: 'snack',
      });
      resetScanner();
      fetchLogs();
      Alert.alert('Berhasil', 'Makanan berhasil disimpan ke log harian!');
    } catch (err) {
      Alert.alert('Error', 'Gagal menyimpan ke log.');
    } finally {
      setSavingScan(false);
    }
  };

  const resetScanner = () => {
    setScanImage(null);
    setScanError(null);
    setScanResult(null);
  };

  const totalCalories = logs.reduce((acc, log) => acc + log.calories, 0);
  const getMealLabel = (mt: string) => MEAL_TIMES.find(m => m.value === mt)?.label || mt;

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-5 pt-5 pb-28">

        {/* Total Calories Card */}
        <View className="bg-primary-500 p-5 rounded-3xl flex-row items-center justify-between mb-5 shadow-sm">
          <View>
            <Text className="text-primary-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Konsumsi Hari Ini</Text>
            <Text className="text-3xl font-black text-white">{totalCalories} <Text className="text-lg font-bold text-primary-200">Kkal</Text></Text>
          </View>
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
            <Flame size={24} color="#ffffff" />
          </View>
        </View>

        {/* AI Food Scanner */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-5">
          <View className="flex-row items-center gap-2 mb-4">
            <Sparkles size={18} color="#f85a65" />
            <Text className="font-bold text-slate-900">AI Food Scanner</Text>
          </View>

          {!scanImage ? (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-6 items-center bg-slate-50 border border-slate-200 rounded-2xl"
                onPress={() => pickImage(true)}
              >
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mb-2">
                  <Camera size={20} color="#f85a65" />
                </View>
                <Text className="text-xs font-bold text-slate-700">Ambil Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-6 items-center bg-slate-50 border border-slate-200 rounded-2xl"
                onPress={() => pickImage(false)}
              >
                <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
                  <ImageIcon size={20} color="#f59e0b" />
                </View>
                <Text className="text-xs font-bold text-slate-700">Pilih Galeri</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="rounded-2xl overflow-hidden border border-slate-200">
              <Image source={{ uri: scanImage }} className="w-full h-44" resizeMode="cover" />
              <View className="absolute inset-0 bg-black/40 items-center justify-center p-4">
                {scanning ? (
                  <>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text className="text-white font-semibold text-sm mt-3">AI sedang menganalisis makanan...</Text>
                  </>
                ) : scanError ? (
                  <>
                    <Text className="text-red-300 font-bold text-sm mb-3 text-center bg-red-500/30 px-4 py-2 rounded-xl">{scanError}</Text>
                    <TouchableOpacity className="bg-white/20 px-4 py-2 rounded-xl" onPress={resetScanner}>
                      <Text className="text-white font-bold text-sm">Coba Lagi</Text>
                    </TouchableOpacity>
                  </>
                ) : scanResult ? (
                  <TouchableOpacity className="absolute top-2 right-2 bg-black/50 p-2 rounded-full" onPress={resetScanner}>
                    <X size={16} color="#ffffff" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}

          {/* Scan Result Display */}
          {scanResult && !scanning && (
            <View className="mt-4">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1 mb-1">
                    <CheckCircle size={14} color="#f85a65" />
                    <Text className="text-xs text-primary-500 font-bold uppercase">Terdeteksi</Text>
                  </View>
                  <Text className="text-xl font-black text-slate-900">{scanResult.food_name}</Text>
                </View>
                <View className="bg-slate-50 rounded-2xl p-3 items-center border border-slate-100 min-w-[80px]">
                  <Text className="text-2xl font-black text-slate-900">{scanResult.calories}</Text>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">Kkal</Text>
                </View>
              </View>

              <View className="flex-row gap-2 mb-4">
                <View className="flex-1 bg-primary-50 border border-primary-100 p-3 rounded-2xl items-center">
                  <Text className="text-xs font-semibold text-primary-500 uppercase mb-1">Protein</Text>
                  <Text className="text-base font-bold text-slate-900">{scanResult.protein}g</Text>
                </View>
                <View className="flex-1 bg-orange-50 border border-orange-100 p-3 rounded-2xl items-center">
                  <Text className="text-xs font-semibold text-orange-500 uppercase mb-1">Karbo</Text>
                  <Text className="text-base font-bold text-slate-900">{scanResult.carbs}g</Text>
                </View>
                <View className="flex-1 bg-red-50 border border-red-100 p-3 rounded-2xl items-center">
                  <Text className="text-xs font-semibold text-red-500 uppercase mb-1">Lemak</Text>
                  <Text className="text-base font-bold text-slate-900">{scanResult.fat}g</Text>
                </View>
              </View>

              <TouchableOpacity
                className="bg-slate-900 py-3.5 rounded-2xl flex-row justify-center items-center shadow-sm"
                onPress={handleSaveScan}
                disabled={savingScan}
              >
                {savingScan ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Plus size={20} color="#ffffff" />
                    <Text className="text-white font-bold ml-2">Simpan ke Log Harian</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-[10px] text-slate-400 mt-3 text-center">✨ Didukung oleh Gemini Vision AI</Text>
        </View>

        {/* Manual Entry Toggle */}
        <TouchableOpacity
          className="bg-white rounded-2xl py-3 px-5 flex-row justify-between items-center border border-slate-100 shadow-sm mb-5"
          onPress={() => setShowManualForm(!showManualForm)}
        >
          <Text className="font-bold text-slate-900">Manual Entry</Text>
          <Text className="text-primary-500 text-sm font-bold">{showManualForm ? 'Tutup' : 'Buka'}</Text>
        </TouchableOpacity>

        {/* Manual Form */}
        {showManualForm && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-5">
            {error && (
              <View className="bg-red-50 border border-red-100 p-3 rounded-xl flex-row items-center gap-2 mb-4">
                <AlertCircle size={16} color="#ef4444" />
                <Text className="text-red-500 text-xs flex-1">{error}</Text>
              </View>
            )}
            {success && (
              <View className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex-row items-center gap-2 mb-4">
                <CheckCircle size={16} color="#10b981" />
                <Text className="text-emerald-600 text-xs flex-1">{success}</Text>
              </View>
            )}

            <View className="mb-3">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs font-semibold text-slate-500 uppercase">Nama Makanan</Text>
                {foodName.length > 2 && (
                  <TouchableOpacity onPress={handleAIPredict} disabled={predicting}>
                    <Text className="text-xs text-primary-500 font-bold">{predicting ? 'Memprediksi...' : '✨ Prediksi AI'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm"
                placeholder="Contoh: Nasi Goreng Ayam"
                placeholderTextColor="#94a3b8"
                value={foodName}
                onChangeText={setFoodName}
              />
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Kalori</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm"
                  placeholder="250"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Waktu</Text>
                <View className="flex-row flex-wrap gap-1">
                  {MEAL_TIMES.map(mt => (
                    <TouchableOpacity
                      key={mt.value}
                      className={`px-2 py-1.5 rounded-lg border ${mealTime === mt.value ? 'bg-primary-500 border-primary-500' : 'bg-slate-50 border-slate-200'}`}
                      onPress={() => setMealTime(mt.value)}
                    >
                      <Text className={`text-[10px] font-bold ${mealTime === mt.value ? 'text-white' : 'text-slate-600'}`}>{mt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="bg-slate-900 py-3.5 rounded-2xl flex-row justify-center items-center shadow-sm mt-2"
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Plus size={20} color="#ffffff" />
                  <Text className="text-white font-bold ml-2">Save Log</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        <Text className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 pl-1">Riwayat Makanan Hari Ini</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#f85a65" />
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <View key={log.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row items-center justify-between mb-3">
              <View className="flex-1 pr-3">
                <View className="bg-slate-100 self-start px-2 py-0.5 rounded-full mb-1">
                  <Text className="text-[10px] font-bold text-slate-600 uppercase">{getMealLabel(log.meal_time)}</Text>
                </View>
                <Text className="font-bold text-slate-900 text-sm">{log.food_name}</Text>
                {((log.protein || 0) > 0 || (log.carbs || 0) > 0 || (log.fat || 0) > 0) && (
                  <View className="flex-row gap-1 mt-1.5">
                    <Text className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">P: {log.protein}g</Text>
                    <Text className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">C: {log.carbs}g</Text>
                    <Text className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">F: {log.fat}g</Text>
                  </View>
                )}
              </View>
              <View className="items-end">
                <Text className="font-black text-slate-900 text-xl">{log.calories}</Text>
                <Text className="text-[10px] text-slate-400 font-semibold uppercase">kcal</Text>
              </View>
            </View>
          ))
        ) : (
          <View className="items-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-3">
              <ClipboardList size={32} color="#cbd5e1" />
            </View>
            <Text className="font-bold text-slate-900">Belum ada catatan</Text>
            <Text className="text-xs text-slate-500 mt-1 text-center max-w-[200px]">Gunakan AI Food Scanner di atas untuk melacak kalori secara instan.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
