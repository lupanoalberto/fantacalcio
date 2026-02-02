import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

type LeagueRow = {
  id: string;
  name: string;
};

type TeamRow = {
  id: string;
  name: string;
  league_id: string;
};

type TeamWithMeta = {
  id: string;
  name: string;
  ownersCount: number; // quanti OWNER (di solito 1)
  membersCount: number; // quanti membri totali (OWNER+MEMBER)
};

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

export default function LeagueTeamsScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id;

  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [teams, setTeams] = useState<TeamWithMeta[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (!leagueId || !isUuidLike(leagueId)) {
          throw new Error(`ID lega non valido: ${String(leagueId)}`);
        }

        // 1) carico la lega (per titolo pagina)
        const { data: lg, error: lgErr } = await supabase
          .from("leagues")
          .select("id,name")
          .eq("id", leagueId)
          .maybeSingle();

        if (lgErr) throw lgErr;
        if (!lg) throw new Error("Lega non trovata.");

        if (!cancelled) setLeague(lg as LeagueRow);

        // 2) carico tutte le squadre della lega + join su user_team per conteggi
        // NB: questa select ritorna "team" con dentro un array "user_team" (dipende da FK).
        const { data, error } = await supabase
          .from("teams")
          .select(
            `
              id,
              name,
              league_id,
              user_team:user_team (
                role
              )
            `
          )
          .eq("league_id", leagueId);

        if (error) throw error;

        const mapped: TeamWithMeta[] = (data ?? []).map((t: any) => {
          const roles: Array<{ role?: string }> = t?.user_team ?? [];
          const ownersCount = roles.filter((r) => r?.role === "OWNER").length;
          const membersCount = roles.length;

          return {
            id: String(t.id),
            name: String(t.name ?? ""),
            ownersCount,
            membersCount,
          };
        });

        // ordino per nome
        mapped.sort((a, b) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }));

        if (!cancelled) setTeams(mapped);
      } catch (e: any) {
        console.error("LeagueTeams load error:", e?.message ?? e);
        if (!cancelled) {
          setTeams([]);
          setErrorMsg(e?.message ?? "Errore nel caricamento squadre.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  const title = useMemo(() => {
    if (league?.name) return `Squadre • ${league.name}`;
    return "Squadre";
  }, [league?.name]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        {/* Header simile al players */}
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
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={{ fontSize: 16, fontFamily: fonts.semibold, color: colors.text }}>
            {title}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : errorMsg ? (
          <Text
            style={{
              paddingHorizontal: 12,
              fontFamily: fonts.regular,
              color: colors.textSecondary,
              fontSize: 12,
            }}
          >
            {errorMsg}
          </Text>
        ) : !teams.length ? (
          <Text
            style={{
              paddingHorizontal: 12,
              fontFamily: fonts.regular,
              color: colors.textSecondary,
              fontSize: 12,
            }}
          >
            Nessuna squadra trovata in questa lega.
          </Text>
        ) : (
          <View style={{ paddingHorizontal: 12, gap: 12 }}>
            <Text
              style={{
                fontFamily: fonts.regular,
                color: colors.textSecondary,
                fontSize: 10,
              }}
            >
              {teams.length} squadre
            </Text>

            {teams.map((t) => (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.85}
                // qui in futuro puoi aprire la scheda squadra: /leagues/[id]/teams/[teamId]
                onPress={() => {router.push(`/leagues/${leagueId}/teams/${t.id}` as any);}}
                style={[
                  styles.card,
                  {
                    borderColor: colors.secondary,
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.semibold,
                      color: colors.text,
                      fontSize: 12,
                    }}
                  >
                    {t.name}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.regular,
                      color: colors.textSecondary,
                      fontSize: 10,
                    }}
                  >
                    Owner: {t.ownersCount} • Membri: {t.membersCount}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
