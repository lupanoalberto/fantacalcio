// services/footballApi.ts
import Constants from "expo-constants";

const BASE_URL = "https://corsproxy.io/?https://api.football-data.org/v4";

const LEAGUE_CODES: Record<string, string> = {
  "Serie A": "SA",
  "Premier League": "PL",
  LaLiga: "PD",
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
    // Filtra solo partite in corso
  const live = data.matches.filter(
    (m: any) => m.status === "IN_PLAY" || m.status === "PAUSED"
  );

  return live;
  } catch (err) {
    console.error("Errore fetch partite:", err);
    return [];
  }
}

export async function getMatches(leagueName: string) {
  const code = LEAGUE_CODES[leagueName] ?? "SA";
  const url = `${BASE_URL}/competitions/${code}/matches`;

  try {
    const res = await fetch(url, {
      headers: { "X-Auth-Token": API_KEY },
    });

    if (!res.ok) throw new Error(`Errore API: ${res.status}`);

    const data = await res.json();
    // Filtra solo partite in corso
    const matches = data.matches.filter(
      (m: any) => m.status === "FINISHED" || m.status === "POSTPONED"
    );

    return matches;
  } catch (err) {
    console.error("Errore fetch partite:", err);
    return [];
  }  
}

/**
 * Restituisce i dettagli completi di un match (eventi e formazioni)
 */
export async function getMatchDetails(matchId: number) {
  try {
    const res = await fetch(
      `${BASE_URL}/matches/${matchId}`,
      {
        headers: { "X-Auth-Token": API_KEY },
      }
    );

    if (!res.ok) {
      console.error(`❌ Errore fetch match ${matchId}:`, res.status);
      return null;
    }

    const data = await res.json();
    console.log("Data Lineup: " + data.homeTeam.lineup);
    
    return data; // Contiene match, eventi, lineups, ecc.
  } catch (err) {
    console.error("❌ Errore caricamento dettagli partita:", err);
    return null;
  }
}