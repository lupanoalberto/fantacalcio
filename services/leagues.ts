import { League, LeagueRules, Team } from '../types/fantacalcio';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid'; // se non l’hai installato: npm i uuid

// ✅ Mock locale (in assenza di backend)
let mockLeagues: League[] = [];

// 🔹 Funzione: restituisce tutte le leghe di un utente
export const getUserLeagues = async (userId: string): Promise<League[]> => {
  return mockLeagues.filter(l => l.members.some(m => m.ownerId === userId));
};

// 🔹 Funzione: crea una nuova lega
export const createLeague = async (
  userId: string,
  name: string,
  rules?: Partial<LeagueRules>
): Promise<League> => {
  const newLeague: League = {
    id: uuidv4(),
    name,
    selectedLeague: 'Serie A',
    type: 'Classic',
    ownerId: userId,
    members: [],
    rules: {
      budget: 500,
      maxPlayers: 25,
      allowSubstitutions: true,
      modificatoreDifesa: true,
      mercatoAperto: true,
      pointsPerGoal: 3,
      pointsPerAssist: 1,
      pointsPerCleanSheet: 1,
      penaltyYellowCard: -0.5,
      penaltyRedCard: -1,
      ...rules,
    },
    calendar: [],
    standings: [],
    createdAt: new Date().toISOString(),
  };

  mockLeagues.push(newLeague);
  return newLeague;
};

// 🔹 Funzione: entra in una lega (join)
export const joinLeague = async (leagueId: string, team: Team): Promise<League> => {
  const league = mockLeagues.find(l => l.id === leagueId);
  if (!league) throw new Error('Lega non trovata');

  league.members.push(team);
  return league;
};

// 🔹 Funzione: ottiene una lega tramite ID
export const getLeagueById = async (leagueId: string): Promise<League | undefined> => {
  return mockLeagues.find(l => l.id === leagueId);
};

// 🔹 (Facoltativa) reset dei mock per test
export const resetLeagues = () => {
  mockLeagues = [];
};
