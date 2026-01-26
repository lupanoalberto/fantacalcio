import { create } from "zustand";
import { League, Team } from "../types/fantacalcio";
import { supabase } from "@/lib/supabase";
import { getDefaultSeasonYear } from "@/services/footballApi";

type Mode = "CLASSICO" | "MANTRA";

interface LeagueStore {
  leagues: League[];
  activeLeague?: League;
  loading: boolean;
  error?: string | null;

  // Azioni
  fetchUserLeagues: (apiLeagueId: number) => Promise<void>;
  setActiveLeague: (leagueId: string) => Promise<void>;

  // Crea lega (dal contesto campionato + default season/scoring)
  addLeague: (params: {
    name: string;
    mode: Mode;
    apiLeagueId: number;
    scoringJson: any;
    budget: number;
    rosterSize: number;
    maxPlayersPerRealTeam: number;
  }) => Promise<string | null>; // ritorna leagueId se ok

  joinLeague: (leagueId: string, team: Team) => Promise<void>;
  reset: () => void;
}

export const useLeagueStore = create<LeagueStore>((set, get) => ({
  leagues: [],
  activeLeague: undefined,
  loading: false,
  error: null,

  // 🔹 Recupera le leghe dell’utente per un campionato reale (apiLeagueId)
  // nel tuo LeagueStore.ts
fetchUserLeagues: async (apiLeagueId: number) => {
  set({ loading: true, error: null });

  const { data, error } = await supabase.rpc("get_user_leagues_by_api_league", {
    p_api_league_id: apiLeagueId,
  });

  if (error) {
    set({ loading: false, error: error.message, leagues: [] });
    return;
  }

  // data: [{ league_id, league_name, team_id, team_name, ... }, ...]
  const leagues = (data ?? []).map((row: any) => ({
    id: row.league_id,
    name: row.league_name,
    api_league_id: row.api_league_id,
    season: row.season,
    mode: row.mode,
    created_at: row.created_at,

    // opzionale: se ti fa comodo in UI
    myTeam: {
      id: row.team_id,
      name: row.team_name,
      role: row.role,
    },
  }));

  set({ leagues, loading: false });
},


  // 🔹 Imposta la lega attiva (carica da DB)
  setActiveLeague: async (leagueId) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", leagueId)
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ activeLeague: data as League, loading: false });
  },

  // 🔹 Crea una nuova lega e aggiorna lista (in base al campionato)
  addLeague: async ({
    name,
    mode,
    apiLeagueId,
    scoringJson,
    budget,
    rosterSize,
    maxPlayersPerRealTeam,
  }) => {
    set({ loading: true, error: null });

    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;

    if (!userId) {
      set({ loading: false, error: "Non sei loggato." });
      return null;
    }

    const season = typeof getDefaultSeasonYear === "function"
      ? getDefaultSeasonYear()
      : new Date().getFullYear();

    // NB: NON passiamo created_by: lo mette il DB con default auth.uid()
    const { data, error } = await supabase
      .from("leagues")
      .insert({
        name: name.trim(),
        mode,
        mod_enabled: false,
        mod_type: null,
        budget,
        roster_size: rosterSize,
        max_players_per_real_team: maxPlayersPerRealTeam,
        scoring_json: scoringJson,
        api_league_id: apiLeagueId,
        season,
      })
      .select("*")
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      return null;
    }

    // aggiorna lista in memoria
    set({
      leagues: [data as League, ...get().leagues],
      activeLeague: data as League,
      loading: false,
    });

    return (data as League).id;
  },

  // 🔹 Entra in una lega esistente (TODO: quando implementi join reale su DB)
  joinLeague: async (_leagueId, _team) => {
    // placeholder: quando avrai la tabella/team_invites ecc.
    // qui chiamerai una RPC o una insert su user_team
  },

  // 🔹 Reset completo (utile per logout o test)
  reset: () => set({ leagues: [], activeLeague: undefined, loading: false, error: null }),
}));
