import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const FoodDetailScreen = () => {
  const router = useRouter();
  const { item } = useLocalSearchParams();
  const [servings, setServings] = useState("1");

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
  const getVal = (val: number | null) =>
    val !== null ? (val * s).toFixed(1) : "N/A";

  const saveMeal = async () => {
    const dateKey = new Date().toISOString().split("T")[0];
    await global.saveMealForDate(dateKey, {
      ...food,
      servings: parseFloat(servings) || 1,
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
  const total = protein + carbs + fat;

  const chartData = [
    {
      name: "Protein",
      grams: protein,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Carbs",
      grams: carbs,
      color: "#2196F3",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Fat",
      grams: fat,
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Menu</Text>
      </Pressable>

      <Text style={styles.heading}>{name}</Text>

      <View style={styles.inputRow}>
        <Text style={styles.label}>Servings:</Text>
        <TextInput
          style={styles.input}
          value={servings}
          onChangeText={setServings}
          keyboardType="numeric"
        />
        <Text style={styles.unit}>
          {serving_size_info?.serving_size_amount}{" "}
          {serving_size_info?.serving_size_unit}
        </Text>
      </View>

      <Pressable onPress={saveMeal} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Add to My Meals</Text>
      </Pressable>

      <Text style={styles.section}>Macro Breakdown</Text>
<View style={styles.macroRow}>
  <View style={styles.macroStats}>
    <Text style={styles.macroText}>Protein: {protein.toFixed(1)} g</Text>
    <Text style={styles.macroText}>Carbs: {carbs.toFixed(1)} g</Text>
    <Text style={styles.macroText}>Fat: {fat.toFixed(1)} g</Text>
  </View>
  <PieChart
      data={chartData}
      width={screenWidth * 0.6}
      height={screenWidth * 0.6 * .6}
      accessor={"grams"}
      backgroundColor={"transparent"}
      paddingLeft={"5"}
      chartConfig={{
        color: () => "#000",
        labelColor: () => "#333",
      }}
      style={{ marginLeft: 10 }}
    />
  </View>


      <Text style={styles.section}>Nutrition Info (x{servings || 1})</Text>
      <View style={styles.nutritionList}>
        <Text>Calories: {getVal(nutrition.calories)} kcal</Text>
        <Text>Protein: {getVal(nutrition.g_protein)} g</Text>
        <Text>Carbs: {getVal(nutrition.g_carbs)} g</Text>
        <Text>Fat: {getVal(nutrition.g_fat)} g</Text>
        <Text>Saturated Fat: {getVal(nutrition.g_saturated_fat)} g</Text>
        <Text>Sodium: {getVal(nutrition.mg_sodium)} mg</Text>
        <Text>Cholesterol: {getVal(nutrition.mg_cholesterol)} mg</Text>
        <Text>Iron: {getVal(nutrition.mg_iron)} mg</Text>
        <Text>Calcium: {getVal(nutrition.mg_calcium)} mg</Text>
        <Text>Vitamin C: {getVal(nutrition.mg_vitamin_c)} mg</Text>
        <Text>Vitamin A: {getVal(nutrition.iu_vitamin_a)} IU</Text>
      </View>

      {ingredients ? (
        <>
          <Text style={styles.section}>Ingredients</Text>
          <Text>{ingredients}</Text>
        </>
      ) : null}

      <Text style={styles.section}>Allergens</Text>
      <Text>Currently not available from this endpoint.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FAFAFA" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  label: { fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    marginHorizontal: 10,
    width: 60,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  unit: { fontSize: 14, color: "#666" },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  section: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 6,
  },
  nutritionList: {
    marginTop: 10,
    gap: 4,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  macroStats: {
    flex: 1,
    gap: 8,
  },
  macroText: {
    fontSize: 16,
  },
  
});

export default FoodDetailScreen;
