// app/(tabs)/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTheme } from "../../../theme";
import LiveMatchesSection from "@/components/LiveMatchesSection";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { goBack } from "expo-router/build/global-state/routing";
import CalendarSection from "@/components/CalendarSection";
import StandingSection from "@/components/StandingSection";
import PlayersSection from "@/components/PlayersSection";
import InjuriesSection from "@/components/InjuriesSection";

const LEAGUE_LOGOS: Record<number, any> = {
  135: require("@/assets/img/135 1.png"),
  39: require("@/assets/img/39 1.png"),
  140: require("@/assets/img/140 1.png"),
  78: require("@/assets/img/78 1.png"),
  61: require("@/assets/img/61 1.png"),
};

type LeagueRow = {
  id: string;
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code: number | null;
  mode: "CLASSICO" | "MANTRA" | null;
  mod_enabled: boolean | null;
  mod_type: "MOD_DIFESA" | null;
  budget: number | null;
  roster_size: number | null;
  max_players_per_real_team: number | null;
  scoring_json: any | null;
  created_by: string | null;
  created_at?: string | null;
};

export default function HomeTab() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const [isActive, setIsActive] = useState(0);
  const insets = useSafeAreaInsets();

  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLeague() {
      try {
        setLeagueLoading(true);

        const leagueId = String(id ?? "");
        if (!leagueId) {
          setLeague(null);
          return;
        }

        const { data, error } = await supabase
          .from("leagues")
          .select(
            `
          id,
          name,
          api_league_id,
          season,
          join_code,
          mode,
          mod_enabled,
          mod_type,
          budget,
          roster_size,
          max_players_per_real_team,
          scoring_json,
          created_by,
          created_at
        `,
          )
          .eq("id", leagueId)
          .single();

        if (error) throw error;

        if (!cancelled) setLeague(data as LeagueRow);
      } catch (e: any) {
        console.error("loadLeague error:", e?.message ?? e);
        if (!cancelled) setLeague(null);
      } finally {
        if (!cancelled) setLeagueLoading(false);
      }
    }

    loadLeague();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const leagueId = league?.api_league_id ?? null;

  const leagueLogo = leagueId != null ? LEAGUE_LOGOS[leagueId] : undefined;

  return (
    <View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View
              style={{
                padding: 12,
                paddingTop: 12 + insets.top,
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity onPress={goBack} style={styles.button}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View
                style={{
                  paddingRight: 24,
                  flex: 1,
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={leagueLogo}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                  }}
                />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                backgroundColor: colors.card,
                padding: 12,
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={[
                  {
                    padding: 12,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 12,
                    backgroundColor:
                      isActive === 0 ? colors.primary : colors.opacity,
                  },
                ]}
                onPress={() => {
                  setIsActive(0);
                }}
              >
                <MaterialIcons name="live-tv" size={24} color={colors.text} />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  Live
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  {
                    padding: 12,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 12,
                    backgroundColor:
                      isActive === 1 ? colors.primary : colors.opacity,
                  },
                ]}
                onPress={() => {
                  setIsActive(1);
                }}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.text} />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  Calendario
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  {
                    padding: 12,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 12,
                    backgroundColor:
                      isActive === 2 ? colors.primary : colors.opacity,
                  },
                ]}
                onPress={() => {
                  setIsActive(2);
                }}
              >
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={24}
                  color={colors.text}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  Classifica
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  {
                    padding: 12,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 12,
                    backgroundColor:
                      isActive === 3 ? colors.primary : colors.opacity,
                  },
                ]}
                onPress={() => {
                  setIsActive(3);
                }}
              >
                <Ionicons name="shirt-outline" size={24} color={colors.text} />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  Giocatori
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  {
                    padding: 12,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 12,
                    backgroundColor:
                      isActive === 4 ? colors.primary : colors.opacity,
                  },
                ]}
                onPress={() => {
                  setIsActive(4);
                }}
              >
                <Ionicons name="bandage-outline" size={24} color={colors.text} />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: fonts.semibold,
                  }}
                >
                  Infortunati
                </Text>
              </TouchableOpacity>
            </ScrollView>
    
            <View>
              {isActive === 0 ? (
                <LiveMatchesSection selectedLeague={league?.id ?? ""} />
              ) : isActive === 1 ? (
                <CalendarSection selectedLeague={league?.id ?? ""} />
              ) : isActive === 2 ? (
                <StandingSection selectedLeague={league?.id ?? ""} />
              ) : isActive === 3 ? (
                <PlayersSection selectedLeague={league?.id ?? ""} />
              ) : (
                <InjuriesSection selectedLeague={league?.id ?? ""} />
              )}
            </View>
          </ScrollView>
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  textButton: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  textSection: {
    fontSize: 14,
    padding: 16,
  },
  containerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
  },
});
