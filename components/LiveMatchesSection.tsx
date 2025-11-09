// components/LiveMatchesSection.tsx
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../app/theme";
import MatchCard from "./MatchCard";
import { getLiveOrUpcomingMatches } from "../services/footballApi";

type Props = {
  selectedLeague: string;
}

export default function LiveMatchesSection({ selectedLeague }: Props) {
  const { colors, fonts } = useTheme();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ useCallback mantiene stabile la funzione tra i render
  const fetchMatches = useCallback(async () => {
    try {
      const data = await getLiveOrUpcomingMatches(selectedLeague);
      if (data && data.length > 0) {
        setMatches(data);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error("Errore aggiornamento partite:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]); // la funzione dipende solo dalla lega

  // Fetch iniziale o cambio lega
  useEffect(() => {
    setLoading(true);
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    const interval = setInterval(fetchMatches, 60000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  return (
    <View style={styles.container}>

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
        Partite in live
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={colors.success} />
      ) : (
        <View style={[{ gap: 16 }]}>
          {matches.length > 0 ? (
            matches.map((match) => {
              const status = match?.status;
              let timeLabel = "";

              if (status === "IN_PLAY") {
                timeLabel = "LIVE";
              }
              else if (status === "PAUSED") {
                timeLabel = "INT.";
              }

              let scoreHome = match?.score?.fullTime?.home;
              let scoreAway = match?.score?.fullTime?.away;

              if (scoreHome === null && scoreAway === null) {
                scoreHome = "-";
                scoreAway = "-";
              }

              const homeLogo =
                match?.homeTeam?.crest ||
                match?.homeTeam?.crestUrl ||
                "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

              const awayLogo =
                match?.awayTeam?.crest ||
                match?.awayTeam?.crestUrl ||
                "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";



              return (
                <View key={match?.id} style={[{ marginBottom: 16, }]}>
                    <MatchCard
                    key={`${selectedLeague}-${match?.id}`}
                    idx={match?.id}
                    homeTeam={match?.homeTeam?.shortName ?? match?.homeTeam?.name}
                    awayTeam={match?.awayTeam?.shortName ?? match?.awayTeam?.name}
                    scoreHome={scoreHome}
                    scoreAway={scoreAway}
                    time={timeLabel}
                    homeLogo={homeLogo}
                    awayLogo={awayLogo}
                  />
                </View>
              );
            })
          ) : (
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fonts.regular,
                textAlign: "center",
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              Nessuna partita in live
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 16, },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
});
