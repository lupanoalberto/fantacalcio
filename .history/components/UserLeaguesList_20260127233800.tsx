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
  135: require("@/assets/img/135 1.png"),
  39: require("@/assets/img/39 1.png"),
  140: require("@/assets/img/140 1.png"),
  78: require("@/assets/img/798.png"),
  61: require("@/assets/img/ligue-1.png"),
};

type UserLeagueRow = {
  // leagues.*
  id: string; // league id (uuid)
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code: number | null; // in DB può essere bigint -> in JS arriva number (finché < 2^53)

  mode: "CLASSICO" | "MANTRA" | null;
  mod_enabled: boolean | null;
  mod_type: "MOD_DIFESA" | null;

  // derived from join (user_team -> teams)
  myTeam: { id: string; name: string }; // teams.id + teams.name
  myRole: "OWNER" | "MEMBER" | null; // user_team.role
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

        const { data, error } = await supabase
          .from("user_team")
          .select(
            `
              role,
              team:teams (
                id,
                name,
                league:leagues (
                  id,
                  name,
                  api_league_id,
                  season,
                  join_code,
                  mode,
                  mod_enabled,
                  mod_type
                )
              )
            `,
          )
          .eq("user_id", uid);

        if (error) throw error;
        const mapped = (data ?? [])
          .map((r: any): UserLeagueRow | null => {
            const team = r?.team;
            const league = team?.league;
            if (!team?.id || !league?.id) return null;

            return {
              id: league.id,
              name: league.name ?? "",
              api_league_id: league.api_league_id ?? null,
              season: league.season ?? null,
              join_code:
                league.join_code == null ? null : Number(league.join_code), // gestisce bigint che arriva come string

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
          row.api_league_id != null
            ? LEAGUE_LOGOS[row.api_league_id]
            : undefined;

        return (
          <TouchableOpacity
            key={`${row.id}-${row.myTeam.id}`}
            onPress={() => router.push(`/leagues/${row.id}` as Href)}
            activeOpacity={0.85}
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.secondary,
              backgroundColor: colors.primary,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View style={styles.logo}>
                  {leagueLogo ? (
                    <Image source={leagueLogo} style={{ width: 12 }} />
                  ) : null}
                </View>
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
              </View>

              <Text
                style={{
                  fontFamily: fonts.semibold,
                  color: colors.text,
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                {row.name}
              </Text>

              <Text
                style={{
                  fontFamily: fonts.regular,
                  color: colors.success,
                  fontSize: 10,
                }}
                numberOfLines={1}
              >
                {row.myTeam.name}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={12}
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
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.text,
  },
});
