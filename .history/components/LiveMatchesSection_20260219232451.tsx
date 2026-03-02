// components/LiveMatchesSection.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTheme } from "@/theme";
import MatchCard from "./MatchCard";
import { getLiveOrUpcomingMatches } from "../services/footballApi";
import { Href, useRouter } from "expo-router";

type Props = {
  selectedLeague: string;
};

export default function LiveMatchesSection({ selectedLeague }: Props) {
  const { colors, fonts } = useTheme();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // evita di sparare onHasMatches ad ogni polling se non cambia
  const lastHasRef = useRef<boolean | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const data = await getLiveOrUpcomingMatches(selectedLeague);
      const list = Array.isArray(data) ? data : [];

      setMatches(list);

      const has = list.length > 0;
      if (lastHasRef.current !== has) {
        lastHasRef.current = has;
      }
    } catch (err) {
      console.error("Errore aggiornamento partite:", err);

      // in errore, consideriamo "no matches" solo se cambia stato
      if (lastHasRef.current !== false) {
        lastHasRef.current = false;
      }
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    setLoading(true);
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    const interval = setInterval(fetchMatches, 60000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  // ✅ SILENZIOSO: se non ho partite, non rendo nulla
  if (!loading && matches.length === 0)
    return (
      <View>
        <Text
          style={{
            fontSize: 12,
            fontFamily: fonts.regular,
            color: colors.textSecondary,
          }}
        >
          Non ci sono partite in live.
        </Text>
      </View>
    );

  return (
    <View style={styles.section}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.green} />
      ) : (
        <View>
          {matches.map((match) => {
            const status = match?.status;
            const date = new Date(match?.utcDate);
            let timeLabel = "";
            let dayLabel = "";

            // NB: nel tuo codice precedente usavi IN_PLAY/PAUSED,
            // ma API-Football spesso usa "1H", "2H", "HT" ecc.
            // Mantengo la tua logica, ma puoi adattarla.
            if (status === "IN_PLAY" || status === "1H" || status === "2H") {
              timeLabel = "LIVE";
            } else if (status === "PAUSED" || status === "HT") {
              timeLabel = "INT.";
            }

            dayLabel = date.toLocaleString("it-IT", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            });

            let scoreHome = match?.score?.fullTime?.home;
            let scoreAway = match?.score?.fullTime?.away;

            if (scoreHome === null && scoreAway === null) {
              scoreHome = "";
              scoreAway = "";
            }

            const fallbackLogo =
              "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

            const homeLogo =
              match?.homeTeam?.crest ||
              match?.homeTeam?.crestUrl ||
              fallbackLogo;

            const awayLogo =
              match?.awayTeam?.crest ||
              match?.awayTeam?.crestUrl ||
              fallbackLogo;

            return (
              <View key={match?.id}>
                <TouchableOpacity
                  onPress={() => router.push(`../match/${match?.id}` as Href)}
                >
                  <MatchCard
                    key={`${selectedLeague}-${match?.id}`}
                    idx={match?.id}
                    homeTeam={
                      match?.homeTeam?.shortName ?? match?.homeTeam?.name
                    }
                    awayTeam={
                      match?.awayTeam?.shortName ?? match?.awayTeam?.name
                    }
                    scoreHome={scoreHome}
                    scoreAway={scoreAway}
                    time={timeLabel}
                    homeLogo={homeLogo}
                    awayLogo={awayLogo}
                    day={dayLabel}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
  },
});
