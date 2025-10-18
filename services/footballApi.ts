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
    const now = new Date();

    const matches = (data.matches ?? []) as any[];

    let index = 1;
    let flag = false;
    while (index < 38 && !flag) {
      let count = 0;
      for(let i=0; i<10; i++) {
        if (matches[index*i].status === "FINISHED" || matches[index*i].status === "POSTPONED" || matches[index*i].status === "CANCELLED") {
          count++;
      }
      else {
        flag = true;
      }
      }
    if (count === 10) {
        index++;
      }
    }

    const finalList = matches.slice(index*10-10, index*10);

    return finalList;
  } catch (err) {
    console.error("Errore fetch partite:", err);
    return [];
  }
}