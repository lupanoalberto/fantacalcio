// services/footballApi.ts
import Constants from "expo-constants";

/**
 * ======================================================
 * API-FOOTBALL (api-sports) — Single provider (SA/PL/PD/BL/L1)
 * ======================================================
 *
 * ✅ Leghe supportate:
 * - Serie A
 * - Premier League
 * - LaLiga
 * - Bundesliga
 * - Ligue 1
 *
 * ✅ Un solo provider:
 * - fixtures
 * - standings
 * - teams
 * - players
 * - player stats
 *
 * NOTE IMPORTANTI:
 * - Free plan: season limitata (di solito ultima stagione)
 * - Players endpoint è paginato (Free: page max = 3)
 * - I matchday arrivano come league.round (es: "Regular Season - 12")
 */

const APIFOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

/**
 * Chiave da app.json -> expo.extra.API_FOOTBALL_KEY
 */
const API_FOOTBALL_KEY =
  Constants.expoConfig?.extra?.API_FOOTBALL_KEY;

/* ======================================================
 * Helpers
 * ====================================================== */

function getHeaders() {
  if (!API_FOOTBALL_KEY) {
    throw new Error("API_FOOTBALL_KEY non configurata");
  }

  return {
    "x-apisports-key": API_FOOTBALL_KEY,
  };
}

async function apiGet<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(APIFOOTBALL_BASE_URL + endpoint);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`API-Football error ${res.status}`);
  }

  const json = await res.json();

  return json.response as T;
}

/* ======================================================
 * League mapping
 * ====================================================== */

export type SupportedLeague =
  | "SERIE_A"
  | "PREMIER_LEAGUE"
  | "LALIGA"
  | "BUNDESLIGA"
  | "LIGUE_1";

export function toApiFootballLeagueId(
  league: SupportedLeague
): number {
  switch (league) {
    case "SERIE_A":
      return 135;
    case "PREMIER_LEAGUE":
      return 39;
    case "LALIGA":
      return 140;
    case "BUNDESLIGA":
      return 78;
    case "LIGUE_1":
      return 61;
    default:
      throw new Error("League non supportata");
  }
}

/* ======================================================
 * Season helpers
 * ====================================================== */

export function getDefaultSeasonYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Stagione calcistica europea
  return month >= 7 ? year : year - 1;
}

/* ======================================================
 * Types
 * ====================================================== */

export interface PersonDetails {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  height: string | null;
  weight: string | null;
  photo: string;
}

export interface TeamInfo {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFootballPlayerSeasonStats {
  league: {
    id: number;
    name: string;
    season: number;
  };
  team: TeamInfo;
  games: {
    appearances: number;
    minutes: number;
    position: string;
  };
  goals: {
    total: number;
    assists: number;
  };
  cards: {
    yellow: number;
    red: number;
  };
}

/* ======================================================
 * Players
 * ====================================================== */

/**
 * Ricerca playerId tramite nome (necessario perché l’ID
 * non è stabile tra provider)
 */
export async function searchApiFootballPlayerId(
  playerName: string
): Promise<number | null> {
  const results = await apiGet<
    {
      player: { id: number; name: string };
    }[]
  >("/players", {
    search: playerName,
    page: 1,
  });

  if (!results.length) return null;

  return results[0].player.id;
}

/**
 * Dettagli anagrafici player
 */
export async function getPlayerDetails(
  playerId: number
): Promise<PersonDetails> {
  const res = await apiGet<
    {
      player: PersonDetails;
    }[]
  >("/players", {
    id: playerId,
  });

  if (!res.length) {
    throw new Error("Player non trovato");
  }

  return res[0].player;
}

/**
 * Statistiche stagionali player (per lega)
 */
export async function getApiFootballPlayerSeasonStats(
  playerId: number,
  league: SupportedLeague,
  season = getDefaultSeasonYear()
): Promise<ApiFootballPlayerSeasonStats | null> {
  const res = await apiGet<
    {
      statistics: ApiFootballPlayerSeasonStats[];
    }[]
  >("/players", {
    id: playerId,
    league: toApiFootballLeagueId(league),
    season,
  });

  if (!res.length || !res[0].statistics.length) {
    return null;
  }

  return res[0].statistics[0];
}

/* ======================================================
 * Teams
 * ====================================================== */

export async function getTeamsByLeague(
  league: SupportedLeague,
  season = getDefaultSeasonYear()
): Promise<TeamInfo[]> {
  return apiGet<TeamInfo[]>("/teams", {
    league: toApiFootballLeagueId(league),
    season,
  });
}

/* ======================================================
 * Standings
 * ====================================================== */

export async function getStandings(
  league: SupportedLeague,
  season = getDefaultSeasonYear()
) {
  return apiGet("/standings", {
    league: toApiFootballLeagueId(league),
    season,
  });
}

/* ======================================================
 * Fixtures
 * ====================================================== */

export async function getFixturesByRound(
  league: SupportedLeague,
  round: string,
  season = getDefaultSeasonYear()
) {
  return apiGet("/fixtures", {
    league: toApiFootballLeagueId(league),
    season,
    round,
  });
}
