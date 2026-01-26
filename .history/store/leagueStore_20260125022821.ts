import { create } from 'zustand';
import { League, Team } from '../types/fantacalcio';
import {
  getUserLeagues,
  createLeague,
  joinLeague,
  getLeagueById,
} from '../services/leagues';

interface LeagueStore {
  leagues: League[];
  activeLeague?: League;
  loading: boolean;

  // Azioni
  fetchUserLeagues: (userId: string) => Promise<void>;
  setActiveLeague: (leagueId: string) => Promise<void>;
  addLeague: (userId: string, name: string) => Promise<void>;
  joinLeague: (leagueId: string, team: Team) => Promise<void>;
  reset: () => void;
}

export const useLeagueStore = create<LeagueStore>((set, get) => ({
  leagues: [],
  activeLeague: undefined,
  loading: false,

  // 🔹 Recupera le leghe dell’utente
  fetchUserLeagues: async (userId) => {
    set({ loading: true });
    const leagues = await getUserLeagues(userId);
    set({ leagues, loading: false });
  },

  // 🔹 Imposta la lega attiva
  setActiveLeague: async (leagueId) => {
    set({ loading: true });
    const league = await getLeagueById(leagueId);
    set({ activeLeague: league, loading: false });
  },

  // 🔹 Crea una nuova lega e aggiorna la lista
  addLeague: async (userId, name) => {
    const newLeague = await createLeague(userId, name);
    set({ leagues: [...get().leagues, newLeague] });
  },

  // 🔹 Entra in una lega esistente
  joinLeague: async (leagueId, team) => {
    const updatedLeague = await joinLeague(leagueId, team);
    set({
      leagues: get().leagues.map((l) => (l.id === leagueId ? updatedLeague : l)),
    });
  },

  // 🔹 Reset completo (utile per logout o test)
  reset: () => set({ leagues: [], activeLeague: undefined, loading: false }),
}));
