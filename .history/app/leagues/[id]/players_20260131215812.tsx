import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import {
  getCompetitionPlayers,
  CompetitionPlayer,
} from "@/services/footballApi";
import { apiLeagueIdToName } from "@/utils/leagueName"; // tu ce l'hai già

type LeagueRow = {
  id: string;
  name: string;
  api_league_id: number | null;
  season: number | null;
};

export default function ListoneScreen() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = String(id);

  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);

  const [players, setPlayers] = useState<CompetitionPlayer[]>([]);
  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);

  // 1) load league + my team id
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        if (!uid) {
          Alert.alert("Login richiesto", "Devi essere loggato.");
          return;
        }

        // LEAGUE
        const { data: leagueData, error: leagueErr } = await supabase
          .from("leagues")
          .select("id,name,api_league_id,season")
          .eq("id", leagueId)
          .single();

        if (leagueErr) throw leagueErr;
        if (!cancelled) setLeague(leagueData);

        // MY TEAM (user_team -> teams)
        const { data: utData, error: utErr } = await supabase
          .from("user_team")
          .select(
            `
            team:teams ( id, league_id )
          `,
          )
          .eq("user_id", uid)
          .eq("team.league_id", leagueId)
          .maybeSingle();

        if (utErr) throw utErr;

        const utRow = utData?.[0] ?? null;
        const tId = utRow?.team?.id ?? null;

        if (!tId) {
          // importante: se non trovi team, vuol dire che non sei membro della lega
          Alert.alert(
            "Non sei nella lega",
            "Non risulti iscritto a questa lega.",
          );
          return;
        }
        if (!cancelled) setMyTeamId(tId);

        // PLAYERS (API-Football)
        const apiLeagueName = apiLeagueIdToName(leagueData.api_league_id);
        // apiLeagueIdToName deve restituire: "Serie A" / "Premier League" / "LaLiga" / "Bundesliga" / "Ligue 1"

        const pl = await getCompetitionPlayers(apiLeagueName);
        if (!cancelled) setPlayers(pl);
      } catch (e: any) {
        console.error("Listone load error:", e?.message ?? e);
        Alert.alert("Errore", e?.message ?? "Errore caricamento listone");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (leagueId) load();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [players, query]);

  async function onAddPlayer(p: CompetitionPlayer) {
    if (!myTeamId) return;

    try {
      setAddingId(p.id);

      // ✅ Opzione A (consigliata): RPC atomica
      // const { error } = await supabase.rpc("add_player_to_team", {
      //   p_team_id: myTeamId,
      //   p_player_id: p.id,
      //   p_player_name: p.name,
      //   p_team_real_id: p.team.id,
      //   p_role: p.position ?? null,
      // });

      // ✅ Opzione B (diretta): insert su tabella "team_players" (CAMBIA NOME TABELLA/COLONNE)
      const { error } = await supabase
        .from("team_players") // <-- CAMBIA con la tua tabella rosa
        .insert({
          team_id: myTeamId,
          player_id: p.id, // id API-Football
          player_name: p.name,
          role: p.position ?? null,
          real_team_id: p.team.id,
          real_team_name: p.team.name,
        });

      if (error) {
        // tipico: unique violation se già aggiunto
        if (String(error.message).toLowerCase().includes("duplicate")) {
          Alert.alert("Già presente", "Hai già questo giocatore in rosa.");
          return;
        }
        throw error;
      }

      Alert.alert("Aggiunto!", `${p.name} è stato aggiunto alla tua rosa.`);
    } catch (e: any) {
      console.error("Add player error:", e?.message ?? e);
      Alert.alert("Errore", e?.message ?? "Impossibile aggiungere giocatore");
    } finally {
      setAddingId(null);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        gap: 12,
        backgroundColor: colors.background,
      }}
    >
      <Text
        style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text }}
      >
        Listone{league?.name ? ` • ${league.name}` : ""}
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Cerca giocatore..."
        placeholderTextColor={colors.textSecondary}
        style={{
          borderWidth: 1,
          borderColor: colors.secondary,
          borderRadius: 8,
          padding: 10,
          color: colors.text,
          fontFamily: fonts.regular,
          fontSize: 12,
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const disabled = addingId === item.id;

          return (
            <View
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.secondary,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    color: colors.text,
                    fontSize: 12,
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    color: colors.textSecondary,
                    fontSize: 11,
                  }}
                  numberOfLines={1}
                >
                  {item.team?.name} • {item.position ?? "—"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onAddPlayer(item)}
                disabled={disabled}
                activeOpacity={0.85}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: colors.success,
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                {disabled ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      color: colors.primary,
                      fontSize: 11,
                    }}
                  >
                    Aggiungi
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}
