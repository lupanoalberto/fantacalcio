// components/UserLeaguesList.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Href, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

type UserLeagueRow = {
  id: string; // league id
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code: number | null;

  mode: string | null;
  mod_enabled: boolean | null;
  mod_type: string | null;

  myTeam: { id: string; name: string };
  myRole: string | null;
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

        console.log("user_team data:", data);
        setRows(data);

        if (error) throw error;
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
