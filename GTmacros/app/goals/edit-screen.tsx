import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { THEME } from "../../constants/Theme";

// Default recommended values
const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 70,
};

const STORAGE_KEYS = {
  calories: "goal_calories",
  protein: "goal_protein",
  carbs: "goal_carbs",
  fat: "goal_fat",
};

export default function EditGoalsScreen() {
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const loadedGoals: any = {};
      for (const key in STORAGE_KEYS) {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]);
        loadedGoals[key] = stored ? parseInt(stored, 10) : DEFAULT_GOALS[key as keyof typeof DEFAULT_GOALS];
      }
      setGoals(loadedGoals);
    })();
  }, []);

  const handleChange = (key: keyof typeof DEFAULT_GOALS, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setGoals((prev) => ({ ...prev, [key]: num }));
    }
  };

  const saveGoals = async () => {
    try {
      for (const key in goals) {
        await AsyncStorage.setItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS], goals[key as keyof typeof goals].toString());
      }
      Alert.alert("Success", "Goals saved!");
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save goals.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Your Goals</Text>

      {Object.keys(goals).map((key) => (
        <View key={key} style={styles.inputGroup}>
          <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={goals[key as keyof typeof goals].toString()}
            onChangeText={(text) => handleChange(key as keyof typeof goals, text)}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={saveGoals}>
        <Text style={styles.saveButtonText}>Save Goals</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: THEME.primary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: THEME.text,
    fontSize: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    color: THEME.text,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: THEME.background,
    fontSize: 16,
    fontWeight: "bold",
  },
});
