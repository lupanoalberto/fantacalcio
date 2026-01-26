// components/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../app/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const insets = useSafeAreaInsets(); // <-- margine superiore dinamico

  return (
    <View
      style={{
        paddingTop: insets.top + 16,
      }}
    ></View>
  );
}
