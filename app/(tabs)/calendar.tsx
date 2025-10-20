import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native";
import { getMatches } from "../../services/footballApi";
import { useTheme } from "../theme";
import Header from "@/components/Header";
import { router } from "expo-router";

const LEAGUES = ["Serie A", "Premier League", "LaLiga"];

export default function CalendarScreen() {
  const { colors, fonts } = useTheme();
  const [selectedLeague, setSelectedLeague] = useState("Serie A");
  const [matchesByMatchday, setMatchesByMatchday] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);

  // 🔹 Carica le partite ogni volta che cambia il campionato
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const matches = await getMatches(selectedLeague);

        // Raggruppa le partite per giornata
        const grouped: Record<number, any[]> = {};
        matches.forEach((m: any) => {

          const day = m.matchday ?? 0;
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push(m);
        });

        setMatchesByMatchday(grouped);
      } catch (err) {
        console.error("❌ Errore caricamento calendario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [selectedLeague]);


  // 🔹 Componenti UI
  const renderLeagueSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 8, marginHorizontal: 16, }}
      contentContainerStyle={styles.content}>

      {LEAGUES.map((league) => {
        const active = league === selectedLeague;
        return (
          <TouchableOpacity
            key={league}
            onPress={() => setSelectedLeague(league)}
            style={{
              backgroundColor: active ? colors.success : colors.secondary,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 24,
            }}
          >
            <Text
              style={{
                color: active ? colors.background : colors.text,
                fontFamily: fonts.medium,
                fontSize: 13,
              }}
            >
              {league}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderMatch = (m: any) => (
    <TouchableOpacity
      key={m.id}
      onPress={() => router.push(`../match/${m.id}`)}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.secondary,
        padding: 16,
        flex: 1, flexDirection: "column", gap: 8,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
        {new Date(m.utcDate).toLocaleDateString("it-IT", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>

      {/* Riga centrale con squadre e risultato */}
      <View style={styles.row}>
        <Image source={{ uri: m.homeTeam.crest }} style={styles.logo} />
        <Text style={{ color: colors.text, fontFamily: fonts.medium, fontSize: 18 }}>
          {m.homeTeam.name}
        </Text>
        <Text style={{ color: colors.text, fontSize: 18, marginLeft: "auto", }}>
          {m.score.fullTime.home}
        </Text>
      </View>
      <View style={styles.row}>
        <Image source={{ uri: m.awayTeam.crest }} style={styles.logo} />
        <Text style={{ color: colors.text, fontFamily: fonts.medium, fontSize: 18 }}>
          {m.awayTeam.name}
        </Text>
        <Text style={{ color: colors.text, fontSize: 18, marginLeft: "auto", }}>
          {m.score.fullTime.away}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMatchdays = () => {
    const days = Object.keys(matchesByMatchday)
      .map((n) => parseInt(n))
      .sort((a, b) => b - a);

    return days.map((day) => (
      <View key={day} style={{ marginBottom: 24 }}>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.bold,
            fontSize: 18,
            padding: 16,
            paddingBottom: 0,
          }}
        >
          Giornata {day}
        </Text>
        {matchesByMatchday[day]
          .sort(
            (a, b) =>
              new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()
          )
          .map(renderMatch)}
      </View>
    ));
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background, }}
    >
      {/* HEADER */}
      <Header
        title="Fantacalcio"
        showBackArrow={false}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background, }}
      >

        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.bold,
            fontSize: 26,
            marginTop: 24,
            marginHorizontal: 16,
          }}
        >
          Calendario
        </Text>

        {renderLeagueSelector()}

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : (
          renderMatchdays()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 16,
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
});