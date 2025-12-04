import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLeagueStore } from "../../../../store/leagueStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import Header from "@/components/Header";
import MenuSelectorLeagues from "@/components/MenuSelectorLeagues";
import { useTheme } from "../../../theme";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const { activeLeague, setActiveLeague, loading } = useLeagueStore();
  const router = useRouter();
  const [team, setTeams] = React.useState("all");
  const [role, setRole] = React.useState("all");
  const [ordine, setOrdine] = React.useState("crescent");

  useEffect(() => {
    setActiveLeague(String(id));
  }, [id]);

  const players = [
    {
      id: 1,
      name: "Di Gregorio",
      role: "Portiere",
      team: "Juventus",
      teamCode: "010304",
      value: "12",
    },
    {
      id: 2,
      name: "Dumfries",
      role: "Difensore",
      team: "Inter",
      teamCode: "020304",
      value: "20",
    },
    {
      id: 3,
      name: "De Ketelaere",
      role: "Centrocampista",
      team: "Atalanta",
      teamCode: "030405",
      value: "24",
    },
    {
      id: 4,
      name: "Leao",
      role: "Attaccante",
      team: "Milan",
      teamCode: "080506",
      value: "30",
    },
  ];

  function renderTeamsOptions() {
    const options = [
      { label: "Squadra", value: "all" },
      { label: "Inter", value: "020304" },
      { label: "Juventus", value: "010304" },
      { label: "Milan", value: "080506" },
    ];
    const optionsArray = [];
    for (let i = 0; i < options.length; i++) {
      optionsArray.push(
        <Picker.Item
          key={i}
          label={options[i].label}
          value={options[i].value}
          style={{
            fontFamily: fonts.semibold,
            fontSize: 12,
          }}
        />
      );
    }
    return optionsArray;
  }

  function renderRoleOptions() {
    const options = [
      { label: "Ruolo", value: "all" },
      { label: "Portieri", value: "01" },
      { label: "Difensori", value: "02" },
      { label: "Centrocampisti", value: "03" },
      { label: "Attaccanti", value: "04" },
    ];
    const optionsArray = [];
    for (let i = 0; i < options.length; i++) {
      optionsArray.push(
        <Picker.Item
          key={i}
          label={options[i].label}
          value={options[i].value}
          style={{
            fontFamily: fonts.semibold,
            fontSize: 12,
          }}
        />
      );
    }
    return optionsArray;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title={"Lega Test"} showBackArrow={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text
            style={[
              styles.sectionTitle,
              {
                marginTop: 8,
                marginHorizontal: 16,
                fontFamily: fonts.bold,
                color: colors.text,
              },
            ]}
          >
            Giocatori
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginHorizontal: 16,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 16,
                height: 48,
                justifyContent: "center",
                paddingHorizontal: 16,
                backgroundColor: colors.secondary,
              }}
            >
              <Picker
                selectedValue={team}
                dropdownIconColor={colors.text}
                onValueChange={(value) => setTeams(value)}
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                {renderTeamsOptions()}
              </Picker>
            </View>
            <View
              style={{
                flex: 1,
                borderRadius: 16,
                height: 48,
                justifyContent: "center",
                paddingHorizontal: 16,
                backgroundColor: colors.secondary,
              }}
            >
              <Picker
                selectedValue={role}
                dropdownIconColor={colors.text}
                onValueChange={(value) => setRole(value)}
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                {renderRoleOptions()}
              </Picker>
            </View>
            <TouchableOpacity
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: colors.secondary,
              }}
            >
              <FontAwesome6
                name="arrow-right-arrow-left"
                size={16}
                color={colors.text}
                style={{ transform: "rotate(90deg)" }}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginHorizontal: 16,
              flexDirection: "column",
              gap: 4,
              marginBottom: 16,
            }}
          >
            {players.map((player) => (
              <View
                key={player.id}
                style={[styles.row, styles.between, styles.card]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: colors.secondary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  ></View>
                  <View style={{ flexDirection: "column", flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 14,
                        color: colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {player.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: colors.textSecondary,
                      }}
                      numberOfLines={1}
                    >
                      {player.role} - {player.team}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 14,
                    color: colors.text,
                  }}
                >
                  {player.value}
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
    gap: 16,
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
