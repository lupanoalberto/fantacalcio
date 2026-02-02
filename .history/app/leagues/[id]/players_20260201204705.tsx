import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

import {
  getCompetitionPlayers,
  CompetitionPlayer,
} from "@/services/footballApi";

type SortDir = "asc" | "desc";
type CanonicalRole = "Portiere" | "Difensore" | "Centrocampista" | "Attaccante";

type LeagueRow = {
  id: string;
  name: string;
  api_league_id: number | null;
  season: number | null;
};

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

function apiLeagueIdToLeagueName(apiLeagueId: number | null): string {
  switch (apiLeagueId) {
    case 135:
      return "Serie A";
    case 39:
      return "Premier League";
    case 140:
      return "LaLiga";
    case 78:
      return "Bundesliga";
    case 61:
      return "Ligue 1";
    default:
      return "Serie A";
  }
}

function normalizeForSearch(s: string) {
  return (s ?? "")
    .normalize("NFD") // separa lettere e diacritici
    .replace(/[\u0300-\u036f]/g, "") // rimuove diacritici (accenti)
    .toLowerCase()
    .trim();
}

function mapRole(position?: string): CanonicalRole | null {
  if (!position) return null;
  const p = position.toLowerCase().trim();

  if (
    p.includes("goalkeeper") ||
    p.includes("keeper") ||
    p === "gk" ||
    p.includes("portiere")
  )
    return "Portiere";

  if (
    p.includes("defender") ||
    p.includes("back") ||
    p.includes("centre-back") ||
    p.includes("center-back") ||
    p.includes("fullback") ||
    p.includes("difens")
  )
    return "Difensore";

  if (
    p.includes("midfielder") ||
    p.includes("midfield") ||
    p.includes("winger") ||
    p.includes("wide") ||
    p.includes("centrocamp")
  )
    return "Centrocampista";

  if (
    p.includes("forward") ||
    p.includes("striker") ||
    p.includes("attacker") ||
    p.includes("second striker") ||
    p.includes("wing") ||
    p.includes("attacc")
  )
    return "Attaccante";

  return null;
}

export default function LeaguePlayersScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id;

  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [players, setPlayers] = useState<CompetitionPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Nuovi controlli UI
  const [roleFilter, setRoleFilter] = useState<CanonicalRole>("Portiere");
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Modal giocatore + azione
  const [selectedPlayer, setSelectedPlayer] =
    useState<CompetitionPlayer | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);

        if (!leagueId || !isUuidLike(leagueId)) {
          throw new Error(`Invalid league id: ${String(leagueId)}`);
        }

        // 1) carico lega
        const { data: lg, error: lgErr } = await supabase
          .from("leagues")
          .select("id,name,api_league_id,season")
          .eq("id", leagueId)
          .maybeSingle();

        if (lgErr) throw lgErr;
        if (!lg) throw new Error("League not found");

        if (!cancelled) setLeague(lg as LeagueRow);

        // 2) carico players dalla competition collegata (API-Football)
        const leagueName = apiLeagueIdToLeagueName(lg.api_league_id ?? null);
        const data = await getCompetitionPlayers(leagueName);

        if (cancelled) return;
        setPlayers(data);

        // reset controlli
        setRoleFilter("Portiere");
        setQuery("");
        setSortDir("asc");
      } catch (err: any) {
        console.error("Listone load error:", err?.message ?? err);
        if (!cancelled) {
          setLeague(null);
          setPlayers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  // ✅ Lista visibile: filtro per ruolo + search + sort
  const visiblePlayers = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = [...players];

    // ruolo (sempre attivo)
    list = list.filter((p) => mapRole(p.position) === roleFilter);

    // ricerca
    if (q.length > 0) {
      list = list.filter((p) => {
        const name = (p.name ?? "").toLowerCase();
        const team = (p.team?.name ?? p.team?.shortName ?? "").toLowerCase();
        return name.includes(q) || team.includes(q);
      });
    }

    // sort
    list.sort((a, b) => {
      const cmp = (a.name ?? "").localeCompare(b.name ?? "", "it", {
        sensitivity: "base",
      });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [players, roleFilter, query, sortDir]);

  async function addPlayerToMyTeam(player: CompetitionPlayer) {
    try {
      setAdding(true);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) {
        Alert.alert(
          "Login richiesto",
          "Devi essere loggato per aggiungere giocatori.",
        );
        router.push("/(auth)/login" as any);
        return;
      }

      if (!leagueId || !isUuidLike(leagueId)) {
        Alert.alert("Errore", "ID lega non valido.");
        return;
      }

      // ✅ prendo la tua squadra in questa lega (prima riga)
      const { data: utData, error: utErr } = await supabase
        .from("user_team")
        .select(
          `
            team:teams (
              id,
              league_id
            )
          `,
        )
        .eq("user_id", uid)
        .eq("team.league_id", leagueId);

      if (utErr) throw utErr;

      const teamId =
        (utData as any)?.[0]?.team?.id ??
        (utData as any)?.[0]?.team?.[0]?.id ??
        null;

      if (!teamId) {
        Alert.alert("Errore", "Non ho trovato la tua squadra in questa lega.");
        return;
      }

      // ⚠️ QUI DEVI METTERE IL NOME TABELLA GIUSTO DELLA ROSA
      // Nel tuo codice avevi "rosters" ma poi in un altro punto parlavi di "team_players"
      // Se la tua tabella si chiama diversamente, cambia qui.
      const payload = {
        team_id: teamId,
        api_player_id: player.id,
      };

      const { data, error } = await supabase
        .from("rosters") // <--- cambia se serve
        .insert(payload)
        .select("*")
        .single();

      console.log("ADD PLAYER payload:", payload);
      console.log("ADD PLAYER data:", data);
      console.log("ADD PLAYER error:", error);

      if (error) {
        Alert.alert("Errore insert", error.message);
        return;
      }

      Alert.alert("Ok!", `${player.name} aggiunto alla tua squadra.`);
      setSelectedPlayer(null);
    } catch (e: any) {
      console.error("addPlayerToMyTeam error:", e?.message ?? e);
      Alert.alert(
        "Errore",
        e?.message ?? "Impossibile aggiungere il giocatore.",
      );
    } finally {
      setAdding(false);
    }
  }

  const renderPlayerRow = (player: CompetitionPlayer) => {
    const role = mapRole(player.position) ?? "-";
    const photo =
      player?.photo ??
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

    return (
      <TouchableOpacity
        key={`${player.id}`}
        activeOpacity={0.85}
        onPress={() => setSelectedPlayer(player)}
        style={[
          styles.row,
          {
            borderColor: colors.secondary,
          },
        ]}
      >
        <Image
          source={{ uri: photo }}
          style={{ width: 48, height: 48, borderRadius: 12 }}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
            numberOfLines={1}
          >
            {player.name}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 10,
            }}
          >
            {role} • {player.team?.shortName ?? player.team?.name ?? "—"}
          </Text>
        </View>

        <Ionicons name="add-circle-outline" size={20} color={colors.success} />
      </TouchableOpacity>
    );
  };

  const headerTitle = league?.name ? `Listone • ${league.name}` : "Listone";

  const RoleButton = ({
    label,
    role,
  }: {
    label: string;
    role: CanonicalRole;
  }) => {
    const active = roleFilter === role;
    return (
      <TouchableOpacity
        onPress={() => setRoleFilter(role)}
        activeOpacity={0.85}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: active ? colors.success : colors.secondary,
          backgroundColor: active ? colors.secondary : colors.background,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.semibold,
            color: colors.text,
            fontSize: 11,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
      >
        {/* HEADER */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            paddingTop: insets.top + 12,
            paddingLeft: 12,
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/");
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 16,
              fontFamily: fonts.semibold,
              color: colors.text,
            }}
          >
            {headerTitle}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : (
          <>
            {/* ✅ CONTROLLI NUOVI */}
            <View style={{ paddingHorizontal: 12, gap: 12 }}>
              {/* bottoni ruolo */}
              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <RoleButton label="Portieri" role="Portiere" />
                <RoleButton label="Difensori" role="Difensore" />
                <RoleButton label="Centrocampisti" role="Centrocampista" />
                <RoleButton label="Attaccanti" role="Attaccante" />
              </View>

              {/* search + ordinamento */}
              <View style={{ gap: 12 }}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Cerca giocatore o squadra..."
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.secondary,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontFamily: fonts.regular,
                    color: colors.text,
                    fontSize: 12,
                  }}
                />

                <TouchableOpacity
                  onPress={() =>
                    setSortDir((s) => (s === "asc" ? "desc" : "asc"))
                  }
                  activeOpacity={0.85}
                  style={{
                    alignSelf: "flex-start",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.secondary,
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name={sortDir === "asc" ? "arrow-up" : "arrow-down"}
                    size={16}
                    color={colors.text}
                  />
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      color: colors.text,
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  >
                    {sortDir === "asc" ? "A → Z" : "Z → A"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                  textAlign: "left",
                }}
              >
                {visiblePlayers.length} giocatori
              </Text>
            </View>

            {/* LISTA */}
            <View style={{ flexDirection: "column" }}>
              {visiblePlayers.map(renderPlayerRow)}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal giocatore */}
      <Modal
        visible={!!selectedPlayer}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setSelectedPlayer(null)}
        />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHeader}>
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              Aggiungi giocatore
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedPlayer(null)}
              hitSlop={10}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {selectedPlayer ? (
            <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 12 }}>
              <View
                style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
              >
                <Image
                  source={{
                    uri:
                      selectedPlayer.photo ??
                      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
                  }}
                  style={{ width: 56, height: 56, borderRadius: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                    }}
                  >
                    {selectedPlayer.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontFamily: fonts.regular,
                      fontSize: 11,
                    }}
                  >
                    {mapRole(selectedPlayer.position) ?? "-"} •{" "}
                    {selectedPlayer.team?.shortName ??
                      selectedPlayer.team?.name ??
                      "—"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => addPlayerToMyTeam(selectedPlayer)}
                activeOpacity={0.85}
                disabled={adding}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.success,
                  opacity: adding ? 0.6 : 1,
                  alignItems: "center",
                }}
              >
                {adding ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: fonts.bold,
                      fontSize: 12,
                    }}
                  >
                    Aggiungi alla mia squadra
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingBottom: 0,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
