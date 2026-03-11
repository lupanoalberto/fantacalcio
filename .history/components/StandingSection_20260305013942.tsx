// components/LiveMatchesSection.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTheme } from "@/theme";
import MatchCard from "./MatchCard";
import {
  getLiveOrUpcomingMatches,
  getStandings,
} from "../services/footballApi";
import { Href, useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { teamToCode3 } from "@/utils/teamCodeName";

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

type Props = {
  selectedLeague: string;
};

export default function StandingSection({ selectedLeague }: Props) {
  const { colors, fonts } = useTheme();
  const router = useRouter();

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
          borderRadius: 12,
          padding: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.opacity,
          gap: 12,
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
            {teamToCode3(teamName)}
          </Text>
        </View>
        <Text
          style={{
            width: 32,
            textAlign: "center",
            color: colors.primary,
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
    <View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.section}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontFamily: fonts.bold,
            }}
          >
            Classifica
          </Text>
          <View
            style={{
              flex: 1,
              flexDirection: "column",
              gap: 6,
            }}
          >
            {/* Header della tabellina */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                paddingVertical: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.opacity,
                gap: 12,
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
                #
              </Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
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
                  color: colors.text,
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
                  color: colors.text,
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
                  color: colors.text,
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
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                }}
              >
                DR
              </Text>
            </View>

            <View
              style={{
                flexDirection: "column",
                gap: 6,
              }}
            >
              {/* Righe classifica */}
              {standings.map(renderRow)}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    padding: 12,
  },
  logoContainer: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: Colors.text,
  },
  logo: {
    width: 24,
    height: 24,
  },
});
