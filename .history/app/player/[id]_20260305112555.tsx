import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { convertRatingToBaseVote } from "@/utils/convertRating";
import { LinearGradient } from "expo-linear-gradient";
import { goBack } from "expo-router/build/global-state/routing";
import { nationalityIcon } from "@/utils/convertNationality";

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
        minWidth: 64,
        alignSelf: "flex-start",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
        gap: 4,
        borderRadius: 12,
        backgroundColor: colors.opacity,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 16,
          fontFamily: fonts.semibold,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.regular,
          fontSize: 10,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PlayerDetailScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, league } = useLocalSearchParams();
  const router = useRouter();

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
          (league as string) || "Serie A",
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
            "Statistiche non disponibili per stagione/lega (API-FOOTBALL).",
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
    [player?.position],
  );
  const age = useMemo(
    () => calcAge(player?.dateOfBirth),
    [player?.dateOfBirth],
  );

  const teamName = player?.currentTeam?.name ?? "—";
  const teamCrest =
    player?.currentTeam?.crest ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  const playerPhoto =
    player?.photo ??
    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  const pid = Number(player?.id);
  const vote = convertRatingToBaseVote(Number(stats?.rating));

  const nationality = nationalityIcon(player?.nationality) ?? undefined;

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            padding: 12,
            paddingTop: 12 + insets.top,
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={goBack} style={styles.button}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View
            style={{
              paddingRight: 24,
              flex: 1,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Image
              source={{ uri: playerPhoto }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
              }}
            />
          </View>
        </View>
        {/* TOP */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: 12,
            backgroundColor: colors.card,
          }}
        >
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 14,
              }}
            >
              {player?.name ?? "—"}
            </Text>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              padding: 6,
              backgroundColor: colors.text,
            }}
          >
            <Image
              source={{ uri: teamCrest }}
              style={{ width: 36, height: 36 }}
            />
          </View>
        </View>

        {/* INFO */}
        <View style={styles.section}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 12,
              padding: 12,
            }}
          >
            <MaterialCommunityIcons
              name="smart-card-outline"
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
              Scheda giocatore
            </Text>
          </View>
          <View
            style={{
              flexDirection: "column",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 12,
              backgroundColor: colors.card,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                }}
              >
                Nome
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                {player?.name ?? "—"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 12,
              backgroundColor: colors.card,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                }}
              >
                Ruolo
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                {role ?? "—"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 12,
              backgroundColor: colors.card,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                }}
              >
                Nazionalità
              </Text>
                <Image
                  source={
                    nationality
                      ? nationality
                      : require("@/assets/flags/italy.png")
                  }
                  style={{ width: 24, aspectRatio: 1 / 1 }}
                  resizeMode="contain"
                />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 12,
              backgroundColor: colors.card,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                }}
              >
                Età
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                {age !== null ? `${age} anni` : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.section}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 12,
              padding: 12,
            }}
          >
            <Ionicons
              name="stats-chart-outline"
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
              Statistiche stagionali
            </Text>
          </View>

          {statsLoading ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : statsError ? (
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.regular,
                fontSize: 12,
              }}
            >
              {statsError}
            </Text>
          ) : (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 12,
              }}
            >
              <StatCard
                label="Presenze"
                value={
                  stats?.appearances == null ? "—" : String(stats.appearances)
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
              <StatCard
                label="Gol subiti"
                value={stats?.conceded == null ? "—" : String(stats.conceded)}
                colors={colors}
                fonts={fonts}
              />
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

              {stats?.rating ? (
                <StatCard
                  label="Rating"
                  value={vote}
                  colors={colors}
                  fonts={fonts}
                />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderRadius: 24,
  },
});
