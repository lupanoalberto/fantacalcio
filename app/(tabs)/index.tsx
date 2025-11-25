// app/(tabs)/index.tsx
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useTheme } from "../theme";
import Header from "../../components/Header";
import ListLeagues from "@/components/ListLeagues";
import LiveMatchesSection from "@/components/LiveMatchesSection";
import NewsCarousel from "@/components/NewsCarousel";
import LeagueSelector from "@/components/LeagueSelector";
import { useState } from "react";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";

type LeagueName = "Serie A" | "Premier League" | "LaLiga";

export default function HomeTab() {
  const { colors, fonts } = useTheme();
  const [selectedLeague, setSelectedLeague] = useState<LeagueName>("Serie A");

  const leagues: LeagueName[] = ["Serie A", "Premier League", "LaLiga"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title="Fantacalcio" showBackArrow={false} />

      {/* CONTENUTO */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <LeagueSelector
            leagues={leagues}
            selectedLeague={selectedLeague}
            onSelect={(league) => setSelectedLeague(league as LeagueName)}
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <LiveMatchesSection selectedLeague={selectedLeague} />
        </View>

        <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          >
            Consigli per l&apos;asta
          </Text>

          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: colors.primary,
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: colors.secondary,
              }}
            >
              <Ionicons name="football-outline" size={18} color={colors.text} />
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Giocatori
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: colors.secondary,
              }}
            >
              <Ionicons name="book-outline" size={18} color={colors.text} />
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Consigli
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: colors.secondary,
              }}
            >
              <FontAwesome5 name="clipboard-list" size={18} color={colors.text} />
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Tattiche
              </Text>
            </View>
          </View>
        </View>

        {/* SEZIONE LEGHE */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          >
            Le tue leghe
          </Text>

          <ListLeagues></ListLeagues>
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
  section: { width: "100%", paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
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
