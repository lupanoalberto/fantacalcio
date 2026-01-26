// components/UserLeaguesList.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Href, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

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
    <View style={{ gap: 8, paddingHorizontal: 12 }}>
      {rows.map((row) => (
        <TouchableOpacity
          key={`${row.id}-${row.myTeam.id}`}
          onPress={() => router.push(`/leagues/${row.id}` as Href)}
          activeOpacity={0.85}
          style={{
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.secondary,
            backgroundColor: colors.background,
          }}
        >
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
              color: colors.textSecondary,
              fontSize: 11,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            Squadra: {row.myTeam.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
