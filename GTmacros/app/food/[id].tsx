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
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MacroCircle from '@/components/MacroCircle';
import { THEME } from '../../constants/Theme';

const screenWidth = Dimensions.get("window").width;

const FoodDetailScreen = () => {
  const router = useRouter();
  const { item } = useLocalSearchParams();
  const [servings, setServings] = useState("1");
  const [goalCalories, setGoalCalories] = useState(2000);
  const [goalProtein, setGoalProtein] = useState(50);
  const [goalCarbs, setGoalCarbs] = useState(275);
  const [goalFat, setGoalFat] = useState(78);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    try {
      const dateKey = new Date().toISOString().split("T")[0];
      const STORAGE_KEY = "userMeals";
      
      // Get existing meals
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const mealHistory = stored ? JSON.parse(stored) : {};
      
      // Add new meal
      const newMeal = {
        ...food,
        servings: s,
        rounded_nutrition_info: {
          ...nutrition,
          calories: nutrition.calories * s,
          g_protein: nutrition.g_protein * s,
          g_carbs: nutrition.g_carbs * s,
          g_fat: nutrition.g_fat * s,
        },
      };
      
      if (!mealHistory[dateKey]) {
        mealHistory[dateKey] = [];
      }
      mealHistory[dateKey].push(newMeal);
      
      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mealHistory));
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error saving meal:", error);
      Alert.alert("Error", "Failed to save meal");
    }
  };

  const protein = nutrition.g_protein * s;
  const carbs = nutrition.g_carbs * s;
  const fat = nutrition.g_fat * s;

  const goHome = () => {
    setShowSuccessModal(false);
    router.push('/(tabs)/');
  };

  const keepAdding = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

        {/* Success Modal */}
        <Modal
          transparent
          animationType="fade"
          visible={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <Text style={styles.successTitle}>Meal Added Successfully!</Text>
              <Text style={styles.successSubtitle}>Your meal has been saved to your daily log.</Text>
              
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={styles.primaryModalButton} onPress={goHome}>
                  <Text style={styles.primaryModalButtonText}>Go to Home</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryModalButton} onPress={keepAdding}>
                  <Text style={styles.secondaryModalButtonText}>Keep Adding Meals</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: THEME.primary,
    marginBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "600",
    color: THEME.primary,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    color: THEME.text,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    color: THEME.text,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    width: 60,
    height: 40,
    borderRadius: 6,
  },
  unit: {
    fontSize: 14,
    color: THEME.text,
  },
  nutritionList: {
    marginTop: 10,
    gap: 4,
  },
  bodyText: {
    fontSize: 15,
    color: THEME.text,
    marginTop: 6,
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: THEME.primary,
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
    color: THEME.background,
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModal: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    width: "100%",
    maxWidth: 350,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: THEME.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: THEME.text,
    textAlign: "center",
    marginBottom: 32,
  },
  modalButtonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryModalButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryModalButtonText: {
    color: THEME.background,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryModalButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  secondaryModalButtonText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FoodDetailScreen;