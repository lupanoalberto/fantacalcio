// components/StandingSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
} from "react-native";
import { useTheme } from "@/theme";
import { getStandings } from "../services/footballApi";
import { Colors } from "@/constants/colors";
import { teamToCode3 } from "@/utils/teamCodeName";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

type StandingRow = {
  position: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalDifference: number;
  team: {
    id: number | string;
    name: string;
    shortName?: string;
    crest?: string;
    crestUrl?: string;
  };
};

type Props = {
  selectedLeague: string;
};

type LeagueStandingDbRow = {
  team_id: string;
  position?: number | null;
  played?: number | null;
  won?: number | null;
  draw?: number | null;
  lost?: number | null;
  points?: number | null;
  goal_difference?: number | null;
  team?:
    | { id: string; name: string; logo_url?: string }
    | { id: string; name: string; logo_url?: string }[];
};

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

function isApiLeagueLike(v: any) {
  return typeof v === "string" && v.trim().length > 0 && !isUuidLike(v);
}

const REAL_LEAGUE_MAP: Record<string, string> = {
  "Serie A": "135",
  "Premier League": "39",
  "La Liga": "140",
  Bundesliga: "78",
  "Ligue 1": "61",
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default function StandingSection({ selectedLeague }: Props) {
  const { colors, fonts } = useTheme();

  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isDbLeague = useMemo(
    () => isUuidLike(selectedLeague),
    [selectedLeague],
  );

  const isApiLeague = useMemo(
    () => isApiLeagueLike(selectedLeague),
    [selectedLeague],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadStandingsData() {
      try {
        setLoading(true);
        setStandings([]);

        if (isApiLeague) {
          const apiLeagueId = REAL_LEAGUE_MAP[selectedLeague] ?? selectedLeague;
          const data = await getStandings(apiLeagueId);

          if (cancelled) return;

          setStandings(Array.isArray(data) ? data : []);
          return;
        }

        if (isDbLeague) {
          const leagueId = selectedLeague;

          /**
           * Qui assumo che tu abbia una tabella tipo `league_standings`
           * collegata a `teams`.
           *
           * Se i nomi delle colonne sono diversi, devi adattare SOLO questa query/mappatura.
           */
          const { data, error } = await supabase
            .from("league_standings")
            .select(
              `
              team_id,
              position,
              played,
              won,
              draw,
              lost,
              points,
              goal_difference,
              team:teams (
                id,
                name,
                logo_url
              )
            `,
            )
            .eq("league_id", leagueId)
            .order("position", { ascending: true });

          if (error) throw error;

          if (cancelled) return;

          const mapped: StandingRow[] = (
            (data ?? []) as LeagueStandingDbRow[]
          ).map((row, index) => {
            const team = pickOne(row.team);

            return {
              position: Number(row.position ?? index + 1),
              playedGames: Number(row.played ?? 0),
              won: Number(row.won ?? 0),
              draw: Number(row.draw ?? 0),
              lost: Number(row.lost ?? 0),
              points: Number(row.points ?? 0),
              goalDifference: Number(row.goal_difference ?? 0),
              team: {
                id: team?.id ?? row.team_id,
                name: team?.name ?? "Squadra",
                shortName: team?.name ?? "Squadra",
                crest: team?.logo_url ?? undefined,
                crestUrl: team?.logo_url ?? undefined,
              },
            };
          });

          setStandings(mapped);
          return;
        }

        throw new Error("Lega non riconosciuta.");
      } catch (err: any) {
        console.error("❌ Errore caricamento classifica:", err);
        if (!cancelled) {
          Alert.alert(
            "Errore",
            err?.message ?? "Impossibile caricare la classifica.",
          );
          setStandings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStandingsData();

    return () => {
      cancelled = true;
    };
  }, [selectedLeague, isApiLeague, isDbLeague]);

  const renderRow = (row: StandingRow) => {
    const teamName = row.team.shortName ?? row.team.name;

    return (
      <View
        key={String(row.team.id)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          padding: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.opacity,
          gap: 12,
        }}
      >
        <Text
          style={{
            width: 24,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 10,
          }}
        >
          {row.position}.
        </Text>

        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={styles.logoContainer}>
            {row.team.crest || row.team.crestUrl ? (
              <Image
                source={{ uri: row.team.crest ?? row.team.crestUrl }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.bold,
                  fontSize: 10,
                }}
              >
                {teamToCode3(teamName).slice(0, 3)}
              </Text>
            )}
          </View>

          <Text
            style={{
              flex: 1,
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
            numberOfLines={1}
          >
            {teamToCode3(teamName)}
          </Text>
        </View>

        <Text
          style={{
            width: 32,
            padding: 6,
            borderRadius: 12,
            textAlign: "center",
            backgroundColor: colors.primary,
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 10,
          }}
        >
          {row.points}
        </Text>

        <Text
          style={{
            width: 32,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.regular,
            fontSize: 10,
          }}
        >
          {row.playedGames}
        </Text>

        <Text
          style={{
            width: 64,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.regular,
            fontSize: 10,
          }}
        >
          {row.won}/{row.draw}/{row.lost}
        </Text>

        <Text
          style={{
            width: 32,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.regular,
            fontSize: 10,
          }}
        >
          {row.goalDifference}
        </Text>
      </View>
    );
  };

  return (
    <View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.section}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 12,
            }}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={24}
              color={colors.text}
            />
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontFamily: fonts.bold,
              }}
            >
              Classifica
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              flexDirection: "column",
              gap: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                paddingVertical: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.opacity,
                gap: 12,
              }}
            >
              <Text
                style={{
                  width: 24,
                  textAlign: "center",
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                #
              </Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Squadra
              </Text>
              <Text
                style={{
                  width: 32,
                  textAlign: "center",
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                Pt.
              </Text>
              <Text
                style={{
                  width: 32,
                  textAlign: "center",
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                GG
              </Text>
              <Text
                style={{
                  width: 64,
                  textAlign: "center",
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                V/P/S
              </Text>
              <Text
                style={{
                  width: 32,
                  textAlign: "center",
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                DR
              </Text>
            </View>

            <View
              style={{
                flexDirection: "column",
                gap: 6,
              }}
            >
              {standings.map(renderRow)}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    padding: 12,
  },
  logoContainer: {
    width: 36,
    height: 36,
    padding: 6,
    borderRadius: 12,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 24,
    height: 24,
  },
});
