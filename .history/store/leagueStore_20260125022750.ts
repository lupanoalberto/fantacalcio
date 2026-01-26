import { create } from "zustand";
import { supabase } from "@/lib/supabase";

/**
 * Tipi minimi per UI:
 * - myTeam serve per ListLeagues: item.myTeam?.name
 */
export type MyTeamLite = {
  id: string;
  name: string;
};

export type LeagueLite = {
  id: string;
  name: string;
  api_league_id: number;
  season: number;
  mode?: string | null;

  // opzionali
  join_code?: number | null;

  // 👇 squadra dell'utente in quella lega
  myTeam?: MyTeamLite | null;
};

type CreateLeagueArgs = {
  name: string; // nome lega
  mode: string; // "CLASSICO" | "MANTRA"
  apiLeagueId: number;
  season: number;
  scoringJson: any;

  budget: number;
  rosterSize: number;
  maxPlayersPerRealTeam: number;

  teamName: string; // nome squadra owner
};

type JoinLeagueArgs = {
  leagueId: number; // id numerico "codice lega" (join_code o id? vedi sotto nota)
  teamName: string;
};

interface LeagueStore {
  leagues: LeagueLite[];
  activeLeague?: LeagueLite;
  loading: boolean;
  error?: string;

  fetchUserLeagues: (apiLeagueId: number) => Promise<void>;
  setActiveLeague: (leagueId: string) => Promise<void>;

  createLeagueWithOwnerTeam: (args: CreateLeagueArgs) => Promise<string>; // returns league_id
  joinLeagueById: (args: JoinLeagueArgs) => Promise<string>; // returns league_id

  reset: () => void;
}

export const useLeagueStore = create<LeagueStore>((set, get) => ({
  leagues: [],
  activeLeague: undefined,
  loading: false,
  error: undefined,

  /**
   * ✅ Leghe dove l'utente partecipa + filtro per campionato corrente
   * Richiede:
   * - tabella user_team (user_id -> team_id)
   * - tabella teams (team_id -> league_id)
   * - tabella leagues (league_id -> api_league_id)
   *
   * Qui facciamo 2 query:
   * 1) prendo tutte le team dell'utente con join league
   * 2) costruisco leagues[] con myTeam
   */
  fetchUserLeagues: async (apiLeagueId: number) => {
    set({ loading: true, error: undefined });

    const { data: sess, error: sessErr } = await supabase.auth.getSession();
    const userId = sess?.session?.user?.id;

    if (sessErr || !userId) {
      set({ loading: false, error: "Not authenticated" });
      return;
    }

    // 1) prendo le squadre dell'utente e la relativa lega
    // NB: la select annidata funziona se hai FK:
    // user_team.team_id -> teams.id
    // teams.league_id -> leagues.id
    const { data, error } = await supabase
      .from("user_team")
      .select(
        `
        team:teams (
          id,
          name,
          league:leagues (
            id,
            name,
            api_league_id,
            season,
            mode,
            join_code
          )
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    // 2) trasformo in leagues filtrate per apiLeagueId
    const map = new Map<string, LeagueLite>();

    for (const row of data ?? []) {
      const team = (row as any)?.team;
      const league = team?.league;

      if (!league?.id) continue;
      if (league.api_league_id !== apiLeagueId) continue;

      // un utente può avere UNA sola team per lega: quindi myTeam è la sua team
      map.set(league.id, {
        id: league.id,
        name: league.name,
        api_league_id: league.api_league_id,
        season: league.season,
        mode: league.mode,
        join_code: league.join_code ?? null,
        myTeam: team?.id ? { id: team.id, name: team.name } : null,
      });
    }

    set({ leagues: Array.from(map.values()), loading: false });
  },

  /**
   * ✅ Dettaglio lega corrente + myTeam (squadra utente nella lega)
   */
  setActiveLeague: async (leagueId: string) => {
    set({ loading: true, error: undefined });

    const { data: sess } = await supabase.auth.getSession();
    const userId = sess?.session?.user?.id;

    if (!userId) {
      set({ loading: false, error: "Not authenticated" });
      return;
    }

    // 1) lega
    const { data: league, error: leagueErr } = await supabase
      .from("leagues")
      .select("id, name, api_league_id, season, mode, join_code")
      .eq("id", leagueId)
      .single();

    if (leagueErr || !league) {
      set({ loading: false, error: leagueErr?.message ?? "League not found" });
      return;
    }

    // 2) myTeam nella lega: user_team -> teams (filtrando per league_id)
    const { data: ut, error: utErr } = await supabase
      .from("user_team")
      .select("team:teams(id, name, league_id)")
      .eq("user_id", userId);

    if (utErr) {
      set({ loading: false, error: utErr.message });
      return;
    }

    const found = (ut ?? []).find((x: any) => x?.team?.league_id === leagueId);
    const myTeam: MyTeamLite | null = found?.team?.id
      ? { id: found.team.id, name: found.team.name }
      : null;

    set({
      activeLeague: {
        id: league.id,
        name: league.name,
        api_league_id: league.api_league_id,
        season: league.season,
        mode: league.mode,
        join_code: league.join_code ?? null,
        myTeam,
      },
      loading: false,
    });
  },

  /**
   * ✅ Crea lega + crea team owner + user_team owner (RPC atomica)
   * Ritorna league_id.
   */
  createLeagueWithOwnerTeam: async (args: CreateLeagueArgs) => {
    set({ loading: true, error: undefined });

    const { data, error } = await supabase.rpc("create_league_with_owner_team", {
      p_name: args.name,
      p_mode: args.mode,
      p_api_league_id: args.apiLeagueId,
      p_season: args.season,
      p_scoring_json: args.scoringJson,
      p_budget: args.budget,
      p_roster_size: args.rosterSize,
      p_max_players_per_real_team: args.maxPlayersPerRealTeam,
      p_team_name: args.teamName,
    });

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    const created = Array.isArray(data) ? data[0] : data;
    const league_id = created?.league_id as string | undefined;

    if (!league_id) {
      set({ loading: false, error: "RPC returned missing league_id" });
      throw new Error("RPC returned missing league_id");
    }

    set({ loading: false });
    return league_id;
  },

  /**
   * ✅ Join lega esistente + crea team utente + user_team (RPC)
   * Ritorna league_id.
   *
   * ⚠️ NOTA IMPORTANTE:
   * qui args.leagueId è quello che tu chiami "codice"
   * Se nel DB il codice è join_code e NON id uuid,
   * allora la RPC deve cercare la lega tramite join_code.
   */
  joinLeagueById: async (args: JoinLeagueArgs) => {
    set({ loading: true, error: undefined });

    const { data, error } = await supabase.rpc("join_league_by_id", {
      p_league_id: args.leagueId,
      p_team_name: args.teamName,
    });

    if (error) {
      set({ loading: false, error: error.message });
      throw error;
    }

    const joined = Array.isArray(data) ? data[0] : data;
    const league_id =
      (joined?.league_id as string | undefined) ??
      (joined?.id as string | undefined);

    if (!league_id) {
      set({ loading: false, error: "RPC returned missing league_id" });
      throw new Error("RPC returned missing league_id");
    }

    set({ loading: false });
    return league_id;
  },

  reset: () => set({ leagues: [], activeLeague: undefined, loading: false, error: undefined }),
}));
