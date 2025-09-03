import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { THEME } from "../../constants/Theme";

const STORAGE_KEY = "userMeals";

const CustomMealPage = () => {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a meal name");
      return;
    }

    const customMeal = {
      name: name.trim(),
      rounded_nutrition_info: {
        calories: parseInt(calories) || 0,
        g_protein: parseInt(protein) || 0,
        g_carbs: parseInt(carbs) || 0,
        g_fat: parseInt(fat) || 0,
      },
      isCustom: true,
    };

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const mealHistory = stored ? JSON.parse(stored) : {};
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      
      if (!mealHistory[dateKey]) {
        mealHistory[dateKey] = [];
      }
      
      mealHistory[dateKey].push(customMeal);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mealHistory));
      
      Alert.alert("Success", "Custom meal added!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save meal");
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Custom Meal</Text>
        </View>
        
        <Text style={styles.label}>Meal Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter meal name"
          placeholderTextColor={THEME.textSecondary}
        />

        <Text style={styles.label}>Calories</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={setCalories}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={THEME.textSecondary}
        />

        <Text style={styles.label}>Protein (g)</Text>
        <TextInput
          style={styles.input}
          value={protein}
          onChangeText={setProtein}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={THEME.textSecondary}
        />

        <Text style={styles.label}>Carbs (g)</Text>
        <TextInput
          style={styles.input}
          value={carbs}
          onChangeText={setCarbs}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={THEME.textSecondary}
        />

        <Text style={styles.label}>Fat (g)</Text>
        <TextInput
          style={styles.input}
          value={fat}
          onChangeText={setFat}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={THEME.textSecondary}
        />

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {format(selectedDate, "MMM dd, yyyy")}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Meal</Text>
        </TouchableOpacity>
      </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: THEME.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: THEME.primary,
    flex: 1,
    textAlign: "center",
    marginLeft: -40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: THEME.text,
  },
  dateButton: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: THEME.text,
  },
  saveButton: {
    backgroundColor: THEME.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 30,
  },
  saveButtonText: {
    color: THEME.background,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default CustomMealPage;