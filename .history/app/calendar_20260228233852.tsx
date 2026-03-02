import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
} from "react-native";
import { getMatches } from "../services/footballApi";
import { useTheme } from "@/theme";
import MatchCard from "@/components/MatchCard";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { goBack } from "expo-router/build/global-state/routing";

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ borderWidth: 1, borderColor: colors.opacity, borderRadius: 24, }}
        >
          {matchdays.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.button,
                { borderRightWidth: 1, borderColor: colors.opacity },
              ]}
              onPress={() => {
                selectDay(m);
              }}
            >
              <Text
                style={{
                  color: day === m ? colors.green : colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                GG {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          padding: 12,
          paddingTop: 12 + insets.top,
          backgroundColor: colors.opacity,
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          minHeight: 64 + insets.top,
        }}
      >
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            paddingRight: 36,
          }}
        >
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              color: colors.white,
              fontFamily: fonts.bold,
              fontSize: 16,
              paddingRight: 36,
            }}
            numberOfLines={1}
          >
            Calendario
          </Text>
        </View>
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 24, paddingVertical: 24 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.green} />
        ) : (
          <>{renderMatchdays()}</>
        )}
      </ScrollView>
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
