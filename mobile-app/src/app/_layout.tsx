import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../context/authStore';
import '../global.css';

export default function RootLayout() {
  const { isAuthenticated, isInitialized, init } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(member)';
    const onAuthPage = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && inAuthGroup) {
      // Not logged in but trying to access member area → go to login
      router.replace('/login');
    } else if (!isAuthenticated && !onAuthPage) {
      // Not logged in and not on login/register → go to login
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      // Logged in but not in member area → go to dashboard
      router.replace('/(member)');
    }
  }, [isAuthenticated, isInitialized, segments]);

  if (!isInitialized) {
    return null; // Or a splash screen
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(member)" />
    </Stack>
  );
}
