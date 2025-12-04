import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLeagueStore } from "../../../store/leagueStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import Header from "@/components/Header";
import MenuSelectorLeagues from "@/components/MenuSelectorLeagues";
import { useTheme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const { activeLeague, setActiveLeague, loading } = useLeagueStore();
  const router = useRouter();

  useEffect(() => {
    setActiveLeague(String(id));
  }, [id]);

  const standings = [
    {
      position: 1,
      team: "Team A",
      points: 30,
      played: 15,
      won: 9,
      drawn: 3,
      lost: 3,
      goalsFor: 25,
      goalsAgainst: 15,
      goalDifference: 10,
    },
    {
      position: 2,
      team: "Team B",
      points: 28,
      played: 15,
      won: 8,
      drawn: 4,
      lost: 3,
      goalsFor: 22,
      goalsAgainst: 14,
      goalDifference: 8,
    },
    {
      position: 3,
      team: "Team C",
      points: 25,
      played: 15,
      won: 7,
      drawn: 4,
      lost: 4,
      goalsFor: 20,
      goalsAgainst: 18,
      goalDifference: 2,
    },
    // Aggiungi altre squadre come necessario
  ];

  const headerStyle = {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
  };
  const rowStyle = {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
  };

  if (loading || !activeLeague)
    return <Text style={{ padding: 16 }}>Caricamento...</Text>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title={activeLeague.name} showBackArrow={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <ScrollView>
            <MenuSelectorLeagues isActive={2}></MenuSelectorLeagues>

            <View style={{ paddingHorizontal: 16 }}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fonts.semibold },
                ]}
              >
                Classifica
              </Text>
              <View>
                <View
                  style={[
                    styles.row,
                    styles.between,
                    styles.card,
                    { backgroundColor: colors.secondary, marginBottom: 4 },
                  ]}
                >
                  <Text style={[styles.colPosition, headerStyle]}>#</Text>
                  <Text style={[styles.colTeam, headerStyle]}>Squadra</Text>
                  <Text style={[styles.colPoints, headerStyle]}>Pt.</Text>
                  <Text style={[styles.colPlayed, headerStyle]}>G</Text>
                  <Text style={[styles.colRecord, headerStyle]}>V/P/S</Text>
                  <Text style={[styles.colGoals, headerStyle]}>Gol</Text>
                </View>

                {standings.map((team) => (
                  <View
                    key={team.position}
                    style={[
                      styles.row,
                      styles.between,
                      styles.card,
                      { marginBottom: 4 },
                    ]}
                  >
                    <Text style={[styles.colPosition, rowStyle]}>
                      {team.position}
                    </Text>
                    <Text style={[styles.colTeam, { fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text, }]} numberOfLines={1}>
                      {team.team}
                    </Text>
                    <Text style={[styles.colPoints, rowStyle]}>
                      {team.points}
                    </Text>
                    <Text style={[styles.colPlayed, rowStyle]}>
                      {team.played}
                    </Text>
                    <Text style={[styles.colRecord, rowStyle]}>
                      {team.won}/{team.drawn}/{team.lost}
                    </Text>
                    <Text style={[styles.colGoals, rowStyle]}>
                      {team.goalsFor}/{team.goalsAgainst}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
  content: {
    marginTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  column: {
    flex: 1,
    flexDirection: "column",
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.success,
  },
  addButtonText: { fontSize: 12 },
  buttonContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  between: {
    justifyContent: "space-between",
  },
  card: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  colPosition: {
    width: 24, // colonna molto stretta, perfetta per i numeri 1–20
    textAlign: "left",
  },
  colTeam: {
    flex: 1, // ⛳ questa colonna prende tutto lo spazio rimanente
    textAlign: "left",
  },
  colPoints: {
    width: 28,
    textAlign: "center",
  },
  colPlayed: {
    width: 24,
    textAlign: "center",
  },
  colRecord: {
    width: 52, // abbastanza per "10/10/10"
    textAlign: "center",
  },
  colGoals: {
    width: 52,
    textAlign: "center",
  },
});
