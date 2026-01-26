import React from "react";
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
import SerieAIcon from "@/assets/svg/serie-a-logo.svg";
import PremierLeagueIcon from "@/assets/svg/Premier League_Symbol_0.svg";
import LaLigaIcon from "@/assets/svg/LaLiga_id5A1pzi0Q_0.svg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      {/* HEADER */}

      <ScrollView style={[styles.container, { paddingVertical: 12, gap: 12 }]}>
        <View style={styles.containerButtons}>
          <TouchableOpacity style={styles.button}>
            <MaterialCommunityIcons
              name="account-outline"
              size={24}
              color={colors.text}
            />
            <Text
              style={[
                styles.textButton,
                { color: Colors.text, fontFamily: Fonts.semibold },
              ]}
            >
              Profilo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="add" size={24} color={colors.text} />
            <Text
              style={[
                styles.textButton,
                { color: Colors.text, fontFamily: Fonts.semibold },
              ]}
            >
              Aggiungi lega
            </Text>
          </TouchableOpacity>
        </View>

        {/* Qui sarà inserita la lista delle leghe */}

        <View style={styles.section}>
          <Text
            style={[
              styles.textSection,
              { color: Colors.text, fontFamily: Fonts.semibold },
            ]}
          >
            Esplora i campionati
          </Text>
          <ScrollView
            style={styles.containerScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() =>
                router.push(`/(tabs)/Serie A` as Href)
              }
            >
              <Image
                source={require("@/assets/img/serie-a.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() =>
                router.push(`/(tabs)/Premier League` as Href)
              }
            >
              <Image
                source={require("@/assets/img/premier-league.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() =>
                router.push(`/(tabs)/LaLiga` as Href)
              }
            >
              <Image
                source={require("@/assets/img/laliga.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() =>
                router.push(`/(tabs)/Bundesliga` as Href)
              }
            >
              <Image
                source={require("@/assets/img/bundesliga.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leagueButton}
              onPress={() =>
                router.push(`/(tabs)/Ligue 1` as Href)
              }
            >
              <Image
                source={require("@/assets/img/ligue-1.png")}
                style={styles.leagueImage}
              />
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
  containerButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
  },
  button: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  textButton: {
    fontSize: 10,
    textTransform: "uppercase",
  },

  section: {
    width: "100%",
    flex
});
