// components/LeagueSelector.tsx
import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../app/theme";
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
            style={[styles.button, {backgroundColor: isActive ? colors.secondary : colors.primary,}]}
          >
            <Text
              style={{
                color: isActive ? colors.gold : colors.text,
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
  content: { marginHorizontal: 16, padding: 4, borderRadius: 40, backgroundColor: Colors.primary, borderWidth: 1, borderColor: Colors.secondary },
  button: {
    padding: 16,
    borderRadius: 40,
  },
});
