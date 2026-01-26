// store/leagueStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { UserLeague } from "@/types/fantacalcio";

type DbLeague = {
  id: string;
  name: string;
  api_league_id: number | null;
  season: number | null;
  join_code?: number | null;
  created_by?: string | null;
  mode?: string | null;
  mod_enabled?: boolean | null;
  mod_type?: string | null;
  budget?: number | null;
  roster_size?: number | null;
  max_players_per_real_team?: number | null;
  scoring_json?: any;
};

type DbTeam = {
  id: string;
  name: string;
  league: DbLeague | null;
};

type DbUserTeamRow = {
  role: string;
  team: DbTeam | null;
};

function isUserLeague(x: any): x is UserLeague {
  return !!x && typeof x.id === "string" && !!x.myTeam?.id;
}

type LeagueState = {
  leagues: UserLeague[];
  loading: boolean;
  error: string | null;

  fetchUserLeagues: () => Promise<void>;
  reset: () => void;
};

export const useLeagueStore = create<LeagueState>((set) => ({
  leagues: [],
  loading: false,
  error: null,

  reset: () => set({ leagues: [], loading: false, error: null }),

  fetchUserLeagues: async () => {
    set({ loading: true, error: null });

    try {
      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const uid = sess.session?.user?.id;
      if (!uid) {
        set({ leagues: [], loading: false, error: null });
        return;
      }

      const { data, error } = await supabase
        .from("user_team")
        .select(
          `
          role,
          team:teams (
            id,
            name,
            league:leagues (
              id,
              name,
              api_league_id,
              season,
              join_code,
              created_by,
              mode,
              mod_enabled,
              mod_type,
              budget,
              roster_size,
              max_players_per_real_team,
              scoring_json
            )
          )
        `,
        )
        .eq("user_id", uid);

      if (error) throw error;

      const rows = (data ?? []) as DbUserTeamRow[];

      const mapped = rows
        .map((r) => {
          const team = r.team;
          const league = team?.league;
          if (!team?.id || !league?.id) return null;

          const out: UserLeague = {
            ...league,
            myTeam: { id: team.id, name: team.name },
            myRole: r.role,
          };

          return out;
        })
        .filter(isUserLeague);

      // dedup per league_id (un utente ha 1 team per league, ma dedup non fa male)
      const uniq = new Map<string, UserLeague>();
      for (const x of mapped) uniq.set(x.id, x);
      const out = Array.from(uniq.values());

      set({ leagues: out, loading: false, error: null });
    } catch (e: any) {
      set({ leagues: [], loading: false, error: e?.message ?? "Errore" });
    }
  },
}));
