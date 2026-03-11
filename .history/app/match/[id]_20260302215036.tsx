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
      return { backgroundColor: colors.gray, color: colors.text };
    }

    const v = vote as number;

    // soglie semplici (puoi tararle):
    if (v >= 7.5)
      return { backgroundColor: colors.blue, color: colors.background };
    else if (v >= 6.5)
      return { backgroundColor: colors.green, color: colors.background };
    else if (v >= 6)
      return {
        backgroundColor: colors.yellow ?? colors.yellow,
        color: colors.background,
      };
    else if (v > 0 && v < 6)
      return {
        backgroundColor: colors.orange ?? colors.yellow,
        color: colors.background,
      };
    else return { backgroundColor: colors.textSecondary, color: colors.text };
  };

  // ✅ Early returns dopo hooks
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (error || !details || !fixture || !teams) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 8 }}>
          <Text
            style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}
          >
            {error ?? "Impossibile caricare i dettagli della partita."}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 12,
              marginTop: 8,
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
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            paddingRight: 32,
          }}
        >
          <Image
            source={{ uri: homeLogo }}
            style={{
              width: 32,
              height: 32,
            }}
            resizeMode="contain"
          />
          <Image
            source={{ uri: awayLogo }}
            style={{
              width: 32,
              height: 32,
            }}
            resizeMode="contain"
          />
        </View>
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
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 24, paddingBottom: 8 }}
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
              }}
            >
              Dettagli partita
            </Text>

            {/* TAB */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    borderWidth: 1,
                    borderColor: colors.opacity,
                    backgroundColor:
                      isActive === 0 ? colors.white : colors.opacity,
                  },
                ]}
                onPress={() => setIsActive(0)}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: isActive === 0 ? colors.orange : colors.white,
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
                    borderWidth: 1,
                    borderColor: colors.opacity,
                    backgroundColor:
                      isActive === 1 ? colors.white : colors.opacity,
                  },
                ]}
                onPress={() => setIsActive(1)}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: isActive === 1 ? colors.orange : colors.white,
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
                gap: 4,
              }}
            >
              {isActive === 0 ? (
                eventsLoading ? (
                  <ActivityIndicator size="small" color={colors.green} />
                ) : events.length === 0 ? (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12,
                      padding: 8,
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
                          padding: 8,
                          borderColor: "transparent",
                          backgroundColor: colors.opacity,
                          borderRadius: 8,
                          gap: 8,
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
                        <TouchableOpacity
                          onPress={() =>
                            router.push(
                              `/player/${String(e.player.id)}` as Href,
                            )
                          }
                        >
                          <Text
                            style={{
                              color: isSub ? colors.textSecondary : colors.text,
                              fontSize: 12,
                              fontFamily: fonts.regular,
                            }}
                          >
                            {e.player.name}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            router.push(
                              `/player/${String(e.assist.id)}` as Href,
                            )
                          }
                        >
                          <Text
                            style={{
                              color: isSub ? colors.text : colors.textSecondary,
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
                <ActivityIndicator size="small" color={colors.green} />
              ) : lineups.length === 0 ? (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    padding: 8,
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
                      style={{ width: "50%", flexDirection: "column", gap: 4 }}
                    >
                      {/* TitolarI (se presenti) */}
                      {Array.isArray(l.startXI) && l.startXI.length > 0 ? (
                        <View
                          style={{
                            width: "100%",
                            flexDirection: "column",
                            gap: 4,
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
                                  padding: 8,
                                  borderColor: "transparent",
                                  backgroundColor: colors.opacity,
                                  borderRadius: 8,
                                  gap: 8,
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
                                    padding: 4,
                                    borderRadius: 8,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: colors.opacity,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: voteUI.backgroundColor,
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
                            gap: 4,
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
                                  padding: 8,
                                  borderColor: "transparent",
                                  backgroundColor: colors.opacity,
                                  borderRadius: 8,
                                  gap: 8,
                                }}
                              >
                                <Text
                                  style={{
                                    flex: 1,
                                    color: colors.textSecondary,
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
                                    padding: 4,
                                    borderRadius: 8,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: colors.opacity,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: voteUI.backgroundColor,
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
      </LinearGradient>
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
    gap: 8,
    padding: 8,
    borderRadius: 24,
    backgroundColor: Colors.opacity,
  },
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
    paddingHorizontal: 16,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 14, alignSelf: "flex-start" },
  containerScroll: {
    width: "100%",
    padding: 6,
    backgroundColor: Colors.gray,
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
