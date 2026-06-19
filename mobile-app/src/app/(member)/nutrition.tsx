import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { memberService, NutritionLogData, NutritionLogRequest, FoodAnalysisResponse } from '../../services/memberService';
import { Plus, AlertCircle, CheckCircle, ClipboardList, Flame, Camera, ImageIcon, Sparkles, X, Bell, Settings, Utensils, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const MEAL_TIMES = [
  { value: 'breakfast' as const, label: 'Sarapan' },
  { value: 'lunch' as const, label: 'Siang' },
  { value: 'dinner' as const, label: 'Malam' },
  { value: 'snack' as const, label: 'Camilan' },
];

const FOOD_OPTIONS = [
  "Nasi Putih", "Nasi Merah", "Nasi Goreng", "Dada Ayam Panggang", 
  "Ayam Goreng", "Telur Rebus", "Telur Mata Sapi", "Roti Gandum", 
  "Susu Sapi (Full Cream)", "Susu Kedelai", "Lainnya"
];

export default function NutritionScreen() {
  const [logs, setLogs] = useState<NutritionLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState('');
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

  // Dropdown states
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [isCustomName, setIsCustomName] = useState(false);

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
    if (!foodName) {
      setError('Pilih atau ketik nama makanan terlebih dahulu.');
      return;
    }
    if (!calories) {
      setError('Tekan Hitung Nutrisi (AI) terlebih dahulu sebelum menyimpan.');
      return;
    }

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
      setPortion('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setIsCustomName(false);
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
    if (foodName.length < 3) {
      setError('Nama makanan terlalu pendek.');
      return;
    }
    if (!portion) {
      setError('Mohon isi porsi (misal: 200 gram).');
      return;
    }

    setPredicting(true);
    setError(null);
    const query = `${portion} ${foodName}`;

    try {
      const data = await memberService.analyzeFoodText(query);
      setCalories(data.calories.toString());
      setProtein(data.protein.toString());
      setCarbs(data.carbs.toString());
      setFat(data.fat.toString());
      setFoodName(data.food_name.replace(' ✨(Ollama)', '')); // Set clean name
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
              <Text className="text-red-600 font-bold text-lg">Catat Nutrisi</Text>
              <Text className="text-slate-500 text-xs">{todayStr}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity><Bell size={24} color="#64748b" /></TouchableOpacity>
            <TouchableOpacity><Settings size={24} color="#64748b" /></TouchableOpacity>
          </View>
        </View>

        <View className="px-5 pb-28 pt-2">
          {/* Total Calories Card */}
          <View className="bg-slate-900 p-6 rounded-3xl flex-row items-center justify-between mb-6 shadow-sm border-b-4 border-b-red-600 relative overflow-hidden">
            <View className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
            <View className="z-10">
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Konsumsi Hari Ini</Text>
              <Text className="text-4xl font-black text-white tracking-tighter">{totalCalories} <Text className="text-base font-bold text-slate-400">kcal</Text></Text>
            </View>
            <View className="w-14 h-14 bg-red-600/20 rounded-2xl items-center justify-center z-10 border border-red-500/30">
              <Flame size={28} color="#ef4444" />
            </View>
          </View>

          {/* AI Food Scanner */}
          <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row items-center gap-2">
                <View className="bg-red-50 p-2 rounded-xl">
                  <Sparkles size={20} color="#ef4444" />
                </View>
                <Text className="font-bold text-slate-900 text-base">AI Food Scanner</Text>
              </View>
              <View className="bg-slate-100 px-2 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-slate-500">BETA</Text>
              </View>
            </View>

            {!scanImage ? (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 py-8 items-center bg-slate-50 border border-slate-100 rounded-2xl shadow-sm"
                  onPress={() => pickImage(true)}
                >
                  <View className="w-14 h-14 rounded-full bg-red-100 items-center justify-center mb-3">
                    <Camera size={24} color="#ef4444" />
                  </View>
                  <Text className="text-sm font-bold text-slate-700">Kamera</Text>
                  <Text className="text-[10px] text-slate-400 mt-1">Scan Makanan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-8 items-center bg-slate-50 border border-slate-100 rounded-2xl shadow-sm"
                  onPress={() => pickImage(false)}
                >
                  <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center mb-3">
                    <ImageIcon size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-sm font-bold text-slate-700">Galeri</Text>
                  <Text className="text-[10px] text-slate-400 mt-1">Pilih Foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="rounded-2xl overflow-hidden border border-slate-200">
                <Image source={{ uri: scanImage }} className="w-full h-48" resizeMode="cover" />
                <View className="absolute inset-0 bg-black/50 items-center justify-center p-4">
                  {scanning ? (
                    <>
                      <ActivityIndicator size="large" color="#ef4444" />
                      <Text className="text-white font-bold text-sm mt-3 text-center">AI Vision sedang mendeteksi makanan Anda...</Text>
                    </>
                  ) : scanError ? (
                    <>
                      <View className="bg-red-500/80 px-4 py-3 rounded-2xl mb-4 border border-red-400 items-center">
                        <AlertCircle size={24} color="white" className="mb-1" />
                        <Text className="text-white font-bold text-sm text-center">{scanError}</Text>
                      </View>
                      <TouchableOpacity className="bg-white/20 border border-white/40 px-5 py-2.5 rounded-xl" onPress={resetScanner}>
                        <Text className="text-white font-bold text-sm">Coba Foto Lain</Text>
                      </TouchableOpacity>
                    </>
                  ) : scanResult ? (
                    <TouchableOpacity className="absolute top-3 right-3 bg-black/60 p-2 rounded-full" onPress={resetScanner}>
                      <X size={18} color="#ffffff" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* Scan Result Display */}
            {scanResult && !scanning && (
              <View className="mt-5 pt-5 border-t border-slate-100">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <CheckCircle size={14} color="#10b981" />
                      <Text className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">BERHASIL DITEBAK</Text>
                    </View>
                    <Text className="text-2xl font-black text-slate-900">{scanResult.food_name}</Text>
                  </View>
                  <View className="bg-red-50 rounded-2xl p-3 items-center border border-red-100 min-w-[80px]">
                    <Text className="text-2xl font-black text-red-600">{scanResult.calories}</Text>
                    <Text className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Kkal</Text>
                  </View>
                </View>

                <View className="flex-row gap-3 mb-5">
                  <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Protein</Text>
                    <Text className="text-sm font-black text-slate-800">{scanResult.protein}g</Text>
                  </View>
                  <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Karbo</Text>
                    <Text className="text-sm font-black text-slate-800">{scanResult.carbs}g</Text>
                  </View>
                  <View className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-2xl items-center">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lemak</Text>
                    <Text className="text-sm font-black text-slate-800">{scanResult.fat}g</Text>
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-red-600 py-4 rounded-2xl flex-row justify-center items-center shadow-sm"
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

            <Text className="text-[9px] font-medium text-slate-300 mt-4 text-center tracking-widest uppercase">✨ Didukung oleh Llama 3.2 Vision</Text>
          </View>

          {/* Manual Entry Toggle */}
          <TouchableOpacity
            className="bg-white rounded-2xl py-4 px-5 flex-row justify-between items-center border border-slate-100 shadow-sm mb-6"
            onPress={() => setShowManualForm(!showManualForm)}
          >
            <View className="flex-row items-center gap-3">
              <Utensils size={18} color="#64748b" />
              <Text className="font-bold text-slate-800">Catat Manual (Tanpa Foto)</Text>
            </View>
            <Text className="text-red-600 text-xs font-bold">{showManualForm ? 'TUTUP' : 'BUKA'}</Text>
          </TouchableOpacity>

          {/* Manual Form */}
          {showManualForm && (
            <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6 z-50">
              {error && (
                <View className="bg-red-50 border border-red-100 p-3 rounded-xl flex-row items-center gap-2 mb-5">
                  <AlertCircle size={16} color="#ef4444" />
                  <Text className="text-red-600 text-xs flex-1 font-medium">{error}</Text>
                </View>
              )}
              {success && (
                <View className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex-row items-center gap-2 mb-5">
                  <CheckCircle size={16} color="#10b981" />
                  <Text className="text-emerald-700 text-xs flex-1 font-medium">{success}</Text>
                </View>
              )}

              <View className="mb-4 z-50 relative">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Makanan</Text>
                
                {!isCustomName ? (
                  <TouchableOpacity 
                    className={`bg-slate-50 border ${showNameDropdown ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3.5 flex-row justify-between items-center`}
                    onPress={() => setShowNameDropdown(!showNameDropdown)}
                  >
                    <Text className={foodName ? "text-slate-900 font-medium" : "text-slate-400"}>
                      {foodName ? foodName : "Pilih Makanan"}
                    </Text>
                    <ChevronDown size={16} color="#64748b" style={{ transform: [{ rotate: showNameDropdown ? '180deg' : '0deg' }] }} />
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium"
                      placeholder="Ketik nama makanan..."
                      value={foodName}
                      onChangeText={setFoodName}
                      autoFocus
                    />
                    <TouchableOpacity 
                      className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl"
                      onPress={() => {
                        setIsCustomName(false);
                        setFoodName('');
                      }}
                    >
                      <X size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                )}

                {showNameDropdown && !isCustomName && (
                  <View className="absolute top-[72px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <ScrollView className="max-h-48" nestedScrollEnabled>
                      {FOOD_OPTIONS.map((item) => (
                        <TouchableOpacity
                          key={`food-${item}`}
                          onPress={() => {
                            if (item === 'Lainnya') {
                              setIsCustomName(true);
                              setFoodName('');
                            } else {
                              setFoodName(item);
                            }
                            setShowNameDropdown(false);
                          }}
                          className={`px-4 py-3 border-b border-slate-50 ${foodName === item ? 'bg-red-50' : ''}`}
                        >
                          <Text className={`font-medium ${foodName === item ? 'text-red-700' : 'text-slate-600'}`}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View className="mb-5 z-40">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Porsi / Takaran</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-sm font-medium"
                  placeholder="Misal: 200 gram, 1 mangkuk..."
                  placeholderTextColor="#94a3b8"
                  value={portion}
                  onChangeText={setPortion}
                />
              </View>

              <View className="mb-5 z-30">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Waktu Makan</Text>
                <View className="flex-row flex-wrap gap-2">
                  {MEAL_TIMES.map(mt => (
                    <TouchableOpacity
                      key={mt.value}
                      className={`px-3.5 py-2.5 rounded-xl border ${mealTime === mt.value ? 'bg-red-600 border-red-600' : 'bg-slate-50 border-slate-200'}`}
                      style={mealTime === mt.value ? { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 } : {}}
                      onPress={() => setMealTime(mt.value)}
                    >
                      <Text className={`text-xs font-bold uppercase ${mealTime === mt.value ? 'text-white' : 'text-slate-500'}`}>{mt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                className="bg-slate-100 border border-slate-200 py-3.5 rounded-2xl flex-row justify-center items-center mb-4"
                onPress={handleAIPredict}
                disabled={predicting || !foodName || !portion}
              >
                {predicting ? (
                  <ActivityIndicator color="#ef4444" size="small" />
                ) : (
                  <>
                    <Sparkles size={18} color="#ef4444" />
                    <Text className="text-red-600 font-bold ml-2 text-sm">Hitung Nutrisi (AI)</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Prediksi Kalori View Only */}
              {calories ? (
                <View className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 flex-row justify-between items-center">
                  <View>
                    <Text className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">TOTAL ESTIMASI</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-[10px] font-bold text-slate-600">PRO {protein}g</Text>
                      <Text className="text-[10px] font-bold text-slate-600">CRB {carbs}g</Text>
                      <Text className="text-[10px] font-bold text-slate-600">FAT {fat}g</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="font-black text-red-600 text-2xl">{calories}</Text>
                    <Text className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Kkal</Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                className={`py-4 rounded-2xl flex-row justify-center items-center shadow-sm ${calories ? 'bg-slate-900' : 'bg-slate-300'}`}
                onPress={handleSubmit}
                disabled={submitting || !calories}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <CheckCircle size={18} color="#ffffff" />
                    <Text className="text-white font-bold ml-2 text-sm">Simpan Catatan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* History */}
          <Text className="font-bold text-slate-900 text-base mb-4 ml-1">Riwayat Makan Hari Ini</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#ef4444" className="mt-8" />
          ) : logs.length > 0 ? (
            logs.map((log) => (
              <View key={log.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex-row items-center justify-between mb-4">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-slate-100 px-2.5 py-1 rounded-md mr-2 border border-slate-200">
                      <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{getMealLabel(log.meal_time)}</Text>
                    </View>
                  </View>
                  <Text className="font-bold text-slate-900 text-base mb-1">{log.food_name}</Text>
                  {((log.protein || 0) > 0 || (log.carbs || 0) > 0 || (log.fat || 0) > 0) && (
                    <View className="flex-row gap-2 mt-2">
                      <View className="bg-slate-50 px-2 py-1 rounded flex-row items-center border border-slate-100">
                        <Text className="text-[10px] text-slate-400 font-bold mr-1">PRO</Text>
                        <Text className="text-[10px] font-black text-slate-700">{log.protein}g</Text>
                      </View>
                      <View className="bg-slate-50 px-2 py-1 rounded flex-row items-center border border-slate-100">
                        <Text className="text-[10px] text-slate-400 font-bold mr-1">CRB</Text>
                        <Text className="text-[10px] font-black text-slate-700">{log.carbs}g</Text>
                      </View>
                      <View className="bg-slate-50 px-2 py-1 rounded flex-row items-center border border-slate-100">
                        <Text className="text-[10px] text-slate-400 font-bold mr-1">FAT</Text>
                        <Text className="text-[10px] font-black text-slate-700">{log.fat}g</Text>
                      </View>
                    </View>
                  )}
                </View>
                <View className="items-end pl-2 border-l border-slate-100">
                  <Text className="font-black text-red-600 text-2xl">{log.calories}</Text>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">kcal</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm mt-2">
              <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4 border border-slate-100">
                <Utensils size={28} color="#cbd5e1" />
              </View>
              <Text className="font-bold text-slate-700 text-base mb-1">Belum Ada Catatan</Text>
              <Text className="text-xs text-slate-400 text-center max-w-[240px] leading-relaxed">
                Gunakan AI Food Scanner atau catat manual makanan Anda hari ini.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
