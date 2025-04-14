import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

const FoodDetailScreen = () => {
  const router = useRouter();
  const { item } = useLocalSearchParams();
  const [servings, setServings] = useState("1");

  if (!item || typeof item !== "string") {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>No food item selected</Text>
        <Button title="Back to menu" onPress={() => router.back()} />
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
        <Button title="Back to menu" onPress={() => router.back()} />
      </View>
    );
  }

  const { food } = foodItem;
  if (!food) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>No food info found</Text>
        <Button title="Back to menu" onPress={() => router.back()} />
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

  return (
    <ScrollView style={styles.container}>
      <Button title="← Back to Menu" onPress={() => router.back()} />
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
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", marginVertical: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  },
  unit: { fontSize: 14, color: "#666" },
  section: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 4,
  },
  nutritionList: {
    marginTop: 8,
  },
});

export default FoodDetailScreen;
