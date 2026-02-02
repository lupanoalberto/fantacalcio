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

export default function HomeTab() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasAnyLiveMatch, setHasAnyLiveMatch] = useState(false);

  useEffect(() => {
    setActiveLeague(String(id));
  }, [id]);

  useEffect(() => {
    setHasAnyLiveMatch(false);
  }, []);

  const handleHasMatches = (has: boolean) => {
    if (has) setHasAnyLiveMatch(true);
  };

  const CURRENT_LEAGUE = String(id) || "Serie A";

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
            aspectRatio: 4 / 3,
            position: "relative",
          }}
        >
          <TouchableOpacity onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push("/"); // fallback alla home
            }}
          style={{ position: "absolute", top: insets.top + 12, left: 12 }}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
          <View>
            <Image source={require("@/assets/img/serie-a.png")} style={{ width: 120, height: 120 }} />
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

          {hasAnyLiveMatch ? (
            <>
              <LiveMatchesSection
                selectedLeague={CURRENT_LEAGUE}
                onHasMatches={handleHasMatches}
              ></LiveMatchesSection>
            </>
          ) : (
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 12,
                paddingHorizontal: 12,
              }}
            >
              Non ci sono partite in live.
            </Text>
          )}
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
                <MaterialCommunityIcons name="calendar-outline" size={36} color={colors.text} />
              </View>
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.text, fontFamily: fonts.semibold }}>
                Calendario
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={gotToStandings}
            >
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="trophy-outline" size={36} color={colors.text} />
              </View>
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.text, fontFamily: fonts.semibold }}>
                Classifica
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={gotToPlayers}
            >
              <View style={styles.logoContainer}>
                <Ionicons name="shirt-outline" size={36} color={colors.text} />
              </View>
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.text, fontFamily: fonts.semibold }}>
                Giocatori
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
            >
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="strategy" size={36} color={colors.text} />
              </View>
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.text, fontFamily: fonts.semibold }}>
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
