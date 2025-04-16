import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAL_HISTORY_KEY = 'meal_history';

// Get all saved meals
export const getMealHistory = async (): Promise<Record<string, any[]>> => {
  const json = await AsyncStorage.getItem(MEAL_HISTORY_KEY);
  return json ? JSON.parse(json) : {};
};

// Add a meal to a specific date
export const addMealToDate = async (date: string, meal: any) => {
  const history = await getMealHistory();
  const existing = history[date] || [];
  history[date] = [...existing, meal];
  await AsyncStorage.setItem(MEAL_HISTORY_KEY, JSON.stringify(history));
};

// Remove a meal from a date (e.g. by index)
export const removeMealFromDate = async (date: string, index: number) => {
  const history = await getMealHistory();
  if (!history[date]) return;
  history[date].splice(index, 1);
  await AsyncStorage.setItem(MEAL_HISTORY_KEY, JSON.stringify(history));
};

// Update a meal on a date
export const updateMealOnDate = async (date: string, index: number, updatedMeal: any) => {
  const history = await getMealHistory();
  if (!history[date]) return;
  history[date][index] = updatedMeal;
  await AsyncStorage.setItem(MEAL_HISTORY_KEY, JSON.stringify(history));
};
