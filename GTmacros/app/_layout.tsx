import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const STORAGE_KEY = 'userMeals'; // ✅ Global storage key

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // ✅ Initialize global save/load logic
      global.saveMealForDate = async (dateKey, meal) => {
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          const meals = stored ? JSON.parse(stored) : {};

          if (!meals[dateKey]) {
            meals[dateKey] = [];
          }
          meals[dateKey].push(meal);

          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
          console.log('Meal saved!');
        } catch (e) {
          console.error('Error saving meal:', e);
        }
      };

      global.loadMealsForDate = async (dateKey: string | number) => {
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          const meals = stored ? JSON.parse(stored) : {};
          return meals[dateKey] || [];
        } catch (e) {
          console.error('Error loading meals:', e);
          return [];
        }
      };

      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
