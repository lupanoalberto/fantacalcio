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
        <ActivityIndicator size="large" color={colors.success} />
      </View>
    );
  }

  // ✅ Se non esiste calendario: mostra CTA
  if (!calendarExists) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
        }}
      >
        <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
          {/* HEADER */}
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              paddingTop: insets.top + 8,
              paddingLeft: 8,
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.push("/" as Href);
              }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 14,
                fontFamily: fonts.semibold,
                color: colors.text,
              }}
            >
              {title}
            </Text>
          </View>

          <Text
            style={{
              paddingHorizontal: 8,
              fontFamily: fonts.regular,
              color: colors.textSecondary,
              fontSize: 12,
            }}
          >
            Il calendario della lega non è stato ancora creato.
          </Text>

          {isOwner ? (
            <TouchableOpacity
              onPress={handleCreateCalendar}
              activeOpacity={0.85}
              disabled={creating}
              style={{
                marginHorizontal: 8,
                padding: 8,
                borderRadius: 8,
                backgroundColor: colors.success,
                alignItems: "center",
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? (
                <ActivityIndicator />
              ) : (
                <Text
                  style={{
                    color: colors.primary,
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
        </ScrollView>
      </View>
    );
  }

  // ✅ Calendario esistente: UI stile tuo (modal giornata + lista)
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ gap: 24, paddingBottom: 8 }}
      >
        {/* HEADER */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            paddingTop: insets.top + 8,
            paddingLeft: 8,
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/" as Href);
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.semibold,
              color: colors.text,
            }}
          >
            {title}
          </Text>
        </View>

        {/* Trigger popup */}
        <TouchableOpacity
          onPress={openDayModal}
          activeOpacity={0.8}
          style={{
            padding: 8,
            marginHorizontal: 8,
            borderRadius: 8,
            backgroundColor: colors.text,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            alignSelf: "flex-start",
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
          >
            Giornata {day}
          </Text>
          <Ionicons name="chevron-down" color={colors.primary} size={16} />
        </TouchableOpacity>

        {/* Modal selezione giornata */}
        <Modal
          visible={isDayModalOpen}
          transparent
          animationType="fade"
          onRequestClose={closeDayModal}
        >
          <Pressable style={styles.overlay} onPress={closeDayModal} />

          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Seleziona giornata
              </Text>

              <TouchableOpacity onPress={closeDayModal} hitSlop={10}>
                <Ionicons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 560 }}
              showsVerticalScrollIndicator={false}
            >
              {matchdays.map((md) => {
                const isActive = md === day;

                return (
                  <TouchableOpacity
                    key={md}
                    onPress={() => selectDay(md)}
                    activeOpacity={0.85}
                    style={[
                      styles.dayRow,
                      {
                        borderColor: colors.secondary ?? "rgba(0,0,0,0.08)",
                        backgroundColor: isActive
                          ? colors.secondary
                          : colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontFamily: fonts.regular,
                        fontSize: 10,
                      }}
                    >
                      Giornata {md}
                    </Text>

                    {isActive ? (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.success}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>

        {/* Fixtures list */}
        <View style={{ flexDirection: "column", gap: 8 }}>
          {fixtures.length === 0 ? (
            <Text
              style={{
                paddingHorizontal: 8,
                fontFamily: fonts.regular,
                color: colors.textSecondary,
                fontSize: 12,
              }}
            >
              Nessuna partita per questa giornata.
            </Text>
          ) : (
            fixtures.map((fx) => {
              const home = fx.home_team?.name ?? "—";
              const away = fx.away_team?.name ?? "—";

              console.log(fx);

              return (
                <View key={fx?.id} style={{ marginHorizontal: 8 }}>
                  <TouchableOpacity
                    onPress={() => router.push(goToMatchId(fx) as any)}
                  >
                    <MatchCard
                      key={`${fx.id}`}
                      idx={fx.id}
                      homeTeam={home}
                      awayTeam={away}
                      scoreHome={"0"}
                      scoreAway={"0"}
                      time={"FT"}
                      homeLogo={""}
                      awayLogo={""}
                      day={fx.matchday}
                    />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
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
