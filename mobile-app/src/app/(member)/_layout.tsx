import { Tabs } from 'expo-router';
import { Home, Apple, Brain, User, Dumbbell } from 'lucide-react-native';

export default function MemberLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#f85a65',
      tabBarInactiveTintColor: '#94a3b8',
      headerShown: true,
      headerStyle: {
        backgroundColor: '#ffffff',
      },
      headerShadowVisible: false,
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, size }) => <Apple size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-meals"
        options={{
          title: 'AI Meals',
          tabBarIcon: ({ color, size }) => <Brain size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout-logs"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
