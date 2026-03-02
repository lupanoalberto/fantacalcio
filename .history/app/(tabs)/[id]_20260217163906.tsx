// app/(tabs)/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTheme } from "../../theme";
import Header from "../../components/Header";
import ListLeagues from "@/components/ListLeagues";
import LiveMatchesSection from "@/components/LiveMatchesSection";
import NewsCarousel from "@/components/NewsCarousel";
import {
  Entypo,
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

const LEAGUE_LOGOS: Record<string, any> = {
  "Serie A": require("@/assets/img/serie-a.png"),
  "Premier League": require("@/assets/img/premier-league.png"),
  LaLiga: require("@/assets/img/laliga.jpg"),
  Bundesliga: require("@/assets/img/bundesliga.png"),
  "Ligue 1": require("@/assets/img/ligue-1.png"),
};

export default function HomeTab() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasAnyLiveMatch, setHasAnyLiveMatch] = useState(false);

  useEffect(() => {
    setHasAnyLiveMatch(false);
  }, []);

  const handleHasMatches = (has: boolean) => {
    if (has) setHasAnyLiveMatch(true);
  };

  const CURRENT_LEAGUE = String(id) || "Serie A";

  const leagueLogo =
    CURRENT_LEAGUE != null ? LEAGUE_LOGOS[CURRENT_LEAGUE] : undefined;

  const goToCalendar = () => {
    router.push({
      pathname: "/calendar",
      params: { league: CURRENT_LEAGUE },
    });
  };

  const gotToStandings = () => {
    router.push({
      pathname: "/standings",
      params: { league: CURRENT_LEAGUE },
    });
  };

  const gotToPlayers = () => {
    router.push({
      pathname: "/players",
      params: { league: CURRENT_LEAGUE },
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
            height: 240,
            position: "relative",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/"); // fallback alla home
            }}
            style={{ position: "absolute", top: insets.top + 8, left: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View>
            {leagueLogo ? (
              <Image source={leagueLogo} style={{ width: 96, height: 96 }} />
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.textSection,
              { color: colors.text, fontFamily: fonts.semibold },
            ]}
          >
            Risultati in live
          </Text>
          <>
            <LiveMatchesSection selectedLeague={CURRENT_LEAGUE} />
          </>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.textSection,
              { color: colors.text, fontFamily: fonts.semibold },
            ]}
          >
            Esplora {CURRENT_LEAGUE}
          </Text>
          <View
            style={styles.containerScroll}
          >
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={goToCalendar}
            >
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={32}
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
                  size={32}
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
              onPress={gotToPlayers}
            >
              <View style={styles.logoContainer}>
                <Ionicons name="shirt-outline" size={32} color={colors.text} />
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
                <MaterialCommunityIcons
                  name="strategy"
                  size={32}
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
                Allenatori
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
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  textButton: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
  },
  textSection: {
    fontSize: 14,
    marginLeft: 8,
  },
  containerScroll: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 8,
  },
  leagueButton: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoContainer: {
    borderRadius: 8,
    padding: 8,
    backgroundColor: Colors.primary,
  },
  leagueImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
