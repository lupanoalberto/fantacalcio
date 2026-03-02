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
            style={[styles.button, { backgroundColor: colors.text }]}
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
            style={[styles.button, { backgroundColor: colors.text }]}
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
              paddingBottom: 2,
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
            style={{
              color: colors.text,
              fontSize: 16,
              fontFamily: fonts.bold,
              paddingHorizontal: 12,
            }}
          >
            Guida e assistenza
          </Text>
          <View style={styles.containerWrap}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.orange }]}>
              <FontAwesome5
                name="question-circle"
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
                FAQ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]}>
                <MaterialCommunityIcons
                  name="strategy"
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
                  Strategie
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]}>
                <MaterialCommunityIcons
                  name="youtube"
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
                  Tutorial
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]}>
                <Ionicons name="list-outline" size={24} color={colors.background} />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: colors.background,
                    fontFamily: fonts.semibold,
                  }}
                >
                  Regole
                </Text>
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
});
