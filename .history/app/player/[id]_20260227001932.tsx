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
import { Ionicons } from "@expo/vector-icons";
import { convertRatingToBaseVote } from "@/utils/convertRating";

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
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 6,
        gap: 6,
        borderBottomWidth: 1,
        borderColor: colors.gray,
      }}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontFamily: fonts.regular,
          fontSize: 10,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 12,
          fontFamily: fonts.semibold,
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
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
        paddingTop: insets.top,
      }}
    >
      {loading ? (
        <ActivityIndicator size="large" color={colors.green} />
      ) : !player ? (
        <View style={{ gap: 12 }}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.bold,
              marginHorizontal: 12,
              fontSize: 12,
            }}
          >
            Impossibile caricare i dati del giocatore.
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 12,
            }}
          >
            ID: {String(id)}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 24, paddingVertical: 12 }}
        >
          <View
            style={{
              width: "100%",
              flex: 1,
              flexDirection: "row",
              paddingHorizontal: 12,
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 12,
            }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.text,
                },
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back-outline"
                size={24}
                color={colors.background}
              />
            </TouchableOpacity>
          </View>

          {/* TOP */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
            }}
          >
            <Image
              source={{ uri: playerPhoto }}
              style={{ width: 96, height: 96, borderRadius: 12 }}
            />

            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 12,
                padding: 12,
                backgroundColor: colors.gray,
              }}
            >
              <Image
                source={{ uri: teamCrest }}
                style={{ width: 72, height: 72 }}
              />
            </View>
          </View>

          {/* INFO */}
          <View style={styles.section}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontFamily: fonts.bold,
              }}
            >
              Dati personali
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 6,
                borderBottomWidth: 1,
                borderColor: colors.gray,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
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
                {player.name ?? "—"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 6,
                borderBottomWidth: 1,
                borderColor: colors.gray,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
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
                padding: 6,
                borderBottomWidth: 1,
                borderColor: colors.gray,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                }}
              >
                Nazionalità
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                {player.nationality ?? "—"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 6,
                borderBottomWidth: 1,
                borderColor: colors.gray,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
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

          {/* STATS */}
          <View style={styles.section}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontFamily: fonts.bold,
              }}
            >
              Statistiche stagionali
            </Text>

            {statsLoading ? (
              <ActivityIndicator size="small" color={colors.green} />
            ) : statsError ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                }}
              >
                {statsError}
              </Text>
            ) : (
              <>
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
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    paddingHorizontal: 12,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: 24,
  },
});
