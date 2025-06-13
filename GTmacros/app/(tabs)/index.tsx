import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Button,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";

// Colors
const GT_NAVY = "#003057";
const GT_GOLD = "#B3A369";
const GT_DARK_BG = "#1a2a40";
const WHITE = "#FFFFFF";

// Location data
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

const BOX_SIZE = 80;
const DINING_HALL_BOX_SIZE = 60;
const STORAGE_KEY = "userMeals";

const ChooseMealScreen = () => {
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Meal history state only (removed date picker states)
  const [mealHistory, setMealHistory] = useState<{ [date: string]: any[] }>({});

  const router = useRouter();

  // Filter dining halls and others inside the component
  const diningHalls = locationData.filter((loc) => diningHallIds.includes(loc.id));
  const otherLocations = locationData.filter((loc) => !diningHallIds.includes(loc.id));

  // Dummy global goals; replace with your actual global state
  const globalGoals = {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 70,
  };

  // Load meal history on screen focus
  useEffect(() => {
    const loadMeals = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setMealHistory(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load meal history:", err);
      }
    };
    loadMeals();
  }, []);

  // Hardcode today's date formatted
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd");

  // Meals for today's date only
  const mealsForDate = mealHistory[formattedDate] || [];

  // Calculate total macros for today based on saved meals
  const totalMacros = mealsForDate.reduce(
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

  const openMealModal = (location: any) => {
    setSelectedLocation(location);
    setModalVisible(true);
  };

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Removed date selection UI */}

      {/* Header Section */}
      <View style={styles.headerCard}>
        <Text style={styles.titleText}>Welcome to GT Macros</Text>

        {/* Macros progress bars in 2 rows of 2 */}
        <View style={styles.macrosRow}>
          <MacroBar label="Calories" value={totalMacros.calories} goal={globalGoals.calories} color="#FF6B6B" />
          <MacroBar label="Protein" value={totalMacros.protein} goal={globalGoals.protein} color="#4ECDC4" />
        </View>
        <View style={styles.macrosRow}>
          <MacroBar label="Carbs" value={totalMacros.carbs} goal={globalGoals.carbs} color="#FFD93D" />
          <MacroBar label="Fat" value={totalMacros.fat} goal={globalGoals.fat} color="#6B6BFF" />
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => router.push("./goals/edit-screen")}>
          <Text style={styles.editButtonText}>Edit Goals</Text>
        </TouchableOpacity>
      </View>

      {/* Dining Halls */}
      <Text style={styles.heading}>Dining Halls</Text>
      <View style={styles.diningHallContainer}>
        <View style={styles.diningHallRow}>
          {diningHalls.slice(0, 2).map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={styles.diningHallButton}
              onPress={() => openMealModal(loc)}
            >
              <Text style={styles.optionText}>{loc.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.diningHallRow, styles.singleButtonRow]}>
          {diningHalls.slice(2, 3).map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={styles.diningHallButton}
              onPress={() => openMealModal(loc)}
            >
              <Text style={styles.optionText}>{loc.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Other Food Places */}
      <Text style={styles.heading}>Other Food Places</Text>
      <Text style={styles.warning}>
        ⚠️ We currently don't have menu information for these locations.
      </Text>
      <View style={styles.scrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {otherLocations.map((loc) => (
            <TouchableOpacity key={loc.id} style={styles.optionBox} onPress={() => openMealModal(loc)}>
              <Text style={styles.icon}>{loc.icon}</Text>
              <Text style={styles.optionText}>{loc.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
            <Button title="Cancel" color="#ccc" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const MacroBar = ({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) => {
  const percent = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <View style={{ flex: 1, marginHorizontal: 6 }}>
      <Text style={{ color: WHITE, fontWeight: "600", marginBottom: 4 }}>{label}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={{ color: WHITE, fontSize: 12, marginTop: 2 }}>
        {value} / {goal} ({percent.toFixed(0)}%)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: GT_DARK_BG,
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: "#002244",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: GT_GOLD,
    marginBottom: 12,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  editButton: {
    alignSelf: "flex-start",
    backgroundColor: GT_GOLD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: GT_NAVY,
    fontWeight: "600",
    fontSize: 13,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
    color: WHITE,
  },
  warning: {
    fontSize: 13,
    color: "#FFDD57",
    marginBottom: 8,
  },
  scrollWrapper: {
    height: BOX_SIZE + 20,
    marginBottom: 16,
  },
  optionBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    backgroundColor: GT_GOLD,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    padding: 6,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 18,
    textAlign: "center",
    color: GT_NAVY,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 30,
  },
  modalContainer: {
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: GT_NAVY,
  },
  mealButton: {
    backgroundColor: GT_GOLD,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 6,
    width: "100%",
    alignItems: "center",
  },
  mealButtonText: {
    color: GT_NAVY,
    fontWeight: "600",
    fontSize: 16,
  },

  barBackground: {
    height: 14,
    backgroundColor: "#555",
    borderRadius: 8,
  },

  barFill: {
    height: 14,
    borderRadius: 8,
  },
  diningHallContainer: {
  // spacing around container
  marginBottom: 16,
},

diningHallRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 12,
},

singleButtonRow: {
  justifyContent: "center",
},

diningHallButton: {
  width: "48%",
  height: DINING_HALL_BOX_SIZE,
  backgroundColor: GT_GOLD,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
},

});

export default ChooseMealScreen;
