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

  const date = new Date(fixture?.utcDate);
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
            backgroundColor: colors.text,
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
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
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
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.bold, marginTop: 16 },
          ]}
        >
          Risultato
        </Text>

        <View style={{ marginBottom: 16 }}>
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

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.bold },
          ]}
        >
          Dettagli partita
        </Text>

        {/* TAB */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                borderColor: isActive === 0 ? colors.success : colors.secondary,
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
                borderColor: isActive === 1 ? colors.success : colors.secondary,
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
        </View>

        {/* CONTENT */}
        {isActive === 0 ? (
          eventsLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.success}
              style={{ marginTop: 6 }}
            />
          ) : events.length === 0 ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginBottom: 24,
              }}
            >
              Nessun evento disponibile.
            </Text>
          ) : (
            events.map((e: any, i: number) => (
              <View
                key={i}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.secondary,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    fontFamily: fonts.semibold,
                  }}
                >
                  {e.time?.elapsed ?? "—"} • {e.team?.name ?? "—"}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {e.type ?? "Evento"}
                  {e.detail ? ` — ${e.detail}` : ""}
                  {e.player?.name ? ` • ${e.player.name}` : ""}
                </Text>
              </View>
            ))
          )
        ) : lineupsLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.success}
            style={{ marginTop: 6 }}
          />
        ) : lineups.length === 0 ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              marginBottom: 24,
            }}
          >
            Formazioni non disponibili.
          </Text>
        ) : (
          lineups.map((l: any, idx: number) => (
            <View key={idx} style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.bold,
                  fontSize: 14,
                }}
              >
                {l.team?.name ?? "Squadra"}
              </Text>

              {/* TitolarI (se presenti) */}
              {Array.isArray(l.startXI) && l.startXI.length > 0 ? (
                <View style={{ marginTop: 8 }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontFamily: fonts.regular,
                      fontSize: 12,
                    }}
                  >
                    Titolari
                  </Text>
                  {l.startXI.map((p: any, j: number) => (
                    <Text
                      key={j}
                      style={{
                        color: colors.text,
                        fontFamily: fonts.regular,
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      {p.player?.number ? `${p.player.number}. ` : ""}
                      {p.player?.name ?? "—"}
                    </Text>
                  ))}
                </View>
              ) : null}

              {/* Panchina (se presenti) */}
              {Array.isArray(l.substitutes) && l.substitutes.length > 0 ? (
                <View style={{ marginTop: 10 }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontFamily: fonts.regular,
                      fontSize: 12,
                    }}
                  >
                    Panchina
                  </Text>
                  {l.substitutes.map((p: any, j: number) => (
                    <Text
                      key={j}
                      style={{
                        color: colors.text,
                        fontFamily: fonts.regular,
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      {p.player?.number ? `${p.player.number}. ` : ""}
                      {p.player?.name ?? "—"}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        )}

        <View style={{ height: 16 }} />
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
  tabBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 40,
  },
  logoContainer: {
    width: 84,
    height: 84,
    },
    logo: {
      width: 72,
      height: 72,
    },
});
