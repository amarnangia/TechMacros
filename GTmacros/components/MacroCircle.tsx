// components/MacroCircle.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
interface MacroCircleProps {
  label: string;
  value: number;
  unit?: string;
  max: number; 
  color: string;
  size?: number;
}

const MacroCircle = ({
  label,
  value,
  unit = "g",
  max,
  color,
  size = screenWidth / 5,
}: MacroCircleProps) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Clamp percentage to a max of 1 (i.e., 100%)
  const clampedPercentage = Math.min(value/max, 1);
  const strokeDashoffset = circumference * (1 - clampedPercentage);

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#ddd"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.valueText}>
          {value}
          {unit}
        </Text>
        <Text style={styles.valueText}>
          /{max}
        </Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -20,//manually fixed centering issue. Circle back later
    left: 0,
    right: 0,
    bottom: 0,
  },
  valueText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#003057",
  },
  label: {
    marginTop: 4,
    fontSize: 14,
    color: "#333",
  },
});

export default MacroCircle;
