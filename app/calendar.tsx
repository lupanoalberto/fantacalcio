import React, { useEffect, useState } from "react";
import { ScrollView, View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getMatches } from "../services/footballApi";
import { useTheme } from "./theme";
import Header from "@/components/Header";
import LeagueSelector from "@/components/LeagueSelector";
import MatchCard from "@/components/MatchCard";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CalendarScreen() {
  const { colors, fonts } = useTheme();
  const [matchesByMatchday, setMatchesByMatchday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<number>(1);
  const insets = useSafeAreaInsets();

  const { league } = useLocalSearchParams();

  const selectedLeague = league as string;

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        let matches = await getMatches(selectedLeague);
        if (matches.length > 0) {
          setMatchesByMatchday(matches.slice(day * 10 - 10, day * 10));
        }
      } catch (err) {
        console.error("❌ Errore caricamento calendario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [selectedLeague, day]);

  function renderDayOptions() {
    const options = [];
    for (let i = 1; i <= 38; i++) {
      options.push(
        <Picker.Item
          key={i}
          label={`Giornata ${i}`}
          value={i}
          style={{
            fontFamily: fonts.semibold,
            fontSize: 12,
          }}
        />
      );
    }
    return options;
  }

  const renderMatchdays = () => {
    return (
      <View key={day} style={{ marginTop: 16, marginBottom: 0 }}>
        {/* 🔹 Select per scegliere la giornata */}
        <View
          style={{
            borderRadius: 16,
            marginBottom: 4,
            height: 48,
            justifyContent: "center",
            marginHorizontal: 16,
            paddingHorizontal: 16,
            backgroundColor: colors.secondary,
          }}
        >
          <Picker
            selectedValue={day}
            dropdownIconColor={colors.text}
            onValueChange={(value) => setDay(value)}
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
          >
            {renderDayOptions()}
          </Picker>
        </View>

        {matchesByMatchday.map((match) => {
          const status = match?.status;
          const date = new Date(match?.utcDate);
          let timeLabel = "";

          if (status === "IN_PLAY") {
            timeLabel = "LIVE";
          } else if (status === "PAUSED") {
            timeLabel = "INT.";
          } else if (
            status === "TIMED" ||
            status === "SCHEDULED" ||
            status === "FINISHED"
          ) {
            timeLabel = date.toLocaleString("it-IT", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          }

          let scoreHome = match?.score?.fullTime?.home;
          let scoreAway = match?.score?.fullTime?.away;

          if (scoreHome === null && scoreAway === null) {
            scoreHome = "";
            scoreAway = "";
          }

          const homeLogo =
            match?.homeTeam?.crest ||
            match?.homeTeam?.crestUrl ||
            "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

          const awayLogo =
            match?.awayTeam?.crest ||
            match?.awayTeam?.crestUrl ||
            "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

          return (
            <View
              key={match?.id}
              style={[{ marginBottom: 4, marginHorizontal: 16 }]}
            >
              <MatchCard
                key={`${selectedLeague}-${match?.id}`}
                idx={match?.id}
                homeTeam={match?.homeTeam?.shortName ?? match?.homeTeam?.name}
                awayTeam={match?.awayTeam?.shortName ?? match?.awayTeam?.name}
                scoreHome={scoreHome}
                scoreAway={scoreAway}
                time={timeLabel}
                homeLogo={homeLogo}
                awayLogo={awayLogo}
                matchday={day}
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <Header title="Calendario" showBackArrow={true} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background, }}>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : (
          renderMatchdays()
        )}

        <View style={{ height: insets.bottom + 12, }}></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, },
});