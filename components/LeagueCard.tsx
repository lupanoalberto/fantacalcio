// components/LeagueCard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app/theme";

type LeagueCardProps = {
  name: string;
  teamsCount: number;
  nextMatch?: string;
  onPress?: () => void;
};

export default function LeagueCard({ name, teamsCount, nextMatch, onPress }: LeagueCardProps) {
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

      <Text style={[styles.detail, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
        Squadre: {teamsCount}
      </Text>

      {nextMatch && (
        <Text style={[styles.detail, { color: colors.success, fontFamily: fonts.regular }]}>
          Prossima partita: {nextMatch}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
  },
  detail: {
    fontSize: 13,
  },
});
