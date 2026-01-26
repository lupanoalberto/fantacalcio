// components/PlayerList.tsx
import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/theme";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

type Player = {
  name: string;
  shortP: string;
};

type LineupItem = {
  team: string;
  players: Player[];
  bench: Player[];
};

type PlayerListProps = {
  playersList: LineupItem[];
};

export default function PlayerList({ playersList }: PlayerListProps) {
  const { colors, fonts } = useTheme();

  const homeLineup = playersList?.[0];
  const awayLineup = playersList?.[1]; // 👈 sicurezza

  if (!homeLineup || !awayLineup) {
    return null; // oppure un messaggio: <Text>Nessun giocatore</Text>
  }

  return (
    <View>
      <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, gap: 4, flexDirection: "column" }}>
          {homeLineup.players.map((player) => (
            <View
              key={player.name}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: Colors.secondary,
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontFamily: fonts.bold,
                  }}
                >
                  {player.shortP}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  {player.name}
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
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Ionicons
                    name="football-outline"
                    size={18}
                    color={colors.success}
                  />
                  <Text
                    style={{
                      fontSize: 8,
                      color: colors.text,
                      fontFamily: fonts.bold,
                    }}
                  >
                    1
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, gap: 4, flexDirection: "column" }}>
          {awayLineup.players.map((player) => (
            <View
              key={player.name}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: Colors.secondary,
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontFamily: fonts.bold,
                  }}
                >
                  {player.shortP}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  {player.name}
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
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, }}>
        <Text
          style={[
            {
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
              marginBottom: 8,
            },
          ]}
        >
          Panchina
        </Text>
      </View>

      <View style={{ flex: 1, flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <View style={{ flex: 1, gap: 4, flexDirection: "column" }}>
          {homeLineup.bench.map((player) => (
            <View
              key={player.name}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: Colors.secondary,
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontFamily: fonts.bold,
                  }}
                >
                  {player.shortP}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  {player.name}
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
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Ionicons
                    name="football-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={{
                      fontSize: 8,
                      color: colors.success,
                      fontFamily: fonts.bold,
                    }}
                  >
                    1
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, gap: 4, flexDirection: "column" }}>
          {awayLineup.bench.map((player) => (
            <View
              key={player.name}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: Colors.secondary,
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontFamily: fonts.bold,
                  }}
                >
                  {player.shortP}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  {player.name}
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
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
