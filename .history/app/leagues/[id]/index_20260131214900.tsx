// app/(tabs)/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTheme } from "../../../theme";
import ListLeagues from "@/components/ListLeagues";
import LiveMatchesSection from "@/components/LiveMatchesSection";
import NewsCarousel from "@/components/NewsCarousel";
import {
  Entypo,
  FontAwesome,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserLeaguesList from "@/components/UserLeaguesList";
import { useEffect, useState } from "react";
import { Colors } from "@/constants/colors";
import { useLeagueStore } from "@/store/leagueStore";
import { supabase } from "@/lib/supabase";
import { ActivityIndicator } from "react-native";
import { apiLeagueIdToName } from "@/utils/leagueName";

const LEAGUE_LOGOS: Record<number, any> = {
  135: require("@/assets/img/135 1.png"),
  39: require("@/assets/img/39 1.png"),
  140: require("@/assets/img/140 1.png"),
  78: require("@/assets/img/78 1.png"),
  61: require("@/assets/img/61 1.png"),
};

type LeagueRow = {
  id: string;
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code: number | null;
  mode: "CLASSICO" | "MANTRA" | null;
  mod_enabled: boolean | null;
  mod_type: "MOD_DIFESA" | null;
  budget: number | null;
  roster_size: number | null;
  max_players_per_real_team: number | null;
  scoring_json: any | null;
  created_by: string | null;
  created_at?: string | null;
};

export default function HomeTab() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLeague() {
      try {
        setLeagueLoading(true);

        const leagueId = String(id ?? "");
        if (!leagueId) {
          setLeague(null);
          return;
        }

        const { data, error } = await supabase
          .from("leagues")
          .select(
            `
          id,
          name,
          api_league_id,
          season,
          join_code,
          mode,
          mod_enabled,
          mod_type,
          budget,
          roster_size,
          max_players_per_real_team,
          scoring_json,
          created_by,
          created_at
        `,
          )
          .eq("id", leagueId)
          .single();

        if (error) throw error;

        if (!cancelled) setLeague(data as LeagueRow);
      } catch (e: any) {
        console.error("loadLeague error:", e?.message ?? e);
        if (!cancelled) setLeague(null);
      } finally {
        if (!cancelled) setLeagueLoading(false);
      }
    }

    loadLeague();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const leagueId = league?.api_league_id ?? null;

  const leagueLogo = leagueId != null ? LEAGUE_LOGOS[leagueId] : undefined;

  const goToCalendar = () => {
    router.push({
      pathname: "/calendar",
      params: { league: leagueId },
    });
  };

  const gotToStandings = () => {
    router.push({
      pathname: "/standings",
      params: { league: leagueId },
    });
  };

  const gotToPlayers = () => {
    router.push({
      pathname: String(`/leagues/${id}/players`),
      params: { league: leagueId },
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ gap: 24 }}>
        <View
          style={{
            width: "100%",
            flex: 1,
            paddingTop: insets.top,
            backgroundColor: colors.text,
            justifyContent: "center",
            alignItems: "center",
            aspectRatio: 4 / 3,
            position: "relative",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/"); // fallback alla home
            }}
            style={{ position: "absolute", top: insets.top + 12, left: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Image
              source={require("@/assets/img/serie-a.png")}
              style={{ width: 120, height: 120 }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ScrollView
            style={styles.containerScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 12 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.text,
              }}
            >
              {leagueLogo ? (
                <Image
                  source={leagueLogo}
                  style={{ width: 12, aspectRatio: 7 / 6 }}
                />
              ) : null}
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  color: colors.text,
                  fontSize: 10,
                  textTransform: "uppercase",
                }}
              >
                {apiLeagueIdToName(leagueId)}
              </Text>
            </View>

            <View
              style={{
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.text,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  color: colors.text,
                  fontSize: 10,
                  textTransform: "uppercase",
                }}
              >
                Codice Accesso: {league?.join_code}
              </Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.textSection,
              { color: colors.text, fontFamily: fonts.semibold },
            ]}
          >
            Esplora
          </Text>
          <ScrollView
            style={styles.containerScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 12 }}
          >
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={goToCalendar}
            >
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={36}
                  color={colors.text}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                }}
              >
                Calendario
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={gotToStandings}
            >
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={36}
                  color={colors.text}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                }}
              >
                Classifica
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={gotToStandings}
            >
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons
                  name="shield-outline"
                  size={36}
                  color={colors.text}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                }}
              >
                Squadre
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={gotToPlayers}
            >
              <View style={styles.logoContainer}>
                <Ionicons name="shirt-outline" size={36} color={colors.text} />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                }}
              >
                Giocatori
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.leagueButton}>
              <View style={styles.logoContainer}>
                <FontAwesome
                  name="exchange"
                  size={36}
                  color={colors.text}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                }}
              >
                Scambi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.leagueButton}>
              <View style={styles.logoContainer}>
                <Ionicons
                  name="settings-outline"
                  size={36}
                  color={colors.text}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontFamily: fonts.semibold,
                }}
              >
                Impostazioni
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 6,
    padding: 6,
    borderRadius: 24,
  },
  textButton: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
  },
  textSection: {
    fontSize: 14,
    marginLeft: 12,
  },
  containerScroll: {
    width: "100%",
  },
  leagueButton: {
    width: 72,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.primary,
  },
  leagueImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
