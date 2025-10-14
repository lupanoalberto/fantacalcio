// components/LiveMatchesSection.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../app/theme";
import LeagueSelector from "./LeagueSelector";
import MatchCard from "./MatchCard";

type LeagueName = "Serie A" | "Premier League" | "LaLiga" | "Bundesliga" | "Ligue 1";

// Aggiungiamo i loghi come campi opzionali
type Match = {
  homeTeam: string;
  awayTeam: string;
  score: string;
  time?: string;
  homeLogo?: string; // NEW
  awayLogo?: string; // NEW
};

export default function LiveMatchesSection() {
  const { colors, fonts } = useTheme();
  const [selectedLeague, setSelectedLeague] = useState<LeagueName>("Serie A");

  const leagues: LeagueName[] = ["Serie A", "Premier League", "LaLiga", "Bundesliga", "Ligue 1"];

  // Usa PNG/JPG (no SVG da web per <Image />)
  const matches: Record<LeagueName, Match[]> = {
    "Serie A": [
      {
        homeTeam: "Juventus",
        awayTeam: "Milan",
        score: "2 - 1",
        time: "78’",
        homeLogo: "https://i.imgur.com/2K7Q3Qk.png", // Esempio PNG
        awayLogo: "https://i.imgur.com/5S1Yq9Z.png", // Esempio PNG
      },
      {
        homeTeam: "Inter",
        awayTeam: "Roma",
        score: "0 - 0",
        time: "65’",
        homeLogo: "https://i.imgur.com/1n8t5Qj.png",
        awayLogo: "https://i.imgur.com/Ym9k3Qn.png",
      },
    ],
    "Premier League": [
      {
        homeTeam: "Chelsea",
        awayTeam: "Arsenal",
        score: "1 - 2",
        time: "90+2’",
        homeLogo: "https://i.imgur.com/gk7n6sE.png",
        awayLogo: "https://i.imgur.com/7Jp0o2s.png",
      },
    ],
    LaLiga: [
      {
        homeTeam: "Barcellona",
        awayTeam: "Real Madrid",
        score: "1 - 3",
        time: "FT",
        homeLogo: "https://i.imgur.com/4qQx3cB.png",
        awayLogo: "https://i.imgur.com/3xw2b9C.png",
      },
    ],
    Bundesliga: [
      {
        homeTeam: "Bayern",
        awayTeam: "Dortmund",
        score: "3 - 2",
        time: "70’",
        homeLogo: "https://i.imgur.com/Q0P8o9Q.png",
        awayLogo: "https://i.imgur.com/9J1w7X2.png",
      },
    ],
    "Ligue 1": [
      {
        homeTeam: "PSG",
        awayTeam: "Marseille",
        score: "2 - 0",
        time: "HT",
        homeLogo: "https://i.imgur.com/2vJ0m9O.png",
        awayLogo: "https://i.imgur.com/2iYJpQy.png",
      },
    ],
  };

  const list = matches[selectedLeague] ?? [];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.medium }]}>
        Partite in live
      </Text>

      <LeagueSelector
        leagues={leagues}
        selectedLeague={selectedLeague}
        onSelect={(league) => setSelectedLeague(league as LeagueName)}
      />

      <View style={styles.matches}>
        {list.map((match, idx) => (
          <MatchCard
            key={`${selectedLeague}-${idx}`}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            score={match.score}
            time={match.time}
            homeLogo={match.homeLogo}
            awayLogo={match.awayLogo}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", marginTop: 40 },
  sectionTitle: { fontSize: 18, marginBottom: 16 },
  matches: { marginTop: 4 },
});
