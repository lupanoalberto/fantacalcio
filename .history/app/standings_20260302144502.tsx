import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getStandings } from "../services/footballApi";
import { useTheme } from "@/theme";
import Header from "@/components/Header";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { goBack } from "expo-router/build/global-state/routing";

type StandingRow = {
  position: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalDifference: number;
  team: {
    id: number;
    name: string;
    shortName?: string;
    crest?: string;
    crestUrl?: string;
  };
};

export default function StandingsScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { league } = useLocalSearchParams();
  const selectedLeague = (league as string) ?? "Serie A";

  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStandings = async () => {
      try {
        setLoading(true);
        const data = await getStandings(selectedLeague);
        setStandings(data);
      } catch (err) {
        console.error("❌ Errore caricamento classifica:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStandings();
  }, [selectedLeague]);

  const renderRow = (row: StandingRow) => {
    const teamName = row.team.shortName ?? row.team.name;

    return (
      <View
        key={row.team.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          margin: 16,
          marginVertical: 8,
          borderRadius: 8,
          padding: 16,
          backgroundColor: colors.opacity,
          gap: 8,
        }}
      >
        <Text
          style={{
            width: 24,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 10,
          }}
        >
          {row.position}
        </Text>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: row.team.crest }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text
            style={{
              flex: 1,
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
            numberOfLines={1}
          >
            {teamName}
          </Text>
        </View>
        <Text
          style={{
            width: 32,
            textAlign: "center",
            color: colors.green,
            fontFamily: fonts.semibold,
            fontSize: 10,
          }}
        >
          {row.points}
        </Text>
        <Text
          style={{
            width: 32,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.regular,
            fontSize: 10,
          }}
        >
          {row.playedGames}
        </Text>
        <Text
          style={{
            width: 64,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.regular,
            fontSize: 10,
          }}
        >
          {row.won}/{row.draw}/{row.lost}
        </Text>
        <Text
          style={{
            width: 32,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.regular,
            fontSize: 10,
          }}
        >
          {row.goalDifference}
        </Text>
      </View>
    );
  };

  return (
    <View
          style={[
            {
              flex: 1,
              backgroundColor: "#0d0d0d",
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View
            style={{
              padding: 8,
              paddingHorizontal: 16,
              paddingTop: 8 + insets.top,
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              height: 64 + insets.top,
            }}
          >
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                color: colors.white,
                fontFamily: fonts.bold,
                fontSize: 16,
                paddingRight: 32,
                textAlign: "center",
              }}
            >
              Calendario
            </Text>
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
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                gap: 24,
              }}
            >

        {loading ? (
          <ActivityIndicator size="large" color={colors.blue} />
        ) : (
          <View
            style={{
              flex: 1,
              flexDirection: "column",
            }}
          >
            {/* Header della tabellina */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                backgroundColor: colors.opacity,
                gap: 8,
              }}
            >
              <Text
                style={{
                  width: 24,
                  textAlign: "center",
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                #
              </Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Squadra
              </Text>
              <Text
                style={{
                  width: 32,
                  textAlign: "center",
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                Pt.
              </Text>
              <Text
                style={{
                  width: 32,
                  textAlign: "center",
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                GG
              </Text>
              <Text
                style={{
                  width: 64,
                  textAlign: "center",
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                V/P/S
              </Text>
              <Text
                style={{
                  width: 32,
                  textAlign: "center",
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                DR
              </Text>
            </View>

            {/* Righe classifica */}
            {standings.map(renderRow)}
          </View>
        )}
      </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.gray,
  },
  logo: {
    width: 24,
    height: 24,
  },
});
