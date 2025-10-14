// components/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

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
          backgroundColor: colors.background,
          borderBottomColor: colors.secondary,
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <View style={styles.leftSection}>
        {showBackArrow && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/"); // fallback alla home
            }}

            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>
          {title}
        </Text>
      </View>

      <View style={styles.icons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPressShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
  },
  icons: {
    flexDirection: "row",
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
});
