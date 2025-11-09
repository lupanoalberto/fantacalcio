import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // 👈 per ottenere il margine inferiore

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopColor: colors.secondary,
          borderTopWidth: 0.5,
          height: 60 + insets.bottom, // 👈 aggiungiamo spazio extra
          paddingBottom: insets.bottom + 4, // 👈 così non viene coperta
        },
        tabBarActiveTintColor: colors.success,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: "Poppins_400Regular",
          fontSize: 13,
        },
      }}
    >
      <Tabs.Screen
        name="[id]"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendario",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: "Classifica",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: "Squadre",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt-outline" color={color} size={size} />
          ),
        }}
      />
  </Tabs>
  );
}
