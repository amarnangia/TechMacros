// tabs/menu.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Button,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

export {};

declare global {
  var __selectedFoodItem: any;
}

type MenuItem = {
  id: number;
  food: {
    id: number;
    name: string;
    rounded_nutrition_info: {
      calories: number;
      g_protein: number;
      g_fat: number;
      g_carbs: number;
    };
    serving_size_info: {
      serving_size_amount: string;
      serving_size_unit: string;
    };
    ingredients?: string;
  } | null;
};

const MenuScreen = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const router = useRouter();

  const fetchMenu = async (selectedDate: Date) => {
    setLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDatePath = `${year}/${month}/${day}`;
      const url = `https://techdining.api.nutrislice.com/menu/api/weeks/school/west-village/menu-type/dinner/${formattedDatePath}/?format=json`;

      const response = await fetch(url);
      const json = await response.json();

      const days = json.days || [];
      const datesFound = days.map((d: any) => d.date);
      setAvailableDates(datesFound);

      const formattedSelectedDate = `${year}-${month}-${day}`;
      const dayData = days.find((d: any) => d.date === formattedSelectedDate);

      if (!dayData) {
        setMenu([]);
      } else {
        setMenu(dayData.menu_items || []);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
      setMenu([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu(date);
  }, [date]);

  const onDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  return (
    <ScrollView style={styles.container}>
      <Button title={`Select Date (${date.toDateString()})`} onPress={() => setShowDatePicker(true)} />
      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
      )}

      <Text style={styles.heading}>Dinner Menu for {date.toDateString()}</Text>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loading} />
      ) : menu.length > 0 ? (
        <FlatList
          data={menu}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) =>
            item.food ? (
              <Pressable
                onPress={() => {
                  global.__selectedFoodItem = item;
                  router.push(
                    { 
                      pathname: "/food/[id]", 
                      params: { id: String(item.food.id) } 
                    });
                }}
              >
                <View style={styles.itemCard}>
                  <Text style={styles.itemName}>{item.food.name}</Text>
                  <Text style={styles.macros}>
                    Calories: {item.food.rounded_nutrition_info.calories} kcal | Protein: {item.food.rounded_nutrition_info.g_protein}g | Carbs: {item.food.rounded_nutrition_info.g_carbs}g | Fat: {item.food.rounded_nutrition_info.g_fat}g
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Text style={styles.noName}>Unnamed menu item</Text>
            )
          }
        />
      ) : (
        <View>
          <Text style={styles.emptyText}>No menu available for this date.</Text>
          {availableDates.length > 0 && (
            <Text style={styles.availableDates}>
              Available dates in the week: {availableDates.join(", ")}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "600", marginVertical: 12 },
  loading: { marginTop: 20 },
  itemCard: {
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  itemName: { fontSize: 18, fontWeight: "bold" },
  macros: { marginTop: 4, fontSize: 14, color: "#555" },
  emptyText: { marginTop: 20, textAlign: "center", fontSize: 16, color: "#888" },
  availableDates: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  noName: { fontSize: 16, marginVertical: 4 },
});

export default MenuScreen;
