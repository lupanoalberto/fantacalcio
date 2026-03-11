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
import { LinearGradient } from "expo-linear-gradient";
import { goBack } from "expo-router/build/global-state/routing";

const NATIONALITY: Record<string, any> = {
  Argentina: require("@/assets/flags/argentina.png"),
  Austria: require("@/assets/flags/austria.png"),
  Bahrain: require("@/assets/flags/bahrain.png"),
  Belgium: require("@/assets/flags/belgium.png"),
  Brazil: require("@/assets/flags/brazil.png"),
  Canada: require("@/assets/flags/canada.png"),
  Chile: require("@/assets/flags/chile.png"),
  China: require("@/assets/flags/china.png"),
  Colombia: require("@/assets/flags/colombia.png"),
  "Costa-rica": require("@/assets/flags/costa-rica.png"),
  Croatia: require("@/assets/flags/croatia.png"),
  "Czech Republic": require("@/assets/flags/czech-republic.png"),
  Denmark: require("@/assets/flags/denmark.png"),
  England: require("@/assets/flags/england.png"),
  Finland: require("@/assets/flags/finland.png"),
  France: require("@/assets/flags/france.png"),
  Germany: require("@/assets/flags/germany.png"),
  Ghana: require("@/assets/flags/ghana.png"),
  "Hong Kong": require("@/assets/flags/hong-kong.png"),
  Hungary: require("@/assets/flags/hungary.png"),
  Ireland: require("@/assets/flags/ireland.png"),
  Israel: require("@/assets/flags/israel.png"),
  Italy: require("@/assets/flags/italy.png"),
  Japan: require("@/assets/flags/japan.png"),
  Malaysia: require("@/assets/flags/malaysia.png"),
  Morocco: require("@/assets/flags/morocco.png"),
  Norway: require("@/assets/flags/norway.png"),
  Panama: require("@/assets/flags/panama.png"),
  Peru: require("@/assets/flags/peru.png"),
  Philippines: require("@/assets/flags/philippines.png"),
  Poland: require("@/assets/flags/poland.png"),
  Qatar: require("@/assets/flags/qatar.png"),
  Romania: require("@/assets/flags/romania.png"),
  Russia: require("@/assets/flags/russia.png"),
  Ringapore: require("@/assets/flags/singapore.png"),
  Slovakia: require("@/assets/flags/slovakia.png"),
  "South-africa": require("@/assets/flags/south-africa.png"),
  "South-korea": require("@/assets/flags/south-korea.png"),
  Spain: require("@/assets/flags/spain.png"),
  Sweden: require("@/assets/flags/sweden.png"),
  Switzerland: require("@/assets/flags/switzerland.png"),
  Taiwan: require("@/assets/flags/taiwan.png"),
  Thailand: require("@/assets/flags/thailand.png"),
  Tunisia: require("@/assets/flags/tunisia.png"),
  Turkey: require("@/assets/flags/turkey.png"),
  "United-kingdom": require("@/assets/flags/united-kingdom.png"),
  "United-states": require("@/assets/flags/united-states.png"),
  Uzbekistan: require("@/assets/flags/uzbekistan.png"),
  Vietnam: require("@/assets/flags/vietnam.png"),
};

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
        padding: 8,
        gap: 8,
        borderRadius: 8,
        backgroundColor: colors.opacity,
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

  const nationality = convertFlags(player?.nationality);

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
          {player?.name}
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
          {/* TOP */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              padding: 8,
              backgroundColor: colors.opacity,
            }}
          >
            <Image
              source={{ uri: playerPhoto }}
              style={{ width: 64, height: 64, borderRadius: 8 }}
            />
            <View style={{ flex: 1 }}>
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
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Image
                  source={
                    player?.nationality
                      ? nationality
                      : null
                  }
                  style={{ width: 16, aspectRatio: 1 / 1 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  {role ?? "—"}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                }}
              >
                {`${age} anni`}
              </Text>
            </View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                padding: 8,
                backgroundColor: colors.opacity,
              }}
            >
              <Image
                source={{ uri: teamCrest }}
                style={{ width: 24, height: 24 }}
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
                padding: 8,
                backgroundColor: colors.opacity,
                borderRadius: 8,
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
                {player?.name ?? "—"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 8,
                backgroundColor: colors.opacity,
                borderRadius: 8,
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
                padding: 8,
                backgroundColor: colors.opacity,
                borderRadius: 8,
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
                {player?.nationality ?? "—"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 8,
                backgroundColor: colors.opacity,
                borderRadius: 8,
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
    paddingHorizontal: 16,
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
