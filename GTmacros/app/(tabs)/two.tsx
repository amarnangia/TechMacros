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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, addDays } from "date-fns";

const STORAGE_KEY = "userMeals";

const Page2 = () => {
  const [mealHistory, setMealHistory] = useState<{ [date: string]: any[] }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const mealsForDate = mealHistory[formattedDate] || [];

  const totalMacros = mealsForDate.reduce(
    (totals, meal) => {
      const info = meal.rounded_nutrition_info;
      return {
        calories: totals.calories + info.calories,
        protein: totals.protein + info.g_protein,
        carbs: totals.carbs + info.g_carbs,
        fat: totals.fat + info.g_fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

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

  return (
    <View style={styles.container}>
      {/* Date Selection */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
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

      {/* Total Macros */}
      <View style={styles.macroBox}>
        <Text style={styles.macroHeading}>Total Macros</Text>
        <Text>Calories: {totalMacros.calories.toFixed(1)}</Text>
        <Text>Protein: {totalMacros.protein.toFixed(1)}g</Text>
        <Text>Carbs: {totalMacros.carbs.toFixed(1)}g</Text>
        <Text>Fat: {totalMacros.fat.toFixed(1)}g</Text>
      </View>

      {/* Meals List */}
      <ScrollView style={styles.mealList}>
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
              <Text>Servings: {meal.servings}</Text>
              <Text>Calories: {meal.rounded_nutrition_info.calories}</Text>
              <Text>Protein: {meal.rounded_nutrition_info.g_protein}g</Text>
              <Button title="Delete" color="red" onPress={() => confirmDelete(idx)} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  dateNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  arrow: { fontSize: 24, paddingHorizontal: 12 },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  macroBox: {
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  macroHeading: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 6,
  },
  mealList: { flex: 1 },
  mealCard: {
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: { fontWeight: "600", fontSize: 16 },
  empty: { fontSize: 16, color: "#888", textAlign: "center", marginTop: 32 },
});

export default Page2;
