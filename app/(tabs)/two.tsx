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

type ViewMode = 'daily' | 'weekly';
type MacroType = 'calories' | 'protein' | 'carbs' | 'fat';

const WeeklyChart = ({ selectedMacro, setSelectedMacro, mealHistory, selectedDate, avgMacros }: {
  selectedMacro: MacroType;
  setSelectedMacro: (macro: MacroType) => void;
  mealHistory: { [date: string]: any[] };
  selectedDate: Date;
  avgMacros: { calories: number; protein: number; carbs: number; fat: number };
}) => {
  const getWeeklyData = () => {
    const data: number[] = [];
    const labels: string[] = [];
    
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    
    days.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dateLabel = format(date, 'M/d');
      
      labels.push(dateLabel);
      
      const mealsForDay = mealHistory[dateKey] || [];
      const total = mealsForDay.reduce((sum: number, meal: any) => {
        const info = meal.rounded_nutrition_info || {};
        switch (selectedMacro) {
          case 'calories': return sum + (info.calories || 0);
          case 'protein': return sum + (info.g_protein || 0);
          case 'carbs': return sum + (info.g_carbs || 0);
          case 'fat': return sum + (info.g_fat || 0);
          default: return sum;
        }
      }, 0);
      
      data.push(Math.round(total * 100) / 100);
    });
    
    return { data, labels };
  };

  const handleBarPress = (value: number, day: string) => {
    Alert.alert(
      `${day} - ${selectedMacro.charAt(0).toUpperCase() + selectedMacro.slice(1)}`,
      `${value} ${selectedMacro === 'calories' ? '' : 'g'}`,
      [{ text: 'OK' }]
    );
  };

  const macroButtons = [
    { key: 'calories' as MacroType, label: 'Calories', color: '#FF6B6B' },
    { key: 'protein' as MacroType, label: 'Protein', color: '#4ECDC4' },
    { key: 'carbs' as MacroType, label: 'Carbs', color: '#FFD93D' },
    { key: 'fat' as MacroType, label: 'Fat', color: '#6B6BFF' },
  ];

  const { data, labels } = getWeeklyData();
  const maxValue = Math.max(...data, 1);

  return (
    <View style={styles.chartSection}>
      <Text style={styles.chartTitle}>Weekly Breakdown</Text>
      
      <View style={styles.buttonContainer}>
        {macroButtons.map((button) => (
          <TouchableOpacity
            key={button.key}
            style={[
              styles.macroButton,
              { backgroundColor: selectedMacro === button.key ? button.color : THEME.surface },
            ]}
            onPress={() => setSelectedMacro(button.key)}
          >
            <Text
              style={[
                styles.buttonText,
                { color: selectedMacro === button.key ? '#FFFFFF' : THEME.text },
              ]}
            >
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chart}>
        {data.map((value, index) => (
          <TouchableOpacity
            key={index}
            style={styles.barContainer}
            onPress={() => handleBarPress(value, labels[index])}
          >
            <Text style={styles.barValue}>{value}</Text>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max((value / maxValue) * 120, 5),
                  backgroundColor: macroButtons.find(b => b.key === selectedMacro)?.color || '#FF6B6B',
                },
              ]}
            />
            <Text style={styles.barLabel}>{labels[index]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.weeklyAverage}>
        Weekly Average: {avgMacros[selectedMacro].toFixed(1)} {selectedMacro === 'calories' ? '' : 'g'}
      </Text>
    </View>
  );
};

const Page2 = () => {
  const [mealHistory, setMealHistory] = useState<{ [date: string]: any[] }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [selectedMacro, setSelectedMacro] = useState<MacroType>('calories');
  const router = useRouter();

  const getDateRange = () => {
    switch (viewMode) {
      case 'weekly':
        return { start: startOfWeek(selectedDate, { weekStartsOn: 1 }), end: endOfWeek(selectedDate, { weekStartsOn: 1 }) };
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
    const days = viewMode === 'daily' ? direction : direction * 7;
    setSelectedDate(addDays(selectedDate, days));
  };

  const getDateDisplayText = () => {
    switch (viewMode) {
      case 'weekly':
        const { start, end } = getDateRange();
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      default:
        return format(selectedDate, 'yyyy-MM-dd');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          {(['daily', 'weekly'] as ViewMode[]).map(mode => (
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
        
        {/* Report Header */}
        {viewMode === 'daily' && (
          <>
            {/* Date Navigation - Outside box */}
            <View style={styles.dateNav}>
              <TouchableOpacity onPress={() => navigateDate(-1)}>
                <Text style={styles.arrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.dateText}>{getDateDisplayText()}</Text>
              <TouchableOpacity onPress={() => navigateDate(1)}>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            </View>
            
            {/* Macro Bars - Inside box */}
            <View style={styles.headerCard}>
              <View style={styles.macrosRow}>
                <MacroBar label="Calories" value={avgMacros.calories} goal={goals.calories} color="#FF6B6B" />
                <MacroBar label="Protein" value={avgMacros.protein} goal={goals.protein} color="#4ECDC4" />
              </View>
              <View style={styles.macrosRow}>
                <MacroBar label="Carbs" value={avgMacros.carbs} goal={goals.carbs} color="#FFD93D" />
                <MacroBar label="Fat" value={avgMacros.fat} goal={goals.fat} color="#6B6BFF" />
              </View>
            </View>
          </>
        )}
        
        {viewMode === 'weekly' && (
          <>
            {/* Date Navigation */}
            <View style={styles.dateNav}>
              <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -7))}>
                <Text style={styles.arrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.dateText}>{getDateDisplayText()}</Text>
              <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 7))}>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.chartWrapper}>
              <WeeklyChart 
                selectedMacro={selectedMacro} 
                setSelectedMacro={setSelectedMacro}
                mealHistory={mealHistory}
                selectedDate={selectedDate}
                avgMacros={avgMacros}
              />
            </View>
          </>
        )}



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
                  <Text style={styles.name}>{meal.name} (x{meal.servings})</Text>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroText}>Cal: {meal.rounded_nutrition_info.calories}</Text>
                    <Text style={styles.macroText}>Prot: {meal.rounded_nutrition_info.g_protein}g</Text>
                    <Text style={styles.macroText}>Carb: {meal.rounded_nutrition_info.g_carbs}g</Text>
                    <Text style={styles.macroText}>Fat: {meal.rounded_nutrition_info.g_fat}g</Text>
                  </View>
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
  headerCardNoBorder: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: THEME.primary,
    marginBottom: 12,
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: THEME.surface,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
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
  arrow: { fontSize: 24, paddingHorizontal: 8, color: THEME.primary },
  arrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekArrow: { fontSize: 20, paddingHorizontal: 8, color: THEME.primary, fontWeight: 'bold' },
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
  name: { fontWeight: "600", fontSize: 16, color: THEME.primary, marginBottom: 8 },
  empty: { fontSize: 16, color: THEME.primary, textAlign: "center", marginTop: 32 },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chartSection: {
    marginTop: 0,
  },
  chartWrapper: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: THEME.surface,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroButton: {
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    marginBottom: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
  },
  barValue: {
    fontSize: 9,
    color: THEME.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  bar: {
    width: 24,
    borderRadius: 3,
    minHeight: 5,
  },
  barLabel: {
    fontSize: 10,
    color: THEME.text,
    marginTop: 2,
    textAlign: 'center',
  },
  weeklyAverage: {
    fontSize: 16,
    color: THEME.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default Page2;
