import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { getMatches } from "../services/footballApi";
import { useTheme } from "@/theme";
import MatchCard from "@/components/MatchCard";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { goBack } from "expo-router/build/global-state/routing";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function CalendarScreen() {
  const { colors, fonts } = useTheme();
  const [matchesByMatchday, setMatchesByMatchday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<number>(1);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { league } = useLocalSearchParams();
  const selectedLeague = league as string;

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const matches = await getMatches(selectedLeague);

        // matches potrebbe essere un array o un oggetto; qui assumo array (come nel tuo filter).
        // Se getMatches ritorna { matches: [...] } adatta a: const list = matches.matches;
        const list = await getMatches(selectedLeague);
        setMatchesByMatchday(list.filter((m: any) => m.matchday === day));
      } catch (err) {
        console.error("❌ Errore caricamento calendario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [selectedLeague, day]);

  const matchdays = useMemo(
    () => Array.from({ length: 38 }, (_, i) => i + 1),
    [],
  );

  const openDayModal = () => setIsDayModalOpen(true);
  const closeDayModal = () => setIsDayModalOpen(false);

  const selectDay = (newDay: number) => {
    setDay(newDay);
    closeDayModal();
  };

  const renderMatchdays = () => {
    return (
      <View
        key={day}
        style={{
          paddingHorizontal: 16,
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        {/* 🔹 Match list */}
        <View style={{ flexDirection: "column", width: "100%", gap: 8 }}>
          {matchesByMatchday.map((match) => {
            const status = match?.status;
            const date = new Date(match?.utcDate);
            let timeLabel = "";
            let dayLabel = "";
            let scoreColor = false;

            if (status === "IN_PLAY" || status === "1H" || status === "2H") {
              timeLabel = match?.status.elapsed
                ? `${match.status.elapsed}'`
                : "LIVE";
              scoreColor = true;
            } else if (status === "PAUSED" || status === "HT")
              timeLabel = "INT.";
            else {
              timeLabel = date.toLocaleString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              });
            }

            dayLabel = date.toLocaleString("it-IT", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            });

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
              <View key={match?.id}>
                <TouchableOpacity
                  onPress={() => router.push(`../match/${match?.id}` as Href)}
                >
                  <MatchCard
                    key={`${selectedLeague}-${match?.id}`}
                    idx={match?.id}
                    homeTeam={
                      match?.homeTeam?.shortName ?? match?.homeTeam?.name
                    }
                    awayTeam={
                      match?.awayTeam?.shortName ?? match?.awayTeam?.name
                    }
                    scoreHome={scoreHome}
                    scoreAway={scoreAway}
                    time={timeLabel}
                    homeLogo={homeLogo}
                    awayLogo={awayLogo}
                    day={dayLabel}
                    scoreColor={scoreColor}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: "#0d0d0d",
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View
        style={{
          padding: 8,
          paddingHorizontal: 16,
          paddingTop: 8 + insets.top,
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          height: 64 + insets.top,
        }}
      >
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            color: colors.white,
            fontFamily: fonts.bold,
            fontSize: 16,
            paddingRight: 32,
            textAlign: "center",
          }}
        >
          Calendario
        </Text>
      </View>

      <LinearGradient
        colors={[
          "#0d0d0d",
          colors.background,
          colors.orange,
          colors.background,
        ]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            gap: 24,
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ backgroundColor: colors.opacity, borderBottomWidth: 1,
                    borderColor: colors.opacity, padding: 4, }}>
            {matchdays.map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  {
                    borderRadius: 8,
                    padding: 8,
                    paddingHorizontal: 16,
                    backgroundColor: m === day ? colors.white : "transparent",
                  },
                ]}
                onPress={() => {
                  selectDay(m);
                }}
              >
                <Text
                  style={{
                    color: day === m ? colors.text : colors.text,
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {loading ? (
            <ActivityIndicator size="large" color={colors.green} />
          ) : (
            <>{renderMatchdays()}</>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    paddingHorizontal: 12,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  dayRow: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
