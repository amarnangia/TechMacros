import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "userMeals";

const Page2 = () => {
  const [mealHistory, setMealHistory] = useState<{ [date: string]: any[] }>({});

  useFocusEffect(
    useCallback(() => {
      const loadMeals = async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setMealHistory(parsed);
          } catch (err) {
            console.error("Failed to parse meals", err);
          }
        } else {
          setMealHistory({});
        }
      };

      loadMeals();
    }, [])
  );

  const deleteMeal = async (date: string, index: number) => {
    const updatedMeals = { ...mealHistory };
    updatedMeals[date].splice(index, 1);

    // If the day has no meals left, remove it entirely
    if (updatedMeals[date].length === 0) {
      delete updatedMeals[date];
    }

    setMealHistory(updatedMeals);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
  };

  const confirmDelete = (date: string, index: number) => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMeal(date, index) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>My Meal History</Text>
      {Object.keys(mealHistory).length === 0 ? (
        <Text style={styles.empty}>No meals saved yet.</Text>
      ) : (
        Object.entries(mealHistory)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, meals]) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.date}>{date}</Text>
              {meals.map((meal, idx) => (
                <View key={idx} style={styles.mealCard}>
                  <Text style={styles.name}>{meal.name}</Text>
                  <Text>Servings: {meal.servings}</Text>
                  <Text>Calories: {meal.rounded_nutrition_info.calories}</Text>
                  <Text>Protein: {meal.rounded_nutrition_info.g_protein}g</Text>
                  <Button
                    title="Delete"
                    color="red"
                    onPress={() => confirmDelete(date, idx)}
                  />
                </View>
              ))}
            </View>
          ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  empty: { fontSize: 16, color: "#888" },
  dateSection: { marginBottom: 24 },
  date: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  mealCard: {
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: { fontWeight: "600", fontSize: 16 },
});

export default Page2;
