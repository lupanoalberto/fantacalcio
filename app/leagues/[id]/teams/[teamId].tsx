import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import { getCompetitionPlayers, CompetitionPlayer } from "@/services/footballApi";

type TeamRow = { id: string; name: string; league_id: string };
type LeagueRow = { id: string; name: string; api_league_id: number | null; season: number | null };

// rosters: una riga per giocatore in rosa
type RosterRow = { api_player_id: number };

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

function apiLeagueIdToLeagueName(apiLeagueId: number | null): string {
  switch (apiLeagueId) {
    case 135: return "Serie A";
    case 39:  return "Premier League";
    case 140: return "LaLiga";
    case 78:  return "Bundesliga";
    case 61:  return "Ligue 1";
    default:  return "Serie A";
  }
}

export default function TeamPlayersScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, teamId } = useLocalSearchParams<{ id?: string; teamId?: string }>();

  const leagueId = id;
  const tId = teamId;

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [league, setLeague] = useState<LeagueRow | null>(null);

  const [rosterIds, setRosterIds] = useState<number[]>([]);
  const [allPlayers, setAllPlayers] = useState<CompetitionPlayer[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!leagueId || !isUuidLike(leagueId)) throw new Error(`ID lega non valido: ${String(leagueId)}`);
        if (!tId || !isUuidLike(tId)) throw new Error(`ID team non valido: ${String(tId)}`);

        // 1) team (per league_id e name)
        const { data: t, error: tErr } = await supabase
          .from("teams")
          .select("id,name,league_id")
          .eq("id", tId)
          .maybeSingle();

        if (tErr) throw tErr;
        if (!t) throw new Error("Team non trovato.");

        // (opzionale ma utile) verifica coerenza route leagueId -> team.league_id
        if (String(t.league_id) !== String(leagueId)) {
          throw new Error("Questa squadra non appartiene alla lega richiesta.");
        }

        // 2) league (per api_league_id)
        const { data: lg, error: lgErr } = await supabase
          .from("leagues")
          .select("id,name,api_league_id,season")
          .eq("id", leagueId)
          .maybeSingle();

        if (lgErr) throw lgErr;
        if (!lg) throw new Error("Lega non trovata.");

        // 3) rosters (lista id giocatori API)
        const { data: r, error: rErr } = await supabase
          .from("rosters")
          .select("api_player_id")
          .eq("team_id", tId);

        if (rErr) throw rErr;

        const ids = (r ?? [])
          .map((x: any) => Number(x.api_player_id))
          .filter((n) => Number.isFinite(n));

        // 4) UNA chiamata API: listone per quella competizione
        const leagueName = apiLeagueIdToLeagueName(lg.api_league_id ?? null);
        const players = await getCompetitionPlayers(leagueName);

        if (cancelled) return;

        setTeam(t as TeamRow);
        setLeague(lg as LeagueRow);
        setRosterIds(ids);
        setAllPlayers(players);
      } catch (e: any) {
        console.error("TeamPlayers load error:", e?.message ?? e);
        if (!cancelled) {
          setTeam(null);
          setLeague(null);
          setRosterIds([]);
          setAllPlayers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [leagueId, tId]);

  const playerById = useMemo(() => {
    const m = new Map<number, CompetitionPlayer>();
    for (const p of allPlayers) m.set(Number(p.id), p);
    return m;
  }, [allPlayers]);

  const rosterPlayers = useMemo(() => {
    // prende solo quelli realmente presenti nel listone
    return rosterIds
      .map((pid) => playerById.get(pid))
      .filter(Boolean) as CompetitionPlayer[];
  }, [rosterIds, playerById]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.success} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingTop: insets.top + 12, paddingHorizontal: 12 }}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push("/"))}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 16 }} numberOfLines={1}>
              {team?.name ?? "Squadra"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 11 }} numberOfLines={1}>
              {league?.name ?? ""}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 12, marginTop: 12 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 11 }}>
            {rosterPlayers.length} giocatori in rosa
          </Text>
        </View>

        <View style={{ marginTop: 12 }}>
          {rosterPlayers.length === 0 ? (
            <Text style={{ paddingHorizontal: 12, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 12 }}>
              Nessun giocatore in rosa.
            </Text>
          ) : (
            rosterPlayers.map((p) => {
              const photo =
                p.photo ??
                "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

              return (
                <View
                  key={String(p.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: colors.secondary,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Image source={{ uri: photo }} style={{ width: 44, height: 44, borderRadius: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 10 }} numberOfLines={1}>
                      {p.position ?? "-"} • {p.team?.name ?? "—"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
