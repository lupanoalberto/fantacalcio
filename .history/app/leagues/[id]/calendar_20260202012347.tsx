import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

type MatchdayRow = {
  matchday: number;
  status: "OPEN" | "LOCKED" | "FINALIZED";
  deadline_at: string | null;
};

type FixtureRow = {
  id: string;
  matchday: number;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
};

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

export default function LeagueCalendarScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id;

  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<MatchdayRow[]>([]);
  const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null);

  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixtures, setFixtures] = useState<FixtureRow[]>([]);

  // --- load matchdays
  useEffect(() => {
    let cancelled = false;

    async function loadMatchdays() {
      try {
        setLoading(true);

        if (!leagueId || !isUuidLike(leagueId)) throw new Error("leagueId non valido");

        const { data, error } = await supabase
          .from("league_matchdays")
          .select("matchday,status,deadline_at")
          .eq("league_id", leagueId)
          .order("matchday", { ascending: true });

        if (error) throw error;

        const list = (data ?? []) as MatchdayRow[];
        if (!cancelled) {
          setDays(list);

          // selezione di default: prima OPEN, altrimenti prima in lista
          const firstOpen = list.find((d) => d.status === "OPEN")?.matchday ?? null;
          setSelectedMatchday(firstOpen ?? (list[0]?.matchday ?? null));
        }
      } catch (e: any) {
        console.error("Calendar load matchdays error:", e?.message ?? e);
        if (!cancelled) {
          setDays([]);
          setSelectedMatchday(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMatchdays();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  // --- load fixtures for selected matchday
  useEffect(() => {
    let cancelled = false;

    async function loadFixtures() {
      if (!leagueId || !isUuidLike(leagueId) || !selectedMatchday) {
        setFixtures([]);
        return;
      }

      try {
        setFixturesLoading(true);

        const { data, error } = await supabase
          .from("league_fixtures")
          .select(
            `
              id,
              matchday,
              home_team:teams!league_fixtures_home_team_id_fkey ( id, name ),
              away_team:teams!league_fixtures_away_team_id_fkey ( id, name )
            `,
          )
          .eq("league_id", leagueId)
          .eq("matchday", selectedMatchday)
          .order("id", { ascending: true });

        if (error) throw error;

        if (!cancelled) setFixtures((data ?? []) as any);
      } catch (e: any) {
        console.error("Calendar load fixtures error:", e?.message ?? e);
        if (!cancelled) setFixtures([]);
      } finally {
        if (!cancelled) setFixturesLoading(false);
      }
    }

    loadFixtures();
    return () => {
      cancelled = true;
    };
  }, [leagueId, selectedMatchday]);

  const selectedDay = useMemo(() => {
    if (selectedMatchday == null) return null;
    return days.find((d) => d.matchday === selectedMatchday) ?? null;
  }, [days, selectedMatchday]);

  const statusLabel = (s: MatchdayRow["status"]) => {
    if (s === "OPEN") return "APERTO";
    if (s === "LOCKED") return "BLOCCATO";
    return "FINITO";
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 12, gap: 16 }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/");
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontFamily: fonts.semibold, color: colors.text }}>
            Calendario
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : !days.length ? (
          <Text style={{ paddingHorizontal: 12, fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
            Nessuna giornata trovata. (Il calendario non è stato creato?)
          </Text>
        ) : (
          <>
            {/* Selettore giornate */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            >
              {days.map((d) => {
                const active = d.matchday === selectedMatchday;
                return (
                  <TouchableOpacity
                    key={d.matchday}
                    onPress={() => setSelectedMatchday(d.matchday)}
                    activeOpacity={0.85}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: active ? colors.success : colors.secondary,
                      backgroundColor: active ? colors.secondary : colors.background,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }}>
                      G{d.matchday}
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary }}>
                      {statusLabel(d.status)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Info giornata */}
            <View style={{ paddingHorizontal: 12, gap: 8 }}>
              <View style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.secondary }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }}>
                  Giornata {selectedMatchday}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }}>
                  Stato: {selectedDay ? statusLabel(selectedDay.status) : "—"}
                </Text>
                {selectedDay?.deadline_at ? (
                  <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }}>
                    Deadline: {new Date(selectedDay.deadline_at).toLocaleString("it-IT")}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Fixtures */}
            <View style={{ paddingHorizontal: 12, gap: 8 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }}>
                Partite
              </Text>

              {fixturesLoading ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : !fixtures.length ? (
                <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
                  Nessuna partita trovata per questa giornata.
                </Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {fixtures.map((fx) => (
                    <View
                      key={fx.id}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.secondary,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text, flex: 1 }} numberOfLines={1}>
                        {fx.home_team?.name ?? "Home"}
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
                        vs
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text, flex: 1, textAlign: "right" }} numberOfLines={1}>
                        {fx.away_team?.name ?? "Away"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
