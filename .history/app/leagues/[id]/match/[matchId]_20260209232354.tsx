import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

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

function calcPlayerScore(stat: PlayerStatRow | undefined, scoring: ScoringJson) {
  if (!stat) return 0;

  const rules = scoring?.rules ?? scoring?.ruleset ?? scoring?.rules ?? scoring?.rules;
  const minMinutes = safeNum(scoring?.rules?.min_minutes_for_vote ?? scoring?.rules?.minMinutes ?? 0, 0);

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

function splitStartersBench(players: (LineupPlayerRow & { roster?: RosterRow; stat?: PlayerStatRow })[]) {
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

  const [rostersByApiId, setRostersByApiId] = useState<Map<number, RosterRow>>(new Map());
  const [statsByApiId, setStatsByApiId] = useState<Map<number, PlayerStatRow>>(new Map());

  // ---------- load all ----------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!id || typeof id !== "string") throw new Error("id non valido");
        if (!matchId || typeof matchId !== "string") throw new Error("matchId non valido");

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

        const h = (teams ?? []).find((x: any) => String(x.id) === String(m.home_team_id)) ?? null;
        const a = (teams ?? []).find((x: any) => String(x.id) === String(m.away_team_id)) ?? null;

        // 4) lineups (home + away for matchday)
        const { data: lus, error: luErr } = await supabase
          .from("lineups")
          .select("id,team_id,matchday,formation")
          .in("team_id", [m.home_team_id, m.away_team_id])
          .eq("matchday", m.matchday);

        if (luErr) throw luErr;

        const hl = (lus ?? []).find((x: any) => String(x.team_id) === String(m.home_team_id)) ?? null;
        const al = (lus ?? []).find((x: any) => String(x.team_id) === String(m.away_team_id)) ?? null;

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
          homeLP = all.filter((x) => String(x.lineup_id) === String(hl?.id)) as any;
          awayLP = all.filter((x) => String(x.lineup_id) === String(al?.id)) as any;
        }

        // 6) rosters cache (nomi/ruoli) per entrambe le squadre
        const { data: rs, error: rErr } = await supabase
          .from("rosters")
          .select("api_player_id,cached_display_name,cached_role,cached_team_name")
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
            .select("api_player_id,matchday,league_id,minutes,rating,goals,assists,yellow,red")
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

  const homeSplit = useMemo(() => splitStartersBench(homeDecorated), [homeDecorated]);
  const awaySplit = useMemo(() => splitStartersBench(awayDecorated), [awayDecorated]);

  const homeScore = useMemo(() => {
    if (!scoring) return 0;
    return homeSplit.starters.reduce((sum, p) => sum + calcPlayerScore(p.stat, scoring), 0);
  }, [homeSplit.starters, scoring]);

  const awayScore = useMemo(() => {
    if (!scoring) return 0;
    return awaySplit.starters.reduce((sum, p) => sum + calcPlayerScore(p.stat, scoring), 0);
  }, [awaySplit.starters, scoring]);

  const activeTeamName = tab === "HOME" ? homeTeam?.name ?? "Casa" : awayTeam?.name ?? "Trasferta";
  const activeFormation = tab === "HOME" ? homeLineup?.formation : awayLineup?.formation;
  const activeSplit = tab === "HOME" ? homeSplit : awaySplit;

  const PlayerRow = ({ p }: { p: any }) => {
    const name = p.roster?.cached_display_name ?? `#${p.api_player_id}`;
    const teamName = p.roster?.cached_team_name ?? "—";
    const baseVote = safeNum(p.stat?.rating, 0);
    const total = scoring ? calcPlayerScore(p.stat, scoring) : 0;

    return (
      <View style={[styles.row, { borderColor: colors.secondary }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
            {teamName}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary }}>
            Voto: {baseVote ? baseVote.toFixed(2) : "—"}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: colors.text, marginTop: 4 }}>
            Tot: {formatScore(total)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/"))} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontFamily: fonts.semibold, color: colors.text }}>
            Match
          </Text>
          <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }}>
            {match ? `G${match.matchday} • ${String(match.status)}` : "—"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingTop: 24 }}>
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      ) : !match ? (
        <Text style={{ padding: 12, fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
          Match non disponibile.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Score */}
          <View style={[styles.scoreBox, { borderColor: colors.secondary }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }} numberOfLines={1}>
                {homeTeam?.name ?? "Casa"}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }}>
                Modulo: {homeLineup?.formation ?? "—"}
              </Text>
            </View>

            <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: colors.text }}>
              {formatScore(homeScore)} - {formatScore(awayScore)}
            </Text>

            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }} numberOfLines={1}>
                {awayTeam?.name ?? "Trasferta"}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }}>
                Modulo: {awayLineup?.formation ?? "—"}
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setTab("HOME")}
              style={[
                styles.tab,
                {
                  borderColor: colors.secondary,
                  backgroundColor: tab === "HOME" ? colors.secondary : colors.background,
                },
              ]}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }} numberOfLines={1}>
                {homeTeam?.name ?? "Casa"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab("AWAY")}
              style={[
                styles.tab,
                {
                  borderColor: colors.secondary,
                  backgroundColor: tab === "AWAY" ? colors.secondary : colors.background,
                },
              ]}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }} numberOfLines={1}>
                {awayTeam?.name ?? "Trasferta"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lineup */}
          <View style={{ paddingHorizontal: 12, marginTop: 16, gap: 12 }}>
            <Text style={{ fontSize: 18, fontFamily: fonts.semibold, color: colors.text }}>
              {activeTeamName}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
              Modulo: {activeFormation ?? "—"}
            </Text>

            <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text, marginTop: 8 }}>
              Titolari
            </Text>

            {!activeSplit.starters.length ? (
              <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
                Formazione non inserita.
              </Text>
            ) : (
              activeSplit.starters.map((p) => <PlayerRow key={`${p.lineup_id}-${p.api_player_id}-${p.slot}`} p={p} />)
            )}

            <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text, marginTop: 8 }}>
              Panchina
            </Text>

            {!activeSplit.bench.length ? (
              <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
                Panchina vuota.
              </Text>
            ) : (
              activeSplit.bench.map((p) => <PlayerRow key={`${p.lineup_id}-${p.api_player_id}-${p.slot}`} p={p} />)
            )}
          </View>
        </ScrollView>
      )}
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
