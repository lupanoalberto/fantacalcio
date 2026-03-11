export const API_LEAGUE_ID_TO_NAME: Record<number, string> = {
  135: "Serie A",
  39: "Premier League",
  140: "La Liga",
  78: "Bundesliga",
  61: "Ligue 1",
};

export function apiLeagueIdToName(id?: number | null): string {
  if (!id) return "Campionato sconosciuto";
  return API_LEAGUE_ID_TO_NAME[id] ?? "Campionato sconosciuto";
}