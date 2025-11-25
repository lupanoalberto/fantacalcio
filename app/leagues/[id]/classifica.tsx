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
