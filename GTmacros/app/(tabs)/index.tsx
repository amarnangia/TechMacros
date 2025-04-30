// app/chooseMeal.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Button,
} from "react-native";

const mealOptions = ["breakfast", "lunch", "dinner"];
const locationOptions = ["west-village", "north-ave-dining-hall"];

const ChooseMealScreen = () => {
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const router = useRouter();

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
    <View style={styles.container}>
      <Text style={styles.heading}>Choose Your Meal</Text>

      <Text style={styles.subheading}>Meal</Text>
      <View style={styles.optionsRow}>
        {mealOptions.map((meal) => (
          <TouchableOpacity
            key={meal}
            style={[
              styles.optionButton,
              selectedMeal === meal && styles.selectedButton,
            ]}
            onPress={() => setSelectedMeal(meal)}
          >
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
      </View>

      <Text style={styles.subheading}>Location</Text>
      <View style={styles.optionsRow}>
        {locationOptions.map((loc) => (
          <TouchableOpacity
            key={loc}
            style={[
              styles.optionButton,
              selectedLocation === loc && styles.selectedButton,
            ]}
            onPress={() => setSelectedLocation(loc)}
          >
            <Text
              style={[
                styles.optionText,
                selectedLocation === loc && styles.selectedText,
              ]}
            >
              {loc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.continueButton}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedMeal || !selectedLocation}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 24 },
  subheading: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginRight: 12,
    marginBottom: 12,
  },
  selectedButton: {
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "600",
  },
  continueButton: {
    marginTop: 24,
  },
});

export default ChooseMealScreen;
