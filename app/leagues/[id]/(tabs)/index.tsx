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
import PlayerList from "@/components/PlayerList";
import MenuSelectorLeagues from "@/components/MenuSelectorLeagues";
import { useTheme } from "../../../theme";

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

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.semibold, },
          ]}
        >
          Prossima partita
        </Text>

        {/* 🔹 HEADER DEL MATCH */}
        <View style={{ marginHorizontal: 16, marginBottom: 4, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: colors.secondary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, }}>
          <Text style={{ flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 12, textAlign: "center", }} numberOfLines={1}>
            1 giorno
          </Text>
          <Text style={{ flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 12, textAlign: "center", }} numberOfLines={1}>
            8 ore
          </Text>
          <Text style={{ flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 12, textAlign: "center", }} numberOfLines={1}>
            54 min
          </Text>
        </View>
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

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.semibold, marginTop: 16},
          ]}
        >
          Formazioni
        </Text>

        <View style={{ flex: 1, gap: 4, marginHorizontal: 16 }}>
          <PlayerList playersList={lineup}></PlayerList>
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
  sectionTitle: { fontSize: 16, marginBottom: 8, paddingHorizontal: 16 },
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
