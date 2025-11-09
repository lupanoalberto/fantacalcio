// app/(tabs)/index.tsx
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useTheme } from "../theme";
import Header from "../../components/Header";
import ListLeagues from "@/components/ListLeagues"
import LiveMatchesSection from "@/components/LiveMatchesSection";
import NewsCarousel from "@/components/NewsCarousel";
import LeagueSelector from "@/components/LeagueSelector";
import { useState } from "react";

type LeagueName = "Serie A" | "Premier League" | "LaLiga";

export default function HomeTab() {
  const { colors, fonts } = useTheme();
  const [selectedLeague, setSelectedLeague] = useState<LeagueName>("Serie A");

  const leagues: LeagueName[] = ["Serie A", "Premier League", "LaLiga"];

  // Mock leghe
  const leaguesFanta = [
    { id: 1, name: "Lega Amici del Calcetto", teamsCount: 10, team: "AL LEGRI" },
    { id: 2, name: "Serie Fantacampioni", teamsCount: 8, team: "LO PICCHIO" },
  ];

  const handleAddLeague = () => {
    Alert.alert("Nuova lega", "Funzionalità in arrivo!");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header
        title="Fantacalcio"
        showBackArrow={false}
      />


      {/* CONTENUTO */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View>
          <LeagueSelector
            leagues={leagues}
            selectedLeague={selectedLeague}
            onSelect={(league) => setSelectedLeague(league as LeagueName)}
          />
        </View>

        {/* SEZIONE LEGHE */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
            Le tue leghe
          </Text>

          <ListLeagues></ListLeagues>
        </View>

        <View>
          <LiveMatchesSection selectedLeague={selectedLeague} />
        </View>

        <View>
          <NewsCarousel selectedLeague={selectedLeague} />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 16 },
  section: { width: "100%", padding: 16 },
  sectionTitle: { fontSize: 16, marginBottom: 8, },
  addButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  addButtonText: { fontSize: 12 },
});
