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

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import MatchCard from "@/components/MatchCard";
import { convertRatingToBaseVote } from "@/utils/convertRating";

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
};

type RosterRow = {
  api_player_id: number;
  cached_display_name: string | null;
  cached_role: string | null;
  cached_team_name: string | null;
};

type ScoringJson = any;

type DecoratedPlayer = LineupPlayerRow & {
  roster?: RosterRow;
  stat?: PlayerStatRow;
};

function safeNum(v: any, fallback = 0) {
  const n = typeof v === "string" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatScore(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export function calcPlayerBreakdown(
  stat: PlayerStatRow | undefined,
  scoring: ScoringJson,
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

function splitStartersBench(players: DecoratedPlayer[]) {
  const starters = players
    .filter((p) => p.is_starter)
    .sort((a, b) => a.slot - b.slot);

  const bench = players
    .filter((p) => !p.is_starter)
    .sort((a, b) => a.slot - b.slot);

  return { starters, bench };
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

  const params = useLocalSearchParams<{ id?: string; matchId?: string }>();
  const id = params.id;
  const matchId = params.matchId;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [playerModal, setPlayerModal] = useState<DecoratedPlayer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [loading, setLoading] = useState(true);

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
        if (!matchId || typeof matchId !== "string") {
          throw new Error("matchId non valido");
        }

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

        const { data: lg, error: lgErr } = await supabase
          .from("leagues")
          .select("id, scoring_json")
          .eq("id", id)
          .maybeSingle();

        if (lgErr) throw lgErr;
        const scoringJson = (lg as any)?.scoring_json ?? null;

        const { data: teams, error: tErr } = await supabase
          .from("teams")
          .select("id,name,owner_user_id")
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

        const allApiIds = [...homeLP, ...awayLP].map((p) => p.api_player_id);
        const uniqueApiIds = Array.from(new Set(allApiIds));

        const statsMap = new Map<number, PlayerStatRow>();
        if (uniqueApiIds.length) {
          const { data: ps, error: psErr } = await supabase
            .from("player_match_stats")
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
          setMatch(m as MatchRow);
          setHomeTeam(h as TeamRow);
          setAwayTeam(a as TeamRow);
          setScoring(scoringJson);
          setHomeLineup(hl as LineupRow | null);
          setAwayLineup(al as LineupRow | null);
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

  const homeDecorated = useMemo<DecoratedPlayer[]>(() => {
    return homePlayers.map((p) => ({
      ...p,
      roster: rostersByApiId.get(p.api_player_id),
      stat: statsByApiId.get(p.api_player_id),
    }));
  }, [homePlayers, rostersByApiId, statsByApiId]);

  const awayDecorated = useMemo<DecoratedPlayer[]>(() => {
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

  const ratingByPlayerId = useMemo(() => {
    const map = new Map<number, number>();

    [...homeDecorated, ...awayDecorated].forEach((p) => {
      const rating = safeNum(p.stat?.rating, NaN);
      if (Number.isFinite(rating)) {
        map.set(p.api_player_id, rating);
      }
    });

    return map;
  }, [homeDecorated, awayDecorated]);

  function getVoteStyle(vote?: number) {
    if (!Number.isFinite(vote as number) || (vote as number) <= 0) {
      return { backgroundColor: colors.opacity, textColor: colors.text };
    }

    const v = vote as number;

    if (v >= 7.5) {
      return { backgroundColor: colors.primary, textColor: colors.text };
    }

    if (v >= 6.5) {
      return { backgroundColor: colors.primary, textColor: colors.text };
    }

    return { backgroundColor: colors.opacity, textColor: colors.text };
  }

  function openPlayerModal(p: DecoratedPlayer) {
    setPlayerModal(p);
    setModalVisible(true);
  }

  function goToPlayer(idPlayer: number) {
    router.push({
      pathname: "/player/[id]",
      params: { id: String(idPlayer), league: String(id) },
    });
  }

  function renderCompactPlayerRow(
    p: DecoratedPlayer,
    isHome: boolean,
    section: "starters" | "bench",
  ) {
    const name = p.roster?.cached_display_name ?? `#${p.api_player_id}`;
    const rawRating = ratingByPlayerId.get(p.api_player_id);
    const vote = convertRatingToBaseVote(Number(ratingByPlayerId.get(p.api_player_id)));
    const voteUI = getVoteStyle(vote as number);

    return (
      <TouchableOpacity
        key={`${section}-${p.lineup_id}-${p.api_player_id}-${p.slot}`}
        style={{
          width: "100%",
          flexDirection: isHome ? "row" : "row-reverse",
          justifyContent: "flex-start",
          alignItems: "center",
          paddingHorizontal: 12,
          gap: 12,
        }}
        onPress={() => openPlayerModal(p)}
      >
        <Text
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 12,
            fontFamily: fonts.regular,
            textAlign: isHome ? "left" : "right",
          }}
          numberOfLines={1}
        >
          {name}
        </Text>

        <TouchableOpacity
          onPress={() => goToPlayer(p.api_player_id)}
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
              color: voteUI.textColor,
              fontSize: 10,
              fontFamily: fonts.bold,
            }}
          >
            {Number.isFinite(vote as number)
              ? (vote as number).toFixed(1)
              : "—"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  function renderFormationSide(params: {
    team: TeamRow | null;
    lineup: LineupRow | null;
    split: { starters: DecoratedPlayer[]; bench: DecoratedPlayer[] };
    isHome: boolean;
    isMine: boolean;
  }) {
    const { team, lineup, split, isHome, isMine } = params;

    if (!lineup) {
      return (
        <View
          style={{
            width: "50%",
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.bold,
              fontSize: 14,
              textAlign: isHome ? "left" : "right",
            }}
            numberOfLines={1}
          >
            {team?.name ?? "—"}
          </Text>

          {isMine ? (
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
                textAlign: isHome ? "left" : "right",
              }}
            >
              Formazione non disponibile.
            </Text>
          )}
        </View>
      );
    }

    return (
      <View
        style={{
          width: "50%",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <View style={{ paddingHorizontal: 12 }}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.bold,
              fontSize: 14,
              textAlign: isHome ? "left" : "right",
            }}
            numberOfLines={1}
          >
            {team?.name ?? "—"}
          </Text>

          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.regular,
              fontSize: 12,
              textAlign: isHome ? "left" : "right",
              marginTop: 4,
            }}
          >
            Modulo: {lineup.formation ?? "—"}
          </Text>
        </View>

        <View
          style={{
            width: "100%",
            flexDirection: "column",
            gap: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderColor: colors.opacity,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
              paddingHorizontal: 12,
              textAlign: isHome ? "left" : "right",
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
                paddingHorizontal: 12,
                textAlign: isHome ? "left" : "right",
              }}
            >
              Nessun titolare disponibile.
            </Text>
          ) : (
            split.starters.map((p) =>
              renderCompactPlayerRow(p, isHome, "starters"),
            )
          )}
        </View>

        <View
          style={{
            width: "100%",
            flexDirection: "column",
            gap: 12,
            paddingTop: 12,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
              paddingHorizontal: 12,
              textAlign: isHome ? "left" : "right",
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
                paddingHorizontal: 12,
                textAlign: isHome ? "left" : "right",
              }}
            >
              Panchina vuota.
            </Text>
          ) : (
            split.bench.map((p) => renderCompactPlayerRow(p, isHome, "bench"))
          )}
        </View>
      </View>
    );
  }

  const modalBreakdown =
    playerModal && scoring
      ? calcPlayerBreakdown(playerModal.stat, scoring)
      : null;

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          padding: 12,
          paddingTop: 12 + insets.top,
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.push("/")
          }
        >
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
          />
          <View
            style={{
              width: 72,
              height: 72,
              padding: 6,
              backgroundColor: colors.text,
              borderRadius: 12,
            }}
          />
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View>
          <MatchCard
            idx={matchId ?? ""}
            homeTeam={homeTeam?.name ?? "—"}
            awayTeam={awayTeam?.name ?? "—"}
            scoreHome={String(homeScore)}
            scoreAway={String(awayScore)}
            time={String(match?.matchday ?? "—")}
            homeLogo=""
            awayLogo=""
            day={statusLabel(match?.status)}
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
              paddingVertical: 12,
            }}
          >
            {renderFormationSide({
              team: homeTeam,
              lineup: homeLineup,
              split: homeSplit,
              isHome: true,
              isMine: homeIsMine,
            })}

            {renderFormationSide({
              team: awayTeam,
              lineup: awayLineup,
              split: awaySplit,
              isHome: false,
              isMine: awayIsMine,
            })}
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontFamily: fonts.bold,
                  fontSize: 16,
                }}
                numberOfLines={1}
              >
                {playerModal?.roster?.cached_display_name ?? "Giocatore"}
              </Text>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.regular,
                fontSize: 12,
              }}
            >
              {playerModal?.roster?.cached_team_name ?? "—"}
            </Text>

            {modalBreakdown ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.regular,
                      fontSize: 12,
                    }}
                  >
                    Minuti
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.semibold,
                      fontSize: 12,
                    }}
                  >
                    {String(modalBreakdown.minutes)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.regular,
                      fontSize: 12,
                    }}
                  >
                    Voto base
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.semibold,
                      fontSize: 12,
                    }}
                  >
                    {Number.isFinite(modalBreakdown.base)
                      ? modalBreakdown.base.toFixed(2)
                      : "—"}
                  </Text>
                </View>

                {modalBreakdown.breakdown.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontFamily: fonts.semibold,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      Bonus / Malus
                    </Text>

                    {modalBreakdown.breakdown.map((b, idx) => (
                      <View
                        key={`${b.label}-${idx}`}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontFamily: fonts.regular,
                            fontSize: 12,
                          }}
                        >
                          {b.label} x{b.qty}
                        </Text>
                        <Text
                          style={{
                            color: colors.text,
                            fontFamily: fonts.semibold,
                            fontSize: 12,
                          }}
                        >
                          {b.subtotal > 0 ? "+" : ""}
                          {b.subtotal.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.regular,
                      fontSize: 12,
                    }}
                  >
                    Nessun bonus o malus registrato.
                  </Text>
                )}

                <View
                  style={{
                    marginTop: 4,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderColor: colors.opacity,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.bold,
                      fontSize: 14,
                    }}
                  >
                    Totale
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.bold,
                      fontSize: 14,
                    }}
                  >
                    {formatScore(modalBreakdown.total)}
                  </Text>
                </View>
              </>
            ) : (
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                }}
              >
                Dati non disponibili.
              </Text>
            )}
          </View>
        </View>
      </Modal>
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
  playerCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
