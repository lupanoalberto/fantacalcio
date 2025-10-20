import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getMatchDetails } from "../../services/footballApi";
import { useTheme } from "../theme";
import Header from "@/components/Header";

export default function MatchDetails() {
  const { id } = useLocalSearchParams();
  const { colors, fonts } = useTheme();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (match.status === "FINISHED") {
    status = "FT";
  } else {
    status = "POSTPONED";
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}          
            <Header
              title="Fantacalcio"
              showBackArrow={true}
            />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* 🔹 HEADER DEL MATCH */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 16,
            borderRadius: 8,
            marginVertical: 24,
            backgroundColor: colors.secondary,
          }}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            <Image
              source={{ uri: homeTeam.crest }}
              style={{ width: 48, height: 48, marginBottom: 4 }}
            />
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.medium,
                fontSize: 13,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {homeTeam.name}
            </Text>
          </View>

          <View style={{ alignItems: "center", width: 80 }}>
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.bold,
                fontSize: 26,
              }}
            >
              {scoreHome} - {scoreAway}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                fontFamily: fonts.regular,
                marginTop: 4,
              }}
            >
              {status}
            </Text>
          </View>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Image
              source={{ uri: awayTeam.crest }}
              style={{ width: 48, height: 48, marginBottom: 4 }}
            />
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.medium,
                fontSize: 13,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {awayTeam.name}
            </Text>
          </View>
        </View>

        {/* 🔹 SEZIONE EVENTI */}
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.bold,
            fontSize: 18,
            marginBottom: 8,
          }}
        >
          Eventi
        </Text>

        {events.length === 0 ? (
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
                  fontFamily: fonts.medium,
                }}
              >
                {e.minute} • {e.team?.name}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {e.type} — {e.player?.name ?? "Giocatore sconosciuto"}
              </Text>
            </View>
          ))
        )}

        {/* 🔹 SEZIONE FORMAZIONI */}
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.bold,
            fontSize: 18,
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          Formazioni
        </Text>

        {lineups.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Formazioni non disponibili.
          </Text>
        ) : (
          lineups.map((team: any, i: number) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.success,
                  fontFamily: fonts.bold,
                  fontSize: 16,
                  marginBottom: 4,
                }}
              >
                {team.team.name}
              </Text>
              {team.startXI?.map((p: any, j: number) => (
                <Text
                  key={j}
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    lineHeight: 18,
                  }}
                >
                  {p.position}. {p.name}
                </Text>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}