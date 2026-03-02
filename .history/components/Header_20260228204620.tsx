// components/Header.tsx
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { goBack } from "expo-router/build/global-state/routing";

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
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={goBack}>
          <MaterialCommunityIcons name="account-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      )}

      <Text>
        
      </Text>
    </View>
  );
}
