import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Button,
  Modal,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { COLORS, THEME } from "../../constants/Theme";

// Config
const BOX_SIZE = 80;
const DINING_HALL_BOX_SIZE = 60;
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

const locationData = [
  { name: "West Village", id: "west-village", meals: ["breakfast", "lunch", "dinner"], icon: "🏙️" },
  { name: "North Ave Dining Hall", id: "north-ave-dining-hall", meals: ["breakfast", "lunch", "dinner", "overnight"], icon: "🏫" },
  { name: "Brittain Dining Hall", id: "brittain", meals: ["breakfast"], icon: "🍽️" },
  { name: "Bento", id: "bento", meals: ["lunch", "dinner"], icon: "🍱" },
  { name: "Brain Freeze", id: "brain-freeze", meals: ["lunch", "dinner"], icon: "🍦" },
  { name: "Campus Crust", id: "campus-crust", meals: ["lunch"], icon: "🍕" },
  { name: "Gyro Chef", id: "ramblin-coffee-sweets", meals: ["all-day-menu"], icon: "🥙" },
  { name: "Kaldi's Coffee", id: "kaldis-coffee", meals: ["all-day-menu"], icon: "☕" },
  { name: "Test Kitchen", id: "test-kitchen", meals: ["breakfast", "lunch"], icon: "🧪" },
  { name: "The Missing T", id: "the-missing-t", meals: ["all-day-menu"], icon: "🔍" },
];

const diningHallIds = ["west-village", "north-ave-dining-hall", "brittain"];

const ChooseMealScreen = () => {
  const [mealHistory, setMealHistory] = useState<{ [date: string]: any[] }>({});
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const router = useRouter();

  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd");
  const mealsForToday = mealHistory[formattedDate] || [];

  const totalMacros = mealsForToday.reduce(
    (totals, meal) => {
      const info = meal.rounded_nutrition_info || {};
      return {
        calories: totals.calories + (info.calories || 0),
        protein: totals.protein + (info.g_protein || 0),
        carbs: totals.carbs + (info.g_carbs || 0),
        fat: totals.fat + (info.g_fat || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

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
    React.useCallback(() => {
      const loadData = async () => {
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) {
            setMealHistory(JSON.parse(stored));
          }
          
          // Check if welcome modal has been shown
          const welcomeShown = await AsyncStorage.getItem('welcomeShown');
          if (!welcomeShown) {
            setWelcomeModalVisible(true);
          }
        } catch (err) {
          console.error("Failed to load meal history:", err);
        }
        await loadGoals();
      };
      loadData();
    }, [])
  );

  const handleMealSelect = (meal: string) => {
    setModalVisible(false);
    router.push({
      pathname: "./food/menu-screen",
      params: {
        meal,
        location: selectedLocation.id,
      },
    });
  };

  const openMealModal = (location: any) => {
    setSelectedLocation(location);
    setModalVisible(true);
  };

  const diningHalls = locationData.filter((loc) => diningHallIds.includes(loc.id) && loc.id !== "brittain");
  const otherLocations = locationData.filter((loc) => !diningHallIds.includes(loc.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.titleText}>Welcome to GT Macros</Text>
          <View style={styles.macrosRow}>
            <MacroBar label="Calories" value={totalMacros.calories} goal={goals.calories} color="#FF6B6B" />
            <MacroBar label="Protein" value={totalMacros.protein} goal={goals.protein} color="#4ECDC4" />
          </View>
          <View style={styles.macrosRow}>
            <MacroBar label="Carbs" value={totalMacros.carbs} goal={goals.carbs} color="#FFD93D" />
            <MacroBar label="Fat" value={totalMacros.fat} goal={goals.fat} color="#6B6BFF" />
          </View>

          <TouchableOpacity style={styles.editButton} onPress={() => router.push("./goals/edit-screen")}>
            <Text style={styles.editButtonText}>Edit Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Dining Halls */}
        <Text style={styles.heading}>Dining Halls</Text>
        <View style={styles.diningHallContainer}>
          {diningHalls.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={styles.diningHallButton}
              onPress={() => openMealModal(loc)}
            >
              <Text style={styles.optionText}>{loc.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.customMealButton}
          onPress={() => router.push("./food/custom-meal-page")}
        >
          <Text style={styles.customMealText}>➕ Add Custom Meal</Text>
        </TouchableOpacity>

        {/* Other Locations */}
        <Text style={styles.heading}>On Campus Dining!</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollWrapper}>
          {otherLocations.map((loc) => (
            <TouchableOpacity key={loc.id} style={styles.optionBox} onPress={() => openMealModal(loc)}>
              <Text style={styles.icon}>{loc.icon}</Text>
              <Text style={styles.optionText}>{loc.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Welcome Modal */}
        <Modal transparent animationType="fade" visible={welcomeModalVisible} onRequestClose={() => setWelcomeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.welcomeModal}>
              <Text style={styles.welcomeTitle}>Welcome to GT Macros!</Text>
              
              <Text style={styles.welcomeText}>
                If you find missing data, that is an issue from our data source, but we strive to show as accurate information as we can.
              </Text>
              
              <Text style={styles.upcomingTitle}>Upcoming Features:</Text>
              <Text style={styles.upcomingText}>• Enhanced UI</Text>
              <Text style={styles.upcomingText}>• Food lookup by name</Text>
              
              <TouchableOpacity 
                style={styles.welcomeButton} 
                onPress={async () => {
                  await AsyncStorage.setItem('welcomeShown', 'true');
                  setWelcomeModalVisible(false);
                }}
              >
                <Text style={styles.welcomeButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Meal Selection Modal */}
        <Modal transparent animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select a Meal</Text>
              {selectedLocation?.meals.map((meal: string) => (
                <TouchableOpacity key={meal} style={styles.mealButton} onPress={() => handleMealSelect(meal)}>
                  <Text style={styles.mealButtonText}>{meal}</Text>
                </TouchableOpacity>
              ))}
              <Button title="Cancel" color="#aaa" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
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
        {value} / {goal} ({percent.toFixed(0)}%)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
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
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  editButton: {
    alignSelf: "flex-start",
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: THEME.background,
    fontWeight: "600",
    fontSize: 13,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
    color: THEME.primary,
  },
  warning: {
    fontSize: 13,
    color: THEME.primary,
    marginBottom: 8,
  },
  scrollWrapper: {
    marginBottom: 16,
  },
  optionBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    backgroundColor: THEME.surface,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    padding: 6,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 16,
    textAlign: "center",
    color: THEME.primary,
    fontWeight: "600",
  },
  diningHallContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  diningHallButton: {
    width: "48%",
    height: DINING_HALL_BOX_SIZE,
    backgroundColor: THEME.surface,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    padding: 6,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  customMealButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.primary,
    backgroundColor: THEME.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  customMealText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 30,
  },
  modalContainer: {
    backgroundColor: THEME.surface,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: THEME.primary,
  },
  mealButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 6,
    width: "100%",
    alignItems: "center",
  },
  mealButtonText: {
    color: THEME.background,
    fontWeight: "600",
    fontSize: 16,
  },
  warningText: {
    color: "#FFC107",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    marginTop: 8,
  },
  welcomeModal: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    maxWidth: "90%",
    alignSelf: "center",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: THEME.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: THEME.text,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.primary,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  upcomingText: {
    fontSize: 16,
    color: THEME.text,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  welcomeButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  welcomeButtonText: {
    color: THEME.background,
    fontWeight: "600",
    fontSize: 16,
  },
});

export default ChooseMealScreen;
