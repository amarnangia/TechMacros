// app/(tabs)/two.tsx
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Button,
  Alert,
  SafeAreaView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { THEME } from "../../constants/Theme";

const STORAGE_KEY = "userMeals";
const STORAGE_KEYS = {
  calories: "goal_calories",
  protein: "goal_protein",
  carbs: "goal_carbs",
  fat: "goal_fat",
};

const DEFAULT_GOALS = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
};

type ViewMode = 'daily' | 'weekly' | 'monthly';

const Page2 = () => {
  const [mealHistory, setMealHistory] = useState<{ [date: string]: any[] }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const router = useRouter();

  const getDateRange = () => {
    switch (viewMode) {
      case 'weekly':
        return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
      case 'monthly':
        return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
      default:
        return { start: selectedDate, end: selectedDate };
    }
  };

  const getReportData = () => {
    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });
    
    let totalMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let daysWithData = 0;
    
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const meals = mealHistory[dateKey] || [];
      if (meals.length > 0) daysWithData++;
      
      meals.forEach(meal => {
        const info = meal.rounded_nutrition_info;
        totalMacros.calories += info.calories || 0;
        totalMacros.protein += info.g_protein || 0;
        totalMacros.carbs += info.g_carbs || 0;
        totalMacros.fat += info.g_fat || 0;
      });
    });
    
    if (viewMode === 'daily') {
      return { totalMacros, avgMacros: totalMacros, daysWithData: daysWithData > 0 ? 1 : 0 };
    }
    
    const avgMacros = daysWithData > 0 ? {
      calories: totalMacros.calories / daysWithData,
      protein: totalMacros.protein / daysWithData,
      carbs: totalMacros.carbs / daysWithData,
      fat: totalMacros.fat / daysWithData,
    } : { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    return { totalMacros, avgMacros, daysWithData };
  };

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const mealsForDate = mealHistory[formattedDate] || [];
  const { totalMacros, avgMacros, daysWithData } = getReportData();

  const loadGoals = async () => {
    try {
      const newGoals: any = {};
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        const value = await AsyncStorage.getItem(storageKey);
        newGoals[key] = value ? parseInt(value) : DEFAULT_GOALS[key as keyof typeof DEFAULT_GOALS];
      }
      setGoals(newGoals);
    } catch (err) {
      console.error("Failed to load goals:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadMeals = async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const now = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(now.getDate() - 30);

            const filtered: { [date: string]: any[] } = {};
            for (const date in parsed) {
              const dateObj = new Date(date);
              if (dateObj >= oneMonthAgo) {
                filtered[date] = parsed[date];
              }
            }

            setMealHistory(filtered);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
          } catch (err) {
            console.error("Failed to parse meals", err);
          }
        }
        await loadGoals();
      };
      loadMeals();
    }, [])
  );


  const deleteMeal = async (index: number) => {
    const updated = { ...mealHistory };
    updated[formattedDate].splice(index, 1);
    if (updated[formattedDate].length === 0) delete updated[formattedDate];
    setMealHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const confirmDelete = (index: number) => {
    Alert.alert("Delete Meal", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMeal(index) },
    ]);
  };

  const handleMealPress = (index: number, meal: any) => {
    router.push({
      pathname: "/editMeals/edit-meal",
      params: {
        date: formattedDate,
        index: String(index),
        mealData: JSON.stringify(meal),
      },
    });
  };

  const navigateDate = (direction: number) => {
    const days = viewMode === 'daily' ? direction : viewMode === 'weekly' ? direction * 7 : direction * 30;
    setSelectedDate(addDays(selectedDate, days));
  };

  const getDateDisplayText = () => {
    switch (viewMode) {
      case 'weekly':
        const { start, end } = getDateRange();
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      case 'monthly':
        return format(selectedDate, 'MMMM yyyy');
      default:
        return format(selectedDate, 'yyyy-MM-dd');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Report Header */}
        <View style={styles.headerCard}>
          <Text style={styles.titleText}>Macro Report</Text>
          
          {/* View Mode Selector */}
          <View style={styles.viewModeContainer}>
            {(['daily', 'weekly', 'monthly'] as ViewMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.viewModeButton, viewMode === mode && styles.viewModeButtonActive]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Navigation */}
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={() => navigateDate(-1)}>
              <Text style={styles.arrow}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{getDateDisplayText()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateDate(1)}>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Macro Bars */}
          <View style={styles.macrosRow}>
            <MacroBar label="Calories" value={avgMacros.calories} goal={goals.calories} color="#FF6B6B" />
            <MacroBar label="Protein" value={avgMacros.protein} goal={goals.protein} color="#4ECDC4" />
          </View>
          <View style={styles.macrosRow}>
            <MacroBar label="Carbs" value={avgMacros.carbs} goal={goals.carbs} color="#FFD93D" />
            <MacroBar label="Fat" value={avgMacros.fat} goal={goals.fat} color="#6B6BFF" />
          </View>
          
          {viewMode !== 'daily' && (
            <Text style={styles.statsText}>
              {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Average • {daysWithData} days with data
            </Text>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="calendar"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {/* Meals List - Only show for daily view */}
        {viewMode === 'daily' && (
          <ScrollView style={styles.mealList}>
            <Text style={styles.sectionTitle}>Meals</Text>
            {mealsForDate.length === 0 ? (
              <Text style={styles.empty}>No meals for this day.</Text>
            ) : (
              mealsForDate.map((meal, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.mealCard}
                  onPress={() => handleMealPress(idx, meal)}
                >
                  <Text style={styles.name}>{meal.name}</Text>
                  <Text style={styles.mealText}>Servings: {meal.servings}</Text>
                  <Text style={styles.mealText}>Calories: {meal.rounded_nutrition_info.calories}</Text>
                  <Text style={styles.mealText}>Protein: {meal.rounded_nutrition_info.g_protein}g</Text>
                  <Button title="Delete" color="red" onPress={() => confirmDelete(idx)} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const MacroBar = ({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) => {
  const percent = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <View style={{ flex: 1, marginHorizontal: 6 }}>
      <Text style={{ color: THEME.text, fontWeight: "600", marginBottom: 4 }}>{label}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={{ color: THEME.text, fontSize: 12, marginTop: 2 }}>
        {value.toFixed(0)} / {goal} ({percent.toFixed(0)}%)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  container: { padding: 16, flexGrow: 1 },
  headerCard: {
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: THEME.primary,
    marginBottom: 12,
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: THEME.background,
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: THEME.primary,
  },
  viewModeText: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: THEME.background,
    fontWeight: '600',
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  barBackground: {
    height: 14,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  barFill: {
    height: 14,
    borderRadius: 8,
  },
  statsText: {
    color: THEME.text,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  arrow: { fontSize: 24, paddingHorizontal: 12, color: THEME.primary },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: THEME.primary,
    color: THEME.background,
    borderRadius: 8,
    minWidth: 200,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: THEME.primary,
  },
  mealList: { flex: 1 },
  mealCard: {
    backgroundColor: THEME.surface,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  name: { fontWeight: "600", fontSize: 16, color: THEME.primary },
  empty: { fontSize: 16, color: THEME.primary, textAlign: "center", marginTop: 32 },
  mealText: { color: THEME.text, fontSize: 14 },
});

export default Page2;
