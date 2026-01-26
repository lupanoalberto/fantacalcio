// components/LeagueSelector.tsx
import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";
import { Colors } from "@/constants/colors";

type LeagueSelectorProps = {
  leagues: string[];
  selectedLeague: string;
  onSelect: (league: string) => void;
};

export default function LeagueSelector({
  leagues,
  selectedLeague,
  onSelect,
}: LeagueSelectorProps) {
  const { colors, fonts } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {leagues.map((league) => {
        const isActive = league === selectedLeague;
        return (
          <TouchableOpacity
            key={league}
            onPress={() => onSelect(league)}
            activeOpacity={0.8}
            style={[styles.button, {borderColor: isActive ? colors.success : colors.background,}]}
          >
            <Text
              style={{
                color: isActive ? colors.success : colors.textSecondary,
                fontFamily: fonts.semibold, fontSize: 12,
              }}
            >
              {league}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, gap: 16,},
  button: {
    paddingBottom: 12,
    borderBottomWidth: 2,
  },
});
