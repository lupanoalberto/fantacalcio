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
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
        <Header title={"FUTA 2026"} showBackArrow={false} />
        <View style={styles.content}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          >
            Seleziona la lingua
          </Text>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: isActive === 0 ? colors.success : colors.secondary,
                backgroundColor: colors.primary,
                borderRadius: 40,
              }}
              onPress={() => setIsActive(0)}
            >
              <ItalyIcon
                width={16}
                height={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: isActive === 1 ? colors.success : colors.secondary,
                backgroundColor: colors.primary,
                borderRadius: 40,
              }}
              onPress={() => setIsActive(1)}
            >
              <UkIcon
                width={16}
                height={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: isActive === 2 ? colors.success : colors.secondary,
                backgroundColor: colors.primary,
                borderRadius: 40,
              }}
              onPress={() => setIsActive(2)}
            >
              <SpainIcon
                width={16}
                height={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: isActive === 3 ? colors.success : colors.secondary,
                backgroundColor: colors.primary,
                borderRadius: 40,
              }}
              onPress={() => setIsActive(3)}
            >
              <GermanyIcon
                width={16}
                height={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: isActive === 4 ? colors.success : colors.secondary,
                backgroundColor: colors.primary,
                borderRadius: 40,
              }}
              onPress={() => setIsActive(4)}
            >
              <FranceIcon
                width={16}
                height={16}
              />
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  sectionTitle: { fontSize: 16, marginBottom: 4, alignSelf: "flex-start" },
});
