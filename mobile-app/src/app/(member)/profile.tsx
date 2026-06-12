import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../../context/authStore';
import { User, Save, AlertCircle, CheckCircle, LogOut } from 'lucide-react-native';

const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Keto', 'Halal', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'];
const MEDICAL_OPTIONS = ['Diabetes Tipe 2', 'Hipertensi', 'Asam Urat', 'Kolesterol Tinggi', 'Maag/GERD', 'Asma'];

export default function ProfileScreen() {
  const { user, updateProfile, error, clearError, fetchProfile, logout } = useAuthStore();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState('');

  const [dietaryList, setDietaryList] = useState<string[]>([]);
  const [medicalList, setMedicalList] = useState<string[]>([]);

  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearError();
    if (!user) {
      fetchProfile();
    }
  }, []);

  useEffect(() => {
    if (user) {
      setHeight(user.height ? user.height.toString() : '');
      setWeight(user.weight ? user.weight.toString() : '');
      setAge(user.age ? user.age.toString() : '');
      setGender(user.gender || 'male');
      setDailyCalorieTarget(user.daily_calorie_target ? user.daily_calorie_target.toString() : '');

      setDietaryList(user.dietary_preferences ? user.dietary_preferences.split(',').map(s => s.trim()).filter(Boolean) : []);
      setMedicalList(user.medical_history ? user.medical_history.split(',').map(s => s.trim()).filter(Boolean) : []);
    }
  }, [user]);

  // Auto-calculate Calorie Target using Mifflin-St Jeor Equation
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age, 10);
    if (h > 0 && w > 0 && a > 0) {
      let bmr = 0;
      if (gender === 'male') {
        bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
      } else {
        bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
      }
      const tdee = Math.round(bmr * 1.2);
      setDailyCalorieTarget(tdee.toString());
    }
  }, [height, weight, age, gender]);

  const toggleOption = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, option: string) => {
    if (list.includes(option)) {
      setList(list.filter(item => item !== option));
    } else {
      setList([...list, option]);
    }
  };

  const handleSubmit = async () => {
    if (!height || !weight || !age || !dailyCalorieTarget) {
      Alert.alert('Error', 'Harap isi semua field wajib.');
      return;
    }

    setSubmitting(true);
    setSuccess(null);
    clearError();

    const successUpdate = await updateProfile({
      height: parseFloat(height),
      weight: parseFloat(weight),
      age: parseInt(age, 10),
      gender: gender,
      daily_calorie_target: parseInt(dailyCalorieTarget, 10),
      dietary_preferences: dietaryList.join(', '),
      medical_history: medicalList.join(', '),
    });

    if (successUpdate) {
      setSuccess('Profil berhasil diperbarui!');
    }
    setSubmitting(false);
  };

  const calculateBMI = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0) return 0;
    const hInMeters = h / 100;
    return w / (hInMeters * hInMeters);
  };

  const bmi = calculateBMI();
  const getBmiDesc = (val: number) => {
    if (val <= 0) return 'Belum Diisi';
    if (val < 18.5) return 'Underweight';
    if (val < 25.0) return 'Normal Ideal';
    if (val < 30.0) return 'Overweight';
    return 'Obese';
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-5 pt-5 pb-28">
        
        {/* Header Profile */}
        <View className="items-center mb-6 mt-2">
          <View className="w-20 h-20 rounded-full bg-slate-200 items-center justify-center border-4 border-white shadow-sm mb-3">
            <User size={40} color="#94a3b8" />
          </View>
          <Text className="text-xl font-bold text-slate-900">{user?.name || 'User'}</Text>
          <Text className="text-sm text-slate-500">{user?.email || ''}</Text>
        </View>

        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <Text className="font-bold text-slate-900 mb-4 text-lg">Update Profile</Text>

          {error && (
            <View className="bg-red-50 border border-red-100 p-3 rounded-2xl flex-row items-center gap-2 mb-4">
              <AlertCircle size={20} color="#ef4444" />
              <Text className="text-red-500 text-sm flex-1">{error}</Text>
            </View>
          )}

          {success && (
            <View className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex-row items-center gap-2 mb-4">
              <CheckCircle size={20} color="#10b981" />
              <Text className="text-emerald-600 text-sm flex-1">{success}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Tinggi (cm)</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm"
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Berat (kg)</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Umur</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Gender</Text>
              <View className="flex-row bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-[46px]">
                <TouchableOpacity 
                  className={`flex-1 items-center justify-center ${gender === 'male' ? 'bg-primary-500' : ''}`}
                  onPress={() => setGender('male')}
                >
                  <Text className={`text-xs font-bold ${gender === 'male' ? 'text-white' : 'text-slate-500'}`}>Pria</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`flex-1 items-center justify-center ${gender === 'female' ? 'bg-primary-500' : ''}`}
                  onPress={() => setGender('female')}
                >
                  <Text className={`text-xs font-bold ${gender === 'female' ? 'text-white' : 'text-slate-500'}`}>Wanita</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Target Kalori Harian (Otomatis)</Text>
            <TextInput
              className="bg-primary-50/50 border border-primary-200 rounded-xl px-4 py-3 text-primary-500 font-bold text-sm"
              keyboardType="numeric"
              value={dailyCalorieTarget}
              onChangeText={setDailyCalorieTarget}
            />
            <Text className="text-[10px] text-slate-400 mt-1">Dihitung otomatis menggunakan persamaan Mifflin-St Jeor.</Text>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Preferensi Diet</Text>
            <View className="flex-row flex-wrap gap-2">
              {DIETARY_OPTIONS.map(opt => {
                const isSelected = dietaryList.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleOption(dietaryList, setDietaryList, opt)}
                    className={`px-3 py-1.5 rounded-full border ${isSelected ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Riwayat Penyakit</Text>
            <View className="flex-row flex-wrap gap-2">
              {MEDICAL_OPTIONS.map(opt => {
                const isSelected = medicalList.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleOption(medicalList, setMedicalList, opt)}
                    className={`px-3 py-1.5 rounded-full border ${isSelected ? 'bg-amber-500 border-amber-500' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Estimasi BMI */}
          <View className="bg-slate-50 rounded-2xl p-4 mt-2 mb-4 flex-row items-center justify-between border border-slate-100">
            <View>
              <Text className="text-xs text-slate-500 font-semibold uppercase">Estimasi BMI</Text>
              <Text className="text-amber-500 font-bold text-sm mt-0.5">{getBmiDesc(bmi)}</Text>
            </View>
            <Text className="text-3xl font-black text-slate-900">{bmi > 0 ? bmi.toFixed(1) : '-'}</Text>
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
                <Save size={20} color="#ffffff" />
                <Text className="text-white font-bold ml-2">Simpan Profil</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="w-full py-4 mt-4 rounded-2xl bg-red-50 flex-row justify-center items-center border border-red-100"
          onPress={() => logout()}
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-600 font-bold ml-2">Log Out</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}
