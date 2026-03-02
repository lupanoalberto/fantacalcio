import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Href, useRouter } from "expo-router";
import { useTheme } from "../../theme";
import {
  FontAwesome,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "@/components/Header";
import UserLeaguesList from "@/components/UserLeaguesList";
import LiveMatchesSection from "@/components/LiveMatchesSection";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userLabel, setUserLabel] = useState<string>("Login");
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      if (!mounted) return;

      if (user) {
        const label =
          (user.user_metadata?.username as string) ||
          (user.user_metadata?.name as string) ||
          user.email ||
          "Profilo";

        setUserLabel(label);
        setIsAuthed(true);
      } else {
        setUserLabel("Login");
        setIsAuthed(false);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 24, paddingVertical: 12 }}
      >
        <View
          style={{
            paddingHorizontal: 12,
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.push(
                (isAuthed ? "/(tabs)/profile" : "/(auth)/login") as Href,
              )
            }
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={colors.background}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/leagues/create" as Href)}
          >
            <Ionicons name="add" size={24} color={colors.background} />
            <Text
              style={{
                color: colors.background,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              Aggiungi lega
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { paddingHorizontal: 12 }]}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontFamily: fonts.bold,
            }}
          >
            Le tue leghe
          </Text>
          <UserLeaguesList></UserLeaguesList>
        </View>

        <View style={styles.section}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontFamily: fonts.bold,
              paddingHorizontal: 12,
            }}
          >
            Esplora i campionati
          </Text>
          <ScrollView
            style={styles.containerScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 6,
              paddingHorizontal: 12,
              paddingBottom: "2px";
            }}
          >
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() => router.push(`/(tabs)/Serie A` as Href)}
            >
              <Image
                source={require("@/assets/img/logo/serie-a.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() => router.push(`/(tabs)/Premier League` as Href)}
            >
              <Image
                source={require("@/assets/img/logo/premier-league.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() => router.push(`/(tabs)/LaLiga` as Href)}
            >
              <Image
                source={require("@/assets/img/logo/laliga.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() => router.push(`/(tabs)/Bundesliga` as Href)}
            >
              <Image
                source={require("@/assets/img/logo/bundesliga.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() => router.push(`/(tabs)/Ligue 1` as Href)}
            >
              <Image
                source={require("@/assets/img/logo/ligue-1.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
          </ScrollView>
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
            Guida e assistenza
          </Text>
          <View style={styles.containerWrap}>
            <TouchableOpacity style={styles.buttonHelp}>
              <View style={styles.rowStart}>
                <FontAwesome5
                  name="question-circle"
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
                  FAQ
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={12} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonHelp}>
              <View style={styles.rowStart}>
                <MaterialCommunityIcons
                  name="strategy"
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
                  Strategie
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={12} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonHelp}>
              <View style={styles.rowStart}>
                <MaterialCommunityIcons
                  name="youtube"
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
                  Tutorial
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={12} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonHelp}>
              <View style={styles.rowStart}>
                <Ionicons name="list-outline" size={24} color={colors.text} />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  Regole
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={12} />
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
  },
  textSection: {
    fontSize: 14,
    paddingHorizontal: 12,
  },
  containerScroll: {
    width: "100%",
  },
  leagueButton: {
    width: 72,
    height: 72,
  },
  leagueImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    borderRadius: 12,
    boxShadow: `0 2px 2px ${Colors.gray}`,
  },
  containerWrap: {
    flexDirection: "column",
  },
  buttonHelp: {
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
