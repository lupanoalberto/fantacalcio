// store/leagueStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { UserLeague } from "@/types/fantacalcio";



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
        `
        )
        .eq("user_id", uid);

      if (error) throw error;

      const mapped: UserLeague[] = (data ?? [])
        .map((r: any) => {
          const team = r?.team;
          const league = team?.league;
          if (!team?.id || !league?.id) return null;

          return {
            ...league,
            myTeam: { id: team.id, name: team.name },
            myRole: r.role,
          } as UserLeague;
        })
        .filter(Boolean);

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
