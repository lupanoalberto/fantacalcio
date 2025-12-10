// app/(tabs)/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../theme";
import Header from "../../components/Header";
import ListLeagues from "@/components/ListLeagues";
import LiveMatchesSection from "@/components/LiveMatchesSection";
import NewsCarousel from "@/components/NewsCarousel";
import LeagueSelector from "@/components/LeagueSelector";
import { useState } from "react";
import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";

const CURRENT_LEAGUE = "Serie A";

export default function HomeTab() {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  const goToCalendar = () => {
    router.push({
      pathname: "/calendar",
      params: { league: CURRENT_LEAGUE },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title="Fantacalcio" showBackArrow={false} />

      {/* CONTENUTO */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={{ marginTop: 16 }}>
          <LiveMatchesSection selectedLeague={CURRENT_LEAGUE} />
        </View>

        <View style={{ margin: 16 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          >
            {CURRENT_LEAGUE}
          </Text>

          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.primary,
              borderWidth: 1,
              borderColor: colors.secondary,
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <TouchableOpacity
              onPress={goToCalendar}
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color={colors.text}
                />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Calendario
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <Ionicons name="trophy-outline" size={32} color={colors.text} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Classifica
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <Ionicons name="shirt-outline" size={32} color={colors.text} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Giocatori
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <MaterialCommunityIcons
                  name="strategy"
                  size={32}
                  color={colors.text}
                />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Allenatori
              </Text>
            </View>
          </View>
        </View>

        {/* SEZIONE LEGHE */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          >
            Le tue leghe
          </Text>

          <ListLeagues></ListLeagues>
        </View>

        <View style={{ marginTop: 16 }}>
          <NewsCarousel selectedLeague={CURRENT_LEAGUE} />
        </View>

        <View style={{ margin: 16 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          >
            Come funziona
          </Text>

          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.primary,
              borderWidth: 1,
              borderColor: colors.secondary,
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <MaterialIcons name="rule" size={32} color={colors.text} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Regole
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <Entypo name="line-graph" size={32} color={colors.text} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Strategie
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <Ionicons name="logo-youtube" size={32} color={colors.text} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Tutorial
              </Text>
            </View>
            <View
              style={{
                flex: 1,
              }}
            ></View>
          </View>
        </View>

        <View style={{ margin: 16, marginVertical: 0 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fonts.bold },
            ]}
          >
            Profilo e assistenza
          </Text>

          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.primary,
              borderWidth: 1,
              borderColor: colors.secondary,
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={32}
                  color={colors.text}
                />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Account
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <FontAwesome5
                  name="question-circle"
                  size={32}
                  color={colors.text}
                />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Faq
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                }}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={32}
                  color={colors.text}
                />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                Contattaci
              </Text>
            </View>
            <View style={{ flex: 1 }}></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 16 },
  section: { width: "100%", paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
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
