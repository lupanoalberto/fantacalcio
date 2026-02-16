// components/UserLeaguesList.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native";
import { Href, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { apiLeagueIdToName } from "@/utils/leagueName";

const LEAGUE_LOGOS: Record<number, any> = {
  135: require("@/assets/img/serie-a.png"),
  39: require("@/assets/img/premier-league.png"),
  140: require("@/assets/img/laliga.png"),
  78: require("@/assets/img/bundesliga.png"),
  61: require("@/assets/img/ligue-1.png"),
};

type UserLeagueRow = {
  id: string; // league id
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code: number | null;

  mode: "CLASSICO" | "MANTRA" | null;
  mod_enabled: boolean | null;
  mod_type: "MOD_DIFESA" | null;

  myTeam: { id: string; name: string };
  myRole: "OWNER" | "CO_OWNER" | null;
};

type DbUserTeam = { team_id: string; role: "OWNER" | "CO_OWNER" };
type DbTeam = { id: string; name: string; league_id: string };
type DbLeague = {
  id: string;
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code: any; // bigint può arrivare string
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

        // 1) prendo solo user_team (NO JOIN)
        const { data: ut, error: utErr } = await supabase
          .from("user_team")
          .select("team_id, role")
          .eq("user_id", uid);

        if (utErr) throw utErr;

        const utRows = (ut ?? []) as DbUserTeam[];
        if (!utRows.length) {
          if (!cancelled) setRows([]);
          return;
        }

        const teamIds = utRows.map((r) => r.team_id);

        // 2) carico teams (NO JOIN)
        const { data: teams, error: tErr } = await supabase
          .from("teams")
          .select("id, name, league_id")
          .in("id", teamIds);

        if (tErr) throw tErr;

        const teamRows = (teams ?? []) as DbTeam[];
        if (!teamRows.length) {
          if (!cancelled) setRows([]);
          return;
        }

        const leagueIds = Array.from(new Set(teamRows.map((t) => t.league_id)));

        // 3) carico leagues
        const { data: leagues, error: lErr } = await supabase
          .from("leagues")
          .select("id, name, api_league_id, season, join_code, mode, mod_enabled, mod_type")
          .in("id", leagueIds);

        if (lErr) throw lErr;

        const leagueRows = (leagues ?? []) as DbLeague[];

        // map veloci
        const teamById = new Map(teamRows.map((t) => [t.id, t]));
        const leagueById = new Map(leagueRows.map((l) => [l.id, l]));

        const mapped: UserLeagueRow[] = utRows
          .map((r) => {
            const team = teamById.get(r.team_id);
            if (!team) return null;

            const league = leagueById.get(team.league_id);
            if (!league) return null;

            return {
              id: league.id,
              name: league.name ?? "",
              api_league_id: league.api_league_id ?? null,
              season: league.season ?? null,
              join_code: league.join_code == null ? null : Number(league.join_code),

              mode: league.mode ?? null,
              mod_enabled: league.mod_enabled ?? null,
              mod_type: league.mod_type ?? null,

              myTeam: { id: team.id, name: team.name ?? "" },
              myRole: r.role ?? null,
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
          color: colors.textSecondary,
        }}
      >
        Non partecipi ancora a nessuna lega.
      </Text>
    );
  }

  return (
    <View style={{ gap: 12, paddingHorizontal: 12 }}>
      {rows.map((row) => {
        const leagueLogo =
          row.api_league_id != null ? LEAGUE_LOGOS[row.api_league_id] : undefined;

        return (
          <TouchableOpacity
            key={`${row.id}-${row.myTeam.id}`}
            onPress={() => router.push(`/leagues/${row.id}` as Href)}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.secondary,
              backgroundColor: colors.primary,
            }}
          >
            <View style={styles.logo}>
              {leagueLogo ? (
                <Image source={leagueLogo} style={{ width: "100%", height: "100%", resizeMode: "contain" }} />
              ) : null}
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  fontSize: 10,
                  textTransform: "uppercase",
                }}
              >
                {apiLeagueIdToName(row.api_league_id)}
              </Text>

              <Text style={{ fontFamily: fonts.semibold, color: colors.text, fontSize: 12 }} numberOfLines={1}>
                {row.name}
              </Text>

              <Text style={{ fontFamily: fonts.regular, color: colors.success, fontSize: 10 }} numberOfLines={1}>
                {row.myTeam.name}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.text,
    padding: 8,
  },
});
