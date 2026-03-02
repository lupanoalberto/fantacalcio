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

  const homeTeam = teams?.home?;
  const awayTeam = teams?.away?;

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

  /**
   * ✅ Mappa eventi per playerId (icone sotto al nome)
   * - per e.player.id aggiungo l’evento “normale”
   * - per substitution aggiungo anche evento al giocatore entrato (assist.id)
   */
  const eventChipsByPlayerId = useMemo(() => {
    const map = new Map<number, PlayerEventChip[]>();

    const pushChip = (pid: number, chip: Omit<PlayerEventChip, "count">) => {
      if (!Number.isFinite(pid)) return;
      const list = map.get(pid) ?? [];
      const idx = list.findIndex(
        (x) => x.type === chip.type && (x.detail ?? "") === (chip.detail ?? ""),
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], count: list[idx].count + 1 };
      } else {
        list.push({ ...chip, count: 1 });
      }
      map.set(pid, list);
    };

    for (const e of events ?? []) {
      const type = e?.type;
      const detail = e?.detail;

      const pidOut = Number(e?.player?.id);
      if (Number.isFinite(pidOut)) {
        pushChip(pidOut, { type, detail });
      }

      // substitution: spesso e.assist è “player in”
      if (type === "subst") {
        const pidIn = Number(e?.assist?.id);
        if (Number.isFinite(pidIn)) {
          // stesso type/detail va bene per la tua EventIcon
          pushChip(pidIn, { type, detail });
        }
      }
    }

    return map;
  }, [events]);

  const getVoteStyle = (vote?: number) => {
    // fallback neutro
    if (!Number.isFinite(vote as number)) {
      return { backgroundColor: colors.gray, color: colors.text };
    }

    const v = vote as number;

    // soglie semplici (puoi tararle):
    if (v >= 7)
      return { backgroundColor: colors.green, color: colors.background };
    if (v >= 6) return { backgroundColor: colors.yellow, color: colors.text };
    if (v >= 5)
      return {
        backgroundColor: colors.orange ?? colors.yellow,
        color: colors.text,
      };
    return { backgroundColor: colors.orange, color: colors.background };
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
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 24 }}
      >
        <View
          style={{
            width: "100%",
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "flex-end",
            height: insets.top + 12 + 48 + 24 + 72,
            gap: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.text,
                position: "absolute",
                top: 12 + insets.top,
                left: 12,
                zIndex: 10,
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
          <Image
            source={{ uri: homeLogo }}
            style={{
              width: 72,
              height: 72,
              marginTop: insets.top / 2,
            }}
            resizeMode="contain"
          />
          <Image
            source={{ uri: awayLogo }}
            style={{
              width: 72,
              height: 72,
              marginTop: insets.top / 2,
            }}
            resizeMode="contain"
          />
        </View>

        <View style={[styles.section]}>
          <Text
            style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}
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
              scoreColor={scoreColor}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}
          >
            Dettagli partita
          </Text>

          {/* TAB */}
          <ScrollView
            style={styles.containerScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isActive === 0 ? colors.yellow : colors.gray,
                },
              ]}
              onPress={() => setIsActive(0)}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  color: colors.text,
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
                  backgroundColor: isActive === 1 ? colors.yellow : colors.gray,
                },
              ]}
              onPress={() => setIsActive(1)}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  color: colors.text,
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
                <ActivityIndicator size="small" color={colors.green} />
              ) : events.length === 0 ? (
                <Text
                  style={{
                    color: colors.textSecondary,
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
                        padding: 12,
                        borderBottomWidth: 1,
                        borderColor: colors.gray,
                        gap: 12,
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
            ) : lineupsLoading || playersStatsLoading ? (
              <ActivityIndicator size="small" color={colors.green} />
            ) : lineups.length === 0 ? (
              <Text
                style={{
                  color: colors.textSecondary,
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
                  <View key={idx} style={{ width: "50%" }}>
                    {/* TitolarI (se presenti) */}
                    {Array.isArray(l.startXI) && l.startXI.length > 0 ? (
                      <View style={{ width: "100%" }}>
                        {l.startXI.map((p: any, j: number) => {
                          const pid = Number(p?.player?.id);
                          const vote = Number.isFinite(pid)
                            ? ratingByPlayerId.get(pid)
                            : undefined;
                          const voteUI = getVoteStyle(vote);
                          const chips = Number.isFinite(pid)
                            ? (eventChipsByPlayerId.get(pid) ?? [])
                            : [];

                          return (
                            <View
                              key={j}
                              style={{
                                width: "100%",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                alignItems:
                                  isHome === 0 ? "flex-start" : "flex-end",
                                padding: 12,
                                borderBottomWidth: 1,
                                borderColor: colors.gray,
                                gap: 6,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection:
                                    isHome === 0 ? "row" : "row-reverse",
                                  gap: 6,
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  width: "100%",
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
                                    minWidth: 36,
                                    paddingVertical: 4,
                                    paddingHorizontal: 8,
                                    borderRadius: 8,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: voteUI.backgroundColor,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: voteUI.color,
                                      fontSize: 12,
                                      fontFamily: fonts.semibold,
                                    }}
                                  >
                                    {Number.isFinite(vote as number)
                                      ? (vote as number).toFixed(1)
                                      : "—"}
                                  </Text>
                                </View>
                              </View>

                              <View
                                style={{
                                  flexDirection:
                                    isHome === 0 ? "row" : "row-reverse",
                                  gap: 6,
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  width: "100%",
                                  flexWrap: "wrap",
                                }}
                              >
                                {/* ✅ ICONE EVENTI DEL GIOCATORE (gol, assist, sostituzione ecc...) */}
                                {chips.length === 0
                                  ? null
                                  : chips.map((chip, k) => (
                                      <View
                                        key={`${chip.type}-${chip.detail ?? ""}-${k}`}
                                        style={{
                                          flexDirection: "row",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                      >
                                        <EventIcon
                                          type={chip.type}
                                          detail={chip.detail}
                                          size={18}
                                        />
                                        {chip.count > 1 ? (
                                          <Text
                                            style={{
                                              color: colors.textSecondary,
                                              fontSize: 11,
                                              fontFamily: fonts.semibold,
                                            }}
                                          >
                                            x{chip.count}
                                          </Text>
                                        ) : null}
                                      </View>
                                    ))}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    {/* Panchina (se presenti) */}
                    {Array.isArray(l.substitutes) &&
                    l.substitutes.length > 0 ? (
                      <View style={{ width: "100%" }}>
                        {l.substitutes.map((p: any, j: number) => (
                          <View
                            key={j}
                            style={{
                              width: "100%",
                              flexDirection:
                                isHome === 0 ? "row" : "row-reverse",
                              justifyContent: "flex-start",
                              alignItems: "center",
                              padding: 12,
                              borderBottomWidth: 1,
                              borderColor: colors.gray,
                              gap: 12,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.textSecondary,
                                fontSize: 12,
                                fontFamily: fonts.regular,
                              }}
                            >
                              {p.player?.number ? `${p.player.number}. ` : ""}
                            </Text>
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
                          </View>
                        ))}
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
    gap: 6,
    padding: 12,
    borderRadius: 24,
  },
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    paddingHorizontal: 12,
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
