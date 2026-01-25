// services/footballApi.ts
import Constants from "expo-constants";

/**
 * ======================================================
 * API-FOOTBALL (api-sports) — Single provider (SA/PL/PD)
 * ======================================================
 *
 * ✅ Leghe supportate (per ora): Serie A, Premier League, LaLiga
 * ✅ Un solo provider: fixtures, standings, teams, players, player stats
 *
 * NOTE IMPORTANTI:
 * - Free plan: spesso limita seasons/endpoint. In test usiamo season=2024.
 * - Players endpoint è paginato (Free: page max = 3) -> gestito sotto.
 * - I "matchday" arrivano come league.round (es: "Regular Season - 12").
 */

const APIFOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

/**
 * Chiave da app.json -> expo.extra.API_FOOTBALL_KEY
 * Assicurati che app.json abbia:
 *  "extra": { "API_FOOTBALL_KEY": "..." }
 */
function getApiFootballHeaders() {
  const key =
    ((Constants.expoConfig?.extra as any)?.API_FOOTBALL_KEY as string) || "";
  if (!key) throw new Error("Missing API_FOOTBALL_KEY in app.json extra.");
  return { "x-apisports-key": key.trim() };
}

/**
 * ------------------------------------------------------
 * League mapping (SA/PL/PD)
 * ------------------------------------------------------
 */
export const LEAGUE_CODES: Record<string, string> = {
  "Serie A": "SA",
  "Premier League": "PL",
  LaLiga: "PD",
  Bundesliga: "BL1",
  "Ligue 1": "FL1",
};

export const APIFOOTBALL_LEAGUE_ID: Record<string, number> = {
  SA: 135, // Serie A
  PL: 39, // Premier League
  PD: 140, // LaLiga
  BL1: 78, // Bundesliga
  FL1: 61, // Ligue 1
};

// Helper: accetta "Serie A" oppure "SA" e ritorna leagueId
export function toApiFootballLeagueId(input: string): number {
  const s = (input ?? "").trim();
  const code = LEAGUE_CODES[s] ?? s; // se mi passi già "SA" resta "SA"
  const id = APIFOOTBALL_LEAGUE_ID[code as keyof typeof APIFOOTBALL_LEAGUE_ID];
  if (!id)
    throw new Error(
      `Unsupported league: ${String(input)} (code=${String(code)})`
    );
  return id;
}

/**
 * ------------------------------------------------------
 * Season policy (TEST)
 * ------------------------------------------------------
 * Free plan spesso limita le stagioni. Per test fissiamo 2024.
 * Quando passi al paid, metti TEST_MODE=false e userà la season corrente.
 */

export function getDefaultSeasonYear(date = new Date()) {

  // stagione “di inizio”: es. Gen 2026 -> 2025, Ago 2026 -> 2026
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return m >= 7 ? y : y - 1;
}

/**
 * ------------------------------------------------------
 * Helpers
 * ------------------------------------------------------
 */
function parseJsonSafe<T = any>(rawText: string, label: string): T {
  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(`${label} invalid JSON: ${rawText.slice(0, 200)}`);
  }
}

function extractApiErrors(obj: any): string | null {
  const errs = obj?.errors;
  if (errs && typeof errs === "object" && Object.keys(errs).length > 0) {
    return JSON.stringify(errs);
  }
  return null;
}

// API-FOOTBALL "round" -> matchday number (es: "Regular Season - 12" -> 12)
export function roundToMatchday(round?: string | null): number | null {
  if (!round) return null;
  const m = String(round).match(/-\s*(\d+)\s*$/);
  if (m?.[1]) return Number(m[1]);
  return null;
}

function normalizeNameForSearch(s: string) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ------------------------------------------------------
 * Types (App-facing)
 * ------------------------------------------------------
 */
export type AppMatch = {
  id: number; // fixtureId
  status: string;
  utcDate: string; // ISO
  matchday: number | null;

  homeTeam: { id: number; name: string; shortName?: string; crest?: string };
  awayTeam: { id: number; name: string; shortName?: string; crest?: string };

  score: {
    fullTime: { home: number | null; away: number | null };
  };
};

export type StandingRow = {
  position: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  team: {
    id: number;
    name: string;
    shortName?: string;
    crest?: string;
  };
};

export type CompetitionPlayer = {
  id: number;
  name: string;
  position?: string;
  nationality?: string;
  dateOfBirth?: string;
  photo?: string;
  team: {
    id: number;
    name: string;
    shortName?: string;
    crest?: string;
  };
};

export type PersonDetails = {
  id: number;
  name: string;
  firstname?: string;
  lastname?: string;
  age?: number;
  dateOfBirth?: string; // se disponibile
  nationality?: string;
  height?: string;
  weight?: string;
  photo?: string;

  currentTeam?: {
    id: number;
    name: string;
    crest?: string;
  };

  // ruolo “API” (può variare)
  position?: string;

  // ✅ compat con UI vecchia (evita errori su shirtNumber)
  shirtNumber?: number | null;
};

export type ApiFootballPlayerSeasonStats = {
  playerId: number;
  name: string;
  teamId: number;
  teamName: string;

  season: number;
  leagueId: number;

  appearances: number | null;
  minutes: number | null;

  goals: number | null;
  assists: number | null;

  yellow: number | null;
  red: number | null;

  rating?: string | null;
};

/**
 * ------------------------------------------------------
 * API: Matches (fixtures)
 * ------------------------------------------------------
 */
type FixturesResponse = {
  response: Array<{
    fixture: { id: number; date: string; status: { short: string } };
    league: { id: number; season: number; round?: string };
    teams: {
      home: { id: number; name: string; logo?: string };
      away: { id: number; name: string; logo?: string };
    };
    goals: { home: number | null; away: number | null };
  }>;
  errors?: Record<string, any>;
};

export async function getMatches(
  leagueNameOrCode: string
): Promise<AppMatch[]> {
  const leagueId = toApiFootballLeagueId(leagueNameOrCode);
  const season = getDefaultSeasonYear();

  const url = `${APIFOOTBALL_BASE_URL}/fixtures?league=${leagueId}&season=${season}`;
  const res = await fetch(url, { headers: getApiFootballHeaders() });
  const raw = await res.text();

  if (!res.ok)
    throw new Error(`API-FOOTBALL fixtures failed: ${res.status} ${raw}`);
  const data = parseJsonSafe<FixturesResponse>(raw, "fixtures");

  const err = extractApiErrors(data);
  if (err) throw new Error(`API-FOOTBALL fixtures errors: ${err}`);

  const list = data.response ?? [];
  return list.map((x) => ({
    id: x.fixture.id,
    status: x.fixture.status.short,
    utcDate: x.fixture.date,
    matchday: roundToMatchday(x.league.round ?? null),

    homeTeam: {
      id: x.teams.home.id,
      name: x.teams.home.name,
      shortName: x.teams.home.name,
      crest: x.teams.home.logo,
    },
    awayTeam: {
      id: x.teams.away.id,
      name: x.teams.away.name,
      shortName: x.teams.away.name,
      crest: x.teams.away.logo,
    },
    score: {
      fullTime: {
        home: x.goals.home ?? null,
        away: x.goals.away ?? null,
      },
    },
  }));
}

export async function getLiveOrUpcomingMatches(leagueNameOrCode: string) {
  // semplice: prendi tutti e filtra stati live
  const all = await getMatches(leagueNameOrCode);
  return all.filter(
    (m) => m.status === "1H" || m.status === "2H" || m.status === "HT"
  );
}

/**
 * ------------------------------------------------------
 * API: Match details (fixture details) — API-FOOTBALL
 * ------------------------------------------------------
 *
 * ✅ match/[id].tsx (nuovo) usa:
 * details.fixture / details.teams / details.goals / details.league
 *
 * Quindi getMatchDetails deve ritornare l'ENTRY RAW (non {match, events, lineups}).
 */

// -------------
// Details
// -------------
type FixtureDetailsResponse = {
  response: Array<{
    fixture: { id: number; date: string; status: { short: string } };
    league: { id: number; season: number; round?: string };
    teams: {
      home: { id: number; name: string; logo?: string };
      away: { id: number; name: string; logo?: string };
    };
    goals: { home: number | null; away: number | null };
  }>;
  errors?: Record<string, any>;
};

export async function getMatchDetails(fixtureId: number) {
  const url = `${APIFOOTBALL_BASE_URL}/fixtures?id=${fixtureId}`;
  const res = await fetch(url, { headers: getApiFootballHeaders() });
  const raw = await res.text();

  if (!res.ok) {
    console.error(`❌ Errore fetch fixture ${fixtureId}:`, res.status, raw);
    return null;
  }

  const data = parseJsonSafe<FixtureDetailsResponse>(raw, "fixture details");
  const err = extractApiErrors(data);
  if (err) {
    console.error("❌ API-FOOTBALL fixture details errors:", err);
    return null;
  }

  return data.response?.[0] ?? null;
}

// -------------
// Events
// -------------
type FixtureEventsResponse = {
  response: Array<{
    time?: { elapsed?: number; extra?: number };
    team?: { id: number; name: string; logo?: string };
    player?: { id?: number; name?: string };
    assist?: { id?: number; name?: string };
    type?: string;
    detail?: string;
    comments?: string | null;
  }>;
  errors?: Record<string, any>;
};

export async function getFixtureEvents(fixtureId: number): Promise<any[]> {
  const url = `${APIFOOTBALL_BASE_URL}/fixtures/events?fixture=${fixtureId}`;
  const res = await fetch(url, { headers: getApiFootballHeaders() });
  const raw = await res.text();

  if (!res.ok) {
    console.error(
      `❌ Errore fetch events fixture ${fixtureId}:`,
      res.status,
      raw
    );
    return [];
  }

  const data = parseJsonSafe<FixtureEventsResponse>(raw, "fixture events");
  const err = extractApiErrors(data);
  if (err) {
    console.error("❌ API-FOOTBALL fixture events errors:", err);
    return [];
  }

  return data.response ?? [];
}

// -------------
// Lineups
// -------------
type FixtureLineupsResponse = {
  response: Array<{
    team?: { id: number; name: string; logo?: string; colors?: any };
    coach?: { id?: number; name?: string; photo?: string };
    formation?: string;
    startXI?: Array<{
      player?: {
        id?: number;
        name?: string;
        number?: number;
        pos?: string;
        grid?: string;
      };
    }>;
    substitutes?: Array<{
      player?: {
        id?: number;
        name?: string;
        number?: number;
        pos?: string;
        grid?: string;
      };
    }>;
  }>;
  errors?: Record<string, any>;
};

export async function getFixtureLineups(fixtureId: number): Promise<any[]> {
  const url = `${APIFOOTBALL_BASE_URL}/fixtures/lineups?fixture=${fixtureId}`;
  const res = await fetch(url, { headers: getApiFootballHeaders() });
  const raw = await res.text();

  if (!res.ok) {
    console.error(
      `❌ Errore fetch lineups fixture ${fixtureId}:`,
      res.status,
      raw
    );
    return [];
  }

  const data = parseJsonSafe<FixtureLineupsResponse>(raw, "fixture lineups");
  const err = extractApiErrors(data);
  if (err) {
    console.error("❌ API-FOOTBALL fixture lineups errors:", err);
    return [];
  }

  return data.response ?? [];
}

/**
 * ------------------------------------------------------
 * API: Standings
 * ------------------------------------------------------
 */
type StandingsResponse = {
  response: Array<{
    league: {
      standings: Array<
        Array<{
          rank: number;
          team: { id: number; name: string; logo?: string };
          all: {
            played: number;
            win: number;
            draw: number;
            lose: number;
            goals: { for: number; against: number };
          };
          points: number;
          goalsDiff: number;
        }>
      >;
    };
  }>;
  errors?: Record<string, any>;
};

export async function getStandings(
  leagueNameOrCode: string
): Promise<StandingRow[]> {
  const leagueId = toApiFootballLeagueId(leagueNameOrCode);
  const season = getDefaultSeasonYear();

  const url = `${APIFOOTBALL_BASE_URL}/standings?league=${leagueId}&season=${season}`;
  const res = await fetch(url, { headers: getApiFootballHeaders() });
  const raw = await res.text();

  if (!res.ok)
    throw new Error(`API-FOOTBALL standings failed: ${res.status} ${raw}`);
  const data = parseJsonSafe<StandingsResponse>(raw, "standings");

  const err = extractApiErrors(data);
  if (err) throw new Error(`API-FOOTBALL standings errors: ${err}`);

  const table = data.response?.[0]?.league?.standings?.[0] ?? [];
  return table.map((r) => ({
    position: r.rank,
    playedGames: r.all.played,
    won: r.all.win,
    draw: r.all.draw,
    lost: r.all.lose,
    points: r.points,
    goalsFor: r.all.goals.for,
    goalsAgainst: r.all.goals.against,
    goalDifference: r.goalsDiff,
    team: {
      id: r.team.id,
      name: r.team.name,
      shortName: r.team.name,
      crest: r.team.logo,
    },
  }));
}

/**
 * ------------------------------------------------------
 * API: Players list (league + season) — paginated
 * ------------------------------------------------------
 */
type PlayersLeagueResponse = {
  paging?: { current: number; total: number };
  response: Array<{
    player: {
      id: number;
      name: string;
      firstname?: string;
      lastname?: string;
      age?: number;
      nationality?: string;
      birth?: { date?: string };
      photo?: string;
    };
    statistics?: Array<{
      team?: { id: number; name: string; logo?: string };
      games?: { position?: string };
      league?: { id: number; season: number };
    }>;
  }>;
  errors?: Record<string, any>;
};

export async function getCompetitionPlayers(
  leagueNameOrCode: string
): Promise<CompetitionPlayer[]> {
  const leagueId = toApiFootballLeagueId(leagueNameOrCode);
  const season = getDefaultSeasonYear();

  const all: CompetitionPlayer[] = [];

  // ✅ Free plan: non possiamo superare page=3.
  const maxPages = APIFOOTBALL_TEST_MODE ? APIFOOTBALL_MAX_PAGE_FREE : Infinity;

  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const url = `${APIFOOTBALL_BASE_URL}/players?league=${leagueId}&season=${season}&page=${page}`;
    const res = await fetch(url, { headers: getApiFootballHeaders() });
    const raw = await res.text();

    if (!res.ok)
      throw new Error(
        `API-FOOTBALL players(league) failed: ${res.status} ${raw}`
      );
    const data = parseJsonSafe<PlayersLeagueResponse>(raw, "players league");

    const err = extractApiErrors(data);
    if (err) throw new Error(`API-FOOTBALL players(league) errors: ${err}`);

    const list = data.response ?? [];
    for (const item of list) {
      const st0 = item.statistics?.[0];
      const team = st0?.team;
      const pos = st0?.games?.position;

      if (!team?.id || !item.player?.id) continue;

      all.push({
        id: item.player.id,
        name: item.player.name,
        position: pos ?? undefined,
        nationality: item.player.nationality ?? undefined,
        dateOfBirth: item.player.birth?.date ?? undefined,
        photo: item.player.photo ?? undefined,
        team: {
          id: team.id,
          name: team.name,
          shortName: team.name,
          crest: team.logo,
        },
      });
    }

    const paging = data.paging;
    totalPages = paging?.total ?? 1;
    page = (paging?.current ?? page) + 1;
  }

  // Dedup + sort
  const unique = new Map<number, CompetitionPlayer>();
  for (const p of all) {
    if (!unique.has(p.id)) unique.set(p.id, p);
  }

  const out = Array.from(unique.values());
  out.sort((a, b) => a.name.localeCompare(b.name, "it"));
  return out;
}

/**
 * ------------------------------------------------------
 * API: Player details + season stats
 * ------------------------------------------------------
 */
type PlayerStatsResponse = {
  response: Array<{
    player: {
      id: number;
      name: string;
      firstname?: string;
      lastname?: string;
      age?: number;
      nationality?: string;
      height?: string;
      weight?: string;
      birth?: { date?: string };
      photo?: string;
    };
    statistics: Array<{
      league: { id: number; season: number };
      team: { id: number; name: string; logo?: string };
      games: {
        appearances?: number;
        minutes?: number;
        rating?: string;
        position?: string;
      };
      goals: { total?: number; assists?: number };
      cards: { yellow?: number; red?: number };
    }>;
  }>;
  errors?: Record<string, any>;
};

// ✅ DOPO: getPlayerDetails(playerId, leagueIdOrName)
export async function getPlayerDetails(
  playerId: number,
  leagueNameOrCode: string
): Promise<PersonDetails> {
  const season = getDefaultSeasonYear();
  const leagueId = toApiFootballLeagueId(leagueNameOrCode);

  const url = `${APIFOOTBALL_BASE_URL}/players?id=${playerId}&league=${leagueId}&season=${season}`;
  const res = await fetch(url, { headers: getApiFootballHeaders() });
  const raw = await res.text();

  if (!res.ok)
    throw new Error(`API-FOOTBALL player details failed: ${res.status} ${raw}`);
  const data = parseJsonSafe<PlayerStatsResponse>(raw, "player details");

  const err = extractApiErrors(data);
  if (err) throw new Error(`API-FOOTBALL player details errors: ${err}`);

  const entry = data.response?.[0];
  if (!entry) throw new Error("Player not found (API-FOOTBALL).");

  const st0 = entry.statistics?.[0];

  return {
    id: entry.player.id,
    name: entry.player.name,
    firstname: entry.player.firstname,
    lastname: entry.player.lastname,
    age: entry.player.age,
    dateOfBirth: entry.player.birth?.date,
    nationality: entry.player.nationality,
    height: entry.player.height,
    weight: entry.player.weight,
    photo: entry.player.photo,
    currentTeam: st0?.team
      ? { id: st0.team.id, name: st0.team.name, crest: st0.team.logo }
      : undefined,
    position: st0?.games?.position,
    shirtNumber: null,
  };
}

export async function getApiFootballPlayerSeasonStats(params: {
  playerId: number;
  leagueId: number;
  season: number;
}): Promise<ApiFootballPlayerSeasonStats | null> {
  const { playerId, leagueId, season } = params;

  const url = `${APIFOOTBALL_BASE_URL}/players?id=${playerId}&league=${leagueId}&season=${season}`;
  const res = await fetch(url, { headers: getApiFootballHeaders() });
  const raw = await res.text();

  if (!res.ok)
    throw new Error(`API-FOOTBALL player stats failed: ${res.status} ${raw}`);
  const data = parseJsonSafe<PlayerStatsResponse>(raw, "player stats");

  const err = extractApiErrors(data);
  if (err) throw new Error(`API-FOOTBALL player stats errors: ${err}`);

  const entry = data.response?.[0];
  if (!entry) return null;

  const st = entry.statistics?.[0];
  if (!st) return null;

  return {
    playerId: entry.player.id,
    name: entry.player.name,
    teamId: st.team.id,
    teamName: st.team.name,
    season: st.league.season,
    leagueId: st.league.id,
    appearances: st.games?.appearances ?? null,
    minutes: st.games?.minutes ?? null,
    goals: st.goals?.total ?? null,
    assists: st.goals?.assists ?? null,
    yellow: st.cards?.yellow ?? null,
    red: st.cards?.red ?? null,
    rating: st.games?.rating ?? null,
  };
}

/**
 * ------------------------------------------------------
 * Player search (FREE plan-safe)
 * ------------------------------------------------------
 * Free plan spesso richiede league o team quando usi search.
 * Qui cerchiamo sempre con league+season (e opzionalmente teamName -> teamId).
 */
type TeamsSearchResponse = {
  response: Array<{ team: { id: number; name: string } }>;
  errors?: Record<string, any>;
};

export async function getApiFootballTeamIdByName(
  teamName: string
): Promise<number | null> {
  const q = normalizeNameForSearch(teamName);
  const url = `${APIFOOTBALL_BASE_URL}/teams?search=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: getApiFootballHeaders() });
  const raw = await res.text();

  if (!res.ok)
    throw new Error(`API-FOOTBALL teams search failed: ${res.status} ${raw}`);
  const data = parseJsonSafe<TeamsSearchResponse>(raw, "teams search");

  const err = extractApiErrors(data);
  if (err) throw new Error(`API-FOOTBALL teams errors: ${err}`);

  const list = data.response ?? [];
  if (!list.length) return null;

  const tn = teamName.toLowerCase().trim();
  const exact = list.find((t) => t.team?.name?.toLowerCase?.().trim?.() === tn);
  return exact?.team?.id ?? list[0]?.team?.id ?? null;
}

export async function searchApiFootballPlayerId(params: {
  name: string;
  leagueId: number;
  season: number;
  teamName?: string;
}): Promise<number | null> {
  const { name, leagueId, season, teamName } = params;

  const cleanedFull = normalizeNameForSearch(name);
  const lastName = cleanedFull.split(" ").slice(-1)[0] || cleanedFull;

  // 1) Preferisco team-scope se ho teamName
  if (teamName) {
    const teamId = await getApiFootballTeamIdByName(teamName);
    if (teamId) {
      // full name
      let url = `${APIFOOTBALL_BASE_URL}/players?team=${teamId}&season=${season}&search=${encodeURIComponent(
        cleanedFull
      )}`;
      let res = await fetch(url, { headers: getApiFootballHeaders() });
      let raw = await res.text();
      if (!res.ok)
        throw new Error(
          `API-FOOTBALL players(team) failed: ${res.status} ${raw}`
        );
      let data = parseJsonSafe<PlayersLeagueResponse>(raw, "players(team)");
      let err = extractApiErrors(data);
      if (err) throw new Error(`API-FOOTBALL players(team) errors: ${err}`);
      if (data.response?.length) return data.response[0].player.id;

      // last name
      url = `${APIFOOTBALL_BASE_URL}/players?team=${teamId}&season=${season}&search=${encodeURIComponent(
        lastName
      )}`;
      res = await fetch(url, { headers: getApiFootballHeaders() });
      raw = await res.text();
      if (!res.ok)
        throw new Error(
          `API-FOOTBALL players(team,last) failed: ${res.status} ${raw}`
        );
      data = parseJsonSafe<PlayersLeagueResponse>(raw, "players(team,last)");
      err = extractApiErrors(data);
      if (err)
        throw new Error(`API-FOOTBALL players(team,last) errors: ${err}`);
      if (data.response?.length) return data.response[0].player.id;
    }
  }

  // 2) fallback: league + season (free-plan friendly)
  {
    // full name
    let url = `${APIFOOTBALL_BASE_URL}/players?league=${leagueId}&season=${season}&search=${encodeURIComponent(
      cleanedFull
    )}`;
    let res = await fetch(url, { headers: getApiFootballHeaders() });
    let raw = await res.text();
    if (!res.ok)
      throw new Error(
        `API-FOOTBALL players(league) failed: ${res.status} ${raw}`
      );
    let data = parseJsonSafe<PlayersLeagueResponse>(raw, "players(league)");
    let err = extractApiErrors(data);
    if (err) throw new Error(`API-FOOTBALL players(league) errors: ${err}`);
    if (data.response?.length) return data.response[0].player.id;

    // last name
    url = `${APIFOOTBALL_BASE_URL}/players?league=${leagueId}&season=${season}&search=${encodeURIComponent(
      lastName
    )}`;
    res = await fetch(url, { headers: getApiFootballHeaders() });
    raw = await res.text();
    if (!res.ok)
      throw new Error(
        `API-FOOTBALL players(league,last) failed: ${res.status} ${raw}`
      );
    data = parseJsonSafe<PlayersLeagueResponse>(raw, "players(league,last)");
    err = extractApiErrors(data);
    if (err)
      throw new Error(`API-FOOTBALL players(league,last) errors: ${err}`);
    if (data.response?.length) return data.response[0].player.id;
  }

  return null;
}

/**
 * Backward-compat: se in UI stai ancora importando questo nome,
 * lo manteniamo (usa Serie A di default; meglio passare leagueId esplicitamente).
 */
export async function searchApiFootballPlayerIdByNameAndTeam(params: {
  name: string;
  teamName?: string;
}): Promise<number | null> {
  const season = getDefaultSeasonYear();
  const leagueId = APIFOOTBALL_LEAGUE_ID.SA;
  return searchApiFootballPlayerId({
    name: params.name,
    teamName: params.teamName,
    leagueId,
    season,
  });
}
