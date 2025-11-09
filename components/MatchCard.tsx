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
  } else if (["POSTPONED", "SUSPENDED", "CANCELLED"].some((w) => normalizedTime.includes(w))) {
    scoreColor = colors.error; // rosso per problemi
    timeColor = colors.error; // giallo per sospensione
  }

  return (
    <TouchableOpacity onPress={() => router.push((`../match/${idx}`) as Href)} style={[styles.card, { backgroundColor: colors.primary }]}>
      
      <View style={styles.row}>
        {/* Orario o stato match */}
        {time && (
          <Text style={[styles.time, { color: timeColor, fontFamily: fonts.regular }]}>
            {time}
          </Text>
        )}
        <Ionicons name="chevron-forward-outline" color={colors.textSecondary} size={18} />
      </View>

      <View style={styles.row}>
        {/* Squadra di casa */}
        <View style={[styles.teamContainer, { justifyContent: "flex-start" }]}>
          <View style={styles.logoContainer}>
            {homeLogo && <Image source={{ uri: homeLogo }} style={styles.logo} />}
          </View>
          <Text
            style={[styles.team, { color: colors.text, fontFamily: fonts.semibold }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {homeTeam}
          </Text>
        </View>
        <Text style={[styles.score, { color: scoreColor, fontFamily: fonts.semibold }]}>
          {scoreHome}
        </Text>
      </View>

      <View style={styles.row}>
        {/* Squadra di casa */}
        <View style={[styles.teamContainer, { justifyContent: "flex-start" }]}>
          <View style={styles.logoContainer}>
            {awayLogo && <Image source={{ uri: awayLogo }} style={styles.logo} />}
          </View>
          <Text
            style={[styles.team, { color: colors.text, fontFamily: fonts.semibold }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {awayTeam}
          </Text>
        </View>
        <Text style={[styles.score, { color: scoreColor, fontFamily: fonts.semibold }]}>
          {scoreAway}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowCenter: {
    width: "100%",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  teamContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoContainer: {
    padding: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  logo: {
    width: 24,
    height: 24,
  },
  team: {
    fontSize: 14,
  },
  score: {
    fontSize: 14,
  },
  time: {
    fontSize: 12,
  },
});
