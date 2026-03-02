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
      <View key={day} style={{ width: gap: 12 }}>
        {/* 🔹 Trigger popup */}
        <TouchableOpacity
          onPress={openDayModal}
          style={[
            styles.button,
            {
              width: "auto",
              backgroundColor: colors.text,
            },
          ]}
        >
          <Text
            style={{
              color: colors.background,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
          >
            Giornata {day}
          </Text>
          <Ionicons name="chevron-down" color={colors.background} size={24} />
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
              },
            ]}
          >
            <View
              style={[styles.sheetHeader, { backgroundColor: colors.text }]}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Seleziona giornata
              </Text>

              <TouchableOpacity onPress={closeDayModal} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 480 }}
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
                          : colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontFamily: fonts.regular,
                        fontSize: 10,
                      }}
                    >
                      Giornata {md}
                    </Text>

                    {isActive ? (
                      <Ionicons
                        name="checkmark"
                        size={12}
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
        <View style={{ flexDirection: "column", gap: 6 }}>
          {matchesByMatchday.map((match) => {
            const status = match?.status;
            const date = new Date(match?.utcDate);
            let timeLabel = "";
            let dayLabel = "";

            if (status === "IN_PLAY" || status === "1H" || status === "2H")
              timeLabel = "LIVE";
            else if (status === "PAUSED" || status === "HT") timeLabel = "INT.";
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
              <View key={match?.id} style={{ paddingHorizontal: 12 }}>
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
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 24, paddingVertical: 12 }}
      >
        <View
          style={{
            width: "100%",
            flex: 1,
            flexDirection: "row",
            paddingHorizontal: 12,
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.text,
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={colors.background}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.green} />
        ) : (
          <View style={styles.section}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontFamily: fonts.bold,
              }}
            >
              Calendario
            </Text>
            {renderMatchdays()}
          </View>
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
    gap: 6,
    padding: 12,
    borderRadius: 24,
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
    paddingBottom: 0,
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
