import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

type CanonicalRole =
  | "Portiere"
  | "Difensore"
  | "Centrocampista"
  | "Attaccante"
  | "Altro";

function toCanonicalRole(role?: string | null): CanonicalRole {
  const r = (role ?? "").toLowerCase();
  if (r.includes("por") || r.includes("gk") || r.includes("goal"))
    return "Portiere";
  if (r.includes("dif") || r.includes("def")) return "Difensore";
  if (r.includes("cen") || r.includes("mid")) return "Centrocampista";
  if (r.includes("att") || r.includes("forw") || r.includes("strik"))
    return "Attaccante";
  return "Altro";
}

function isUuidLike(s?: string | null) {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
}

type TeamRow = {
  id: string;
  name: string;
  league_id: string;
};

type TeamPlayerRow = {
  id: string;
  team_id: string;
  api_player_id: number | null;
  player_name: string | null;
  role: string | null;
  player_photo?: string | null;
  price?: number | null;
};

export default function TeamPlayersScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
    teamId?: string | string[];
  }>();
  const leagueId = Array.isArray(params.id) ? params.id[0] : params.id;
  const teamId = Array.isArray(params.teamId)
    ? params.teamId[0]
    : params.teamId;

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [players, setPlayers] = useState<TeamPlayerRow[]>([]);

  // filtri UI
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<CanonicalRole | "Tutti">(
    "Tutti",
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!isUuidLike(leagueId) || !isUuidLike(teamId)) {
          throw new Error(
            `Parametri non validi: leagueId=${String(leagueId)} teamId=${String(teamId)}`,
          );
        }

        // 1) squadra
        const { data: t, error: tErr } = await supabase
          .from("teams")
          .select("id,name,league_id")
          .eq("id", teamId)
          .eq("league_id", leagueId)
          .single();

        if (tErr) throw tErr;

        // 2) giocatori della squadra (ROSA)
        // 🔧 Se la tua tabella si chiama diversamente, cambia qui.
        const { data: p, error: pErr } = await supabase
          .from("roster")
          .select("*")
          .eq("team_id", teamId);

        if (pErr) throw pErr;

        if (!cancelled) {
          setTeam(t as TeamRow);
          setPlayers((p ?? []) as TeamPlayerRow[]);
        }
      } catch (e: any) {
        console.error("TeamPlayers load error:", e?.message ?? e);
        Alert.alert("Errore", e?.message ?? "Impossibile caricare la squadra.");
        if (!cancelled) {
          setTeam(null);
          setPlayers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [leagueId, teamId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return players.filter((p) => {
      const name = (p.player_name ?? "").toLowerCase();
      const role = toCanonicalRole(p.role);

      const okName = !q || name.includes(q);
      const okRole = roleFilter === "Tutti" ? true : role === roleFilter;

      return okName && okRole;
    });
  }, [players, search, roleFilter]);

  const countByRole = useMemo(() => {
    const base: Record<CanonicalRole, number> = {
      Portiere: 0,
      Difensore: 0,
      Centrocampista: 0,
      Attaccante: 0,
      Altro: 0,
    };
    for (const p of players) base[toCanonicalRole(p.role)] += 1;
    return base;
  }, [players]);

  const RoleChip = ({
    label,
    value,
  }: {
    label: CanonicalRole | "Tutti";
    value?: number;
  }) => {
    const active = roleFilter === label;
    return (
      <TouchableOpacity
        onPress={() => setRoleFilter(label)}
        activeOpacity={0.85}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: active ? colors.success : colors.secondary,
          backgroundColor: active ? colors.secondary : colors.background,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 12,
            color: colors.text,
          }}
        >
          {label}
          {typeof value === "number" ? ` (${value})` : ""}
        </Text>
      </TouchableOpacity>
    );
  };

  const PlayerRow = ({ p }: { p: TeamPlayerRow }) => {
    const photo =
      p.player_photo ??
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 12,
          borderBottomWidth: 1,
          borderColor: colors.secondary,
        }}
      >
        <Image
          source={{ uri: photo }}
          style={{ width: 40, height: 40, borderRadius: 8 }}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 12,
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {p.player_name ?? "Sconosciuto"}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {toCanonicalRole(p.role)}
            {typeof p.price === "number" ? ` • ${p.price}` : ""}
          </Text>
        </View>

        {/* opzionale: link al profilo player */}
        {p.api_player_id ? (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/player/[id]" as any,
                params: { id: String(p.api_player_id) },
              })
            }
            activeOpacity={0.85}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.secondary,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 12,
                color: colors.text,
              }}
            >
              Dettagli
            </Text>
          </TouchableOpacity>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        )}
      </View>
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
      {/* Header custom */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.push("/" as any);
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 16,
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {team?.name ?? "Squadra"}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            {players.length} giocatori in rosa
          </Text>
        </View>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
          {/* Search */}
          <View style={{ paddingHorizontal: 12, marginTop: 12 }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cerca giocatore…"
              placeholderTextColor={colors.textSecondary}
              style={{
                borderWidth: 1,
                borderColor: colors.secondary,
                borderRadius: 8,
                padding: 12,
                fontFamily: fonts.regular,
                color: colors.text,
                fontSize: 12,
              }}
            />
          </View>

          {/* Role chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 12,
              gap: 12,
              paddingVertical: 12,
            }}
          >
            <RoleChip label="Tutti" value={players.length} />
            <RoleChip label="Portiere" value={countByRole.Portiere} />
            <RoleChip label="Difensore" value={countByRole.Difensore} />
            <RoleChip
              label="Centrocampista"
              value={countByRole.Centrocampista}
            />
            <RoleChip label="Attaccante" value={countByRole.Attaccante} />
          </ScrollView>

          {/* List */}
          {visible.length === 0 ? (
            <Text
              style={{
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontFamily: fonts.regular,
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              Nessun giocatore trovato.
            </Text>
          ) : (
            <View style={{ marginTop: 4 }}>
              {visible.map((p) => (
                <PlayerRow key={p.id} p={p} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
