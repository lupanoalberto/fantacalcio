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
  budget: number; // ✅
  roster_size: number; // ✅
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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/ø/g, "o")
    .replace(/œ/g, "oe")
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

type RosterAgg = {
  count: number; // giocatori già presi
  spent: number; // crediti già spesi
};

export default function LeaguePlayersScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id;

  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [players, setPlayers] = useState<CompetitionPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ controlli UI
  const [roleFilter, setRoleFilter] = useState<CanonicalRole>("Portiere");
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // ✅ dati team + budget
  const [teamId, setTeamId] = useState<string | null>(null);
  const [agg, setAgg] = useState<RosterAgg>({ count: 0, spent: 0 });
  const [loadingBudget, setLoadingBudget] = useState(false);

  // Modal giocatore + azione
  const [selectedPlayer, setSelectedPlayer] =
    useState<CompetitionPlayer | null>(null);
  const [adding, setAdding] = useState(false);

  // ✅ prezzo
  const [priceText, setPriceText] = useState<string>("1");

  const rosterSize = league?.roster_size ?? 25;
  const totalBudget = league?.budget ?? 0;

  const playersTaken = agg.count;
  const spent = agg.spent;

  const remainingPlayers = Math.max(0, rosterSize - playersTaken);
  const budgetRemaining = Math.max(0, totalBudget - spent);

  // ✅ players già presi nella lega (api_player_id)
  const [takenIds, setTakenIds] = useState<Set<number>>(new Set());
  const [loadingTaken, setLoadingTaken] = useState(false);

  // Devi lasciare almeno (remainingPlayers - 1) crediti dopo l'acquisto (min 1 per ogni altro giocatore)
  // Quindi max prezzo acquistabile = budgetRemaining - (remainingPlayers - 1)
  const maxAffordableNow = Math.max(
    0,
    budgetRemaining - Math.max(0, remainingPlayers - 1),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);

        if (!leagueId || !isUuidLike(leagueId)) {
          throw new Error(`Invalid league id: ${String(leagueId)}`);
        }

        // session
        const { data: sess, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) throw sessErr;

        const uid = sess.session?.user?.id;
        if (!uid) {
          router.push("/(auth)/login" as any);
          return;
        }

        // 1) carico lega (aggiungo budget + roster_size)
        const { data: lg, error: lgErr } = await supabase
          .from("leagues")
          .select("id,name,api_league_id,season,budget,roster_size")
          .eq("id", leagueId)
          .maybeSingle();

        if (lgErr) throw lgErr;
        if (!lg) throw new Error("League not found");

        if (!cancelled) {
          setLeague({
            id: lg.id,
            name: lg.name ?? "",
            api_league_id: lg.api_league_id ?? null,
            season: lg.season ?? null,
            budget: Number(lg.budget ?? 0),
            roster_size: Number(lg.roster_size ?? 25),
          });
        }

        // 2) prendo la mia squadra in questa lega (prima riga)
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
          .eq("user_id", uid);

        if (utErr) throw utErr;

        const rows = Array.isArray(utData) ? utData : [];
        const myTeamId =
          (rows as any).find(
            (r: any) => String(r?.team?.league_id) === String(leagueId),
          )?.team?.id ?? null;

        if (!myTeamId)
          throw new Error("Non ho trovato la tua squadra in questa lega.");

        if (!cancelled) setTeamId(String(myTeamId));

        // 3) carico players da API-Football
        const leagueName = apiLeagueIdToLeagueName(lg.api_league_id ?? null);
        const apiPlayers = await getCompetitionPlayers(leagueName);

        if (cancelled) return;
        setPlayers(apiPlayers);

        // reset controlli
        setRoleFilter("Portiere");
        setQuery("");
        setSortDir("asc");
      } catch (err: any) {
        console.error("Listone load error:", err?.message ?? err);
        if (!cancelled) {
          setLeague(null);
          setPlayers([]);
          setTeamId(null);
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

  async function refreshBudgetAndRoster() {
    if (!teamId) return;
    try {
      setLoadingBudget(true);

      // count giocatori presi + somma price
      const { data, error } = await supabase
        .from("rosters")
        .select("price, released_at")
        .eq("team_id", teamId);

      if (error) throw error;

      const active = (data ?? []).filter((r: any) => r.released_at == null);

      const count = active.length;
      const spent = active.reduce(
        (acc: number, r: any) => acc + (Number(r.price ?? 0) || 0),
        0,
      );

      setAgg({ count, spent });
    } catch (e: any) {
      console.error("refreshBudgetAndRoster error:", e?.message ?? e);
      // non blocco UI
    } finally {
      setLoadingBudget(false);
    }
  }

  // refresh budget quando ho teamId/league pronta
  useEffect(() => {
    refreshBudgetAndRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function refreshTakenInLeague() {
    if (!leagueId || !isUuidLike(leagueId)) return;

    try {
      setLoadingTaken(true);

      // 1) team della lega
      const { data: tData, error: tErr } = await supabase
        .from("teams")
        .select("id")
        .eq("league_id", leagueId);

      if (tErr) throw tErr;

      const teamIds = (tData ?? []).map((t: any) => t.id).filter(Boolean);
      if (teamIds.length === 0) {
        setTakenIds(new Set());
        return;
      }

      // 2) rosters attivi di quei team
      const { data: rData, error: rErr } = await supabase
        .from("rosters")
        .select("api_player_id, released_at")
        .in("team_id", teamIds)
        .is("released_at", null);

      if (rErr) throw rErr;

      const s = new Set<number>();
      (rData ?? []).forEach((r: any) => {
        const id = Number(r.api_player_id);
        if (Number.isFinite(id)) s.add(id);
      });

      setTakenIds(s);
    } catch (e: any) {
      console.error("refreshTakenInLeague error:", e?.message ?? e);
      // non blocco UI
    } finally {
      setLoadingTaken(false);
    }
  }

  useEffect(() => {
    if (!leagueId || !isUuidLike(leagueId)) return;

    const t = setInterval(() => {
      refreshTakenInLeague();
    }, 1000); // ogni 15s

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  useEffect(() => {
    refreshTakenInLeague();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, teamId]);

  // ✅ Lista visibile: filtro per ruolo + search + sort + filtro budget
  const visiblePlayers = useMemo(() => {
    const q = normalizeForSearch(query);

    let list = [...players];

    // ruolo (sempre attivo)
    list = list.filter((p) => mapRole(p.position) === roleFilter);

    // ricerca (accent-insensitive)
    if (q.length > 0) {
      list = list.filter((p) => {
        const name = normalizeForSearch(p.name ?? "");
        const team = normalizeForSearch(
          p.team?.name ?? p.team?.shortName ?? "",
        );
        return name.includes(q) || team.includes(q);
      });
    }

    // filtro: nascondo quelli già presi nella lega
    list = list.filter((p) => !takenIds.has(Number(p.id)));

    // sort
    list.sort((a, b) => {
      const cmp = (a.name ?? "").localeCompare(b.name ?? "", "it", {
        sensitivity: "base",
      });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [players, roleFilter, query, sortDir]);

  function parsePrice(v: string): number {
    const n = Number(String(v).replace(",", "."));
    if (!Number.isFinite(n)) return 0;
    return Math.floor(n);
  }

  async function addPlayerToMyTeam(player: CompetitionPlayer, price: number) {
    try {
      // ✅ optimistic: aggiorno subito la UI
      setTakenIds((prev) => {
        const next = new Set(prev);
        next.add(Number(player.id));
        return next;
      });

      await refreshBudgetAndRoster();
      await refreshTakenInLeague();

      if (!teamId) {
        Alert.alert("Errore", "Team non trovato.");
        return;
      }

      if (!leagueId || !isUuidLike(leagueId)) {
        Alert.alert("Errore", "ID lega non valido.");
        return;
      }

      // validazioni prezzo
      if (!Number.isFinite(price) || price < 1) {
        Alert.alert(
          "Prezzo non valido",
          "Inserisci un prezzo minimo di 1 credito.",
        );
        return;
      }

      // se roster piena
      if (remainingPlayers <= 0) {
        Alert.alert("Rosa completa", "Hai già completato la rosa.");
        return;
      }

      // budget intelligente (devi poter comprare i restanti a 1)
      if (price > maxAffordableNow) {
        Alert.alert(
          "Budget insufficiente",
          `Puoi spendere massimo ${maxAffordableNow} crediti adesso (devi lasciare almeno ${Math.max(
            0,
            remainingPlayers - 1,
          )} crediti per completare la rosa).`,
        );
        return;
      }

      setAdding(true);

      // doppione? (stesso api_player_id nella tua rosa)
      const { data: already, error: alreadyErr } = await supabase
        .from("rosters")
        .select("id")
        .eq("team_id", teamId)
        .eq("api_player_id", player.id)
        .is("released_at", null)
        .limit(1);

      if (alreadyErr) throw alreadyErr;
      if ((already ?? []).length > 0) {
        Alert.alert(
          "Giocatore già presente",
          "Hai già questo giocatore in rosa.",
        );
        return;
      }

      const payload = {
        team_id: teamId,
        api_player_id: player.id,
        price: price,
        cached_display_name: player.name ?? null,
        cached_role: mapRole(player.position) ?? null,
        cached_team_name: player.team?.name ?? player.team?.shortName ?? null,
      };

      // ✅ blocco immediato UI
      if (takenIds.has(Number(player.id))) {
        Alert.alert(
          "Non disponibile",
          "Questo giocatore è già stato acquistato da un'altra squadra.",
        );
        return;
      }

      const { error } = await supabase.rpc("buy_player", {
        p_league_id: leagueId,
        p_api_player_id: Number(player.id),
        p_price: price,
        p_cached_display_name: player.name ?? null,
        p_cached_role: mapRole(player.position) ?? null,
        p_cached_team_name: player.team?.name ?? player.team?.shortName ?? null,
      });

      if (error) {
        // messaggi più chiari per i casi comuni
        const msg = String(error.message ?? "");
        if (msg.toLowerCase().includes("already taken")) {
          Alert.alert(
            "Non disponibile",
            "Questo giocatore è già stato acquistato da un'altra squadra.",
          );
        } else if (msg.toLowerCase().includes("not enough budget")) {
          Alert.alert("Budget insufficiente", msg);
        } else if (msg.toLowerCase().includes("roster is full")) {
          Alert.alert("Rosa completa", "Hai già completato la rosa.");
        } else {
          Alert.alert("Errore", error.message);
        }
        return;
      }

      // aggiorno contatori/budget e chiudo
      await refreshBudgetAndRoster();
      Alert.alert("Ok!", `${player.name} acquistato a ${price} crediti.`);
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
    const isTaken = takenIds.has(Number(player.id));
    const disabled = isTaken; // puoi aggiungere altre condizioni

    const photo =
      player?.photo ??
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

    return (
      <TouchableOpacity
        key={`${player.id}`}
        activeOpacity={0.85}
        disabled={disabled}
        onPress={() => {
          if (disabled) return;
          setSelectedPlayer(player);
          setPriceText("1");
        }}
        style={[
          styles.row,
          { borderColor: colors.secondary, opacity: disabled ? 0.4 : 1 },
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

        {isTaken ? (
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 10,
              color: colors.textSecondary,
            }}
          >
            PRESO
          </Text>
        ) : (
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={colors.success}
          />
        )}
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

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.semibold,
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {headerTitle}
            </Text>

            {/* ✅ Riga budget */}
            <Text
              style={{
                marginTop: 2,
                fontSize: 10,
                fontFamily: fonts.regular,
                color: colors.textSecondary,
              }}
              numberOfLines={1}
            >
              Budget: {budgetRemaining}/{totalBudget} • Rosa: {playersTaken}/
              {rosterSize}
              {loadingBudget ? " • aggiorno..." : ""}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : (
          <>
            {/* ✅ CONTROLLI */}
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
              Giocatore selezionato
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
                onPress={() =>
                  addPlayerToMyTeam(selectedPlayer, parsePrice(priceText))
                }
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
                <Text></Text>
              </TouchableOpacity>

              {/* ✅ Budget info + prezzo */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 11,
                  }}
                >
                  Budget disponibile: {budgetRemaining} • Giocatori mancanti:{" "}
                  {remainingPlayers} • Max ora: {maxAffordableNow}
                </Text>

                <TextInput
                  value={priceText}
                  onChangeText={setPriceText}
                  keyboardType="numeric"
                  placeholder="Prezzo (min 1)"
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
              </View>

              <TouchableOpacity
                onPress={() =>
                  addPlayerToMyTeam(selectedPlayer, parsePrice(priceText))
                }
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
                    Conferma acquisto
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
