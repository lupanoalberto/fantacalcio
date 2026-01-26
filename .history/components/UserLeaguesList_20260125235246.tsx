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

      const { data: sessRes } = await supabase.auth.getSession();
      const userId = sessRes.session?.user?.id;

      if (!userId) {
        if (!mounted) return;
        setRows([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_team")
        .select(
          `
          team:teams (
            id,
            name,
            league:leagues (
              id,
              name,
              api_league_id,
              season
            )
          )
        `
        )
        .eq("user_id", userId);

      if (!mounted) return;

      if (error) {
        console.error("Errore fetch leghe utente:", error);
        setRows([]);
      } else {
        // difensivo: elimina righe “rotte”
        const cleaned = (data ?? []).filter(
          (x: any) => x?.team?.league?.id && x?.team?.id
        );
        setRows(cleaned as UserLeagueRow[]);
      }

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
          opacity: 0.6,
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
