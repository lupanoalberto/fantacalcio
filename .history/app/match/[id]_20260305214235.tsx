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
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { convertRatingToBaseVote } from "@/utils/convertRating";
import {
  getMatchDetails,
  getFixtureEvents,
  getFixtureLineups,
  // ✅ AGGIUNGI questa funzione nel tuo footballApi (vedi nota sotto)
  getFixturePlayersStats,
  roundToMatchday,
} from "../../services/footballApi";

import { useTheme } from "@/theme";
import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import EventIcon from "@/components/EventIcon";
import { goBack } from "expo-router/build/global-state/routing";
import { LinearGradient } from "expo-linear-gradient";

function formatStatusLabel(statusShort?: string, utcDate?: string) {
  const date = utcDate ? new Date(utcDate) : null;

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

type PlayerEventChip = { type: string; detail?: string; count: number };

export default function MatchDetails() {
  const { id } = useLocalSearchParams();
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fixtureId = Number(id);

  const [details, setDetails] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any[]>([]);

  // ✅ stats giocatori (per voto/rating)
  const [playersStats, setPlayersStats] = useState<any[]>([]);
  const [playersStatsLoading, setPlayersStatsLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [lineupsLoading, setLineupsLoading] = useState(false);

  const [isActive, setIsActive] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

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
        setPlayersStats([]);

        if (!Number.isFinite(fixtureId)) {
          setError("ID match non valido.");
          return;
        }

        const data = await getMatchDetails(fixtureId);

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

    if (isActive === 1) loadLineups();
  }, [fixtureId, isActive, loading, error]);

  // -------------------------
  // 4) Load players stats (tab 1) -> per VOTO
  // -------------------------
  useEffect(() => {
    const loadPlayersStats = async () => {
      try {
        setPlayersStatsLoading(true);
        const list = await getFixturePlayersStats(fixtureId);
        setPlayersStats(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error("❌ Errore players stats:", e);
        setPlayersStats([]);
      } finally {
        setPlayersStatsLoading(false);
      }
    };

    if (!Number.isFinite(fixtureId)) return;
    if (loading) return;
    if (error) return;

    // carica solo quando apro tab formazioni
    if (isActive === 1) loadPlayersStats();
  }, [fixtureId, isActive, loading, error]);

  const date = new Date(fixture?.date);
  const status = fixture?.status.short;
  let timeLabel = "";
  let dayLabel = "";
  let scoreColor = false;

  if (status === "IN_PLAY" || status === "1H" || status === "2H") {
    timeLabel = fixture?.status.elapsed ? `${fixture.status.elapsed}'` : "LIVE";
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

  const homeTeamId = teams?.home?.id ?? null;

  const homeTeam = teams?.home;
  const awayTeam = teams?.away;

  const scoreHome = goals?.home ?? "-";
  const scoreAway = goals?.away ?? "-";

  const homeLogo =
    homeTeam?.logo ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  const awayLogo =
    awayTeam?.logo ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  const goToPlayer;

  /**
   * ✅ Mappa voto/rating per playerId:
   * API-Football fixtures/players di solito ritorna:
   * [{ team: {...}, players: [{ player: {id}, statistics:[{ games:{ rating:"6.7" } ...}] }]}]
   */
  const ratingByPlayerId = useMemo(() => {
    const map = new Map<number, number>();

    for (const teamBlock of playersStats ?? []) {
      const players = teamBlock?.players;
      if (!Array.isArray(players)) continue;

      for (const row of players) {
        const pid = Number(row?.player?.id);
        if (!Number.isFinite(pid)) continue;

        const stats0 = Array.isArray(row?.statistics)
          ? row.statistics[0]
          : null;
        const raw = stats0?.games?.rating; // spesso string "6.7"
        const val = raw == null ? NaN : Number(raw);

        if (Number.isFinite(val)) map.set(pid, val);
      }
    }
    return map;
  }, [playersStats]);

  const getVoteStyle = (vote?: number) => {
    // fallback neutro
    if (!Number.isFinite(vote as number)) {
      return { backgroundColor: colors.opacity, color: colors.text };
    }

    const v = vote as number;

    // soglie semplici (puoi tararle):
    if (v >= 6.5)
      return { backgroundColor: colors.primary, color: colors.background };
    else return { backgroundColor: colors.opacity, color: colors.text };
  };

  // ✅ Early returns dopo hooks
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !details || !fixture || !teams) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 12 }}>
          <Text
            style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}
          >
            {error ?? "Impossibile caricare i dettagli della partita."}
          </Text>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.regular,
              fontSize: 12,
              marginTop: 12,
            }}
          >
            ID: {String(id)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View
        style={{
          padding: 12,
          paddingHorizontal: 12,
          paddingTop: 12 + insets.top,
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            paddingRight: 24,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              padding: 6,
              backgroundColor: colors.text,
              borderRadius: 12,
            }}
          >
            <Image
              source={{ uri: homeLogo }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
          <View
            style={{
              width: 72,
              height: 72,
              padding: 6,
              backgroundColor: colors.text,
              borderRadius: 12,
            }}
          >
            <Image
              source={{ uri: awayLogo }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
            scoreColor={scoreColor}
          />
        </View>

        <View style={styles.section}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.bold,
              fontSize: 16,
              padding: 12,
            }}
          >
            Dettagli partita
          </Text>

          {/* TAB */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 12,
              padding: 12,
              backgroundColor: colors.card,
              flex: 1,
              borderBottomWidth: 1,
              borderBottomColor: colors.opacity
            }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor:
                    isActive === 0 ? colors.primary : colors.opacity,
                },
              ]}
              onPress={() => setIsActive(0)}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                }}
              >
                Eventi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor:
                    isActive === 1 ? colors.primary : colors.opacity,
                },
              ]}
              onPress={() => setIsActive(1)}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                }}
              >
                Formazioni
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View
            style={{
              flexDirection: isActive === 0 ? "column" : "row",
              backgroundColor: colors.card,
              gap: isActive === 0 ? 12 : 0,
              paddingVertical: 12,
            }}
          >
            {isActive === 0 ? (
              eventsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : events.length === 0 ? (
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    padding: 12,
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
                        paddingHorizontal: 12,
                        gap: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 12,
                          fontFamily: fonts.regular,
                        }}
                      >
                        {`${e.time?.elapsed ?? "—"}'`}
                      </Text>
                      <EventIcon type={e.type} detail={e.detail} size={24} />
                      <TouchableOpacity
                        onPress={() =>
                          router.push(`/player/${String(e.player.id)}` as Href)
                        }
                      >
                        <Text
                          style={{
                            color: isSub ? colors.text : colors.text,
                            fontSize: 12,
                            fontFamily: fonts.regular,
                          }}
                        >
                          {e.player.name}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={gotToPlayer)
                        }
                      >
                        <Text
                          style={{
                            color: isSub ? colors.text : colors.text,
                            fontSize: 12,
                            fontFamily: fonts.regular,
                          }}
                        >
                          {e.assist?.name ? `(${e.assist.name})` : ""}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )
            ) : lineupsLoading || playersStatsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : lineups.length === 0 ? (
              <Text
                style={{
                  color: colors.text,
                  fontSize: 12,
                  padding: 12,
                }}
              >
                Formazioni non disponibili.
              </Text>
            ) : (
              lineups.map((l: any, idx: number) => {
                const isHome = idx; // 0 home, 1 away (come già usi tu)
                return (
                  <View
                    key={idx}
                    style={{ width: "50%", flexDirection: "column", }}
                  >
                    {/* TitolarI (se presenti) */}
                    {Array.isArray(l.startXI) && l.startXI.length > 0 ? (
                      <View
                        style={{
                          width: "100%",
                          flexDirection: "column",
                          gap: 12,
                          paddingBottom: 12,
                          borderBottomWidth: 1,
                          borderColor: colors.opacity
                        }}
                      >
                        {l.startXI.map((p: any, j: number) => {
                          const pid = Number(p?.player?.id);
                          const vote = convertRatingToBaseVote(
                            Number(ratingByPlayerId.get(pid)),
                          );
                          const voteUI = getVoteStyle(vote as number);

                          return (
                            <TouchableOpacity
                              key={j}
                              style={{
                                flexDirection: isHome ? "row-reverse" : "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                paddingHorizontal: 12,
                                gap: 12,
                              }}
                              onPress={() =>
                                router.push(
                                  `/player/${String(p.player.id)}` as Href,
                                )
                              }
                            >
                              <Text
                                style={{
                                  flex: 1,
                                  color: colors.text,
                                  fontSize: 12,
                                  fontFamily: fonts.regular,
                                  textAlign: isHome === 0 ? "left" : "right",
                                }}
                                numberOfLines={1}
                              >
                                {p.player?.name ?? "—"}
                              </Text>

                              {/* ✅ VOTO DEL GIOCATORE + colore per qualità */}
                              <View
                                style={{
                                  padding: 6,
                                  borderRadius: 12,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: voteUI.backgroundColor,
                                }}
                              >
                                <Text
                                  style={{
                                    color: colors.text,
                                    fontSize: 10,
                                    fontFamily: fonts.bold,
                                  }}
                                >
                                  {Number.isFinite(vote as number)
                                    ? (vote as number).toFixed(1)
                                    : "—"}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}

                    {/* Panchina (se presenti) */}
                    {Array.isArray(l.substitutes) &&
                    l.substitutes.length > 0 ? (
                      <View
                        style={{
                          width: "100%",
                          flexDirection: "column",
                          gap: 12,
                          paddingTop: 12,
                        }}
                      >
                        {l.substitutes.map((p: any, j: number) => {
                          const pid = Number(p?.player?.id);
                          const vote = convertRatingToBaseVote(
                            Number(ratingByPlayerId.get(pid)),
                          );
                          const voteUI = getVoteStyle(Number(vote));

                          return (
                            <TouchableOpacity
                              onPress={() =>
                                router.push(
                                  `/player/${String(p.player.id)}` as Href,
                                )
                              }
                              key={j}
                              style={{
                                width: "100%",
                                flexDirection: isHome ? "row-reverse" : "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                paddingHorizontal: 12,
                                gap: 12,
                              }}
                            >
                              <Text
                                style={{
                                  flex: 1,
                                  color: colors.text,
                                  fontSize: 12,
                                  fontFamily: fonts.regular,
                                  textAlign: isHome === 0 ? "left" : "right",
                                }}
                                numberOfLines={1}
                              >
                                {p.player?.name ?? "—"}
                              </Text>

                              {/* ✅ VOTO DEL GIOCATORE + colore per qualità */}
                              <View
                                style={{
                                  padding: 6,
                                  borderRadius: 12,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: voteUI.backgroundColor,
                                }}
                              >
                                <Text
                                  style={{
                                    color: colors.text,
                                    fontSize: 10,
                                    fontFamily: fonts.bold,
                                  }}
                                >
                                  {Number.isFinite(vote as number)
                                    ? (vote as number).toFixed(1)
                                    : "—"}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
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
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  section: {
    width: "100%",
    flexDirection: "column",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 14, alignSelf: "flex-start" },
  containerScroll: {
    width: "100%",
    padding: 6,
    backgroundColor: Colors.text,
    flex: 1,
    borderRadius: 24,
  },
  tabBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
});
