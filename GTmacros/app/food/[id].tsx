import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MacroCircle from '@/components/MacroCircle';

const screenWidth = Dimensions.get("window").width;

const FoodDetailScreen = () => {
  const router = useRouter();
  const { item } = useLocalSearchParams();
  const [servings, setServings] = useState("1");
  const [goalCalories, setGoalCalories] = useState(2000);
  const [goalProtein, setGoalProtein] = useState(50);
  const [goalCarbs, setGoalCarbs] = useState(275);
  const [goalFat, setGoalFat] = useState(78);

  useEffect(() => {
    const fetchGoals = async () => {
      const cal = await AsyncStorage.getItem("goal_calories");
      const prot = await AsyncStorage.getItem("goal_protein");
      const carbs = await AsyncStorage.getItem("goal_carbs");
      const fat = await AsyncStorage.getItem("goal_fat");
      if (cal) setGoalCalories(parseInt(cal, 10));
      if (prot) setGoalProtein(parseInt(prot, 10));
      if (carbs) setGoalCarbs(parseInt(carbs, 10));
      if (fat) setGoalFat(parseInt(fat, 10));
    };
    fetchGoals();
  }, []);

  if (!item || typeof item !== "string") {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>No food item selected</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to menu</Text>
        </Pressable>
      </View>
    );
  }

  let foodItem;
  try {
    foodItem = JSON.parse(decodeURIComponent(item));
  } catch (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Failed to load item data</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to menu</Text>
        </Pressable>
      </View>
    );
  }

  const { food } = foodItem;
  if (!food) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>No food info found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to menu</Text>
        </Pressable>
      </View>
    );
  }

  const {
    name,
    ingredients,
    rounded_nutrition_info: nutrition,
    serving_size_info,
  } = food;

  const s = parseFloat(servings) || 1;
  const getVal = (val: number | null) => val !== null ? (val * s).toFixed(1) : "N/A";

  const saveMeal = async () => {
    const dateKey = new Date().toISOString().split("T")[0];
    await global.saveMealForDate(dateKey, {
      ...food,
      servings: s,
      rounded_nutrition_info: {
        ...nutrition,
        calories: nutrition.calories * s,
        g_protein: nutrition.g_protein * s,
        g_carbs: nutrition.g_carbs * s,
        g_fat: nutrition.g_fat * s,
      },
    });
    Alert.alert("Success", "Meal saved!");
  };

  const protein = nutrition.g_protein * s;
  const carbs = nutrition.g_carbs * s;
  const fat = nutrition.g_fat * s;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Menu</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.heading}>{name}</Text>
          <Text style={styles.section}>Macro Breakdown</Text>
          <Text style={styles.bodyText}>Edit Macro Goals in profile</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingHorizontal: 10 }}>
            <View style={{ flexDirection: "row", marginVertical: 12 }}>
              <MacroCircle label="CAL" value={nutrition.calories * s} unit="" max={goalCalories} color="#FFA500" />
              <MacroCircle label="FAT" value={fat} max={goalFat} color="#F28C28" />
              <MacroCircle label="CARBS" value={carbs} max={goalCarbs} color="#007FAE" />
              <MacroCircle label="PROT" value={protein} max={goalProtein} color="#B3A369" />
            </View>
          </ScrollView>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Servings:</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
            />
            <Text style={styles.unit}>
              {serving_size_info?.serving_size_amount} {serving_size_info?.serving_size_unit}
            </Text>
          </View>

          {ingredients && (
            <>
              <Text style={styles.section}>Ingredients</Text>
              <Text style={styles.bodyText}>{ingredients}</Text>
            </>
          )}

          <Text style={styles.section}>Allergens</Text>
          {food.icons?.food_icons?.length > 0 ? (
            <View style={styles.nutritionList}>
              {food.icons.food_icons.map((icon, idx) => (
                <Text key={idx}>• {icon.name}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.bodyText}>No allergens listed for this item.</Text>
          )}
        </ScrollView>

        <Pressable onPress={saveMeal} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Add to My Meals</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003057",
    marginBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: "#007FAE",
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "600",
    color: "#003057",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    color: "#003057",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    marginHorizontal: 10,
    width: 60,
    height: 40,
    borderRadius: 6,
  },
  unit: {
    fontSize: 14,
    color: "#666",
  },
  nutritionList: {
    marginTop: 10,
    gap: 4,
  },
  bodyText: {
    fontSize: 15,
    color: "#333",
    marginTop: 6,
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#B3A369",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "#003057",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default FoodDetailScreen;