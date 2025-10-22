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
                backgroundColor: isActive ? colors.success : colors.secondary,
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
  container: { marginTop: 16 },
  content: { gap: 16 },
  button: {
    fontSize: 13,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
});
