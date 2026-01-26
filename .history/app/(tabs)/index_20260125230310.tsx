import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
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
                router.push(`//${String(notif.id)}` as Href)
              }
            >
              <Image
                source={require("@/assets/img/serie-a.png")}
                style={styles.leagueImage}
              />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/Serie A` as Href)}
          style={{
            width: "100%",
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: colors.secondary,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <ImageBackground
            source={require("@/assets/img/serie-a.jpg")}
            resizeMode="cover"
            style={{
              flex: 1,
              height: 80,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 16,
              paddingHorizontal: 16,
            }}
          >
            {/* Overlay scuro opzionale */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(0,0,0,0.65)",
              }}
            />
            <SerieAIcon
              width={40}
              height={40}
              stroke={colors.text}
              fill={colors.text}
            />
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.bold,
                color: colors.text,
              }}
            >
              Serie A
            </Text>
          </ImageBackground>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/Premier League` as Href)}
          style={{
            width: "100%",
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: colors.secondary,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <ImageBackground
            source={require("@/assets/img/premier-league.jpg")}
            resizeMode="cover"
            style={{
              flex: 1,
              height: 80,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 16,
              paddingHorizontal: 16,
            }}
          >
            {/* Overlay scuro opzionale */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(0,0,0,0.65)",
              }}
            />
            <PremierLeagueIcon
              width={40}
              height={40}
              stroke={colors.text}
              fill={colors.text}
            />
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.bold,
                color: colors.text,
              }}
            >
              Premier League
            </Text>
          </ImageBackground>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/LaLiga` as Href)}
          style={{
            width: "100%",
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: colors.secondary,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <ImageBackground
            source={require("@/assets/img/la-liga.jpg")}
            resizeMode="cover"
            style={{
              flex: 1,
              height: 80,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 16,
              paddingHorizontal: 16,
            }}
          >
            {/* Overlay scuro opzionale */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(0,0,0,0.65)",
              }}
            />
            <LaLigaIcon
              width={40}
              height={40}
              stroke={colors.text}
              fill={colors.text}
            />
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.bold,
                color: colors.text,
              }}
            >
              LaLiga
            </Text>
          </ImageBackground>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/Bundesliga` as Href)}
          style={{
            width: "100%",
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: colors.secondary,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <ImageBackground
            source={require("@/assets/img/serie-a.jpg")}
            resizeMode="cover"
            style={{
              flex: 1,
              height: 80,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 16,
              paddingHorizontal: 16,
            }}
          >
            {/* Overlay scuro opzionale */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(0,0,0,0.65)",
              }}
            />
            <SerieAIcon
              width={40}
              height={40}
              stroke={colors.text}
              fill={colors.text}
            />
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.bold,
                color: colors.text,
              }}
            >
              Bundesliga
            </Text>
          </ImageBackground>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/Ligue 1` as Href)}
          style={{
            width: "100%",
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: colors.secondary,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <ImageBackground
            source={require("@/assets/img/serie-a.jpg")}
            resizeMode="cover"
            style={{
              flex: 1,
              height: 80,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 16,
              paddingHorizontal: 16,
            }}
          >
            {/* Overlay scuro opzionale */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(0,0,0,0.65)",
              }}
            />
            <SerieAIcon
              width={40}
              height={40}
              stroke={colors.text}
              fill={colors.text}
            />
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.bold,
                color: colors.text,
              }}
            >
              Ligue 1
            </Text>
          </ImageBackground>
        </TouchableOpacity>
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
});
