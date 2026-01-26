import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Href, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

type UserLeagueRow = {
  team: {
    id: string;
    name: string;
    league: {
      id: string;
      name: string;
      api_league_id: number | null;
      season: number | null;
    };
  };
};

export default function UserLeaguesList() {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserLeagueRow[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const uid = sess.session?.user?.id;
      if (!uid) throw new Error("No session");

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
        created_by,
        mode,
        mod_enabled,
        mod_type
      )
    )
  `,
        )
        .eq("user_id", uid);

      if (error) throw error;

      const rows = (data ?? [])
        .map((r: any) => {
          const league = r?.team?.league;
          if (!league) return null;

          return {
            ...league,
            myTeam: { id: r.team.id, name: r.team.name },
            myRole: r.role,
          };
        })
        .filter(Boolean);
      
      setRows

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
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
      {rows.map((row) => {
        const league = row.team.league;
        const team = row.team;

        return (
          <TouchableOpacity
            key={`${league.id}-${team.id}`}
            onPress={() => router.push(`/leagues/${league.id}` as Href)}
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
              {league.name}
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
              Squadra: {team.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
