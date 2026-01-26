import React, { useEffect, useMemo } from "react";
import { Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useLeagueStore } from "@/store/leagueStore";
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { Colors } from "@/constants/colors";

type Props = {
  selectedLeague: string; // es: "135" | "serie a" | "Serie A"
};

// 🔧 mappa campionati → api_league_id
const LEAGUE_ID_MAP: Record<string, number> = {
  "serie a": 135,
  "premier league": 39,
  laliga: 140,
  bundesliga: 78,
  "ligue 1": 61,
};

function normalizeLeagueKey(value?: string) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export default function ListLeagues({ selectedLeague }: Props) {
  const router = useRouter();
  const { colors, fonts } = useTheme();
  const { leagues, fetchUserLeagues, loading } = useLeagueStore();

  // 🎯 apiLeagueId derivato
  const apiLeagueId = useMemo<number | null>(() => {
    const n = Number(selectedLeague);
    if (!Number.isNaN(n) && n > 0) return n;

    const key = normalizeLeagueKey(selectedLeague);
    return LEAGUE_ID_MAP[key] ?? null;
  }, [selectedLeague]);

  // 🔁 fetch leghe utente per campionato
  useEffect(() => {
    if (!apiLeagueId) return;
    fetchUserLeagues(apiLeagueId);
  }, [apiLeagueId]);

  if (loading) {
    return <Text>Caricamento…</Text>;
  }

  return (
    <FlatList
      data={leagues}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/leagues/${item.id}` as Href)}
          style={[styles.card, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
            numberOfLines={1}
          >
            {item.myTeam?.name ?? "La tua squadra"}
          </Text>

          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.textSecondary}
            style={{ transform: [{ rotate: "-90deg" }], alignSelf: "center" }}
          />

          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 11,
              opacity: 0.8,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => {
            if (!apiLeagueId) return;
            router.push(
              `/leagues/create?apiLeagueId=${apiLeagueId}` as Href
            );
          }}
        >
          <Ionicons name="add" size={18} color={colors.text} />
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
          >
            Aggiungi nuova lega
          </Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.secondary,
  },
});
