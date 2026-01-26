import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import { getStandings } from "../services/footballApi";
import { useTheme } from "@/theme";
import Header from "@/components/Header";
import { Colors } from "@/constants/colors";

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
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.primary,
          borderWidth: 1,
          borderColor: colors.secondary,
          borderRadius: 16,
          gap: 2,
        }}
      >
        <Text
          style={{
            width: 24,
            textAlign: "center",
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 12,
          }}
        >
          {row.position}
        </Text>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
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
              fontSize: 14,
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
            color: colors.success,
            fontFamily: fonts.semibold,
            fontSize: 12,
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
            fontSize: 12,
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
            fontSize: 12,
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
            fontSize: 12,
          }}
        >
          {row.goalDifference}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Classifica" showBackArrow={true} />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
              fontFamily: fonts.bold,
              marginTop: 16,
              marginHorizontal: 16,
            },
          ]}
        >
          Classifica {selectedLeague}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : (
          <View
            style={{
              margin: 16,
              marginTop: 0,
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* Header della tabellina */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: colors.secondary,
                borderRadius: 16,
                gap: 2,
              }}
            >
              <Text
                style={{
                  width: 24,
                  textAlign: "center",
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
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
                  fontSize: 12,
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
                  fontSize: 12,
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
                  fontSize: 12,
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
                  fontSize: 12,
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
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  logo: {
    width: 40,
    height: 40,
  },
  sectionTitle: { fontSize: 16, marginBottom: 4, alignSelf: "flex-start" },
});
