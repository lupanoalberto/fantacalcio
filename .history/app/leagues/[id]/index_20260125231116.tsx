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
import { useTheme } from "../../theme";
import SerieAIcon from "@/assets/svg/serie-a-logo.svg";
import PremierLeagueIcon from "@/assets/svg/Premier League_Symbol_0.svg";
import LaLigaIcon from "@/assets/svg/LaLiga_id5A1pzi0Q_0.svg";
import { Feather, FontAwesome, FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const [isActive, setIsActive] = useState<number>(0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title={"FUTA 2026"} showBackArrow={true} />

      <ScrollView style={styles.container}>
        <View style={styles.content}>
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
              source={require("@/assets/img/inserisci-formazione.png")}
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
              <MaterialCommunityIcons
                name="soccer-field"
                size={40}
                color={colors.text}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: colors.text,
                }}
              >
                Inserisci formazione
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
              source={require("@/assets/img/calendario.png")}
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
              <Ionicons name="calendar-outline" size={40} color={colors.text} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: colors.text,
                }}
              >
                Calendario
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
              source={require("@/assets/img/classifica.png")}
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
              <Ionicons name="trophy-outline" size={40} color={colors.text} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: colors.text,
                }}
              >
                Classifica
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
              source={require("@/assets/img/laliga.jpg")}
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
              <Ionicons name="shield-outline" size={40} color={colors.text} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: colors.text,
                }}
              >
                Squadre
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
              source={require("@/assets/img/listone.png")}
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
              <Ionicons name="shirt-outline" size={40} color={colors.text} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: colors.text,
                }}
              >
                Listone
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
              source={require("@/assets/img/scambi.png")}
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
              <FontAwesome name="exchange" size={40} color={colors.text} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: colors.text,
                }}
              >
                Scambi
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
              source={require("@/assets/img/laliga.jpg")}
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
                <Feather name="settings" size={40} color={colors.text} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: colors.text,
                }}
              >
                Impostazioni
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
              source={require("@/assets/img/laliga.jpg")}
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
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.secondary }}>

              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  color: colors.text,
                }}
              >
                Profilo
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
});
