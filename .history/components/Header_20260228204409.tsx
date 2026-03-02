// components/Header.tsx
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  showBackError: true;
}

export default function Header({
  title,
  showBackError
}: Props) {
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
      {showBackError ? (
        <TouchableOpacity>
          <Ionicons />
        </TouchableOpacity>
      ) : (

      )
      }
    </View>
  );
}
