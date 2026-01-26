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
import { useTheme } from "../theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
            }}
          >
            <TouchableOpacity
              style={[styles.button, { borderWidth: 1, borderColor: colors.text }]}
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
              style={[styles.button, { borderWidth: 1, borderColor: colors.text }]}
              onPress={() =>
                router.push(
                  (isAuthed ? "/leagues/create" : "/(auth)/login") as Href,
                )
              }
            >
              <Ionicons name="add" size={24} color={colors.text} />
              <Text
                style={[
                  styles.textButton,
                  { color: colors.text, fontFamily: fonts.semibold },
                ]}
              >
                Aggiungi lega
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Qui sarà inserito il componente che mostra l'elenco delle leghe */}
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

          {/* Qui sarà inserito il componente che mostra la lista dei risultati live */}
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
    marginLeft: 12,
  },
  containerScroll: {
    width: "100%",
    flex: 1,
    flexDirection: "row",
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
