// components/LeagueSelector.tsx
import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../app/theme";

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
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {leagues.map((league) => {
        const isActive = league === selectedLeague;
        return (
          <TouchableOpacity
            key={league}
            onPress={() => onSelect(league)}
            activeOpacity={0.8}
            style={[
              styles.button,
              {
                backgroundColor: isActive ? colors.success : "transparent",
                borderColor: colors.textSecondary,
              },
            ]}
          >
            <Text
              style={{
                color: isActive ? colors.background : colors.text,
                fontFamily: fonts.medium,
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
  container: { marginBottom: 16 },
  content: { paddingHorizontal: 4, gap: 10 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 40,
    borderWidth: 1,
  },
});
