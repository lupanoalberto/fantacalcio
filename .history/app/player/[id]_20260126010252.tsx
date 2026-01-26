import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Header from "@/components/Header";
import { useTheme } from "@/theme";
import {
  getPlayerDetails,
  PersonDetails,
  getApiFootballPlayerSeasonStats,
  ApiFootballPlayerSeasonStats,
  toApiFootballLeagueId,
  getDefaultSeasonYear,
  searchApiFootballPlayerId, // ✅ AGGIUNTO
} from "../../services/footballApi";

type CanonicalRole = "Portiere" | "Difensore" | "Centrocampista" | "Attaccante";

function mapRole(position?: string): CanonicalRole | null {
  if (!position) return null;
  const p = position.toLowerCase().trim();

  if (
    p.includes("goalkeeper") ||
    p.includes("keeper") ||
    p === "gk" ||
    p.includes("portiere")
  )
    return "Portiere";

  if (
    p.includes("defender") ||
    p.includes("back") ||
    p.includes("centre-back") ||
    p.includes("center-back") ||
    p.includes("fullback") ||
    p.includes("difens")
  )
    return "Difensore";

  if (
    p.includes("midfielder") ||
    p.includes("midfield") ||
    p.includes("winger") ||
    p.includes("wide") ||
    p.includes("centrocamp")
  )
    return "Centrocampista";

  if (
    p.includes("forward") ||
    p.includes("striker") ||
    p.includes("attacker") ||
    p.includes("second striker") ||
    p.includes("wing") ||
    p.includes("attacc")
  )
    return "Attaccante";

  return null;
}

function calcAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null;
  const d = new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function StatCard({ label, value, colors, fonts }: any) {
  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 16,
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: colors.secondary,
      }}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontFamily: fonts.regular,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.bold,
          fontSize: 16,
          marginTop: 6,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function PlayerDetailScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, league } = useLocalSearchParams();

  // ID route (può essere API-FOOTBALL oppure “vecchio”)
  const routeId = Number(id);

  const apiLeagueId = useMemo(() => {
    try {
      return toApiFootballLeagueId((league as string) || "Serie A");
    } catch {
      return toApiFootballLeagueId("Serie A");
    }
  }, [league]);

  const season = useMemo(() => getDefaultSeasonYear(new Date()), []);

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PersonDetails | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<ApiFootballPlayerSeasonStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // ✅ manteniamo un playerId “effettivo” per le stats (API-FOOTBALL)
  const [apiPlayerId, setApiPlayerId] = useState<number | null>(null);

  // 1) Load player info
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setPlayer(null);
        setApiPlayerId(null);

        if (!Number.isFinite(routeId)) return;

        // 🔸 NB: questa chiamata deve essere coerente con lega/stagione (idealmente),
        // ma anche se tornasse “parziale”, useremo player.name per fare search.
        const data = await getPlayerDetails(
          routeId,
          (league as string) || "Serie A"
        );
        setPlayer(data);

        // ✅ ipotesi: routeId è già un playerId API-FOOTBALL
        // (se non lo è, lo correggiamo dopo con search)
        setApiPlayerId(routeId);
      } catch (e) {
        console.error("❌ Errore caricamento dettaglio giocatore:", e);
        setPlayer(null);
        setApiPlayerId(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [routeId]);

  // 2) Resolve apiPlayerId (fallback robusto)
  useEffect(() => {
    const resolve = async () => {
      try {
        if (!player?.name) return;

        const teamName = player.currentTeam?.name;
        // Se routeId è già valido, spesso non serve. Ma se stats risultano vuote,
        // questo fallback salva moltissimi casi.
        const found = await searchApiFootballPlayerId({
          name: player.name,
          leagueId: apiLeagueId,
          season,
          teamName: player.currentTeam?.name,
        });

        if (found) setApiPlayerId(found);
      } catch (e) {
        // non blocco la UI: se fallisce, rimane routeId
        console.warn("⚠️ resolve apiPlayerId failed:", e);
      }
    };

    resolve();
  }, [player?.name, player?.currentTeam?.name, apiLeagueId, season]);

  // 3) Load season stats (campionato)
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        setStats(null);

        if (!apiPlayerId || !Number.isFinite(apiPlayerId)) {
          setStatsError("PlayerId (API) non valido.");
          return;
        }

        const s = await getApiFootballPlayerSeasonStats({
          playerId: apiPlayerId,
          leagueId: apiLeagueId,
          season,
        });

        if (!s) {
          setStatsError(
            "Statistiche non disponibili per stagione/lega (API-FOOTBALL)."
          );
          return;
        }

        setStats(s);
      } catch (e: any) {
        console.error("❌ Errore stats API-FOOTBALL:", e);
        setStatsError(e?.message ?? "Errore sconosciuto");
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [apiPlayerId, apiLeagueId, season]);

  const role = useMemo(
    () => mapRole(player?.position) ?? "-",
    [player?.position]
  );
  const age = useMemo(
    () => calcAge(player?.dateOfBirth),
    [player?.dateOfBirth]
  );

  const teamName = player?.currentTeam?.name ?? "—";
  const teamCrest =
    player?.currentTeam?.crest ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  const playerPhoto =
    player?.photo ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Giocatore" showBackArrow={true} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.success}
          style={{ marginTop: 32 }}
        />
      ) : !player ? (
        <View style={{ padding: 16 }}>
          <Text
            style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}
          >
            Impossibile caricare i dati del giocatore.
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
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* TOP */}
          <View
            style={{
              margin: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.primary,
              borderWidth: 1,
              borderColor: colors.secondary,
              gap: 12,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.bold,
                fontSize: 18,
              }}
            >
              {player.name}
            </Text>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: colors.secondary,
                }}
              >
                <Image
                  source={{ uri: teamCrest }}
                  style={{ width: 42, height: 42 }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: fonts.semibold,
                    fontSize: 14,
                  }}
                >
                  {teamName}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                  }}
                >
                  {role}
                </Text>
              </View>

              <View
                style={{
                  padding: 2,
                  borderRadius: 24,
                  backgroundColor: colors.secondary,
                }}
              >
                <Image
                  source={{ uri: playerPhoto }}
                  style={{ width: 46, height: 46, borderRadius: 23 }}
                />
              </View>
            </View>
          </View>

          {/* INFO */}
          <View style={{ marginHorizontal: 16, gap: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: colors.secondary,
              }}
            >
              <View
                style={{ flexDirection: "column", alignItems: "flex-start" }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                  }}
                >
                  Nazionalità
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: fonts.semibold,
                    fontSize: 14,
                  }}
                >
                  {player.nationality ?? "—"}
                </Text>
              </View>

              <View style={{ flexDirection: "column", alignItems: "flex-end" }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                  }}
                >
                  Età
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: fonts.semibold,
                    fontSize: 14,
                  }}
                >
                  {age !== null ? `${age} anni` : "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* STATS */}
          <View style={{ marginHorizontal: 16, marginTop: 16, gap: 10 }}>
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.bold,
                fontSize: 16,
              }}
            >
              Statistiche stagione (campionato)
            </Text>

            {statsLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.success}
                style={{ marginTop: 6 }}
              />
            ) : statsError ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 13,
                }}
              >
                {statsError}
              </Text>
            ) : (
              <>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatCard
                    label="Presenze"
                    value={
                      stats?.appearances == null
                        ? "—"
                        : String(stats.appearances)
                    }
                    colors={colors}
                    fonts={fonts}
                  />
                  <StatCard
                    label="Minuti"
                    value={stats?.minutes == null ? "—" : String(stats.minutes)}
                    colors={colors}
                    fonts={fonts}
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatCard
                    label="Gol"
                    value={stats?.goals == null ? "—" : String(stats.goals)}
                    colors={colors}
                    fonts={fonts}
                  />
                  <StatCard
                    label="Assist"
                    value={stats?.assists == null ? "—" : String(stats.assists)}
                    colors={colors}
                    fonts={fonts}
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatCard
                    label="Gialli"
                    value={stats?.yellow == null ? "—" : String(stats.yellow)}
                    colors={colors}
                    fonts={fonts}
                  />
                  <StatCard
                    label="Rossi"
                    value={stats?.red == null ? "—" : String(stats.red)}
                    colors={colors}
                    fonts={fonts}
                  />
                </View>

                {stats?.rating ? (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <StatCard
                      label="Rating"
                      value={String(stats.rating)}
                      colors={colors}
                      fonts={fonts}
                    />
                    <View style={{ flex: 1 }} />
                  </View>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
