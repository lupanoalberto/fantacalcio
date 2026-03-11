// components/LiveMatchesSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { useTheme } from "@/theme";
import MatchCard from "./MatchCard";
import { getMatches } from "../services/footballApi";
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

type Props = {
  selectedLeague: string;
};

type MatchdayRow = {
  matchday: number;
  status: "OPEN" | "LOCKED" | "FINALIZED";
  deadline_at: string | null;
};

type FixtureRowDb = {
  id: string;
  matchday: number;
  home_team_id: string;
  away_team_id: string;
  home_team: { id: string; name: string } | { id: string; name: string }[];
  away_team: { id: string; name: string } | { id: string; name: string }[];
};

type TeamLite = {
  id: string;
  name: string;
};

type UIMatch = {
  id: string | number;
  source: "api" | "db";
  matchday: number;
  utcDate?: string | null;
  status?: any;
  score?: any;
  homeTeam?: {
    id?: string | number;
    name?: string;
    shortName?: string;
    crest?: string;
    crestUrl?: string;
  };
  awayTeam?: {
    id?: string | number;
    name?: string;
    shortName?: string;
    crest?: string;
    crestUrl?: string;
  };
  home_team_id?: string;
  away_team_id?: string;
};

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default function CalendarSection({ selectedLeague }: Props) {
  const { colors, fonts } = useTheme();
  const [matches, setMatches] = useState<UIMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<number>(1);
  const [matchdays, setMatchdays] = useState<number[]>([]);

  const router = useRouter();

  const isApiLeague = useMemo(
    () => isRealLeagueId(selectedLeague),
    [selectedLeague],
  );

  const isDbLeague = useMemo(
    () => isUuidLike(selectedLeague),
    [selectedLeague],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        setLoading(true);
        setMatches([]);
        setMatchdays([]);
        setDay(1);

        if (isApiLeague) {
          const list = await getMatches(selectedLeague);

          if (cancelled) return;

          const normalized: UIMatch[] = (list ?? []).map((m: any) => ({
            ...m,
            source: "api",
            matchday: Number(m.matchday ?? 1),
          }));

          const uniqueDays = Array.from(
            new Set(
              normalized
                .map((m) => Number(m.matchday))
                .filter((n) => Number.isFinite(n)),
            ),
          ).sort((a, b) => a - b);

          setMatchdays(uniqueDays.length > 0 ? uniqueDays : [1]);
          setDay(uniqueDays[0] ?? 1);
          setMatches(normalized.filter((m) => Number(m.matchday) === (uniqueDays[0] ?? 1)));
          return;
        }

        if (isDbLeague) {
          const leagueId = selectedLeague;

          const { data: mdData, error: mdErr } = await supabase
            .from("league_matchdays")
            .select("matchday,status,deadline_at")
            .eq("league_id", leagueId)
            .order("matchday", { ascending: true });

          if (mdErr) throw mdErr;

          let mdList = ((mdData ?? []) as MatchdayRow[]).map((m) =>
            Number(m.matchday),
          );

          if (mdList.length === 0) {
            const { data: fxDays, error: fxDaysErr } = await supabase
              .from("league_fixtures")
              .select("matchday")
              .eq("league_id", leagueId)
              .order("matchday", { ascending: true });

            if (fxDaysErr) throw fxDaysErr;

            mdList = Array.from(
              new Set((fxDays ?? []).map((x: any) => Number(x.matchday))),
            ).sort((a, b) => a - b);
          }

          if (cancelled) return;

          const safeMatchdays = mdList.length > 0 ? mdList : [1];
          const firstDay = safeMatchdays[0] ?? 1;

          setMatchdays(safeMatchdays);
          setDay(firstDay);

          const { data: fxData, error: fxErr } = await supabase
            .from("league_fixtures")
            .select(
              `
              id,
              matchday,
              home_team_id,
              away_team_id,
              home_team:teams!league_fixtures_home_team_id_fkey ( id, name ),
              away_team:teams!league_fixtures_away_team_id_fkey ( id, name )
            `,
            )
            .eq("league_id", leagueId)
            .eq("matchday", firstDay)
            .order("matchday", { ascending: true });

          if (fxErr) throw fxErr;

          if (cancelled) return;

          const mapped: UIMatch[] = ((fxData ?? []) as FixtureRowDb[]).map((r) => {
            const homeTeam = pickOne<TeamLite>(r.home_team);
            const awayTeam = pickOne<TeamLite>(r.away_team);

            return {
              id: r.id,
              source: "db",
              matchday: Number(r.matchday),
              utcDate: null,
              status: "SCHEDULED",
              score: {
                fullTime: {
                  home: "",
                  away: "",
                },
              },
              home_team_id: r.home_team_id,
              away_team_id: r.away_team_id,
              homeTeam: {
                id: homeTeam?.id,
                name: homeTeam?.name,
                shortName: homeTeam?.name,
              },
              awayTeam: {
                id: awayTeam?.id,
                name: awayTeam?.name,
                shortName: awayTeam?.name,
              },
            };
          });

          setMatches(mapped);
          return;
        }

        throw new Error("ID non valido: deve essere un id numerico o un UUID.");
      } catch (err: any) {
        console.error("❌ Errore caricamento calendario:", err);
        if (!cancelled) {
          Alert.alert(
            "Errore",
            err?.message ?? "Impossibile caricare il calendario.",
          );
          setMatches([]);
          setMatchdays([1]);
          setDay(1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [selectedLeague, isApiLeague, isDbLeague]);

  useEffect(() => {
    let cancelled = false;

    async function loadDayData() {
      try {
        if (!selectedLeague) return;

        setLoading(true);

        if (isApiLeague) {
          const list = await getMatches(selectedLeague);

          if (cancelled) return;

          const normalized: UIMatch[] = (list ?? []).map((m: any) => ({
            ...m,
            source: "api",
            matchday: Number(m.matchday ?? 1),
          }));

          setMatches(normalized.filter((m) => Number(m.matchday) === Number(day)));
          return;
        }

        if (isDbLeague) {
          const { data: fxData, error: fxErr } = await supabase
            .from("league_fixtures")
            .select(
              `
              id,
              matchday,
              home_team_id,
              away_team_id,
              home_team:teams!league_fixtures_home_team_id_fkey ( id, name ),
              away_team:teams!league_fixtures_away_team_id_fkey ( id, name )
            `,
            )
            .eq("league_id", selectedLeague)
            .eq("matchday", day)
            .order("matchday", { ascending: true });

          if (fxErr) throw fxErr;

          if (cancelled) return;

          const mapped: UIMatch[] = ((fxData ?? []) as FixtureRowDb[]).map((r) => {
            const homeTeam = pickOne<TeamLite>(r.home_team);
            const awayTeam = pickOne<TeamLite>(r.away_team);

            return {
              id: r.id,
              source: "db",
              matchday: Number(r.matchday),
              utcDate: null,
              status: "SCHEDULED",
              score: {
                fullTime: {
                  home: "",
                  away: "",
                },
              },
              home_team_id: r.home_team_id,
              away_team_id: r.away_team_id,
              homeTeam: {
                id: homeTeam?.id,
                name: homeTeam?.name,
                shortName: homeTeam?.name,
              },
              awayTeam: {
                id: awayTeam?.id,
                name: awayTeam?.name,
                shortName: awayTeam?.name,
              },
            };
          });

          setMatches(mapped);
        }
      } catch (err: any) {
        console.error("❌ Errore caricamento giornata:", err);
        if (!cancelled) {
          setMatches([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDayData();

    return () => {
      cancelled = true;
    };
  }, [selectedLeague, day, isApiLeague, isDbLeague]);

  const selectDay = (newDay: number) => {
    setDay(newDay);
  };

  async function goToMatch(match: UIMatch) {
    try {
      if (match.source === "api") {
        router.push(`../match/${match.id}` as Href);
        return;
      }

      if (!isUuidLike(selectedLeague)) {
        Alert.alert("Errore", "ID lega non valido.");
        return;
      }

      if (!match.home_team_id || !match.away_team_id) {
        Alert.alert("Errore", "Dati partita incompleti.");
        return;
      }

      const leagueId = selectedLeague;

      const { data: existing, error: exErr } = await supabase
        .from("league_matches")
        .select("id")
        .eq("league_id", leagueId)
        .eq("matchday", match.matchday)
        .eq("home_team_id", match.home_team_id)
        .eq("away_team_id", match.away_team_id)
        .maybeSingle();

      if (exErr) throw exErr;

      let matchId = existing?.id ?? null;

      if (!matchId) {
        const { data: created, error: insErr } = await supabase
          .from("league_matches")
          .insert({
            league_id: leagueId,
            matchday: match.matchday,
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            status: "SCHEDULED",
          })
          .select("id")
          .single();

        if (insErr) throw insErr;
        matchId = created?.id ?? null;
      }

      if (!matchId) {
        throw new Error("Impossibile aprire la partita.");
      }

      router.push(`/leagues/${leagueId}/match/${matchId}` as Href);
    } catch (e: any) {
      console.error("goToMatch error:", e?.message ?? e);
      Alert.alert("Errore", e?.message ?? "Impossibile aprire la partita.");
    }
  }

  const renderMatchdays = () => {
    return (
      <View
        key={day}
        style={{
          flexDirection: "column",
          width: "100%",
          gap: 6,
          paddingHorizontal: 12,
        }}
      >
        {matches.map((match) => {
          const rawStatus = match?.status;
          const statusCode =
            typeof rawStatus === "string"
              ? rawStatus
              : rawStatus?.short || rawStatus?.type || rawStatus?.status;

          const date = match?.utcDate ? new Date(match.utcDate) : null;

          let timeLabel = "";
          let dayLabel = "";
          let scoreColor = false;

          if (
            statusCode === "IN_PLAY" ||
            statusCode === "1H" ||
            statusCode === "2H"
          ) {
            timeLabel =
              match?.status?.elapsed != null
                ? `${match.status.elapsed}'`
                : "LIVE";
            scoreColor = true;
          } else if (statusCode === "PAUSED" || statusCode === "HT") {
            timeLabel = "INT.";
          } else if (date && !Number.isNaN(date.getTime())) {
            timeLabel = date.toLocaleString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            });
          } else {
            timeLabel = "-";
          }

          if (date && !Number.isNaN(date.getTime())) {
            dayLabel = date.toLocaleString("it-IT", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            });
          } else {
            dayLabel = `Giornata ${match.matchday}`;
          }

          let scoreHome = match?.score?.fullTime?.home;
          let scoreAway = match?.score?.fullTime?.away;

          if (
            scoreHome === null ||
            scoreHome === undefined ||
            scoreHome === ""
          ) {
            scoreHome = "";
          }

          if (
            scoreAway === null ||
            scoreAway === undefined ||
            scoreAway === ""
          ) {
            scoreAway = "";
          }

          const homeLogo =
            match?.homeTeam?.crest ||
            match?.homeTeam?.crestUrl ||
            "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

          const awayLogo =
            match?.awayTeam?.crest ||
            match?.awayTeam?.crestUrl ||
            "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

          return (
            <View key={`${match.source}-${match.id}`}>
              <TouchableOpacity
                onPress={() => goToMatch(match)}
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.opacity,
                }}
              >
                <MatchCard
                  key={`${selectedLeague}-${match.source}-${match.id}`}
                  idx={String(match?.id) || ""}
                  homeTeam={match?.homeTeam?.shortName ?? match?.homeTeam?.name ?? "-"}
                  awayTeam={match?.awayTeam?.shortName ?? match?.awayTeam?.name ?? "-"}
                  scoreHome={scoreHome}
                  scoreAway={scoreAway}
                  time={timeLabel}
                  homeLogo={homeLogo}
                  awayLogo={awayLogo}
                  day={dayLabel}
                  scoreColor={scoreColor}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="calendar-outline" size={24} color={colors.text} />
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontFamily: fonts.bold,
          }}
        >
          Calendario
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          backgroundColor: colors.card,
          padding: 12,
          gap: 6,
        }}
      >
        {matchdays.map((m) => (
          <TouchableOpacity
            key={m}
            style={{
              minWidth: 36,
              borderRadius: 12,
              padding: 6,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: m === day ? colors.primary : "transparent",
            }}
            onPress={() => {
              selectDay(m);
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>{renderMatchdays()}</>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    paddingVertical: 12,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  dayRow: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});