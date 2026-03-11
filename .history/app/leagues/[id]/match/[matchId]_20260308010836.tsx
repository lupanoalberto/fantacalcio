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

  const PlayerRow = ({ p }: { p: any }) => {
    const name = p.roster?.cached_display_name ?? `#${p.api_player_id}`;
    const teamName = p.roster?.cached_team_name ?? "—";

    const baseVote = safeNum(p.stat?.rating, 0);
    const total = scoring ? calcPlayerScore(p.stat, scoring) : 0;

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
          >
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
          </View>
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
            <View>

            </View>
            <View>
              
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
