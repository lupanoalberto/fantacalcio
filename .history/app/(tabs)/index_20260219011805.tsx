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
        contentContainerStyle={{ gap: 16, paddingVertical: 16 }}
      >
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.push(
                (isAuthed ? "/(tabs)/profile" : "/(auth)/login") as Href,
              )
            }
          >
            <View style={{ flexDirection: "column" }}>
              <Text
                style={{
                  fontSize: 20,
                  color: colors.text,
                  fontFamily: fonts.bold,
                }}
              >
                Ciao,
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  textDecorationLine: "underline",
                }}
              >
                {userLabel}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <TouchableOpacity
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => router.push("/leagues/create" as Href)}
          >
            <Ionicons name="add-outline" size={24} color={colors.text} />
            <Text
              style={{
                fontSize: 12,
                color: colors.text,
                fontFamily: fonts.semibold,
              }}
            >
              Aggiungi nuova lega
            </Text>
          </TouchableOpacity>
          <UserLeaguesList></UserLeaguesList>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.textSection,
              {
                color: colors.text,
                fontFamily: fonts.semibold,
                borderBottomWidth: 1,
                borderColor: Colors.secondary,
              },
            ]}
          >
            Esplora i campionati
          </Text>
          <ScrollView
            style={styles.containerScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 12,
              padding: 12,
              backgroundColor: colors.primary,
              borderBottomWidth: 1,
              borderColor: Colors.secondary,
            }}
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
              {
                color: colors.text,
                fontFamily: fonts.semibold,
                borderBottomWidth: 1,
                borderColor: Colors.secondary,
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
              <Ionicons
                name="chevron-forward"
                size={12}
                color={colors.textSecondary}
              />
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
              <Ionicons
                name="chevron-forward"
                size={12}
                color={colors.textSecondary}
              />
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
              <Ionicons
                name="chevron-forward"
                size={12}
                color={colors.textSecondary}
              />
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
    padding: 12,
  },
  containerScroll: {
    width: "100%",
  },
  leagueButton: {
    width: 72,
    height: 72,
    borderRadius: 6,
    padding: 12,
    backgroundColor: Colors.text,
  },
  leagueImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  containerWrap: {
    flexDirection: "column",
  },
  buttonHelp: {
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
