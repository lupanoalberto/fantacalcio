// services/footballApi.ts
import Constants from "expo-constants";

const BASE_URL = "https://api.football-data.org/v4";

const LEAGUE_CODES: Record<string, string> = {
  "Serie A": "SA",
  "Premier League": "PL",
  LaLiga: "PD",
  Bundesliga: "BL1",
  "Ligue 1": "FL1",
};

const API_KEY =
  ((Constants.expoConfig?.extra as any)?.FOOTBALL_API_KEY as string) ||
  (process.env.FOOTBALL_API_KEY as string) ||
  "";

export async function getLiveOrUpcomingMatches(leagueName: string) {
  const code = LEAGUE_CODES[leagueName] ?? "SA";
  const url = `${BASE_URL}/competitions/${code}/matches`;

  try {
    const res = await fetch(url, {
      headers: { "X-Auth-Token": API_KEY },
    });

    if (!res.ok) throw new Error(`Errore API: ${res.status}`);

    const data = await res.json();
    const now = new Date();

    const matches = (data.matches ?? []) as any[];

    // 🔹 Filtra partite LIVE
    const liveMatches = matches.filter(
      (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
    );

    // 🔹 Filtra solo partite future
    const futureMatches = matches
      .filter((m) => {
        const matchDate = new Date(m.utcDate);
        return matchDate.getTime() > now.getTime();
      })
      .sort(
        (a, b) =>
          new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
      );

    // 🔹 Prendi le 10 partite più vicine (entro 2 giorni, o le prime se più lontane)
    const upcomingMatches = futureMatches.filter((m) => {
      const diffHours =
        (new Date(m.utcDate).getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours <= 48;
    });

    // Se non ci sono match entro 48h, mostra comunque i 5 più prossimi
    let numberMatches;
    if (code === "SA" || code === "PL" || code === "PD") {
      numberMatches = 10;
    }
    else {
      numberMatches = 9;
    }
    const fallbackMatches = upcomingMatches.length > 0 ? upcomingMatches : futureMatches.slice(0, numberMatches);

    // 🔹 Combina LIVE e FUTURE e ordina per data
    const finalList = [...liveMatches, ...fallbackMatches].sort(
      (a, b) =>
        new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );

    return finalList;
  } catch (err) {
    console.error("Errore fetch partite:", err);
    return [];
  }
}