import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../context/authStore';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    const success = await login(email, password);
    if (success) {
      router.replace('/(member)');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-8 justify-center pb-10">
        <View className="mb-12">
          <Text className="text-4xl font-extrabold text-slate-900 mb-2">Fitness Vals</Text>
          <Text className="text-lg text-slate-500 font-medium">Log in to continue your fitness journey</Text>
        </View>

        {error && (
          <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
            <Text className="text-red-600 text-sm font-medium">{error}</Text>
          </View>
        )}

        <View className="space-y-6">
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-2">Email Address</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
              <Mail size={20} className="text-slate-400 mr-3" />
              <TextInput
                className="flex-1 text-base text-slate-900 h-full"
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-sm font-semibold text-slate-700 mb-2">Password</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
              <Lock size={20} className="text-slate-400 mr-3" />
              <TextInput
                className="flex-1 text-base text-slate-900 h-full"
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity className="mt-4 mb-8">
          <Text className="text-right text-primary-500 font-medium">Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-primary-500 h-14 rounded-2xl flex-row justify-center items-center shadow-sm"
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text className="text-white text-lg font-bold mr-2">Log In</Text>
              <ArrowRight size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-10">
          <Text className="text-slate-500 font-medium">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text className="text-primary-500 font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
