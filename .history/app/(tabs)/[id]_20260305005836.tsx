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
  const [isActive, setIsActive] = useState(0);
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
        }}
      >
        <TouchableOpacity onPress={goBack} style={styles.button}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ paddingRight: 24, flex: 1, flexDirection: "row", justifyContent: "center" }}>
          <Image
            source={leagueLogo}
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              paddingRight: 48,
            }}
          />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: colors.card }}
        >
          <TouchableOpacity
            style={[
              {
                padding: 12,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                borderBottomWidth: 1,
                borderColor: isActive === 0 ? colors.primary : "transparent",
              },
            ]}
            onPress={() => {
              setIsActive(0);
            }}
          >
            <MaterialIcons
              name="live-tv"
              size={24}
              color={isActive === 0 ? colors.primary : colors.text}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: isActive === 0 ? colors.primary : colors.text,
                fontFamily: fonts.semibold,
              }}
            >
              Live
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              {
                padding: 12,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                borderBottomWidth: 1,
                borderColor: isActive === 1 ? colors.primary : "transparent",
              },
            ]}
            onPress={() => {
              setIsActive(1);
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={isActive === 1 ? colors.primary : colors.text}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: isActive === 1 ? colors.primary : colors.text,
                fontFamily: fonts.semibold,
              }}
            >
              Calendario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              {
                padding: 12,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                borderBottomWidth: 1,
                borderColor: isActive === 2 ? colors.primary : "transparent",
              },
            ]}
            onPress={() => {
              setIsActive(2);
            }}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={24}
              color={isActive === 2 ? colors.primary : colors.text}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: isActive === 2 ? colors.primary : colors.text,
                fontFamily: fonts.semibold,
              }}
            >
              Classifica
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              {
                padding: 12,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                borderBottomWidth: 1,
                borderColor: isActive === 3 ? colors.primary : "transparent",
              },
            ]}
            onPress={() => {
              setIsActive(3);
            }}
          >
            <Ionicons
              name="shirt-outline"
              size={24}
              color={isActive === 3 ? colors.primary : colors.text}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: isActive === 3 ? colors.primary : colors.text,
                fontFamily: fonts.semibold,
              }}
            >
              Giocatori
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              {
                padding: 12,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                borderBottomWidth: 1,
                borderColor: isActive === 4 ? colors.primary : "transparent",
              },
            ]}
            onPress={() => {
              setIsActive(4);
            }}
          >
            <Ionicons
              name="bandage-outline"
              size={24}
              color={isActive === 4 ? colors.primary : colors.text}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: isActive === 4 ? colors.primary : colors.text,
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
