// app/(tabs)/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { useLocalSearchParams, useRouter } from "expo-router";

export default function HomeTab() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();

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
            paddingTop: insets.top,
          },
        ]}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ gap: 24, paddingVertical: 12 }}
        >
          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                paddingHorizontal: 12,
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.button,
                  { borderWidth: 1, borderColor: colors.text },
                ]}
                onPress={() =>
                  router.push(
                    (isAuthed ? "/(tabs)/profile" : "/(auth)/login") as Href,
                  )
                }
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={24}
                  color={colors.text}
                />
                <Text
                  style={[
                    styles.textButton,
                    { color: colors.text, fontFamily: fonts.semibold },
                  ]}
                >
                  {userLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.success }]}
                onPress={() =>
                  router.push(
                    (isAuthed ? "/leagues/create" : "/(auth)/login") as Href,
                  )
                }
              >
                <Ionicons name="add" size={24} color={colors.primary} />
                <Text
                  style={[
                    styles.textButton,
                    { color: colors.primary, fontFamily: fonts.bold },
                  ]}
                >
                  Aggiungi lega
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
  
          <View>
            <UserLeaguesList></UserLeaguesList>
          </View>
  
          <View style={styles.section}>
            <Text
              style={[
                styles.textSection,
                { color: colors.text, fontFamily: fonts.semibold },
              ]}
            >
              Esplora i campionati
            </Text>
            <ScrollView
              style={styles.containerScroll}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 12 }}
            >
              <TouchableOpacity
                style={styles.leagueButton}
                onPress={() => router.push(`/(tabs)/Serie A` as Href)}
              >
                <Image
                  source={require("@/assets/img/serie-a.png")}
                  style={styles.leagueImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.leagueButton}
                onPress={() => router.push(`/(tabs)/Premier League` as Href)}
              >
                <Image
                  source={require("@/assets/img/premier-league.png")}
                  style={styles.leagueImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.leagueButton}
                onPress={() => router.push(`/(tabs)/LaLiga` as Href)}
              >
                <Image
                  source={require("@/assets/img/laliga.jpg")}
                  style={styles.leagueImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.leagueButton}
                onPress={() => router.push(`/(tabs)/Bundesliga` as Href)}
              >
                <Image
                  source={require("@/assets/img/bundesliga.png")}
                  style={styles.leagueImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.leagueButton}
                onPress={() => router.push(`/(tabs)/Ligue 1` as Href)}
              >
                <Image
                  source={require("@/assets/img/ligue-1.png")}
                  style={styles.leagueImage}
                />
              </TouchableOpacity>
            </ScrollView>
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
                  selectedLeague="Serie A"
                  onHasMatches={handleHasMatches}
                ></LiveMatchesSection>
  
                <LiveMatchesSection
                  selectedLeague="Premier League"
                  onHasMatches={handleHasMatches}
                ></LiveMatchesSection>
  
                <LiveMatchesSection
                  selectedLeague="LaLiga"
                  onHasMatches={handleHasMatches}
                ></LiveMatchesSection>
  
                <LiveMatchesSection
                  selectedLeague="Bundesliga"
                  onHasMatches={handleHasMatches}
                ></LiveMatchesSection>
  
                <LiveMatchesSection
                  selectedLeague="Ligue 1"
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
      height: 72,
      borderRadius: 12,
      padding: 12,
      backgroundColor: Colors.text,
    },
    leagueImage: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
  });