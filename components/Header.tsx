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
      style={[
        styles.container,
        {
          paddingTop: insets.top + 16,
        },
      ]}
    >
        {showBackArrow && (
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/"); // fallback alla home
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text
          style={[styles.title, { flex: 1, color: colors.text, fontFamily: fonts.bold }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      <TouchableOpacity onPress={onPressShare} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name="account-circle-outline"
          size={32}
          color={colors.text}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 24,
  },
  icons: {
    flexDirection: "row",
    gap: 16,
  },
});
