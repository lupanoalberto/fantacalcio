import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLeagueStore } from "../../../../store/leagueStore";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import Header from "@/components/Header";
import MenuSelectorLeagues from "@/components/MenuSelectorLeagues";
import { useTheme } from "../../../theme";
import { Ionicons } from "@expo/vector-icons";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const { activeLeague, setActiveLeague } = useLeagueStore();
    const [isActive, setIsActive] = useState<number>(0);

  useEffect(() => {
    setActiveLeague(String(id));
    console.log("ID " + id + " ACTIVE LEAGUE " + activeLeague);
  }, [id]);

  const lineup = [
    {
      team: "Home",
      players: [
        { name: "Carnesecchi", position: "Portiere", shortP: "P" },
        { name: "Kalulu", position: "Difensore", shortP: "D" },
        { name: "Valle", position: "Difensore", shortP: "D" },
        { name: "Carlos Augusto", position: "Difensore", shortP: "D" },
        { name: "Locatelli", position: "Centrocampista", shortP: "C" },
        { name: "Koopmeiners", position: "Centrocampista", shortP: "C" },
        { name: "Gudmundson", position: "Centrocampista", shortP: "C" },
        { name: "Pasalic", position: "Centrocampista", shortP: "C" },
        { name: "Morata", position: "Attaccante", shortP: "A" },
        { name: "Esposito S.", position: "Attaccante", shortP: "A" },
        { name: "Berardi", position: "Attaccante", shortP: "A" },
      ],
      bench: [
        { name: "Carnesecchi", position: "Portiere", shortP: "P" },
        { name: "Kalulu", position: "Difensore", shortP: "D" },
        { name: "Valle", position: "Difensore", shortP: "D" },
        { name: "Carlos Augusto", position: "Difensore", shortP: "D" },
        { name: "Locatelli", position: "Centrocampista", shortP: "C" },
        { name: "Koopmeiners", position: "Centrocampista", shortP: "C" },
        { name: "Gudmundson", position: "Centrocampista", shortP: "C" },
        { name: "Pasalic", position: "Centrocampista", shortP: "C" },
        { name: "Morata", position: "Attaccante", shortP: "A" },
        { name: "Esposito S.", position: "Attaccante", shortP: "A" },
        { name: "Berardi", position: "Attaccante", shortP: "A" },
      ],
    },
    {
      team: "Away",
      players: [
        { name: "Okoye", position: "Portiere", shortP: "P" },
        { name: "Bellanova", position: "Difensore", shortP: "D" },
        { name: "Nkounkou", position: "Difensore", shortP: "D" },
        { name: "Zappacosta", position: "Difensore", shortP: "D" },
        { name: "Isaksen", position: "Centrocampista", shortP: "C" },
        { name: "Vlasic", position: "Centrocampista", shortP: "C" },
        { name: "Sucic", position: "Centrocampista", shortP: "C" },
        { name: "Bernabè", position: "Centrocampista", shortP: "C" },
        { name: "Adams C.", position: "Attaccante", shortP: "A" },
        { name: "Vlahovic", position: "Attaccante", shortP: "A" },
        { name: "Yildiz", position: "Attaccante", shortP: "A" },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title={"Lega Test"} showBackArrow={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <ScrollView>
            <MenuSelectorLeagues isActive={0}></MenuSelectorLeagues>
          </ScrollView>
        </View>

        {/* 🔹 HEADER DEL MATCH */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginHorizontal: 16,
            borderRadius: 16,
            marginBottom: 4,
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: Colors.secondary,
          }}
        >
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                padding: 8,
                backgroundColor: Colors.secondary,
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <View style={{ width: 40, height: 40 }} />
            </View>
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 13,
                textAlign: "center",
                width: 64,
              }}
              numberOfLines={1}
            >
              AL LEGRI
            </Text>
          </View>
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 12,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              Serie A
            </Text>
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.bold,
                fontSize: 24,
              }}
            >
              -
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 12,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              Giornata 11
            </Text>
          </View>

          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                padding: 8,
                backgroundColor: Colors.secondary,
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <View style={{ width: 40, height: 40 }} />
            </View>
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 12,
                textAlign: "center",
                width: 64,
              }}
              numberOfLines={1}
            >
              Scarsenal
            </Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.addButton]} activeOpacity={0.8}>
          <Text
            style={[
              styles.addButtonText,
              { color: colors.background, fontFamily: fonts.bold },
            ]}
          >
            Inserisci formazione
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 16, margin: 16, }}>
          <TouchableOpacity
            onPress={() => setIsActive(0)}
            activeOpacity={0.8}
            style={[
              {
                borderColor:
                  isActive === 0 ? colors.success : colors.background,
                paddingBottom: 12,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={{
                color: isActive === 0 ? colors.success : colors.textSecondary,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              AL LEGRI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsActive(1)}
            activeOpacity={0.8}
            style={[
              {
                borderColor:
                  isActive === 1 ? colors.success : colors.background,
                paddingBottom: 12,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={{
                color: isActive === 1 ? colors.success : colors.textSecondary,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              Scarsenal
            </Text>
          </TouchableOpacity>
        </View>

          <View style={{ flex: 1, gap: 4, marginHorizontal: 16 }}>
            {lineup[isActive].players.map((line) => (
              <View
                key={line.name}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  borderWidth: 1,
                  borderColor: Colors.secondary,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontFamily: fonts.semibold,
                    }}
                  >
                    {line.shortP}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      color: colors.text,
                      fontFamily: fonts.semibold,
                    }}
                  >
                    {line.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.success,
                      fontFamily: fonts.semibold,
                    }}
                  >
                    6.5
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      padding: 4,
                      position: "relative",
                    }}
                  >
                    <Ionicons
                      name="football-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text
                    style={{
                      fontSize: 8,
                      color: colors.primary,
                      paddingHorizontal: 2,
                      backgroundColor: colors.success,
                      borderRadius: 3,
                      fontFamily: fonts.semibold,
                      position: "absolute",
                      top: 0,
                      right: 0,
                    }}
                  >
                    2
                  </Text>
                  </View>
                  
                </View>
              </View>
            ))}
          </View>

        <View style={{ marginTop: 16, marginHorizontal: 16 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.semibold },
            ]}
          >
            Panchina
          </Text>
        </View>

        <View style={{ flex: 1, gap: 4, marginHorizontal: 16, marginBottom: 16 }}>
            {lineup[isActive].players.map((line) => (
              <View
                key={line.name}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  borderWidth: 1,
                  borderColor: Colors.secondary,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontFamily: fonts.semibold,
                    }}
                  >
                    {line.shortP}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      color: colors.text,
                      fontFamily: fonts.semibold,
                    }}
                  >
                    {line.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.success,
                      fontFamily: fonts.semibold,
                    }}
                  >
                    SV
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                </View>
              </View>
            ))}
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
  sectionTitle: { fontSize: 12, marginBottom: 8 },
  row: {
    flex: 1,
    flexDirection: "row",
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
    flexDirection: "column",
    gap: 8,
    borderRadius: 8,
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
