// types/fantacalcio.ts

export type League = {
  id: string; // uuid
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

  scoring_json?: any; // jsonb
};

export type MyTeam = {
  id: string; // uuid
  name: string;
};

export type UserLeague = League & {
  myTeam: MyTeam;
  myRole: string; // es "OWNER" | "MEMBER"
};
