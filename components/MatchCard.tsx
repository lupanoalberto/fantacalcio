import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useTheme } from "../app/theme";
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
  const router = useRouter();

  // 🔹 Determina il colore in base allo stato
  let scoreColor = colors.text;
  let timeColor = colors.textSecondary;

  const normalizedTime = time?.toUpperCase?.() ?? "";

  if (normalizedTime.includes("LIVE") || normalizedTime.includes("INT.")) {
    scoreColor = colors.gold; // verde per LIVE
    timeColor = colors.gold;
  } else if (
    ["POSTPONED", "SUSPENDED", "CANCELLED"].some((w) =>
      normalizedTime.includes(w)
    )
  ) {
    scoreColor = colors.error; // rosso per problemi
    timeColor = colors.error; // giallo per sospensione
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.primary }]}
      onPress={() => router.push(`../match/${idx}` as Href)}
    >
      <View style={styles.row}>
        {/* Squadra di casa */}
        <View style={styles.column}>
          <View style={styles.logoContainer}>
            {homeLogo && (
              <Image source={{ uri: homeLogo }} style={styles.logo} />
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.team,
              { color: colors.text, fontFamily: fonts.semibold },
            ]}
          >
            {homeTeam}
          </Text>
        </View>
        <View style={styles.column}>
          {/* Orario o stato match */}
          {time && (
            <Text
              style={[
                styles.time,
                { color: timeColor, fontFamily: fonts.regular },
              ]}
            >
              {time}
            </Text>
          )}
          <Text
            style={[
              styles.score,
              { color: scoreColor, fontFamily: fonts.semibold },
            ]}
          >
            {scoreHome} - {scoreAway}
          </Text>
          <Text
            style={[
              styles.time,
              { color: colors.textSecondary, fontFamily: fonts.regular },
            ]}
          >
            Giornata {matchday}
          </Text>
        </View>
        <View style={styles.column}>
          <View style={styles.logoContainer}>
            {awayLogo && (
              <Image source={{ uri: awayLogo }} style={styles.logo} />
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.team,
              { color: colors.text, fontFamily: fonts.semibold },
            ]}
          >
            {awayTeam}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
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
    width: 32,
    height: 32,
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
