import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../app/theme";

type MatchCardProps = {
  homeTeam: string;
  awayTeam: string;
  score: string;
  time?: string;
  homeLogo?: string;
  awayLogo?: string;
};

export default function MatchCard({
  homeTeam,
  awayTeam,
  score,
  time,
  homeLogo,
  awayLogo,
}: MatchCardProps) {
  const { colors, fonts } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      {/* Riga centrale con squadre e risultato */}
      <View style={styles.row}>
        {/* Squadra di casa */}
        <View style={[styles.teamContainer, { justifyContent: "flex-start" }]}>
          {homeLogo && <Image source={{ uri: homeLogo }} style={styles.logoLeft} />}
          <Text
            style={[styles.team, { color: colors.text, fontFamily: fonts.medium }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {homeTeam}
          </Text>
        </View>

        {/* Risultato */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: colors.success, fontFamily: fonts.bold }]}>
            {score}
          </Text>
        </View>

        {/* Squadra ospite */}
        <View style={[styles.teamContainer, { justifyContent: "flex-end" }]}>
          <Text
            style={[
              styles.team,
              { color: colors.text, fontFamily: fonts.medium, textAlign: "right" },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {awayTeam}
          </Text>
          {awayLogo && <Image source={{ uri: awayLogo }} style={styles.logoRight} />}
        </View>
      </View>

      {/* Orario o stato match */}
      {time && (
        <Text style={[styles.time, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
          {time}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "40%",
  },
  // ✅ logo sinistra → distanza verso destra
  logoLeft: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 10,
  },
  // ✅ logo destra → distanza verso sinistra
  logoRight: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginLeft: 10,
  },
  team: {
    fontSize: 14,
    flexShrink: 1,
  },
  scoreContainer: {
    width: 60,
    alignItems: "center",
  },
  score: {
    fontSize: 16,
  },
  time: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
});
