// app/(tabs)/index.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import Header from "../../components/Header";
import LeagueCard from "../../components/LeagueCard";
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

          {leaguesFanta.map((league) => (
            <LeagueCard
              key={league.id}
              name={league.name}
              teamsCount={league.teamsCount}
              team={league.team}
              onPress={() => Alert.alert("Lega", `Hai aperto ${league.name}`)}
            />
          ))}

          {/* Bottone per aggiungere una nuova lega */}
          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.textSecondary }]}
            activeOpacity={0.8}
            onPress={handleAddLeague}
          >
            <Ionicons name="add" size={20} color={colors.text} />
            <Text style={[styles.addButtonText, { color: colors.text, fontFamily: fonts.medium }]}>
              Aggiungi nuova lega
            </Text>
          </TouchableOpacity>
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
  sectionTitle: { fontSize: 16, marginBottom: 4, },
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
