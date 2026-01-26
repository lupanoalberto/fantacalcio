// components/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../app/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

type HeaderProps = {
  title?: string;
  showBackArrow?: boolean;
  onPressBack?: () => void;
  onPressNotifications?: () => void;
  onPressShare?: () => void;
};

export default function Header({
  title = "Fantacalcio",
  showBackArrow = true,
  onPressBack,
  onPressNotifications,
  onPressShare,
}: HeaderProps) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets(); // <-- margine superiore dinamico

  return (
    <View
      style={
        {
          paddingTop: insets.top + 16,
        }
      }
    >
    </View>
  );
}