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
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 12,
        paddingTop: insets.top + 12,
        backgroundColor: colors.whiteOpacity,
        backdropFilter: "blur(12px)",
      }}
    >
      {showBackError ? }
    </View>
  );
}
