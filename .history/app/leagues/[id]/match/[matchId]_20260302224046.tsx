import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import { goBack } from "expo-router/build/global-state/routing";

type MatchStatus = "OPEN" | "LIVE" | "FINAL" | "LOCKED" | "FINALIZED";

type MatchRow = {
  id: string;
  league_id: string;
  matchday: number;
  status: MatchStatus | string;
  home_team_id: string;
  away_team_id: string;
};

type TeamRow = {
  id: string;
  name: string | null;
};

type LineupRow = {
  id: string;
  team_id: string;
  matchday: number;
  formation: string | null;
};

type LineupPlayerRow = {
  lineup_id: string;
  api_player_id: number;
  slot: number;
  is_starter: boolean;
};

type PlayerStatRow = {
  api_player_id: number;
  matchday: number;
  league_id: string;
  minutes: number | null;
  rating: number | string | null;
  goals: number | null;
  assists: number | null;
  yellow: number | null;
  red: number | null;
  // aggiungi colonne se le hai (rigori, autogol, clean sheet, ecc.)
};

type RosterRow = {
  api_player_id: number;
  cached_display_name: string | null;
  cached_role: string | null;
  cached_team_name: string | null;
};

type ScoringJson = any;

function safeNum(v: any, fallback = 0) {
  const n = typeof v === "string" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatScore(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function calcPlayerScore(
  stat: PlayerStatRow | undefined,
  scoring: ScoringJson,
) {
  if (!stat) return 0;

  const rules =
    scoring?.rules ?? scoring?.ruleset ?? scoring?.rules ?? scoring?.rules;
  const minMinutes = safeNum(
    scoring?.rules?.min_minutes_for_vote ?? scoring?.rules?.minMinutes ?? 0,
    0,
  );

  const minutes = safeNum(stat.minutes, 0);
  if (minutes < minMinutes) return 0;

  // base voto
  let score = safeNum(stat.rating, 0);

  const events = scoring?.events ?? {};
  // fallback valori (se scoring_json non ha events completi)
  const goalPts = safeNum(events?.goal?.value, 3);
  const assistPts = safeNum(events?.assist?.value, 1);
  const yellowPts = safeNum(events?.yellow?.value, -0.5);
  const redPts = safeNum(events?.red?.value, -1);

  score += safeNum(stat.goals, 0) * goalPts;
  score += safeNum(stat.assists, 0) * assistPts;
  score += safeNum(stat.yellow, 0) * yellowPts;
  score += safeNum(stat.red, 0) * redPts;

  return Number(score.toFixed(2));
}

function splitStartersBench(
  players: (LineupPlayerRow & { roster?: RosterRow; stat?: PlayerStatRow })[],
) {
  const starters = players
    .filter((p) => p.is_starter)
    .sort((a, b) => a.slot - b.slot);
  const bench = players
    .filter((p) => !p.is_starter)
    .sort((a, b) => a.slot - b.slot);
  return { starters, bench };
}

export default function MatchScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{ id?: string; matchId?: string }>();
  const id = params.id; // ✅ lega id
  const matchId = params.matchId; // ✅ match id

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"HOME" | "AWAY">("HOME");

  const [match, setMatch] = useState<MatchRow | null>(null);
  const [homeTeam, setHomeTeam] = useState<TeamRow | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamRow | null>(null);

  const [scoring, setScoring] = useState<ScoringJson | null>(null);

  const [homeLineup, setHomeLineup] = useState<LineupRow | null>(null);
  const [awayLineup, setAwayLineup] = useState<LineupRow | null>(null);

  const [homePlayers, setHomePlayers] = useState<LineupPlayerRow[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<LineupPlayerRow[]>([]);

  const [rostersByApiId, setRostersByApiId] = useState<Map<number, RosterRow>>(
    new Map(),
  );
  const [statsByApiId, setStatsByApiId] = useState<Map<number, PlayerStatRow>>(
    new Map(),
  );

  // ---------- load all ----------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!id || typeof id !== "string") throw new Error("id non valido");
        if (!matchId || typeof matchId !== "string")
          throw new Error("matchId non valido");

        // 1) match
        const { data: m, error: mErr } = await supabase
          .from("league_matches")
          .select("id,league_id,matchday,status,home_team_id,away_team_id")
          .eq("id", matchId)
          .maybeSingle();

        if (mErr) throw mErr;
        if (!m?.id) throw new Error("Match non trovato.");

        if (String(m.league_id) !== String(id)) {
          throw new Error("Questo match non appartiene a questa lega.");
        }

        // 2) league scoring
        const { data: lg, error: lgErr } = await supabase
          .from("leagues")
          .select("id, scoring_json")
          .eq("id", id)
          .maybeSingle();

        if (lgErr) throw lgErr;
        const scoringJson = (lg as any)?.scoring_json ?? null;

        // 3) teams
        const { data: teams, error: tErr } = await supabase
          .from("teams")
          .select("id,name")
          .in("id", [m.home_team_id, m.away_team_id]);

        if (tErr) throw tErr;

        const h =
          (teams ?? []).find(
            (x: any) => String(x.id) === String(m.home_team_id),
          ) ?? null;
        const a =
          (teams ?? []).find(
            (x: any) => String(x.id) === String(m.away_team_id),
          ) ?? null;

        // 4) lineups (home + away for matchday)
        const { data: lus, error: luErr } = await supabase
          .from("lineups")
          .select("id,team_id,matchday,formation")
          .in("team_id", [m.home_team_id, m.away_team_id])
          .eq("matchday", m.matchday);

        if (luErr) throw luErr;

        const hl =
          (lus ?? []).find(
            (x: any) => String(x.team_id) === String(m.home_team_id),
          ) ?? null;
        const al =
          (lus ?? []).find(
            (x: any) => String(x.team_id) === String(m.away_team_id),
          ) ?? null;

        // 5) lineup_players
        const lineupIds = [hl?.id, al?.id].filter(Boolean);
        let homeLP: LineupPlayerRow[] = [];
        let awayLP: LineupPlayerRow[] = [];

        if (lineupIds.length) {
          const { data: lps, error: lpErr } = await supabase
            .from("lineup_players")
            .select("lineup_id,api_player_id,slot,is_starter")
            .in("lineup_id", lineupIds)
            .order("slot", { ascending: true });

          if (lpErr) throw lpErr;

          const all = (lps ?? []) as any[];
          homeLP = all.filter(
            (x) => String(x.lineup_id) === String(hl?.id),
          ) as any;
          awayLP = all.filter(
            (x) => String(x.lineup_id) === String(al?.id),
          ) as any;
        }

        // 6) rosters cache (nomi/ruoli) per entrambe le squadre
        const { data: rs, error: rErr } = await supabase
          .from("rosters")
          .select(
            "api_player_id,cached_display_name,cached_role,cached_team_name",
          )
          .in("team_id", [m.home_team_id, m.away_team_id])
          .is("released_at", null);

        if (rErr) throw rErr;

        const rosterMap = new Map<number, RosterRow>();
        (rs ?? []).forEach((r: any) => rosterMap.set(r.api_player_id, r));

        // 7) stats del matchday (tabella voti)
        const allApiIds = [...homeLP, ...awayLP].map((p) => p.api_player_id);
        const uniqueApiIds = Array.from(new Set(allApiIds));

        const statsMap = new Map<number, PlayerStatRow>();
        if (uniqueApiIds.length) {
          const { data: ps, error: psErr } = await supabase
            .from("player_match_stats") // 👈 cambia se la tua tabella si chiama diversamente
            .select(
              "api_player_id,matchday,league_id,minutes,rating,goals,assists,yellow,red",
            )
            .eq("league_id", id)
            .eq("matchday", m.matchday)
            .in("api_player_id", uniqueApiIds);

          if (psErr) throw psErr;

          (ps ?? []).forEach((s: any) => statsMap.set(s.api_player_id, s));
        }

        if (!cancelled) {
          setMatch(m as any);
          setHomeTeam(h as any);
          setAwayTeam(a as any);
          setScoring(scoringJson);
          setHomeLineup(hl as any);
          setAwayLineup(al as any);
          setHomePlayers(homeLP);
          setAwayPlayers(awayLP);
          setRostersByApiId(rosterMap);
          setStatsByApiId(statsMap);
          setTab("HOME");
        }
      } catch (e: any) {
        console.error("match load error:", e?.message ?? e);
        if (!cancelled) {
          Alert.alert("Errore", e?.message ?? "Impossibile caricare il match.");
          setMatch(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, matchId]);

  const homeDecorated = useMemo(() => {
    return homePlayers.map((p) => ({
      ...p,
      roster: rostersByApiId.get(p.api_player_id),
      stat: statsByApiId.get(p.api_player_id),
    }));
  }, [homePlayers, rostersByApiId, statsByApiId]);

  const awayDecorated = useMemo(() => {
    return awayPlayers.map((p) => ({
      ...p,
      roster: rostersByApiId.get(p.api_player_id),
      stat: statsByApiId.get(p.api_player_id),
    }));
  }, [awayPlayers, rostersByApiId, statsByApiId]);

  const homeSplit = useMemo(
    () => splitStartersBench(homeDecorated),
    [homeDecorated],
  );
  const awaySplit = useMemo(
    () => splitStartersBench(awayDecorated),
    [awayDecorated],
  );

  const homeScore = useMemo(() => {
    if (!scoring) return 0;
    return homeSplit.starters.reduce(
      (sum, p) => sum + calcPlayerScore(p.stat, scoring),
      0,
    );
  }, [homeSplit.starters, scoring]);

  const awayScore = useMemo(() => {
    if (!scoring) return 0;
    return awaySplit.starters.reduce(
      (sum, p) => sum + calcPlayerScore(p.stat, scoring),
      0,
    );
  }, [awaySplit.starters, scoring]);

  const activeTeamName =
    tab === "HOME"
      ? (homeTeam?.name ?? "Casa")
      : (awayTeam?.name ?? "Trasferta");
  const activeFormation =
    tab === "HOME" ? homeLineup?.formation : awayLineup?.formation;
  const activeSplit = tab === "HOME" ? homeSplit : awaySplit;

  const PlayerRow = ({ p }: { p: any }) => {
    const name = p.roster?.cached_display_name ?? `#${p.api_player_id}`;
    const teamName = p.roster?.cached_team_name ?? "—";
    const baseVote = safeNum(p.stat?.rating, 0);
    const total = scoring ? calcPlayerScore(p.stat, scoring) : 0;

  if (loading) {
    
  }

  else {return (
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

      <Lin
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
  scoreBox: {
    marginTop: 12,
    marginHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  row: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
