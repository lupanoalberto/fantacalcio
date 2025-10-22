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

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.medium }]}>
        Partite in live
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={colors.success} style={{ marginTop: 16 }} />
      ) : (
        <View style={[styles.matches, { gap: 16 }]}>
          {matches.length > 0 ? (
            matches.map((match, idx) => {
              const status = match?.status;
              const date = new Date(match?.utcDate);
              

              let timeLabel = "";

              if (status === "IN_PLAY") {
                timeLabel = "LIVE";
              }
              else if (status === "PAUSED") {
                timeLabel = "HT";
              }
              else if (status === "FINISHED") {
                timeLabel = "FT";
              }
              else if (status === "TIMED" || status === "SCHEDULED") {
                timeLabel = date.toLocaleString("it-IT", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }

              let scoreHome = match?.score?.fullTime?.home;
              let scoreAway = match?.score?.fullTime?.away;

              if (scoreHome === null && scoreAway === null) {
                scoreHome = "";
                scoreAway = "";
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
                <MatchCard
                  key={`${selectedLeague}-${match?.id ?? idx}`}
                  homeTeam={match?.homeTeam?.name ?? "—"}
                  awayTeam={match?.awayTeam?.name ?? "—"}
                  score={`${scoreHome} - ${scoreAway}`}
                  time={timeLabel}
                  homeLogo={homeLogo}
                  awayLogo={awayLogo}
                  
                />
              );
            })
          ) : (
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fonts.regular,
                textAlign: "center",
                marginTop: 8,
                fontSize: 13,
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
  container: { width: "100%", marginTop: 8 },
  sectionTitle: { fontSize: 18, marginBottom: 8 },
  matches: { marginTop: 4 },
});
