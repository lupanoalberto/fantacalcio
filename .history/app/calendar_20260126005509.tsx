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
} from "react-native";
import { getMatches } from "../services/footballApi";
import { useTheme } from "@/theme";
import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

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
    []
  );

  const openDayModal = () => setIsDayModalOpen(true);
  const closeDayModal = () => setIsDayModalOpen(false);

  const selectDay = (newDay: number) => {
    setDay(newDay);
    closeDayModal();
  };

  const renderMatchdays = () => {
    return (
      <View key={day}>
        {/* 🔹 Trigger popup */}
        <TouchableOpacity
          onPress={openDayModal}
          activeOpacity={0.8}
          style={[
            styles.dayTrigger,
            {
              margin: 16,
              marginBottom: 8,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          >
            Giornata {day}
          </Text>
          <Ionicons name="chevron-down" color={colors.text} size={20} />
        </TouchableOpacity>

        {/* 🔹 Modal selezione giornata */}
        <Modal
          visible={isDayModalOpen}
          transparent
          animationType="fade"
          onRequestClose={closeDayModal}
        >
          {/* Overlay */}
          <Pressable style={styles.overlay} onPress={closeDayModal} />

          {/* Sheet */}
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.bold,
                  fontSize: 18,
                }}
              >
                Seleziona giornata
              </Text>

              <TouchableOpacity onPress={closeDayModal} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
            >
              {matchdays.map((md) => {
                const isActive = md === day;

                return (
                  <TouchableOpacity
                    key={md}
                    onPress={() => selectDay(md)}
                    activeOpacity={0.85}
                    style={[
                      styles.dayRow,
                      {
                        borderColor: colors.secondary ?? "rgba(0,0,0,0.08)",
                        backgroundColor: isActive
                          ? colors.secondary
                          : colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontFamily: isActive ? fonts.semibold : fonts.regular,
                        fontSize: 14,
                      }}
                    >
                      Giornata {md}
                    </Text>

                    {isActive ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.success}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>

        {/* 🔹 Match list */}
        {matchesByMatchday.map((match) => {
          const status = match?.status;
          const date = new Date(match?.utcDate);
          let timeLabel = "";

          if (status === "IN_PLAY") timeLabel = "LIVE";
          else if (status === "PAUSED") timeLabel = "INT.";
          else {
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
              style={{ marginBottom: 4, marginHorizontal: 16 }}
            >
              <TouchableOpacity
                onPress={() => router.push(`../match/${match?.id}` as Href)}
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
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Calendario" showBackArrow={true} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : (
          renderMatchdays()
        )}

        <View style={{ height: insets.bottom + 12 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    alignSelf: "flex-start",
  },
  dayTrigger: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 16,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  dayRow: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
