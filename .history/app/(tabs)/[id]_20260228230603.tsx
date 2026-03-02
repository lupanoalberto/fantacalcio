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
      <View
        style={{
          padding: 8,
          paddingTop: 8 + insets.top,
          paddingHorizontal: 16,
          backgroundColor: colors.opacity,
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          minHeight: 64 + insets.top,
        }}
      >
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            color: colors.white,
            fontFamily: fonts.bold,
            fontSize: 16,
            paddingRight: 32,
          }}
          numberOfLines={1}
        >
          {CURRENT_LEAGUE}
        </Text>
      </View>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 24, paddingVertical: 24 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              { borderWidth: 1, borderColor: colors.opacity },
            ]}
            onPress={goToCalendar}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.white} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.white,
                fontFamily: fonts.semibold,
              }}
            >
              Calendario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { borderWidth: 1, borderColor: colors.opacity },
            ]}
            onPress={gotToStandings}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={24}
              color={colors.white}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.white,
                fontFamily: fonts.semibold,
              }}
            >
              Classifica
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { borderWidth: 1, borderColor: colors.opacity },
            ]}
            onPress={gotToPlayers}
          >
            <Ionicons name="shirt-outline" size={24} color={colors.white} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.white,
                fontFamily: fonts.semibold,
              }}
            >
              Giocatori
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { borderWidth: 1, borderColor: colors.opacity },
            ]}
          >
            <Ionicons name="bandage-outline" size={24} color={colors.white} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.white,
                fontFamily: fonts.semibold,
              }}
            >
              Infortunati
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.section}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontFamily: fonts.bold,
            }}
          >
            Risultati in live
          </Text>
          <LiveMatchesSection selectedLeague={CURRENT_LEAGUE} />
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
    gap: 8,
    padding: 8,
    borderRadius: 24,
  },
  textButton: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
    paddingHorizontal: 16,
  },
  textSection: {
    fontSize: 14,
    padding: 16,
  },
  containerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 6,
  },
});
