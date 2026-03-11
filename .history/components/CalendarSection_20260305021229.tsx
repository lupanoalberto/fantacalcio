// components/LiveMatchesSection.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTheme } from "@/theme";
import MatchCard from "./MatchCard";
import { getLiveOrUpcomingMatches, getMatches } from "../services/footballApi";
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  selectedLeague: string;
};

export default function CalendarSection({ selectedLeague }: Props) {
  const { colors, fonts } = useTheme();
  const [matchesByMatchday, setMatchesByMatchday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<number>(1);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const router = useRouter();

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
        style={{ flexDirection: "column", width: "100%", gap: 6, paddingHorizontal: 12, }}
      >
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
          } else if (status === "PAUSED" || status === "HT") timeLabel = "INT.";
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
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.opacity,
                }}
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
                  day={dayLabel}
                  scoreColor={scoreColor}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.section}>
        <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "center", gap: 12, paddingHorizontal: 12, }}>
            <Ionicons name="calendar-outline" size={36} color={colors.text} />
      <Text
        style={{
          color: colors.text,
          fontSize: 16,
          fontFamily: fonts.bold,
        }}
      >
        Calendario
      </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          backgroundColor: colors.card,
          padding: 12,
          gap: 6,
        }}
      >
        {matchdays.map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              {
                minWidth: 36,
                borderRadius: 12,
                padding: 6,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: m === day ? colors.primary : "transparent",
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
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>{renderMatchdays()}</>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    paddingVertical: 12,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 12,
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
