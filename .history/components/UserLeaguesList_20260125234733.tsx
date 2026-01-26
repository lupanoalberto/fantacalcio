import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Href, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

type UserLeagueItem = {
  team: {
    id: string;
    name: string;
    league: {
      id: string;
      name: string;
      api_league_id: number;
      season: number;
    };
  };
};

type Props = {
  apiLeagueId?: number; // opzionale → se vuoi filtrare per campionato
};

export default function UserLeaguesList({ apiLeagueId }: Props) {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<UserLeagueItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) {
        setLeagues([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_team")
        .select(`
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
        `)
        .eq("user_id", user.id);

      if (!mounted) return;

      if (error) {
        console.error("Errore fetch leghe:", error);
        setLeagues([]);
      } else {
        const filtered = apiLeagueId
          ? data?.filter(
              (x) => x.team?.league?.api_league_id === apiLeagueId
            )
          : data;

        setLeagues(filtered ?? []);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [apiLeagueId]);

  if (loading) return <ActivityIndicator />;

  if (!leagues.length) {
    return (
      <Text style={{ fontSize: 12, opacity: 0.6 }}>
        Non partecipi ancora a nessuna lega
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {leagues.map((item) => (
        <TouchableOpacity
          key={item.team.id}
          onPress={() =>
            router.push(`/leagues/${item.team.league.id}` as Href)
          }
          style={{
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.secondary,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              color: colors.text,
              fontSize: 12,
            }}
          >
            {item.team.league.name}
          </Text>

          <Text
            style={{
              fontFamily: fonts.regular,
              color: colors.textSecondary,
              fontSize: 11,
            }}
          >
            Squadra: {item.team.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
