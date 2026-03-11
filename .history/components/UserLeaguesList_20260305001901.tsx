// components/UserLeaguesList.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { Href, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { apiLeagueIdToName } from "@/utils/leagueName";

const LEAGUE_LOGOS: Record<number, any> = {
  39: require("@/assets/flags/england.png"),
  61: require("@/assets/flags/france.png"),
  78: require("@/assets/flags/germany.png"),
  135: require("@/assets/flags/italy.png"),
  140: require("@/assets/flags/spain.png"),
};

type UserLeagueRow = {
  // leagues.*
  id: string; // league id (uuid)
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code: number | null;

  mode: "CLASSICO" | "MANTRA" | null;
  mod_enabled: boolean | null;
  mod_type: "MOD_DIFESA" | null;

  // derived from join (user_team -> teams)
  myTeam: { id: string; name: string };
  myRole: "OWNER" | "MEMBER" | null;
};

// tipi “DB minimal” per le query a step
type DbUserTeamRow = {
  team_id: string;
  role: "OWNER" | "CO_OWNER" | "MEMBER" | null; // nel DB è OWNER/CO_OWNER, nell'app magari hai MEMBER
};

type DbTeamRow = {
  id: string;
  name: string;
  league_id: string;
};

type DbLeagueRow = {
  id: string;
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code: string | number | null; // bigint può arrivare come string
  mode: "CLASSICO" | "MANTRA" | null;
  mod_enabled: boolean | null;
  mod_type: "MOD_DIFESA" | null;
};

export default function UserLeaguesList() {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserLeagueRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const { data: sess, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) throw sessErr;

        const uid = sess.session?.user?.id;
        if (!uid) {
          if (!cancelled) setRows([]);
          return;
        }

        // ✅ 1) user_team (NO JOIN)
        const { data, error } = await supabase
          .from("user_team")
          .select("user_id, team_id, role")
          .eq("user_id", uid);

        console.log("user_team ONLY:", data, error);

        if (error) throw error;

        const utRows = (data ?? []) as DbUserTeamRow[];
        if (!utRows.length) {
          if (!cancelled) setRows([]);
          return;
        }

        const teamIds = utRows.map((r) => r.team_id);

        // ✅ 2) teams (NO JOIN)
        const { data: tData, error: tErr } = await supabase
          .from("teams")
          .select("id, name, league_id")
          .in("id", teamIds);

        if (tErr) throw tErr;

        const teamRows = (tData ?? []) as DbTeamRow[];
        if (!teamRows.length) {
          if (!cancelled) setRows([]);
          return;
        }

        const leagueIds = Array.from(new Set(teamRows.map((t) => t.league_id)));

        // ✅ 3) leagues (NO JOIN)
        const { data: lData, error: lErr } = await supabase
          .from("leagues")
          .select(
            "id, name, api_league_id, season, join_code, mode, mod_enabled, mod_type",
          )
          .in("id", leagueIds);

        if (lErr) throw lErr;

        const leagueRows = (lData ?? []) as DbLeagueRow[];

        const teamById = new Map(teamRows.map((t) => [t.id, t]));
        const leagueById = new Map(leagueRows.map((l) => [l.id, l]));

        // ✅ mapping identico al tuo, ma senza embed
        const mapped = utRows
          .map((ut): UserLeagueRow | null => {
            const team = teamById.get(ut.team_id);
            if (!team?.id) return null;

            const league = leagueById.get(team.league_id);
            if (!league?.id) return null;

            // normalizzo il ruolo per il tipo attuale (OWNER/MEMBER)
            const myRole: "OWNER" | "MEMBER" | null =
              ut.role === "OWNER" || ut.role === "CO_OWNER"
                ? "OWNER"
                : ut.role === "MEMBER"
                  ? "MEMBER"
                  : null;

            return {
              id: league.id,
              name: league.name ?? "",
              api_league_id: league.api_league_id ?? null,
              season: league.season ?? null,
              join_code:
                league.join_code == null ? null : Number(league.join_code),

              mode: league.mode ?? null,
              mod_enabled: league.mod_enabled ?? null,
              mod_type: league.mod_type ?? null,

              myTeam: { id: team.id, name: team.name ?? "" },
              myRole,
            };
          })
          .filter((x): x is UserLeagueRow => x !== null);

        if (!cancelled) setRows(mapped);
      } catch (e: any) {
        console.error("UserLeaguesList load error:", e?.message ?? e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <ActivityIndicator />;

  if (!rows.length) {
    return (
      <Text
        style={{
          fontSize: 12,
          paddingHorizontal: 12,
          fontFamily: fonts.regular,
          color: colors.text,
        }}
      >
        Non partecipi ancora a nessuna lega.
      </Text>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {rows.map((row) => {
        const leagueLogo =
          row.api_league_id != null
            ? LEAGUE_LOGOS[row.api_league_id]
            : undefined;

        return (
          <TouchableOpacity
            key={`${row.id}-${row.myTeam.id}`}
            onPress={() => router.push(`/leagues/${row.id}` as Href)}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.card,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.opacity,
              }}
            ></View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  color: colors.white,
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                {row.myTeam.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Image source={leagueLogo} style={styles.logo} />
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    color: colors.textSecondary,
                    fontSize: 10,
                  }}
                  numberOfLines={1}
                >
                  {row.name}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 16,
    aspectRatio: 1 / 1,
  },
});
