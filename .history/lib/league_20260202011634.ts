import { supabase } from "@/lib/supabase";

export async function getMyTeamInLeague(leagueId: string) {
  const { data: sess, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw sessErr;

  const uid = sess.session?.user?.id;
  if (!uid) return { uid: null, myTeamId: null, myRole: null };

  const { data, error } = await supabase
    .from("user_team")
    .select(`
      role,
      team:teams (
        id,
        league_id
      )
    `)
    .eq("user_id", uid)
    .eq("team.league_id", leagueId)
    .limit(1);

  if (error) throw error;

  const row = (data ?? [])[0] as any;
  const myTeamId = row?.team?.id ?? null;
  const myRole = row?.role ?? null;

  return { uid, myTeamId, myRole };
}
