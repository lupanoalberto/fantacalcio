import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import MatchCard from "@/components/MatchCard";
import { goBack } from "expo-router/build/global-state/routing";
import { convertRatingToBaseVote } from "@/utils/convertRating";

type MatchStatus = "OPEN" | "LIVE" | "FINAL" | "LOCKED" | "FINALIZED";

export function calcPlayerBreakdown(
  stat: PlayerStatRow | undefined,
  scoring: any,
) {
  const minMinutes = safeNum(scoring?.rules?.min_minutes_for_vote ?? 0, 0);
  const minutes = safeNum(stat?.minutes, 0);

  const base = safeNum(stat?.rating, 0);

  const events = scoring?.events ?? {};
  const goalPts = safeNum(events?.goal?.value, 3);
  const assistPts = safeNum(events?.assist?.value, 1);
  const yellowPts = safeNum(events?.yellow?.value, -0.5);
  const redPts = safeNum(events?.red?.value, -1);

  const goals = safeNum(stat?.goals, 0);
  const assists = safeNum(stat?.assists, 0);
  const yellow = safeNum(stat?.yellow, 0);
  const red = safeNum(stat?.red, 0);

  const disabled = minutes < minMinutes;

  const breakdown = [
    { label: "Gol", qty: goals, ptsEach: goalPts, subtotal: goals * goalPts },
    {
      label: "Assist",
      qty: assists,
      ptsEach: assistPts,
      subtotal: assists * assistPts,
    },
    {
      label: "Giallo",
      qty: yellow,
      ptsEach: yellowPts,
      subtotal: yellow * yellowPts,
    },
    { label: "Rosso", qty: red, ptsEach: redPts, subtotal: red * redPts },
  ].filter((x) => x.qty !== 0);

  const total = disabled
    ? 0
    : Number((base + breakdown.reduce((s, x) => s + x.subtotal, 0)).toFixed(2));

  return { minutes, minMinutes, disabled, base, breakdown, total };
}

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
  owner_user_id?: string | null; // cambia nome se nel DB usi un'altra colonna
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

  const minMinutes = safeNum(
    scoring?.rules?.min_minutes_for_vote ?? scoring?.rules?.minMinutes ?? 0,
    0,
  );

  const minutes = safeNum(stat.minutes, 0);
  if (minutes < minMinutes) return 0;

  // base voto (QUI stai usando rating già "voto" o "rating" — ok per ora)
  let score = safeNum(stat.rating, 0);

  const events = scoring?.events ?? {};
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

function shortName(name?: string | null) {
  const s = (name ?? "").trim();
  if (!s) return "—";
  // prova a prendere 2 lettere
  const parts = s.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? s[0];
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}

function statusLabel(s?: string) {
  const x = String(s ?? "").toUpperCase();
  if (x === "LIVE") return "LIVE";
  if (x === "OPEN") return "APERTA";
  if (x === "FINAL") return "FINITA";
  if (x === "LOCKED") return "BLOCCATA";
  if (x === "FINALIZED") return "CONVALIDATA";
  return x || "—";
}

export default function MatchScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const params = useLocalSearchParams<{ id?: string; matchId?: string }>();
  const id = params.id; // league id
  const matchId = params.matchId; // match id

  const [playerModal, setPlayerModal] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) throw userErr;
        const authUserId = user?.id ?? null;

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
          .select("id,name,owner_user_id") // cambia owner_user_id se la tua colonna si chiama diversamente
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
          setCurrentUserId(authUserId);
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


  const getVoteStyle = (vote?: number) => {
    if (!Number.isFinite(vote as number) || (vote as number) <= 0) {
      return { bg: colors.opacity, fg: colors.text };
    }
    const v = vote as number;
    if (v >= 6.5) return { backgroundColor: colors.primary };
    else return { backgroundColor: colors.opacity };
  };

  function openPlayerModal(p: any) {
    setPlayerModal(p);
    setModalVisible(true);
  }

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

  const PlayerRow = ({ p }: { p: any }) => {
    const name = p.roster?.cached_display_name ?? `#${p.api_player_id}`;
    const teamName = p.roster?.cached_team_name ?? "—";

    const baseVote = safeNum(p.stat?.rating, 0);
    const total = scoring ? calcPlayerScore(p.stat, scoring) : 0;

    const homeIsMine =
      !!currentUserId &&
      !!homeTeam?.owner_user_id &&
      String(homeTeam.owner_user_id) === String(currentUserId);

    const awayIsMine =
      !!currentUserId &&
      !!awayTeam?.owner_user_id &&
      String(awayTeam.owner_user_id) === String(currentUserId);

    function renderLineupColumn(params: {
      team: TeamRow | null;
      lineup: LineupRow | null;
      split: {
        starters: (LineupPlayerRow & {
          roster?: RosterRow;
          stat?: PlayerStatRow;
        })[];
        bench: (LineupPlayerRow & {
          roster?: RosterRow;
          stat?: PlayerStatRow;
        })[];
      };
      isMine: boolean;
    }) {
      const { team, lineup, split, isMine } = params;

      return (
        <View style={{ flex: 1, paddingHorizontal: 12, gap: 8 }}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.bold,
              fontSize: 14,
            }}
            numberOfLines={1}
          >
            {team?.name ?? "—"}
          </Text>

          {lineup ? (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                }}
              >
                Modulo: {lineup.formation ?? "—"}
              </Text>

              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                Titolari
              </Text>

              {split.starters.length === 0 ? (
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                  }}
                >
                  Nessun titolare disponibile.
                </Text>
              ) : (
                split.starters.map((p) => (
                  <PlayerRow
                    key={`s-${p.lineup_id}-${p.api_player_id}-${p.slot}`}
                    p={p}
                  />
                ))
              )}

              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                Panchina
              </Text>

              {split.bench.length === 0 ? (
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                  }}
                >
                  Panchina vuota.
                </Text>
              ) : (
                split.bench.map((p) => (
                  <PlayerRow
                    key={`b-${p.lineup_id}-${p.api_player_id}-${p.slot}`}
                    p={p}
                  />
                ))
              )}
            </>
          ) : isMine ? (
            <TouchableOpacity
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: colors.text,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() =>
                Alert.alert(
                  "Inserisci formazione",
                  "Collega qui la route della schermata inserimento formazione.",
                )
              }
            >
              <Text
                style={{
                  color: colors.background,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Inserisci formazione
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.regular,
                fontSize: 12,
              }}
            >
              Formazione non disponibile.
            </Text>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => openPlayerModal(p)}
        style={[styles.playerCard, { backgroundColor: colors.opacity }]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: fonts.semibold,
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>

          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.regular,
              color: colors.text,
              marginTop: 4,
            }}
          >
            {teamName}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.regular,
              color: colors.text,
            }}
          >
            Voto: {baseVote ? baseVote.toFixed(2) : "—"}
          </Text>

          <Text
            style={{
              fontSize: 13,
              fontFamily: fonts.bold,
              color: colors.text,
              marginTop: 4,
            }}
          >
            Tot: {formatScore(total)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
          ></View>
          <View
            style={{
              width: 72,
              height: 72,
              padding: 6,
              backgroundColor: colors.text,
              borderRadius: 12,
            }}
          ></View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View>
          <MatchCard
            idx={matchId}
            homeTeam={homeTeam?.name ?? "—"}
            awayTeam={awayTeam?.name ?? "—"}
            scoreHome={String(homeScore)}
            scoreAway={String(awayScore)}
            time={String(match?.matchday)}
            homeLogo={""}
            awayLogo={""}
            day={match?.status}
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

          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.card,
              gap: 0,
              paddingVertical: 12,
            }}
          >
            {homeDecorated.map((p) => {
              const pid = Number(p?.api_player_id);
              const vote = convertRatingToBaseVote(
                Number(ratingByPlayerId.get(pid)),
              );
              const voteUI = getVoteStyle(vote as number);

              return (
                <TouchableOpacity
                  key={p.api_player_id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    gap: 12,
                  }}
                  onPress={() => gotToPlayer(p.api_player_id)}
                >
                  <Text
                    style={{
                      flex: 1,
                      color: colors.text,
                      fontSize: 12,
                      fontFamily: fonts.regular,
                      textAlign: "left",
                    }}
                    numberOfLines={1}
                  >
                    {p.roster. ?? "—"}
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

            {renderLineupColumn({
              team: awayTeam,
              lineup: awayLineup,
              split: awaySplit,
              isMine: awayIsMine,
            })}
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
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
    paddingTop: 8,
  },
  pill: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  playerCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
