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
import { LinearGradient } from "expo-linear-gradient";

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

  const CURRENT_LEAGUE = String(id) || "Serie A";

  const leagueBack =
    CURRENT_LEAGUE != null ? LEAGUE_BACK[CURRENT_LEAGUE] : undefined;

  const leagueLogo =
    CURRENT_LEAGUE != null ? LEAGUE_LOGO[CURRENT_LEAGUE] : undefined;

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
          padding: 12,
          paddingTop: 12 + insets.top,
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          height: 72 + insets.top,
        }}
      >
        <TouchableOpacity onPress={goBack} style={styles.button}>
          <Ionicons name="arrow-back" size={24} color={colors.background} />
        </TouchableOpacity>
        <Image
          style={{
            flex: 1,
            color: colors.text,
            fontFamily: fonts.bold,
            fontSize: 16,
            paddingRight: 48,
            textAlign: "center",
          }}
        />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, padding: 12, backgroundColor: colors.card }}
        >
          <TouchableOpacity
            style={[
              
              { borderBottomWidth: 1, borderColor: colors.opacity },
            ]}
            onPress={goToCalendar}
          >
            <MaterialIcons name="live-tv" size={24} color={colors.background} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.background,
                fontFamily: fonts.semibold,
              }}
            >
              Live
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              
              { borderBottomWidth: 1, borderColor: colors.opacity },
            ]}
            onPress={goToCalendar}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.background} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.background,
                fontFamily: fonts.semibold,
              }}
            >
              Calendario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              
              { borderBottomWidth: 1, borderColor: colors.opacity },
            ]}
            onPress={gotToStandings}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={24}
              color={colors.background}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.background,
                fontFamily: fonts.semibold,
              }}
            >
              Classifica
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              
              { borderBottomWidth: 1, borderColor: colors.opacity },
            ]}
            onPress={gotToPlayers}
          >
            <Ionicons name="shirt-outline" size={24} color={colors.background} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.background,
                fontFamily: fonts.semibold,
              }}
            >
              Giocatori
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              
              { borderBottomWidth: 1, borderColor: colors.opacity },
            ]}
          >
            <Ionicons name="bandage-outline" size={24} color={colors.background} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: colors.background,
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
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.text,
  },
  textButton: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
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
    gap: 12,
  },
});
