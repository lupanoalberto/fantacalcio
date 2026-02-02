import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  getMatchDetails,
  getFixtureEvents,
  getFixtureLineups,
  roundToMatchday,
} from "../../services/footballApi";
import { useTheme } from "@/theme";
import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import EventIcon from "@/components/EventIcon";

function formatStatusLabel(statusShort?: string, utcDate?: string) {
  const date = utcDate ? new Date(utcDate) : null;

  // API-FOOTBALL status.short tipici: 1H, 2H, HT, FT, NS, PST, etc.
  if (statusShort === "1H" || statusShort === "2H" || statusShort === "ET")
    return "LIVE";
  if (statusShort === "HT") return "INT.";

  if (!date || Number.isNaN(date.getTime())) return statusShort ?? "—";

  return date.toLocaleString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatchDetails() {
  const { id } = useLocalSearchParams();
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fixtureId = Number(id);

  const [details, setDetails] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [lineupsLoading, setLineupsLoading] = useState(false);

  const [isActive, setIsActive] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // ✅ null-safe memo
  const fixture = useMemo(() => details?.fixture ?? null, [details]);
  const teams = useMemo(() => details?.teams ?? null, [details]);
  const goals = useMemo(() => details?.goals ?? null, [details]);
  const league = useMemo(() => details?.league ?? null, [details]);

  // -------------------------
  // 1) Load match details
  // -------------------------
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setDetails(null);
        setEvents([]);
        setLineups([]);

        if (!Number.isFinite(fixtureId)) {
          setError("ID match non valido.");
          return;
        }

        const data = await getMatchDetails(fixtureId);

        // getMatchDetails (API-FOOTBALL) potrebbe tornare null
        if (!data) {
          setError("Dettagli partita non disponibili (API).");
          return;
        }

        setDetails(data);
      } catch (err: any) {
        console.error("❌ Errore caricamento dettagli partita:", err);
        setError(err?.message ?? "Errore caricamento dettagli partita");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [fixtureId]);

  // -------------------------
  // 2) Load events (tab 0)
  // -------------------------
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        const list = await getFixtureEvents(fixtureId);
        setEvents(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error("❌ Errore eventi:", e);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    if (!Number.isFinite(fixtureId)) return;
    if (loading) return;
    if (error) return;

    // carica solo quando apro tab eventi
    if (isActive === 0) loadEvents();
  }, [fixtureId, isActive, loading, error]);

  // -------------------------
  // 3) Load lineups (tab 1)
  // -------------------------
  useEffect(() => {
    const loadLineups = async () => {
      try {
        setLineupsLoading(true);
        const list = await getFixtureLineups(fixtureId);
        setLineups(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error("❌ Errore formazioni:", e);
        setLineups([]);
      } finally {
        setLineupsLoading(false);
      }
    };

    if (!Number.isFinite(fixtureId)) return;
    if (loading) return;
    if (error) return;

    // carica solo quando apro tab formazioni
    if (isActive === 1) loadLineups();
  }, [fixtureId, isActive, loading, error]);

  // ✅ Early returns dopo hooks
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.success} />
      </View>
    );
  }

  if (error || !details || !fixture || !teams) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16 }}>
          <Text
            style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}
          >
            {error ?? "Impossibile caricare i dettagli della partita."}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 13,
              marginTop: 8,
            }}
          >
            ID: {String(id)}
          </Text>
        </View>
      </View>
    );
  }

  const date = new Date(fixture?.date);
  const status = fixture?.status;
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

    dayLabel = date.toLocaleString("it-IT", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  }

  const homeTeamId = teams.home.id;

  const homeTeam = teams.home;
  const awayTeam = teams.away;

  const scoreHome = goals?.home ?? "-";
  const scoreAway = goals?.away ?? "-";

  const homeLogo =
    homeTeam?.logo ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  const awayLogo =
    awayTeam?.logo ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ gap: 24 }}>
        <View
          style={{
            width: "100%",
            flex: 1,
            paddingTop: insets.top,
            backgroundColor: colors.secondary,
            justifyContent: "center",
            alignItems: "center",
            height: 252,
            position: "relative",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/"); // fallback alla home
            }}
            style={{ position: "absolute", top: insets.top + 12, left: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
            }}
          >
            <View style={styles.logoContainer}>
              {homeLogo && (
                <Image
                  source={{ uri: homeLogo }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}
            </View>
            <View style={styles.logoContainer}>
              {awayLogo && (
                <Image
                  source={{ uri: awayLogo }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </View>

        <View
          style={{ gap: 12, flexDirection: "column", paddingHorizontal: 12 }}
        >
          <Text
            style={[
              { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
            ]}
          >
            Risultato
          </Text>

          <View>
            <MatchCard
              idx={fixture?.id ?? fixtureId}
              homeTeam={homeTeam?.name ?? "—"}
              awayTeam={awayTeam?.name ?? "—"}
              scoreHome={scoreHome}
              scoreAway={scoreAway}
              time={timeLabel}
              homeLogo={homeLogo}
              awayLogo={awayLogo}
              day={dayLabel}
            />
          </View>
        </View>

        <View style={{ gap: 12, flexDirection: "column" }}>
          <Text
            style={[
              {
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 14,
                paddingLeft: 12,
              },
            ]}
          >
            Dettagli partita
          </Text>

          {/* TAB */}
          <ScrollView
            style={styles.containerScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 12 }}
          >
            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  borderColor:
                    isActive === 0 ? colors.success : colors.secondary,
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setIsActive(0)}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  color: isActive === 0 ? colors.success : colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Eventi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  borderColor:
                    isActive === 1 ? colors.success : colors.secondary,
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setIsActive(1)}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  color: isActive === 1 ? colors.success : colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Formazioni
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={{ flexDirection: isActive === 0 ? "column" : "row" }}>
            {isActive === 0 ? (
              eventsLoading ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : events.length === 0 ? (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                  }}
                >
                  Nessun evento disponibile.
                </Text>
              ) : (
                events.map((e: any, i: number) => {
                  const isHomeEvent = e?.team?.id === homeTeamId;
                  let isSub = false;

                  if (e?.type === "subst") isSub = true;

                  return (
                    <View
                      key={i}
                      style={{
                        flexDirection: isHomeEvent ? "row" : "row-reverse",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        padding: 12,
                        borderBottomWidth: 1,
                        borderColor: colors.secondary,
                        gap: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          fontFamily: fonts.regular,
                        }}
                      >
                        {`${e.time?.elapsed ?? "—"}'`}
                      </Text>
                      <EventIcon type={e.type} detail={e.detail} size={24} />
                      <Text
                        style={{
                          color: isSub ? colors.textSecondary : colors.text,
                          fontSize: 12,
                          fontFamily: fonts.regular,
                        }}
                      >
                        {e.player.name}
                      </Text>
                      <Text
                        style={{
                          color: isSub ? colors.text : colors.textSecondary,
                          fontSize: 12,
                          fontFamily: fonts.regular,
                        }}
                      >
                        {e.assist?.name ? `(${e.assist.name})` : ""}
                      </Text>
                    </View>
                  );
                })
              )
            ) : lineupsLoading ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : lineups.length === 0 ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                }}
              >
                Formazioni non disponibili.
              </Text>
            ) : (
              lineups.map((l: any, idx: number) => {
                const isHome = idx;
                  return ();
})
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 16, marginBottom: 4, alignSelf: "flex-start" },
  containerScroll: {
    width: "100%",
  },
  tabBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 40,
  },
  logoContainer: {
    width: 84,
    height: 84,
  },
  logo: {
    width: 84,
    height: 84,
  },
});
