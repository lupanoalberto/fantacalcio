// app/leagues/[id]/teams.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

type TeamRow = {
  id: string;
  league_id: string;
  name: string;
};

type UserTeamRow = {
  user_id: string;
  team_id: string;
  role: "OWNER" | "CO_OWNER" | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type UiTeam = {
  id: string;
  name: string;
  ownerLabel?: string; // username/display_name/email fallback
  isMine?: boolean;
  myRole?: "OWNER" | "CO_OWNER" | null;
};

export default function LeagueTeamsScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id;

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<UiTeam[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!leagueId || !isUuidLike(leagueId)) {
          throw new Error(`ID lega non valido: ${String(leagueId)}`);
        }

        // session (per capire quale team è "mio" e che ruolo ho)
        const { data: sess, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) throw sessErr;
        const uid = sess.session?.user?.id ?? null;

        // 1) teams della lega (NO JOIN)
        const { data, error } = await supabase
  .from("teams")
  .select("id, name, league_id")
  .eq("league_id", leagueId)
  .order("created_at", { ascending: true });

          .order("created_at", { ascending: true });

        if (tErr) throw tErr;

        const teamRows = (tData ?? []) as TeamRow[];
        if (!teamRows.length) {
          if (!cancelled) setTeams([]);
          return;
        }

        const teamIds = teamRows.map((t) => t.id);

        // 2) user_team per quelle squadre (NO JOIN)
        const { data: utData, error: utErr } = await supabase
          .from("user_team")
          .select("user_id, team_id, role")
          .in("team_id", teamIds);

        if (utErr) throw utErr;

        const userTeams = (utData ?? []) as UserTeamRow[];

        // owner per team (prendo il primo OWNER/CO_OWNER che trovo)
        const ownerByTeam = new Map<string, string>();
        const ownerUserIds: string[] = [];

        for (const ut of userTeams) {
          if (!ut?.team_id || !ut?.user_id) continue;
          if (ut.role !== "OWNER" && ut.role !== "CO_OWNER") continue;

          // se già assegnato owner, skip
          if (!ownerByTeam.has(ut.team_id)) {
            ownerByTeam.set(ut.team_id, ut.user_id);
            ownerUserIds.push(ut.user_id);
          }
        }

        // 3) profiles degli owner (NO JOIN)
        let profiles: ProfileRow[] = [];
        if (ownerUserIds.length > 0) {
          const { data: pData, error: pErr } = await supabase
            .from("profiles")
            .select("id, username, display_name")
            .in("id", Array.from(new Set(ownerUserIds)));

          if (pErr) throw pErr;
          profiles = (pData ?? []) as ProfileRow[];
        }

        const profileById = new Map(profiles.map((p) => [p.id, p]));

        // 4) mappo UI
        const myByTeam = new Map<string, { role: UiTeam["myRole"] }>();
        if (uid) {
          for (const ut of userTeams) {
            if (ut.user_id === uid) {
              myByTeam.set(ut.team_id, { role: ut.role });
            }
          }
        }

        const mapped: UiTeam[] = teamRows.map((t) => {
          const ownerUid = ownerByTeam.get(t.id);
          const prof = ownerUid ? profileById.get(ownerUid) : undefined;
          const ownerLabel =
            (prof?.username ?? prof?.display_name ?? "").trim() || undefined;

          const mine = myByTeam.get(t.id);

          return {
            id: t.id,
            name: t.name,
            ownerLabel,
            isMine: !!mine,
            myRole: mine?.role ?? null,
          };
        });

        if (!cancelled) setTeams(mapped);
      } catch (e: any) {
        console.error("LeagueTeams load error:", e?.message ?? e);
        if (!cancelled) {
          setTeams([]);
          Alert.alert("Errore", e?.message ?? "Impossibile caricare le squadre.");
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

  const title = useMemo(() => "Squadre", []);

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
        contentContainerStyle={{ paddingBottom: 12, gap: 12 }}
      >
        {/* Header */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            paddingTop: insets.top + 12,
            paddingHorizontal: 12,
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/" as Href);
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: fonts.semibold,
              color: colors.text,
              fontSize: 16,
            }}
          >
            {title}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : teams.length === 0 ? (
          <Text
            style={{
              fontSize: 12,
              paddingHorizontal: 12,
              fontFamily: fonts.regular,
              color: colors.textSecondary,
            }}
          >
            Nessuna squadra in questa lega.
          </Text>
        ) : (
          <View style={{ gap: 12, paddingHorizontal: 12 }}>
            {teams.map((t) => (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.85}
                onPress={() =>
                  router.push(
                    `/leagues/${String(leagueId)}/teams/${t.id}` as Href
                  )
                }
                style={{
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.secondary,
                  backgroundColor: colors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                    {t.name}
                    {t.isMine ? " • (La mia)" : ""}
                  </Text>

                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      color: colors.textSecondary,
                      fontSize: 10,
                      marginTop: 4,
                    }}
                    numberOfLines={1}
                  >
                    {t.ownerLabel ? `Owner: ${t.ownerLabel}` : "Owner: —"}
                    {t.myRole ? `  •  Ruolo: ${t.myRole}` : ""}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
