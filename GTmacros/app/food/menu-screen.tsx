import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Button,
  ActivityIndicator,
  StyleSheet,
  Platform,
  SafeAreaView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { THEME } from "../../constants/Theme";

// Types
type NutritionInfo = {
  calories: number;
  g_protein: number;
  g_fat: number;
  g_carbs: number;
};

type ServingSizeInfo = {
  serving_size_amount: string;
  serving_size_unit: string;
};

type Food = {
  id: number;
  name: string;
  
  rounded_nutrition_info: NutritionInfo;
  serving_size_info: ServingSizeInfo;
  ingredients?: string;
};

type MenuItem = {
  id: number;
  food: Food | null;
  is_section_title: boolean,
  text: string,
};

const MenuScreen = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { meal, location } = useLocalSearchParams<{
    meal?: string;
    location?: string;
  }>();
  const router = useRouter();

  useEffect(() => {
    fetchMenu(date);
  }, [date, meal, location]);

  const fetchMenu = async (selectedDate: Date) => {
    if (!meal || !location) return;

    setLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDatePath = `${year}/${month}/${day}`;
      const formattedDateString = `${year}-${month}-${day}`;
      const apiUrl = `https://techdining.api.nutrislice.com/menu/api/weeks/school/${location}/menu-type/${meal}/${formattedDatePath}/?format=json`;

      console.log('API Request URL:', apiUrl);
      const response = await fetch(apiUrl);
      const json = await response.json();

      const days = json.days || [];
      setAvailableDates(days.map((d: any) => d.date));

      const dayData = days.find((d: any) => d.date === formattedDateString);

      setMenu(dayData?.menu_items || []);
      
    } catch (err) {
      console.error("Error fetching menu:", err);
      setMenu([]);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const handleItemPress = (item: MenuItem) => {
    if (!item.food) return;
    const encoded = encodeURIComponent(JSON.stringify(item));
    router.push({
      pathname: "../food/[id]",
      params: {
        id: String(item.food.id),
        item: encoded,
      },
    });
  };

  const groupedMenu = (() => {
    const groups: Record<string, MenuItem[]> = {};
    let currentSection = "Other";
  
    for (const item of menu) {
      if (item.is_section_title && item.text.trim()) {
        currentSection = item.text.trim();
        if (!groups[currentSection]) {
          groups[currentSection] = [];
        }
      } else {
        if (!groups[currentSection]) {
          groups[currentSection] = [];
        }
        groups[currentSection].push(item);
      }
    }
  
    return groups;
  })();
  

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const isCurrentlyExpanded = !!prev[section];
      const newState: { [key: string]: boolean } = {};
  
      // Collapse all sections
      Object.keys(prev).forEach((key) => {
        newState[key] = false;
      });
  
      // Toggle the clicked section (expand if it was collapsed)
      newState[section] = !isCurrentlyExpanded;
  
      return newState;
    });
  
  
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
      <Text style={styles.heading}>
        {meal?.toUpperCase()} at {location?.replace("-", " ").toUpperCase()}
      </Text>

      
      <View style={styles.dateNavigationContainer}>
        <Pressable onPress={() => setDate(prev => new Date(prev.setDate(prev.getDate() - 7)))}>
          <Text style={styles.dateNavArrow}>«</Text>
        </Pressable>
        <Pressable onPress={() => setDate(prev => new Date(prev.setDate(prev.getDate() - 1)))}>
          <Text style={styles.dateNavArrow}>‹</Text>
        </Pressable>

        <Pressable onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{date.toDateString()}</Text>
        </Pressable>

        <Pressable onPress={() => setDate(prev => new Date(prev.setDate(prev.getDate() + 1)))}>
          <Text style={styles.dateNavArrow}>›</Text>
        </Pressable>
        <Pressable onPress={() => setDate(prev => new Date(prev.setDate(prev.getDate() + 7)))}>
          <Text style={styles.dateNavArrow}>»</Text>
        </Pressable>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      
      {loading ? (
        <ActivityIndicator size="large" style={styles.loading} />
      ) : menu.length > 0 ? (
        Object.entries(groupedMenu).map(([section, items]) => (
          <View key={section}>
            <Pressable onPress={() => toggleSection(section)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section}</Text>
                <Text style={styles.sectionToggle}>
                  {expandedSections[section] ? "▲" : "▼"}
                </Text>
              </View>
            </Pressable>

            {expandedSections[section] &&
      items.map((item) =>
        item.food ? (
          <Pressable key={item.id} onPress={() => handleItemPress(item)}>
            <View style={styles.itemCard}>
              <Text style={styles.itemName}>{item.food.name}</Text>
              <Text style={styles.sectionLabel}>
                Section: {item.text || "No section"}
              </Text>
              <Text style={styles.sectionLabel}>
                ID: {item.id || "No section"}
              </Text>
              <Text style={styles.macros}>
                Calories: {item.food.rounded_nutrition_info.calories} kcal | Protein:{" "}
                {item.food.rounded_nutrition_info.g_protein}g | Carbs:{" "}
                {item.food.rounded_nutrition_info.g_carbs}g | Fat:{" "}
                {item.food.rounded_nutrition_info.g_fat}g
              </Text>
            </View>
          </Pressable>
    ) : (
      <Text key={item.id} style={styles.noName}>Unnamed menu item</Text>
    )
  )}

          </View>
        ))
      ) : (
        <View>
          <Text style={styles.emptyText}>No menu available for this date.</Text>
          {availableDates.length > 0 && (
            <Text style={styles.availableDates}>
              Available dates this week: {availableDates.join(", ")}
            </Text>
          )}
        </View>
      )}
      </ScrollView>
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
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
    color: THEME.primary,
  },
  subHeading: {
    fontSize: 16,
    marginBottom: 10,
    color: THEME.primary,
  },
  loading: {
    marginTop: 20,
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: THEME.primary,
    borderRadius: 6,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.background,
  },
  sectionToggle: {
    fontSize: 18,
    color: THEME.background,
  },
  itemCard: {
    padding: 12,
    marginTop: 8,
    backgroundColor: THEME.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: THEME.primary,
  },
  macros: {
    marginTop: 4,
    fontSize: 14,
    color: THEME.text,
  },
  noName: {
    fontSize: 16,
    marginVertical: 4,
    color: THEME.primary,
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: THEME.primary,
  },
  availableDates: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    color: THEME.text,
  },
  dateNavigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    paddingVertical: 10,
    backgroundColor: THEME.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 12,
    color: THEME.primary,
    textDecorationLine: "underline",
  },
  dateNavArrow: {
    fontSize: 20,
    paddingHorizontal: 10,
    color: THEME.primary,
  },
  sectionLabel: {
    fontSize: 12,
    color: THEME.text,
    marginTop: 2,
  },
});


export default MenuScreen;
