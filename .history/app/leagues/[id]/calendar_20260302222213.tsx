import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useTheme } from "@/theme";
import { supabase } from "@/lib/supabase";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MatchCard from "@/components/MatchCard";
import { goBack } from "expo-router/build/global-state/routing";
import { LinearGradient } from "expo-linear-gradient";

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

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

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type FixtureRow = {
  id: string;
  matchday: number;
  home_team_id: string;
  away_team_id: string;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
};

export default function LeagueCalendarScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id;

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [isOwner, setIsOwner] = useState(false);

  const [calendarExists, setCalendarExists] = useState(false);
  const [matchdays, setMatchdays] = useState<number[]>([]);
  const [day, setDay] = useState<number>(1);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const [fixtures, setFixtures] = useState<FixtureRow[]>([]);

  const openDayModal = () => setIsDayModalOpen(true);
  const closeDayModal = () => setIsDayModalOpen(false);

  const selectDay = (newDay: number) => {
    setDay(newDay);
    closeDayModal();
  };

  async function loadAll() {
    try {
      setLoading(true);

      if (!leagueId || !isUuidLike(leagueId)) {
        throw new Error(`ID lega non valido: ${String(leagueId)}`);
      }

      // 1) session + ruolo (OWNER / CO_OWNER) nella lega
      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;
      const uid = sess.session?.user?.id ?? null;

      let owner = false;
      if (uid) {
        const { data: utData, error: utErr } = await supabase
          .from("user_team")
          .select(
            `
              role,
              team:teams (
                id,
                league_id
              )
            `,
          )
          .eq("user_id", uid);

        if (utErr) throw utErr;

        const rows = Array.isArray(utData) ? utData : [];
        owner = rows.some((r: any) => {
          const tLeagueId = r?.team?.league_id;
          const role = r?.role;
          return (
            String(tLeagueId) === String(leagueId) &&
            (role === "OWNER" || role === "CO_OWNER")
          );
        });
      }
      setIsOwner(owner);

      // 2) matchdays: se non esistono => calendario non creato
      const { data: mdData, error: mdErr } = await supabase
        .from("league_matchdays")
        .select("matchday,status,deadline_at")
        .eq("league_id", leagueId)
        .order("matchday", { ascending: true });

      if (mdErr) throw mdErr;

      const mdRows = (mdData ?? []) as MatchdayRow[];
      const mdNums = mdRows.map((m) => m.matchday);

      // fallback: se non ho matchdays, provo a vedere se esistono fixtures (in caso tu abbia creato solo quelli)
      let exists = mdNums.length > 0;

      if (!exists) {
        const { data: fxCheck, error: fxCheckErr } = await supabase
          .from("league_fixtures")
          .select("id", { count: "exact", head: true })
          .eq("league_id", leagueId);

        if (fxCheckErr) throw fxCheckErr;
        // se count > 0 => esiste
        // supabase-js ti ritorna count solo se lo chiedi e head:true
        // qui non lo abbiamo come campo, quindi basta usare data null e contare via `count` nella response
        // ma con client supabase, `count` sta in response. Semplifico: faccio query non head.
        if (!exists) {
          const { data: fxData, error: fxErr } = await supabase
            .from("league_fixtures")
            .select("id")
            .eq("league_id", leagueId)
            .limit(1);
          if (fxErr) throw fxErr;
          exists = (fxData ?? []).length > 0;
        }
      }

      setCalendarExists(exists);

      if (!exists) {
        setMatchdays([]);
        setDay(1);
        setFixtures([]);
        return;
      }

      // se matchdays vuoto ma fixtures esistono, ricavo le giornate dalle fixtures
      let matchdayList = mdNums;
      if (matchdayList.length === 0) {
        const { data: fxDays, error: fxDaysErr } = await supabase
          .from("league_fixtures")
          .select("matchday")
          .eq("league_id", leagueId)
          .order("matchday", { ascending: true });

        if (fxDaysErr) throw fxDaysErr;

        const uniq = Array.from(
          new Set((fxDays ?? []).map((x: any) => Number(x.matchday))),
        ).sort((a, b) => a - b);

        matchdayList = uniq;
      }

      setMatchdays(matchdayList);

      // imposta day iniziale coerente
      const safeDay = matchdayList.includes(day) ? day : (matchdayList[0] ?? 1);
      setDay(safeDay);

      // 3) fixtures di quella giornata (con join alle teams)
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
        .eq("matchday", day)
        .order("matchday", { ascending: true });

      if (fxErr) throw fxErr;

      const dbRows = (fxData ?? []) as unknown as FixtureRowDb[];

      const mapped: FixtureRow[] = (fxData ?? []).map((r: FixtureRowDb) => ({
        id: r.id,
        matchday: r.matchday,
        home_team_id: r.home_team_id,
        away_team_id: r.away_team_id,
        home_team: pickOne(r.home_team),
        away_team: pickOne(r.away_team),
      }));

      setFixtures(mapped);
    } catch (e: any) {
      console.error("LeagueCalendar load error:", e?.message ?? e);
      Alert.alert(
        "Errore",
        e?.message ?? "Impossibile caricare il calendario.",
      );
      setCalendarExists(false);
      setMatchdays([]);
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  // quando cambia day, ricarico solo fixtures (se calendario esiste)
  useEffect(() => {
    let cancelled = false;

    async function loadFixturesForDay() {
      try {
        if (!calendarExists) return;
        if (!leagueId || !isUuidLike(leagueId)) return;

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
          .eq("matchday", day)
          .order("matchday", { ascending: true });

        if (fxErr) throw fxErr;

        if (!cancelled) {
          const dbRows = (fxData ?? []) as unknown as FixtureRowDb[];

          const mapped: FixtureRow[] = dbRows.map((r) => ({
            id: r.id,
            matchday: Number(r.matchday),
            home_team_id: r.home_team_id,
            away_team_id: r.away_team_id,
            home_team: pickOne(r.home_team),
            away_team: pickOne(r.away_team),
          }));

          setFixtures(mapped);
        }
      } catch (e: any) {
        console.error("loadFixturesForDay error:", e?.message ?? e);
        if (!cancelled) setFixtures([]);
      }
    }

    loadFixturesForDay();
    return () => {
      cancelled = true;
    };
  }, [calendarExists, day, leagueId]);

  async function handleCreateCalendar() {
    try {
      if (!leagueId || !isUuidLike(leagueId)) {
        Alert.alert("Errore", "ID lega non valido.");
        return;
      }

      if (!isOwner) {
        Alert.alert("Non consentito", "Solo l'owner può creare il calendario.");
        return;
      }

      setCreating(true);

      // ✅ RPC (cambia nome se la tua funzione si chiama diversamente)
      const { error } = await supabase.rpc("create_league_calendar", {
        p_league_id: leagueId,
        p_start_matchday: 24,
        p_end_matchday: 38,
        p_force: true,
      });

      if (error) throw error;

      Alert.alert("Ok!", "Calendario creato.");
      await loadAll();
    } catch (e: any) {
      console.error("create calendar error:", e?.message ?? e);
      Alert.alert("Errore", e?.message ?? "Impossibile creare il calendario.");
    } finally {
      setCreating(false);
    }
  }

  const title = useMemo(() => "Calendario", []);

  async function goToMatchId(fx: FixtureRow) {
    try {
      if (!leagueId || !isUuidLike(leagueId)) {
        Alert.alert("Errore", "ID lega non valido.");
        return;
      }

      // 1) Provo a trovare il match già creato (stesso home/away)
      const { data: existing, error: exErr } = await supabase
        .from("league_matches")
        .select("id")
        .eq("league_id", leagueId)
        .eq("matchday", fx.matchday)
        .eq("home_team_id", fx.home_team_id)
        .eq("away_team_id", fx.away_team_id)
        .maybeSingle();

      if (exErr) throw exErr;

      let matchId = existing?.id ?? null;

      // 2) Se non esiste, lo creo
      if (!matchId) {
        const { data: created, error: insErr } = await supabase
          .from("league_matches")
          .insert({
            league_id: leagueId,
            matchday: fx.matchday,
            home_team_id: fx.home_team_id,
            away_team_id: fx.away_team_id,
            status: "SCHEDULED",
          })
          .select("id")
          .single();

        if (insErr) throw insErr;
        matchId = created?.id ?? null;
      }

      if (!matchId) {
        Alert.alert("Errore", "Impossibile aprire la partita (id mancante).");
        return;
      }

      router.push(`/leagues/${leagueId}/match/${matchId}` as any);
    } catch (e: any) {
      console.error("goToMatchId error:", e?.message ?? e);
      Alert.alert("Errore", e?.message ?? "Impossibile aprire la partita.");
    }
  }

  const renderMatchdays = () => {
    return (
      <View
        key={day}
        style={{
          paddingHorizontal: 16,
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        {/* 🔹 Match list */}
        <View style={{ flexDirection: "column", width: "100%", gap: 8 }}>
          {fixtures.map((fix) => {
            const status = fix?.status;
            const date = new Date(fix?.utcDate);
            let timeLabel = "";
            let dayLabel = "";
            let scoreColor = false;

            if (status === "IN_PLAY" || status === "1H" || status === "2H") {
              timeLabel = fix?.status.elapsed
                ? `${fix.status.elapsed}'`
                : "LIVE";
              scoreColor = true;
            } else if (status === "PAUSED" || status === "HT")
              timeLabel = "INT.";
            else {
              timeLabel = date.toLocaleString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              });
            }

            dayLabel = date.toLocaleString("it-IT", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            });

            let scoreHome = fix?.score?.fullTime?.home;
            let scoreAway = fix?.score?.fullTime?.away;
            if (scoreHome === null && scoreAway === null) {
              scoreHome = "";
              scoreAway = "";
            }

            const homeLogo =
              fix?.homeTeam?.crest ||
              fix?.homeTeam?.crestUrl ||
              "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

            const awayLogo =
              fix?.awayTeam?.crest ||
              fix?.awayTeam?.crestUrl ||
              "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

            return (
              <View key={fix?.id}>
                <TouchableOpacity
                  onPress={() => router.push(`leagues/${leagueId}/match/${fix?.id}` as Href)}
                  style={{ borderRadius: 8, overflow: "hidden" }}
                >
                  <fixCard
                    key={fix?.id}
                    idx={fix?.id}
                    homeTeam={
                      fix?.homeTeam?.shortName ?? fix?.homeTeam?.name
                    }
                    awayTeam={
                      fix?.awayTeam?.shortName ?? fix?.awayTeam?.name
                    }
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
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: insets.bottom,
          paddingTop: insets.top,
        }}
      >
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  } else {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: "#0d0d0d",
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View
          style={{
            padding: 8,
            paddingHorizontal: 16,
            paddingTop: 8 + insets.top,
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            height: 64 + insets.top,
          }}
        >
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              color: colors.white,
              fontFamily: fonts.bold,
              fontSize: 16,
              paddingRight: 32,
              textAlign: "center",
            }}
          >
            Calendario
          </Text>
        </View>

        <LinearGradient
          colors={[
            "#0d0d0d",
            colors.background,
            colors.orange,
            colors.background,
          ]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 24,
            }}
          >
            {isOwner ? (
              <TouchableOpacity
                onPress={handleCreateCalendar}
                activeOpacity={0.85}
                disabled={creating}
                style={{
                  marginHorizontal: 8,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: colors.green,
                  alignItems: "center",
                  opacity: creating ? 0.6 : 1,
                }}
              >
                {creating ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.bold,
                      fontSize: 12,
                      textTransform: "uppercase",
                    }}
                  >
                    Crea calendario
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text
                style={{
                  paddingHorizontal: 8,
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  fontSize: 12,
                }}
              >
                Solo l’owner può creare il calendario.
              </Text>
            )}
            {calendarExists ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  backgroundColor: colors.opacity,
                  borderBottomWidth: 1,
                  borderColor: colors.opacity,
                  padding: 8,
                  gap: 8, // opzionale, se vuoi spazio tra i bottoni
                }}
              >
                {matchdays.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={{
                      minWidth: 24,
                      borderRadius: 24,
                      padding: 8,
                      paddingHorizontal: 16,
                      backgroundColor: m === day ? colors.white : "transparent",
                    }}
                    onPress={() => selectDay(m)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={{
                        color: day === m ? colors.orange : colors.text,
                        fontFamily: fonts.semibold,
                        fontSize: 12,
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            {calendarExists ? (
              <>{renderMatchdays()}</>
            ) : null}
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingBottom: 0,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  dayRow: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
