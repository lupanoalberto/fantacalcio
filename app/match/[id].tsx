import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getMatchDetails } from "../../services/footballApi";
import { useTheme } from "../theme";
import Header from "@/components/Header";
import { Colors } from "@/constants/colors";

export default function MatchDetails() {
  const { id } = useLocalSearchParams();
  const { colors, fonts } = useTheme();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<number>(0);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getMatchDetails(Number(id));
        setDetails(data);
      } catch (err) {
        console.error("❌ Errore caricamento dettagli partita:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading || !details) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.success} />
      </View>
    );
  }

  const match = details.match ?? details;
  const events = details.events ?? [];
  const lineups = details.lineups ?? [];

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const scoreHome = match.score?.fullTime?.home ?? "-";
  const scoreAway = match.score?.fullTime?.away ?? "-";
  let status;
  const matchday = match.matchday;

  // 🔹 Determina il colore in base allo stato
  let scoreColor = colors.text;
  let timeColor = colors.textSecondary;

  if (match.status === "IN_PLAY") {
    status = "LIVE";
  } else if (match.status === "PAUSED") {
    status = "INT.";
  } else {
    const date = new Date(match?.utcDate);
    status = date.toLocaleString("it-IT", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (status.includes("LIVE") || status.includes("INT.")) {
    scoreColor = colors.success; // verde per LIVE
    timeColor = colors.success;
  } else if (
    ["POSTPONED", "SUSPENDED", "CANCELLED"].some((w) => status.includes(w))
  ) {
    scoreColor = colors.error; // rosso per problemi
    timeColor = colors.error; // giallo per sospensione
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <Header title="Fantacalcio" showBackArrow={true} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* 🔹 HEADER DEL MATCH */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 16,
            marginTop: 8,
            marginBottom: 16,
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: Colors.secondary,
          }}
        >
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={styles.logoContainer}>
              {homeTeam.crest && (
                <Image source={{ uri: homeTeam.crest }} style={styles.logo} />
              )}
            </View>
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 13,
                textAlign: "center",
                width: 64,
              }}
              numberOfLines={1}
            >
              {homeTeam.shortName}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: timeColor,
                fontFamily: fonts.regular,
                fontSize: 12,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {status}
            </Text>
            <Text
              style={{
                color: scoreColor,
                fontFamily: fonts.bold,
                fontSize: 24,
              }}
            >
              {scoreHome} - {scoreAway}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 12,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              Giornata {matchday}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={styles.logoContainer}>
              {awayTeam.crest && (
                <Image source={{ uri: awayTeam.crest }} style={styles.logo} />
              )}
            </View>
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 12,
                textAlign: "center",
                width: 64,
              }}
              numberOfLines={1}
            >
              {awayTeam.shortName}
            </Text>
          </View>
        </View>

        {/* 🔹 SEZIONE EVENTI */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setIsActive(0)}
            activeOpacity={0.8}
            style={[
              {
                borderColor: isActive === 0 ? colors.success : colors.background,
                paddingBottom: 12,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={{
                color: isActive === 0 ? colors.success : colors.textSecondary,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              Eventi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsActive(1)}
            activeOpacity={0.8}
            style={[
              {
                borderColor: isActive === 1 ? colors.success : colors.background,
                paddingBottom: 12,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={{
                color: isActive === 1 ? colors.success : colors.textSecondary,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              Formazioni
            </Text>
          </TouchableOpacity>
        </View>

        {isActive === 0 ? (
          events.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Nessun evento registrato.
            </Text>
          ) : (
            events.map((e: any, i: number) => (
              <View
                key={i}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.secondary,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    fontFamily: fonts.semibold,
                  }}
                >
                  {e.minute} • {e.team?.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {e.type} — {e.player?.name ?? "Giocatore sconosciuto"}
                </Text>
              </View>
            ))
          )
        ) : (
          lineups.map((lineup: any, index: number) => (
            <View key={index} style={{ marginBottom: 16 }}>
              <Text></Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    padding: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
});
