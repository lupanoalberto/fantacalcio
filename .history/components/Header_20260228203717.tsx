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
        flex: 1,
        fle
        padding: 12,
        paddingTop: insets.top + 12, backgroundColor: colors.background,
      }}
    ></View>
  );
}
