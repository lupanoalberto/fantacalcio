import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLeagueStore } from "../store/leagueStore";
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../app/theme";
import { Colors } from "@/constants/colors";

export default function LeaguesListScreen() {
  const { leagues, fetchUserLeagues, addLeague, loading } = useLeagueStore();
  const router = useRouter();
  const { colors, fonts } = useTheme();

  useEffect(() => {
    fetchUserLeagues("user_123"); // ID utente mock
  }, []);

  if (loading) return <Text>Caricamento...</Text>;

  return (
    <FlatList
      data={leagues}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/leagues/${item.id}/(tabs)` as Href)}
          style={[styles.card, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, }}>
            <Text
            style={[
              styles.name,
              { color: colors.success, fontFamily: fonts.semibold },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.detail,
              { color: colors.textSecondary, fontFamily: fonts.regular },
            ]}
          >
            {item.type}
          </Text>
          </View>
          
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary }}></View>
            <Text
            style={[
              styles.name,
              { color: colors.text, fontFamily: fonts.semibold, fontSize: 14},
            ]}
          >
            Squadra Test
          </Text>
          </View>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <TouchableOpacity
          style={[styles.addButton]}
          activeOpacity={0.8}
          onPress={() => addLeague("user_123", "Lega Test")}
        >
          <Ionicons name="add" size={20} color={colors.text} />
          <Text
            style={[
              styles.addButtonText,
              { color: colors.text, fontFamily: fonts.semibold },
            ]}
          >
            Aggiungi nuova lega
          </Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  name: {
    fontSize: 12,
  },
  detail: {
    fontSize: 12,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.secondary,
  },
  addButtonText: { fontSize: 12 },
});
