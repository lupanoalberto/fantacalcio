// components/Header.tsx
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

export default function Header() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // <-- margine superiore dinamico

  return (
    <View
      style={{
        height: insets.top + 16, backgroundColor: colors.background,
      }}
    ></View>
  );
}
