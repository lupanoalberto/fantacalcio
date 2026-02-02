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

type ModType = "MOD_DIFESA";

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

function apiLeagueIdToLeagueName(apiLeagueId: number | null): string {
  // mappa coerente con il tuo progetto (API-Football)
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

  // Filtri
  const [roleFilter, setRoleFilter] = useState<CanonicalRole | "Tutti">(
    "Tutti",
  );
  const [teamFilter, setTeamFilter] = useState<string>("Tutte");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Modals filtri
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

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

        // 1) carico lega (per sapere api_league_id e season)
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

        // reset filtri
        setRoleFilter("Tutti");
        setTeamFilter("Tutte");
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

  // Ruoli fissi
  const roleOptions: (CanonicalRole | "Tutti")[] = [
    "Tutti",
    "Portiere",
    "Difensore",
    "Centrocampista",
    "Attaccante",
  ];

  // Squadre dai dati
  const teamOptions = useMemo(() => {
    const map = new Map<string, string>(); // teamId -> name
    players.forEach((p) => {
      const id = String(p.team?.id ?? "");
      if (!id) return;
      const name = p.team?.shortName ?? p.team?.name ?? "Sconosciuta";
      map.set(id, name);
    });

    const arr = Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "it"));

    return [{ id: "Tutte", name: "Tutte" }, ...arr];
  }, [players]);

  const teamLabel = useMemo(() => {
    if (teamFilter === "Tutte") return "Tutte";
    return teamOptions.find((t) => t.id === teamFilter)?.name ?? "—";
  }, [teamFilter, teamOptions]);

  // Filtri + sort applicati
  const visiblePlayers = useMemo(() => {
    let list = [...players];

    if (roleFilter !== "Tutti") {
      list = list.filter((p) => mapRole(p.position) === roleFilter);
    }

    if (teamFilter !== "Tutte") {
      list = list.filter((p) => String(p.team?.id) === teamFilter);
    }

    list.sort((a, b) => {
      const cmp = (a.name ?? "").localeCompare(b.name ?? "", "it", {
        sensitivity: "base",
      });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [players, roleFilter, teamFilter, sortDir]);

  const FilterChip = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        padding: 12,
        borderRadius: 16,
        backgroundColor: colors.secondary,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        alignSelf: "flex-start",
      }}
    >
      <View>
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: fonts.regular,
            fontSize: 10,
          }}
        >
          {label}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={12} color={colors.text} />
    </TouchableOpacity>
  );

  const Sheet = ({
    visible,
    title,
    onClose,
    children,
  }: {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.sheetHeader}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
          >
            {title}
          </Text>

          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </Modal>
  );

  const OptionRow = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.dayRow,
        {
          borderColor: colors.secondary ?? "rgba(0,0,0,0.08)",
          backgroundColor: active ? colors.secondary : colors.background,
        },
      ]}
    >
      <Text
        style={{ color: colors.text, fontFamily: fonts.regular, fontSize: 10 }}
      >
        {label}
      </Text>

      {active ? (
        <Ionicons name="checkmark" size={18} color={colors.success} />
      ) : null}
    </TouchableOpacity>
  );

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

      // ✅ QUI va la tua logica reale:
      // - recuperare il team dell’utente in questa lega (user_team -> teams)
      // - inserire player nella tabella rosa (es team_players / roster_players)
      //
      // Ti lascio un esempio robusto per ottenere il team id:
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

      // NB: qui può essere array -> prendo il primo
      const tId =
        (utData as any)?.[0]?.team?.id ??
        (utData as any)?.[0]?.team?.[0]?.id ??
        null;
      if (!tId) {
        Alert.alert("Errore", "Non ho trovato la tua squadra in questa lega.");
        return;
      }

      const payload = {
        team_id: tId, // assicurati sia uuid della squadra
        api_player_id: player.id, // o quello che usi tu
        // price: ...
      };

      const { data, error } = await supabase
        .from("rosters")
        .insert(payload)
        .select("*") // IMPORTANTISSIMO: ti fa tornare la riga inserita
        .single();

      console.log("ADD PLAYER payload:", payload);
      console.log("ADD PLAYER data:", data);
      console.log("ADD PLAYER error:", error);

      if (error) {
        Alert.alert("Errore insert", error.message);
        return;
      }

      Alert.alert(
        "Ok!",
        `${player.name} aggiunto (stub). Ora aggancia la query/RPC reale.`,
      );
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
          styles.dayRow,
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
            {/* FILTRI */}
            <View
              style={{
                width: "100%",
                flexDirection: "column",
                marginHorizontal: 12,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <FilterChip
                  label="Ruolo"
                  value={roleFilter}
                  onPress={() => setIsRoleOpen(true)}
                />
                <FilterChip
                  label="Squadra"
                  value={teamLabel}
                  onPress={() => setIsTeamOpen(true)}
                />
                <FilterChip
                  label="Ordine"
                  value={sortDir === "asc" ? "A → Z" : "Z → A"}
                  onPress={() => setIsSortOpen(true)}
                />
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

      {/* Sheet Ruolo */}
      <Sheet
        visible={isRoleOpen}
        title="Filtra per ruolo"
        onClose={() => setIsRoleOpen(false)}
      >
        <ScrollView
          style={{ maxHeight: 420 }}
          showsVerticalScrollIndicator={false}
        >
          {roleOptions.map((r) => (
            <OptionRow
              key={r}
              label={r}
              active={r === roleFilter}
              onPress={() => {
                setRoleFilter(r);
                setIsRoleOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </Sheet>

      {/* Sheet Squadra */}
      <Sheet
        visible={isTeamOpen}
        title="Filtra per squadra"
        onClose={() => setIsTeamOpen(false)}
      >
        <ScrollView
          style={{ maxHeight: 420 }}
          showsVerticalScrollIndicator={false}
        >
          {teamOptions.map((t) => (
            <OptionRow
              key={t.id}
              label={t.name}
              active={t.id === teamFilter}
              onPress={() => {
                setTeamFilter(t.id);
                setIsTeamOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </Sheet>

      {/* Sheet Ordinamento */}
      <Sheet
        visible={isSortOpen}
        title="Ordina"
        onClose={() => setIsSortOpen(false)}
      >
        <OptionRow
          label="A → Z"
          active={sortDir === "asc"}
          onPress={() => {
            setSortDir("asc");
            setIsSortOpen(false);
          }}
        />
        <OptionRow
          label="Z → A"
          active={sortDir === "desc"}
          onPress={() => {
            setSortDir("desc");
            setIsSortOpen(false);
          }}
        />
      </Sheet>

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
  dayRow: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
