// components/LeagueCard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app/theme";
import { Colors } from "@/constants/colors";

type LeagueCardProps = {
  name: string;
  teamsCount: number;
  team?: string;
  onPress?: () => void;
};

export default function LeagueCard({ name, teamsCount, team, onPress }: LeagueCardProps) {
  const { colors, fonts } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text, fontFamily: fonts.bold }]}>
          {name}
        </Text>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.textSecondary} />
      </View>

      {team && (
        <Text style={[styles.detail, { color: colors.success, fontFamily: fonts.semibold }]}>
          {team}
        </Text>
      )}

      <Text style={[styles.detail, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
        Squadre: {teamsCount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
  },
  detail: {
    fontSize: 12,
  },
});
