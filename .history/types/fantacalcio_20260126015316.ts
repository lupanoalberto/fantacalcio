export interface Player {
  id: string;                // player.id da football-data
  name: string;              // player.name
  nationality?: string;
  team: string;              // team.name
  role: 'P' | 'D' | 'C' | 'A';
  stats?: {
    appearances?: number;
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
  };
  status: 'available' | 'owned';
  ownerId?: string;
}

export interface Team {
  id: string;              // es. "team_456"
  ownerId: string;         // id utente proprietario
  teamName: string;        // nome squadra scelto dall’utente
  points: number;          // totale punti
  roster: Player[];        // rosa completa
}

export type TeamMembership = {
  id: string;
  name: string;
  role: "OWNER" | "CO_OWNER";
};

export type League = {
  id: string;
  name: string;
  api_league_id?: number;
  season?: number;
  mode?: string;
  created_at?: string;

  // ✅ aggiungi questo
  myTeam?: TeamMembership;
};


export interface LeagueRules {
  budget: number;             // es. 500
  maxPlayers: number;         // es. 25
  allowSubstitutions: boolean;
  modificatoreDifesa: boolean;
  mercatoAperto: boolean;
  pointsPerGoal: number;
  pointsPerAssist: number;
  pointsPerCleanSheet: number;
  penaltyYellowCard: number;
  penaltyRedCard: number;
}

export interface Match {
  id: string;                 // es. "match_001"
  leagueId: string;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  date?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  leaguesJoined: string[];   // id delle leghe a cui partecipa
}
