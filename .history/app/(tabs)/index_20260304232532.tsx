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
import UserLeaguesList from "@/components/UserLeaguesList";
import LiveMatchesSection from "@/components/LiveMatchesSection";
import Header from "@/components/Header";
import { LinearGradient } from "expo-linear-gradient";

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
          backgroundColor: "#0d0d0d",
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
        <TouchableOpacity
          onPress={() =>
            router.push(
              (isAuthed ? "/(tabs)/profile" : "/(auth)/login") as Href,
            )
          }
          style={{ padding: 12, borderRadius: 12, backgroundColor: colors.opacity }}
        >
          <Ionicons name="person-outline" size={24} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.pink }]}
          onPress={() => router.push("/leagues/create" as Href)}
        >
          <Ionicons name="add" size={24} color={colors.dark} />
          <Text
            style={{
              color: colors.dark,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
          >
            Aggiungi lega
          </Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[
          "#0d0d0d",
          colors.background,
          colors.orange,
          colors.background,
        ]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 24, paddingVertical: 24 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: 16,
              flexDirection: "row",
            }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                { borderWidth: 1, borderColor: colors.opacity },
              ]}
            >
              <Ionicons name="list-outline" size={24} color={colors.white} />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.white,
                  fontFamily: fonts.semibold,
                }}
              >
                Regole
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { borderWidth: 1, borderColor: colors.opacity },
              ]}
            >
              <MaterialCommunityIcons
                name="strategy"
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
                Strategie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { borderWidth: 1, borderColor: colors.opacity },
              ]}
            >
              <MaterialCommunityIcons
                name="youtube"
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
                Tutorial
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { borderWidth: 1, borderColor: colors.opacity },
              ]}
            >
              <FontAwesome name="question" size={24} color={colors.white} />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.white,
                  fontFamily: fonts.semibold,
                }}
              >
                FAQ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { borderWidth: 1, borderColor: colors.opacity },
              ]}
            >
              <MaterialCommunityIcons
                name="chat-outline"
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
                Contattaci
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={[styles.section, { paddingHorizontal: 16 }]}>
            <Text
              style={{
                color: colors.white,
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
                paddingHorizontal: 16,
              }}
            >
              Esplora i campionati
            </Text>
            <ScrollView
              style={styles.containerScroll}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 8,
                paddingHorizontal: 16,
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
        </ScrollView>
      </LinearGradient>
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
    backgroundColor: Colors.opacity,
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
    paddingHorizontal: 16,
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
    borderRadius: 8,
  },
  containerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
});
