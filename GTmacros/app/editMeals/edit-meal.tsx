// app/edit-meal.tsx
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEME } from "../../constants/Theme";

const STORAGE_KEY = "userMeals";

export default function EditMealScreen() {
  const { date, index, mealData } = useLocalSearchParams<{
    date: string;
    index: string;
    mealData: string; // JSON stringified meal
  }>();
  const router = useRouter();

  const [meal, setMeal] = useState<any>(null);
  const [baseMacros, setBaseMacros] = useState<any>(null);
  const [servings, setServings] = useState("1");

  useEffect(() => {
    if (!mealData || !date || !index) return;

    try {
      const parsedMeal = JSON.parse(mealData);
      const s = parseFloat(parsedMeal.servings) || 1;

      setBaseMacros({
        calories: parsedMeal.rounded_nutrition_info.calories / s,
        g_protein: parsedMeal.rounded_nutrition_info.g_protein / s,
        g_carbs: parsedMeal.rounded_nutrition_info.g_carbs / s,
        g_fat: parsedMeal.rounded_nutrition_info.g_fat / s,
      });
      setServings(String(s));
      setMeal(parsedMeal);
    } catch (err) {
      console.error("Failed to parse meal data:", err);
    }
  }, [mealData, date, index]);

  const handleSave = async () => {
    const s = parseFloat(servings) || 1;
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored || !date || !index) return;

    const parsed = JSON.parse(stored);
    const idx = parseInt(index);
    const updatedMeal = {
      ...meal,
      servings: s,
      rounded_nutrition_info: {
        calories: baseMacros.calories * s,
        g_protein: baseMacros.g_protein * s,
        g_carbs: baseMacros.g_carbs * s,
        g_fat: baseMacros.g_fat * s,
      },
    };

    parsed[date][idx] = updatedMeal;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    Alert.alert("Saved!", "Your changes were saved.");
    router.back();
  };

  if (!meal || !baseMacros) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Loading meal...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
      <Text style={styles.heading}>{meal.name}</Text>

      <View style={styles.inputRow}>
        <Text style={styles.label}>Servings:</Text>
        <TextInput
          style={styles.input}
          value={servings}
          onChangeText={setServings}
          keyboardType="numeric"
        />
        <Button title="Save" onPress={handleSave} />
      </View>

      <Text style={styles.section}>Nutrition Info (x{servings})</Text>
      <Text style={styles.nutritionText}>Calories: {(baseMacros.calories * parseFloat(servings || "1")).toFixed(1)} kcal</Text>
      <Text style={styles.nutritionText}>Protein: {(baseMacros.g_protein * parseFloat(servings || "1")).toFixed(1)} g</Text>
      <Text style={styles.nutritionText}>Carbs: {(baseMacros.g_carbs * parseFloat(servings || "1")).toFixed(1)} g</Text>
      <Text style={styles.nutritionText}>Fat: {(baseMacros.g_fat * parseFloat(servings || "1")).toFixed(1)} g</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: THEME.primary },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  label: { fontSize: 16, color: THEME.text },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    color: THEME.text,
    paddingHorizontal: 10,
    width: 60,
    height: 40,
    borderRadius: 6,
    marginHorizontal: 10,
  },
  section: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: THEME.primary,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 6,
  },
  nutritionText: {
    color: THEME.text,
    fontSize: 16,
    marginVertical: 2,
  },
});
