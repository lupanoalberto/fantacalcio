import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { teamToCode3 } from "@/utils/teamCodeName";

type MatchCardProps = {
  idx: string;
  homeTeam: string;
  awayTeam: string;
  scoreHome: string;
  scoreAway: string;
  time?: string;
  homeLogo?: string;
  awayLogo?: string;
  day?: string;
  codeFlag?: boolean;
};

export default function MatchCard({
  idx,
  homeTeam,
  awayTeam,
  scoreHome,
  scoreAway,
  day,
  time,
  homeLogo,
  awayLogo,
  codeFlag = true,
}: MatchCardProps) {
  const { colors, fonts } = useTheme();

  // 🔹 Determina il colore in base allo stato
  let scoreColor = colors.text;
  let timeColor = colors.textSecondary;

  const teamHomeCode = teamToCode3(homeTeam);
  const teamAwayCode = teamToCode3(awayTeam);

  const normalizedTime = time?.toUpperCase?.() ?? "";

  if (normalizedTime.includes("LIVE") || normalizedTime.includes("INT.")) {
    scoreColor = colors.success; // verde per LIVE
    timeColor = colors.success;
  } else if (
    ["POSTPONED", "SUSPENDED", "CANCELLED"].some((w) =>
      normalizedTime.includes(w),
    )
  ) {
    scoreColor = colors.error; // rosso per problemi
    timeColor = colors.error; // giallo per sospensione
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={styles.logoContainer}>
          {homeLogo && (
            <Image
              source={{ uri: homeLogo }}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
        </View>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 14,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {codeFlag ? teamHomeCode : homeTeam}
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
            fontSize: 10,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {day}
        </Text>
        <Text
          style={{
            color: scoreColor,
            fontFamily: fonts.bold,
            fontSize: 20,
          }}
        >
          {scoreHome} - {scoreAway}
        </Text>
        <Text
          style={{
            color: timeColor,
            fontFamily: fonts.regular,
            fontSize: 10,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {time}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          flexDirection: "row-reverse",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={styles.logoContainer}>
          {awayLogo && (
            <Image
              source={{ uri: awayLogo }}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
        </View>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 14,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {codeFlag ? teamAwayCode : awayTeam}
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
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  column: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoContainer: {
    borderRadius: 8,
    padding: 8,
    backgroundColor: Colors.secondary,
  },
  logo: {
    width: 32,
    height: 32,
  },
});
