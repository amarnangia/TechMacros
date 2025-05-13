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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";

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

      const response = await fetch(apiUrl);
      const json = await response.json();

      const days = json.days || [];
      setAvailableDates(days.map((d: any) => d.date));

      const dayData = days.find((d: any) => d.date === formattedDateString);
      console.log('API Response:', dayData);

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
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <Button
        title={`Select Date (${date.toDateString()})`}
        onPress={() => setShowDatePicker(true)}
      />
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Text style={styles.heading}>
        {meal?.toUpperCase()} at {location?.replace("-", " ").toUpperCase()}
      </Text>
      <Text style={styles.subHeading}>for {date.toDateString()}</Text>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFFFFF", // white background
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
    color: "#003057", // Tech Blue
  },
  subHeading: {
    fontSize: 16,
    marginBottom: 10,
    color: "#003057",
  },
  loading: {
    marginTop: 20,
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#B3A369", // Tech Gold
    borderRadius: 6,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF", // white text on gold
  },
  sectionToggle: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  itemCard: {
    padding: 12,
    marginTop: 8,
    backgroundColor: "#F5F5F5", // light neutral background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#B3A369",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003057", // Tech Blue
  },
  macros: {
    marginTop: 4,
    fontSize: 14,
    color: "#555555",
  },
  noName: {
    fontSize: 16,
    marginVertical: 4,
    color: "#999999",
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#888888",
  },
  availableDates: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    color: "#003057",
  },
});


export default MenuScreen;
