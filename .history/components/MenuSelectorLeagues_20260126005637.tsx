// components/LeagueSelector.tsx
import React, { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Href } from "expo-router";

type MenuSelectorLeagues = {
  isActive?: number;
};

export default function LeagueSelector({isActive,
}: MenuSelectorLeagues) {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        onPress={() => {router.push((`/leagues/${String(id)}/(tabs)`) as Href);}}
        activeOpacity={0.8}
        style={[
          styles.button,
          { borderColor: isActive === 0 ? colors.success : colors.background },
        ]}
      >
        <Text
          style={{
            color: isActive === 0 ? colors.success : colors.textSecondary,
            fontFamily: fonts.semibold,
            fontSize: 12,
          }}
        >
          Prossima partita
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {router.push((`/leagues/${String(id)}/calendario`) as Href);}}
        activeOpacity={0.8}
        style={[
          styles.button,
          { borderColor: isActive === 1 ? colors.success : colors.background },
        ]}
      >
        <Text
          style={{
            color: isActive === 1 ? colors.success : colors.textSecondary,
            fontFamily: fonts.semibold,
            fontSize: 12,
          }}
        >
          Calendario
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {router.push((`/leagues/${String(id)}/classifica`) as Href);}}
        activeOpacity={0.8}
        style={[
          styles.button,
          { borderColor: isActive === 2 ? colors.success : colors.background },
        ]}
      >
        <Text
          style={{
            color: isActive === 2 ? colors.success : colors.textSecondary,
            fontFamily: fonts.semibold,
            fontSize: 12,
          }}
        >
          Classifica
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {router.push((`/leagues/${String(id)}/avversari`) as Href);}}
        activeOpacity={0.8}
        style={[
          styles.button,
          { borderColor: isActive === 3 ? colors.success : colors.background },
        ]}
      >
        <Text
          style={{
            color: isActive === 3 ? colors.success : colors.textSecondary,
            fontFamily: fonts.semibold,
            fontSize: 12,
          }}
        >
          Avversari
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 16, paddingBottom: 16 },
  button: {
    paddingBottom: 12,
    borderBottomWidth: 2,
  },
});
