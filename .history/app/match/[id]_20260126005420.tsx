import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
  getMatchDetails,
  getFixtureEvents,
  getFixtureLineups,
  roundToMatchday,
} from "../../services/footballApi";
import { useTheme } from "@/theme";
import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";

function formatStatusLabel(statusShort?: string, utcDate?: string) {
  const date = utcDate ? new Date(utcDate) : null;

  // API-FOOTBALL status.short tipici: 1H, 2H, HT, FT, NS, PST, etc.
  if (statusShort === "1H" || statusShort === "2H" || statusShort === "ET")
    return "LIVE";
  if (statusShort === "HT") return "INT.";

  if (!date || Number.isNaN(date.getTime())) return statusShort ?? "—";

  return date.toLocaleString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatchDetails() {
  const { id } = useLocalSearchParams();
  const { colors, fonts } = useTheme();

  const fixtureId = Number(id);

  const [details, setDetails] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [lineupsLoading, setLineupsLoading] = useState(false);

  const [isActive, setIsActive] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // ✅ null-safe memo
  const fixture = useMemo(() => details?.fixture ?? null, [details]);
  const teams = useMemo(() => details?.teams ?? null, [details]);
  const goals = useMemo(() => details?.goals ?? null, [details]);
  const league = useMemo(() => details?.league ?? null, [details]);

  const timeLabel = useMemo(() => {
    return formatStatusLabel(fixture?.status?.short, fixture?.date);
  }, [fixture?.status?.short, fixture?.date]);

  const matchday = useMemo(() => {
    return roundToMatchday(league?.round ?? null);
  }, [league?.round]);

  // -------------------------
  // 1) Load match details
  // -------------------------
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setDetails(null);
        setEvents([]);
        setLineups([]);

        if (!Number.isFinite(fixtureId)) {
          setError("ID match non valido.");
          return;
        }

        const data = await getMatchDetails(fixtureId);

        // getMatchDetails (API-FOOTBALL) potrebbe tornare null
        if (!data) {
          setError("Dettagli partita non disponibili (API).");
          return;
        }

        setDetails(data);
      } catch (err: any) {
        console.error("❌ Errore caricamento dettagli partita:", err);
        setError(err?.message ?? "Errore caricamento dettagli partita");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [fixtureId]);

  // -------------------------
  // 2) Load events (tab 0)
  // -------------------------
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        const list = await getFixtureEvents(fixtureId);
        setEvents(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error("❌ Errore eventi:", e);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    if (!Number.isFinite(fixtureId)) return;
    if (loading) return;
    if (error) return;

    // carica solo quando apro tab eventi
    if (isActive === 0) loadEvents();
  }, [fixtureId, isActive, loading, error]);

  // -------------------------
  // 3) Load lineups (tab 1)
  // -------------------------
  useEffect(() => {
    const loadLineups = async () => {
      try {
        setLineupsLoading(true);
        const list = await getFixtureLineups(fixtureId);
        setLineups(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error("❌ Errore formazioni:", e);
        setLineups([]);
      } finally {
        setLineupsLoading(false);
      }
    };

    if (!Number.isFinite(fixtureId)) return;
    if (loading) return;
    if (error) return;

    // carica solo quando apro tab formazioni
    if (isActive === 1) loadLineups();
  }, [fixtureId, isActive, loading, error]);

  // ✅ Early returns dopo hooks
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.success} />
      </View>
    );
  }

  if (error || !details || !fixture || !teams) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Partita" showBackArrow={true} />
        <View style={{ padding: 16 }}>
          <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}>
            {error ?? "Impossibile caricare i dettagli della partita."}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 13,
              marginTop: 8,
            }}
          >
            ID: {String(id)}
          </Text>
        </View>
      </View>
    );
  }

  const homeTeam = teams.home;
  const awayTeam = teams.away;

  const scoreHome = goals?.home ?? "-";
  const scoreAway = goals?.away ?? "-";

  const homeLogo =
    homeTeam?.logo ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  const awayLogo =
    awayTeam?.logo ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        title={`${homeTeam?.name ?? "Home"} - ${awayTeam?.name ?? "Away"}`}
        showBackArrow={true}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.bold, marginTop: 16 },
          ]}
        >
          Risultato
        </Text>

        <View style={{ marginBottom: 16 }}>
          <MatchCard
            idx={fixture?.id ?? fixtureId}
            homeTeam={homeTeam?.name ?? "—"}
            awayTeam={awayTeam?.name ?? "—"}
            scoreHome={scoreHome}
            scoreAway={scoreAway}
            time={timeLabel}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
            matchday={matchday ?? 0}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
          Dettagli partita
        </Text>

        {/* TAB */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                borderColor: isActive === 0 ? colors.success : colors.secondary,
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setIsActive(0)}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: isActive === 0 ? colors.success : colors.text,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              Eventi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                borderColor: isActive === 1 ? colors.success : colors.secondary,
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setIsActive(1)}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: isActive === 1 ? colors.success : colors.text,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              Formazioni
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {isActive === 0 ? (
          eventsLoading ? (
            <ActivityIndicator size="small" color={colors.success} style={{ marginTop: 6 }} />
          ) : events.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 24 }}>
              Nessun evento disponibile.
            </Text>
          ) : (
            events.map((e: any, i: number) => (
              <View
                key={i}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.secondary,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 12, fontFamily: fonts.semibold }}>
                  {(e.time?.elapsed ?? "—")} • {e.team?.name ?? "—"}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {(e.type ?? "Evento")}
                  {e.detail ? ` — ${e.detail}` : ""}
                  {e.player?.name ? ` • ${e.player.name}` : ""}
                </Text>
              </View>
            ))
          )
        ) : lineupsLoading ? (
          <ActivityIndicator size="small" color={colors.success} style={{ marginTop: 6 }} />
        ) : lineups.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 24 }}>
            Formazioni non disponibili.
          </Text>
        ) : (
          lineups.map((l: any, idx: number) => (
            <View key={idx} style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 14 }}>
                {l.team?.name ?? "Squadra"}
              </Text>

              {/* TitolarI (se presenti) */}
              {Array.isArray(l.startXI) && l.startXI.length > 0 ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 12 }}>
                    Titolari
                  </Text>
                  {l.startXI.map((p: any, j: number) => (
                    <Text
                      key={j}
                      style={{ color: colors.text, fontFamily: fonts.regular, fontSize: 13, marginTop: 4 }}
                    >
                      {p.player?.number ? `${p.player.number}. ` : ""}
                      {p.player?.name ?? "—"}
                    </Text>
                  ))}
                </View>
              ) : null}

              {/* Panchina (se presenti) */}
              {Array.isArray(l.substitutes) && l.substitutes.length > 0 ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 12 }}>
                    Panchina
                  </Text>
                  {l.substitutes.map((p: any, j: number) => (
                    <Text
                      key={j}
                      style={{ color: colors.text, fontFamily: fonts.regular, fontSize: 13, marginTop: 4 }}
                    >
                      {p.player?.number ? `${p.player.number}. ` : ""}
                      {p.player?.name ?? "—"}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 16, marginBottom: 4, alignSelf: "flex-start" },
  tabBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 40,
  },
});
