import Numbers from "@/constants/Numbers";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const TabButton = ({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  color,
  label,
}: {
  onPress: ((event: GestureResponderEvent) => void) | null | undefined;
  onLongPress: ((event: GestureResponderEvent) => void) | null | undefined;
  isFocused: boolean;
  routeName: string;
  color: string;
  label: string;
}) => {
  const icon: Record<string, (props: any) => JSX.Element> = {
    index: (props: any) => (
      <Ionicons name="home-sharp" size={Numbers.iconSize} {...props} />
    ),
    recipes: (props: any) => (
      <Ionicons name="restaurant-sharp" size={Numbers.iconSize} {...props} />
    ),
    two: (props: any) => (
      <Ionicons name="time-sharp" size={Numbers.iconSize} {...props} />
    ),
  };

  const IconComponent = icon[routeName] || icon.index;

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(
      typeof isFocused === "boolean" ? (isFocused ? 1 : 0) : isFocused,
      { duration: Numbers.animatedIconScaleDuration }
    );
  }, [scale, isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      scale.value,
      [0, 1],
      [1, Numbers.selectedIconScale]
    );
    const top = interpolate(
      scale.value,
      [0, 1],
      [0, Numbers.selectedIconShift]
    );

    return {
      transform: [
        {
          scale: scaleValue,
        },
      ],
      top: top,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);

    return {
      opacity,
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab_bar_item}
    >
      <Animated.View style={animatedIconStyle}>
        <IconComponent color={color} />
      </Animated.View>
      <Animated.Text
        style={[
          {
            color: color,
            fontSize: Numbers.tabLabelFontSize,
          },
          animatedTextStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tab_bar_item: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Numbers.gapBetweenIconAndLabel, //Gap between words and icon
  },
});

export default TabButton;
