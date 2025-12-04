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
import { FontAwesome6, Ionicons } from "@expo/vector-icons";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const { activeLeague, setActiveLeague, loading } = useLeagueStore();
  const router = useRouter();

  useEffect(() => {
    setActiveLeague(String(id));
  }, [id]);

  const teams = [
    {
      id: 1,
      team: "Team A",
      budget: "0",
    },
    {
      id: 2,
      team: "Team B",
      budget: "54",
    },
    {
      id: 3,
      team: "Team C",
      budget: "16",
    },
    {
      id: 4,
      team: "Team D",
      budget: "3",
    },
    {
      id: 5,
      team: "Team E",
      budget: "14",
    },
    // Aggiungi altre squadre come necessario
  ];

  if (loading || !activeLeague)
    return <Text style={{ padding: 16 }}>Caricamento...</Text>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title={activeLeague.name} showBackArrow={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <MenuSelectorLeagues isActive={3}></MenuSelectorLeagues>

          <View style={{ paddingHorizontal: 16 }}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fonts.semibold },
              ]}
            >
              Squadre
            </Text>

            <View
              style={{
                marginBottom: 4,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: colors.secondary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <FontAwesome6 name="arrow-right-arrow-left" size={16} color={colors.text} />
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                Proponi scambio
              </Text>
            </View>

            {teams.map((team) => (
              <View
                key={team.id}
                style={[
                  styles.row,
                  styles.between,
                  styles.card,
                  { marginBottom: 4 },
                ]}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: colors.secondary,
                  }}
                ></View>
                <Text
                  style={[
                    {
                      flex: 1,
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                      color: colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {team.team}
                </Text>
                <Text
                  style={[
                    {
                      fontFamily: fonts.regular,
                      fontSize: 12,
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {team.budget}
                </Text>
              </View>
            ))}
          </View>
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
    gap: 16,
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
});
