import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Button,
} from "react-native";

// Georgia Tech Colors
const GT_NAVY = "#003057";
const GT_GOLD = "#B3A369";
const GT_DARK_BG = "#1a2a40";
const WHITE = "#FFFFFF";

const locationData = [
  { name: "West Village", id: "west-village", meals: ["breakfast", "lunch", "dinner"], icon: "🏙️" },
  { name: "North Ave Dining Hall", id: "north-ave-dining-hall", meals: ["breakfast", "lunch", "dinner", "overnight"], icon: "🏫" },
  { name: "Bento", id: "bento", meals: ["lunch", "dinner"], icon: "🍱" },
  { name: "Brain Freeze", id: "brain-freeze", meals: ["lunch", "dinner"], icon: "🍦" },
  { name: "Brittain Dining Hall", id: "brittain", meals: ["breakfast"], icon: "🍽️" },
  { name: "Campus Crust", id: "campus-crust", meals: ["lunch"], icon: "🍕" },
  { name: "Gyro Chef", id: "ramblin-coffee-sweets", meals: ["all-day-menu"], icon: "🥙" },
  { name: "Kaldi's Coffee", id: "kaldis-coffee", meals: ["all-day-menu"], icon: "☕" },
  { name: "Test Kitchen", id: "test-kitchen", meals: ["breakfast", "lunch"], icon: "🧪" },
  { name: "The Missing T", id: "the-missing-t", meals: ["all-day-menu"], icon: "🔍" },
];

const ChooseMealScreen = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const router = useRouter();

  const currentLocation = locationData.find((loc) => loc.id === selectedLocation);
  const mealOptions = currentLocation?.meals || [];

  const handleContinue = () => {
    if (selectedMeal && selectedLocation) {
      router.push({
        pathname: "./food/menu-screen",
        params: {
          meal: selectedMeal,
          location: selectedLocation,
        },
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Choose a Location</Text>

      <View style={styles.scrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {locationData.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[
                styles.optionBox,
                selectedLocation === loc.id && styles.selectedBox,
              ]}
              onPress={() => {
                setSelectedLocation(loc.id);
                setSelectedMeal(null);
              }}
            >
              <Text style={styles.icon}>{loc.icon}</Text>
              <Text
                style={[
                  styles.optionText,
                  selectedLocation === loc.id && styles.selectedText,
                ]}
              >
                {loc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedLocation && (
        <>
          <Text style={styles.heading}>Choose a Meal</Text>
          <View style={styles.scrollWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mealOptions.map((meal) => (
                <TouchableOpacity
                  key={meal}
                  style={[
                    styles.optionBox,
                    selectedMeal === meal && styles.selectedBox,
                  ]}
                  onPress={() => setSelectedMeal(meal)}
                >
                  <Text style={styles.icon}>🍴</Text>
                  <Text
                    style={[
                      styles.optionText,
                      selectedMeal === meal && styles.selectedText,
                    ]}
                  >
                    {meal}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      <View style={styles.continueButton}>
        <Button
          title="Continue"
          color={GT_GOLD}
          onPress={handleContinue}
          disabled={!selectedMeal || !selectedLocation}
        />
      </View>
    </ScrollView>
  );
};

const BOX_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: GT_DARK_BG,
    flexGrow: 1,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
    color: WHITE,
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
  selectedBox: {
    backgroundColor: GT_NAVY,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 11,
    textAlign: "center",
    color: GT_NAVY,
  },
  selectedText: {
    color: WHITE,
    fontWeight: "600",
  },
  continueButton: {
    marginTop: 20,
  },
});

export default ChooseMealScreen;
