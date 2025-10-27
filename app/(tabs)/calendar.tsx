import React, { useEffect, useState } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getMatches } from "../../services/footballApi";
import { useTheme } from "../theme";
import Header from "@/components/Header";
import LeagueSelector from "@/components/LeagueSelector";
import MatchCard from "@/components/MatchCard";

type LeagueName = "Serie A" | "Premier League" | "LaLiga";

export default function CalendarScreen() {
  const { colors, fonts } = useTheme();
  const [selectedLeague, setSelectedLeague] = useState<LeagueName>("Serie A");
  const leagues: LeagueName[] = ["Serie A", "Premier League", "LaLiga"];
  const [matchesByMatchday, setMatchesByMatchday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<number>(1);

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
        <Picker.Item key={i} label={`Giornata ${i}`} value={i} />
      );
    }
    return options;
  }

  const renderMatchdays = () => {
    return (
      <View key={day} style={{ marginBottom: 0 }}>
        {/* 🔹 Select per scegliere la giornata */}
        <View
          style={{
            borderRadius: 8,
            marginBottom: 16,
            marginHorizontal: 16,
            height: 64,
            paddingHorizontal: 8,
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: colors.secondary,
          }}
        >
          <Picker
            selectedValue={day}
            dropdownIconColor={colors.text}
            onValueChange={(value) => setDay(value)}
            style={{
              color: colors.text,
              fontFamily: fonts.medium,
              fontSize: 12,
              width: "100%",
              height: "100%",
            }}
          >
            {renderDayOptions()}
          </Picker>
        </View>

        {matchesByMatchday.map((match, idx) => {
          const status = match?.status;
          const date = new Date(match?.utcDate);
          let timeLabel = "";

          if (status === "IN_PLAY") {
            timeLabel = "LIVE";
          }
          else if (status === "PAUSED") {
            timeLabel = "INT.";
          }
          else if (status === "TIMED" || status === "SCHEDULED" || status === "FINISHED") {
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
            scoreHome = "-";
            scoreAway = "-";
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
            <View key={idx} style={[{ marginBottom: 16, marginHorizontal: 16, }]}>
              <MatchCard
                key={`${selectedLeague}-${match?.id ?? idx}`}
                homeTeam={match?.homeTeam?.name ?? "—"}
                awayTeam={match?.awayTeam?.name ?? "—"}
                scoreHome={scoreHome}
                scoreAway={scoreAway}
                time={timeLabel}
                homeLogo={homeLogo}
                awayLogo={awayLogo}
              />
            </View>
          );
        })
        }
      </View>
    )
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

        <View style={[{ paddingTop: 8, paddingBottom: 16, }]}>
          <LeagueSelector
            leagues={leagues}
            selectedLeague={selectedLeague}
            onSelect={(league) => setSelectedLeague(league as LeagueName)}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : (
          renderMatchdays()
        )}

      </ScrollView>
    </View>
  );
}