import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SerieAIcon from "@/assets/svg/serie-a-logo.svg";
import PremierLeagueIcon from "@/assets/svg/Premier League_Symbol_0.svg";
import LaLigaIcon from "@/assets/svg/LaLiga_id5A1pzi0Q_0.svg";

export default function TabsLayout() {
  const { colors, fonts } = useTheme();
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
          fontFamily: fonts.semibold,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="serie-a"
        options={{
          title: "Serie A",
          tabBarIcon: ({ color, size }) => (
            <SerieAIcon
              width={size}
              height={size}
              stroke={color}
              fill={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="premier-league"
        options={{
          title: "Premier League",
          tabBarIcon: ({ color, size }) => (
            <PremierLeagueIcon width={size}
              height={size}
              fill={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="la-liga"
        options={{
          title: "LaLiga",
          tabBarIcon: ({ color, size }) => (
            <LaLigaIcon width={size}
              height={size}
              fill={color} />
          ),
        }}
      />
    </Tabs>
  );
}
