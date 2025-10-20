import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../app/theme";
import { Colors } from "@/constants/colors";

type MatchCardProps = {
  homeTeam: string;
  awayTeam: string;
  score: string;
  time?: string;
  homeLogo?: string;
  awayLogo?: string;
  homeWin?: string;
  draw?: string;
  awayWin?: string;
};

export default function MatchCard({
  homeTeam,
  awayTeam,
  score,
  time,
  homeLogo,
  awayLogo,
  homeWin,
  draw,
  awayWin,
}: MatchCardProps) {
  const { colors, fonts } = useTheme();

  // 🔹 Determina il colore in base allo stato
  let scoreColor = colors.text;
  let timeColor = colors.textSecondary;

  const normalizedTime = time?.toUpperCase?.() ?? "";

  if (normalizedTime.includes("LIVE") || normalizedTime.includes("HT")) {
    scoreColor = colors.success; // verde per LIVE
    timeColor = colors.success;
  } else if (["POSTPONED", "SUSPENDED", "CANCELLED"].some((w) => normalizedTime.includes(w))) {
    scoreColor = colors.error; // rosso per problemi
    timeColor = colors.warning; // giallo per sospensione
  }

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
          <Text style={[styles.score, { color: scoreColor, fontFamily: fonts.bold }]}>
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
        <Text style={[styles.time, { color: timeColor, fontFamily: fonts.regular }]}>
          {time}
        </Text>
      )}
        <View style={styles.oddsRow}>
          <Text style={[styles.odd, { color: colors.text }]}>{homeWin ?? "-"}</Text>
          <Text style={[styles.odd, { color: colors.text }]}>{draw ?? "-"}</Text>
          <Text style={[styles.odd, { color: colors.text }]}>{awayWin ?? "-"}</Text>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    maxWidth: "30%",
  },
  // ✅ logo sinistra → distanza verso destra
  logoLeft: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginRight: 8,
  },
  // ✅ logo destra → distanza verso sinistra
  logoRight: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginLeft: 8,
  },
  team: {
    fontSize: 13,
    flexShrink: 1,
  },
  scoreContainer: {
    width: "40%",
    alignItems: "center",
  },
  score: {
    fontSize: 18,
  },
  time: {
    marginTop: 4,
    fontSize: 13,
    textAlign: "center",
  },
  oddsRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  marginTop: 8,
},
odd: {
  fontSize: 13,
  textAlign: "center",
paddingVertical: 4,
paddingHorizontal: 8,
borderRadius: 8,
backgroundColor: Colors.secondary,
},
});
