import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { UserPlus, AlertCircle, CheckCircle, User, Mail, Lock } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name || !email || !password) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/register', { name, email, password });
      setSuccess(response.data.message || 'Registrasi berhasil! Silakan masuk.');
      setName('');
      setEmail('');
      setPassword('');

      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal melakukan registrasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-8 justify-center pb-10">
          <View className="mb-10 items-center">
            <View className="w-20 h-20 rounded-3xl bg-slate-100 items-center justify-center mb-4">
              <UserPlus size={36} color="#f85a65" />
            </View>
            <Text className="text-3xl font-extrabold text-slate-900 mb-1">Create Account</Text>
            <Text className="text-base text-slate-500 font-medium">Join Fitness Vals and start your journey</Text>
          </View>

          {error && (
            <View className="bg-red-50 p-4 rounded-xl mb-4 border border-red-100 flex-row items-center">
              <AlertCircle size={18} color="#ef4444" />
              <Text className="text-red-600 text-sm font-medium ml-2 flex-1">{error}</Text>
            </View>
          )}

          {success && (
            <View className="bg-emerald-50 p-4 rounded-xl mb-4 border border-emerald-100 flex-row items-center">
              <CheckCircle size={18} color="#10b981" />
              <Text className="text-emerald-600 text-sm font-medium ml-2 flex-1">{success}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
              <User size={20} color="#94a3b8" />
              <TextInput
                className="flex-1 text-base text-slate-900 h-full ml-3"
                placeholder="Masukkan nama Anda"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-700 mb-2">Email</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
              <Mail size={20} color="#94a3b8" />
              <TextInput
                className="flex-1 text-base text-slate-900 h-full ml-3"
                placeholder="nama@email.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-slate-700 mb-2">Password</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
              <Lock size={20} color="#94a3b8" />
              <TextInput
                className="flex-1 text-base text-slate-900 h-full ml-3"
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-primary-500 h-14 rounded-2xl flex-row justify-center items-center shadow-sm"
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <UserPlus size={20} color="#ffffff" />
                <Text className="text-white text-lg font-bold ml-2">Register</Text>
              </>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-8">
            <Text className="text-slate-500 font-medium">Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text className="text-primary-500 font-bold">Masuk Di Sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
