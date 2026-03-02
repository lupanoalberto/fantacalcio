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
import { goBack } from "expo-router/build/global-state/routing";

const LEAGUE_BACK: Record<string, any> = {
  "Serie A": require("@/assets/img/logo/background-card-serie-a.png"),
  "Premier League": require("@/assets/img/logo/background-card-premier-league.png"),
  LaLiga: require("@/assets/img/logo/background-card-laliga.png"),
  Bundesliga: require("@/assets/img/logo/background-card-bundesliga.png"),
  "Ligue 1": require("@/assets/img/logo/background-card-ligue-1.png"),
};

const LEAGUE_LOGO: Record<string, any> = {
  "Serie A": require("@/assets/img/logo/serie-a.png"),
  "Premier League": require("@/assets/img/logo/premier-league.png"),
  LaLiga: require("@/assets/img/logo/laliga.png"),
  Bundesliga: require("@/assets/img/logo/bundesliga.png"),
  "Ligue 1": require("@/assets/img/logo/ligue-1.png"),
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

  const leagueBack =
    CURRENT_LEAGUE != null ? LEAGUE_BACK[CURRENT_LEAGUE] : undefined;

  const leagueLogo =
    CURRENT_LEAGUE != null ? LEAGUE_LOGO[CURRENT_LEAGUE] : undefined;

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
            height: 360,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.background,
                position: "absolute",
                top: 12 + insets.top,
                left: 12,
                zIndex: 10,
              },
            ]}
            onPress={() => goBack()}
          >
            <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <Image
            source={leagueLogo}
            style={{
              width: 120,
              height: 120,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
              zIndex: 10,
            }}
          />
          <Image
            source={leagueBack}
            style={{ width: "100%" }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.textSection,
              {
                color: colors.text,
                fontFamily: fonts.semibold,
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
              },
            ]}
          >
            Esplora {CURRENT_LEAGUE}
          </Text>
          <View style={styles.containerWrap}>
            <TouchableOpacity
              style={styles.buttonInternalLeague}
              onPress={goToCalendar}
            >
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
            <TouchableOpacity
              style={styles.buttonInternalLeague}
              onPress={gotToStandings}
            >
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
            <TouchableOpacity
              style={styles.buttonInternalLeague}
              onPress={gotToPlayers}
            >
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
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: 24,
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
