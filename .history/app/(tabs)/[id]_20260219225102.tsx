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
      <ScrollView style={styles.container}>
        <View
          style={{
            width: "100%",
            flex: 1,
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
            style={{ position: "absolute", top: insets.top + 12, left: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View>
            {leagueLogo ? (
              <Image source={leagueLogo} style={{ width: "100%", aspectRatio: 3/2 }} />
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.textSection,
              {
                color: colors.text,
                fontFamily: fonts.semibold,
                borderBottomWidth: 1,
                borderBottomColor: colors.secondary,
              },
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
              {
                color: colors.text,
                fontFamily: fonts.semibold,
                borderBottomWidth: 1,
                borderBottomColor: colors.secondary,
              },
            ]}
          >
            Esplora {CURRENT_LEAGUE}
          </Text>
          <View style={styles.containerWrap}>
            <TouchableOpacity style={styles.buttonInternalLeague} onPress={goToCalendar}>
              <View style={styles.rowStart}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={colors.text}
                />
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
              </View>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonInternalLeague} onPress={gotToStandings}>
              <View style={styles.rowStart}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={24}
                  color={colors.text}
                />
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
              </View>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonInternalLeague} onPress={gotToPlayers}>
              <View style={styles.rowStart}>
                <Ionicons name="shirt-outline" size={24} color={colors.text} />
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
              </View>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
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
    gap: 12,
    padding: 12,
  },
  textButton: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  section: {
    width: "100%",
    flexDirection: "column",
  },
  textSection: {
    fontSize: 14,
    padding: 12,
  },
  containerWrap: {
    flexDirection: "column",
  },
  buttonInternalLeague: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderColor: Colors.secondary,
    padding: 12,
    gap: 12,
  },
  rowStart: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
  },
});
