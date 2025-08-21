// app/edit-meal.tsx
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TouchableOpacity,
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

  const handleDelete = async () => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (!stored || !date || !index) return;
            
            const parsed = JSON.parse(stored);
            const idx = parseInt(index);
            parsed[date].splice(idx, 1);
            
            if (parsed[date].length === 0) {
              delete parsed[date];
            }
            
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            router.back();
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>{meal.name}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Servings</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
            />
            <Text style={styles.servingUnit}>
              {meal.serving_size_info?.serving_size_amount} {meal.serving_size_info?.serving_size_unit}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nutrition (x{servings})</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{(baseMacros.calories * parseFloat(servings || "1")).toFixed(0)}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{(baseMacros.g_protein * parseFloat(servings || "1")).toFixed(1)}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{(baseMacros.g_carbs * parseFloat(servings || "1")).toFixed(1)}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{(baseMacros.g_fat * parseFloat(servings || "1")).toFixed(1)}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Meal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 24,
    color: THEME.primary,
  },
  heading: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: THEME.primary,
    flex: 1,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.primary,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.background,
    color: THEME.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  servingUnit: {
    fontSize: 14,
    color: THEME.text,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: THEME.text,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: THEME.background,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
