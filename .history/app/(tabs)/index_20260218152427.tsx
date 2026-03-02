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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
        contentContainerStyle={{ gap: 24, paddingVertical: 16 }}
      >
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              paddingHorizontal: 16,
              gap: 8,
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
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
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
            Guida e assistenza
          </Text>
          <View style={styles.containerWrap}>
            <TouchableOpacity
              style={styles.buttonHelp}
            >
              <Ionicons
                name="question-mark"
                size={32}
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
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonHelp}
            >
              <MaterialCommunityIcons
                name="trophy-outline"
                size={32}
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
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonHelp}
            >
              <Ionicons name="shirt-outline" size={32} color={colors.text} />
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
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonHelp}>
              <MaterialCommunityIcons
                name="strategy"
                size={32}
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
                Allenatori
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
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 8,
  },
  textButton: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
  },
  textSection: {
    fontSize: 14,
    marginLeft: 16,
  },
  containerScroll: {
    width: "100%",
  },
  leagueButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    padding: 16,
    backgroundColor: Colors.text,
  },
  leagueImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  containerWrap: {
    marginHorizontal: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
  },
  buttonHelp: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.secondary,
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
});
