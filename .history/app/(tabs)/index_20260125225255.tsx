import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { Href, useRouter } from "expo-router";
import Header from "@/components/Header";
import { useTheme } from "../theme";
import SerieAIcon from "@/assets/svg/serie-a-logo.svg";
import PremierLeagueIcon from "@/assets/svg/Premier League_Symbol_0.svg";
import LaLigaIcon from "@/assets/svg/LaLiga_id5A1pzi0Q_0.svg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ItalyIcon from "@/assets/svg/italy-svgrepo-com.svg";
import UkIcon from "@/assets/svg/united-kingdom-svgrepo-com.svg";
import SpainIcon from "@/assets/svg/spain-svgrepo-com.svg";
import FranceIcon from "@/assets/svg/france-svgrepo-com.svg";
import GermanyIcon from "@/assets/svg/germany-svgrepo-com.svg";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const [isActive, setIsActive] = useState<number>(0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}

      <ScrollView style={styles.container}>
        <View style={styles.containerButtons}>
          <TouchableOpacity style={styles.button}>
            <MaterialCommunityIcons name="account-outline" size={24} color={colors.text} />
            <Text style={styles.textButton}>
              Profilo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="add" size={24} color={colors.text} />
            <Text style={styles.textButton}>
              Aggiungi lega
            </Text>
          </TouchableOpacity>
        </View>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold, paddingTop: 12 },
            ]}
          >
            Seleziona il campionato
          </Text>
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
    gap: 16,
  },
  button: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
});
