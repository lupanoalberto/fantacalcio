import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useLeagueStore } from '../store/leagueStore';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../app/theme';
import { Colors } from '@/constants/colors';

export default function LeaguesListScreen() {
  const { leagues, fetchUserLeagues, addLeague, loading } = useLeagueStore();
  const router = useRouter();
  const { colors, fonts } = useTheme();

  useEffect(() => {
    fetchUserLeagues('user_123'); // ID utente mock
  }, []);

  if (loading) return <Text>Caricamento...</Text>;

  return (
    <FlatList
      data={leagues}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <TouchableOpacity
        onPress={() => router.push((`/leagues/${item.id}`) as Href)}
          style={[styles.card, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <View style={styles.header}>
            <Text style={[styles.name, { color: colors.text, fontFamily: fonts.bold }]}>
              {item.name}
            </Text>
            <Ionicons name="chevron-forward-outline" size={18} color={colors.textSecondary} />
          </View>

          <Text style={[styles.detail, { color: colors.gold, fontFamily: fonts.regular }]}>
            {item.type}
          </Text>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.textSecondary }]}
          activeOpacity={0.8}
          onPress={() => addLeague('user_123', 'Lega Test')}
        >
          <Ionicons name="add" size={20} color={colors.text} />
          <Text style={[styles.addButtonText, { color: colors.text, fontFamily: fonts.semibold }]}>
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
  },
  detail: {
    fontSize: 12,
  },
  addButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  addButtonText: { fontSize: 12 },
});