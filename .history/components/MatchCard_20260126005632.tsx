import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";

type MatchCardProps = {
  idx: string;
  homeTeam: string;
  awayTeam: string;
  scoreHome: string;
  scoreAway: string;
  time?: string;
  homeLogo?: string;
  awayLogo?: string;
  matchday?: number;
};

export default function MatchCard({
  idx,
  homeTeam,
  awayTeam,
  scoreHome,
  scoreAway,
  time,
  homeLogo,
  awayLogo,
  matchday,
}: MatchCardProps) {
  const { colors, fonts } = useTheme();

  // 🔹 Determina il colore in base allo stato
  let scoreColor = colors.text;
  let timeColor = colors.textSecondary;

  const normalizedTime = time?.toUpperCase?.() ?? "";

  if (normalizedTime.includes("LIVE") || normalizedTime.includes("INT.")) {
    scoreColor = colors.success; // verde per LIVE
    timeColor = colors.success;
  } else if (
    ["POSTPONED", "SUSPENDED", "CANCELLED"].some((w) =>
      normalizedTime.includes(w)
    )
  ) {
    scoreColor = colors.error; // rosso per problemi
    timeColor = colors.error; // giallo per sospensione
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.primary }]}
    >
      <View
        style={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={styles.logoContainer}>
          {homeLogo && <Image source={{ uri: homeLogo }} style={styles.logo} resizeMode="contain" />}
        </View>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 14,
            textAlign: "center",
            width: 64,
          }}
          numberOfLines={1}
        >
          {homeTeam}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: timeColor,
            fontFamily: fonts.regular,
            fontSize: 12,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {time}
        </Text>
        <Text
          style={{
            color: scoreColor,
            fontFamily: fonts.bold,
            fontSize: 24,
          }}
        >
          {scoreHome} - {scoreAway}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: fonts.regular,
            fontSize: 12,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          Giornata {matchday}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={styles.logoContainer}>
          {awayLogo && <Image source={{ uri: awayLogo }} style={styles.logo} resizeMode="contain" />}
        </View>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 14,
            textAlign: "center",
            width: 64,
          }}
          numberOfLines={1}
        >
          {awayTeam}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  column: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  logoContainer: {
    padding: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  team: {
    width: 64,
    fontSize: 12,
    textAlign: "center",
  },
  score: {
    fontSize: 24,
  },
  time: {
    fontSize: 12,
  },
});
