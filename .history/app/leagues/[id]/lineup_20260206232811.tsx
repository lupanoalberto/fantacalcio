import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

type CanonicalRole = "Portiere" | "Difensore" | "Centrocampista" | "Attaccante";

type MatchdayRow = { matchday: number; status: "OPEN" | "LOCKED" | "FINALIZED" };

type RosterRow = {
  id: string;
  api_player_id: number;
  cached_display_name: string | null;
  cached_role: string | null;
  cached_team_name: string | null;
};

type FormationKey = "3-5-2" | "3-4-3" | "4-4-2" | "4-3-3" | "4-5-1" | "5-3-2" | "5-4-1";
const FORMATIONS: Record<FormationKey, { DEF: number; MID: number; FWD: number }> = {
  "3-5-2": { DEF: 3, MID: 5, FWD: 2 },
  "3-4-3": { DEF: 3, MID: 4, FWD: 3 },
  "4-4-2": { DEF: 4, MID: 4, FWD: 2 },
  "4-3-3": { DEF: 4, MID: 3, FWD: 3 },
  "4-5-1": { DEF: 4, MID: 5, FWD: 1 },
  "5-3-2": { DEF: 5, MID: 3, FWD: 2 },
  "5-4-1": { DEF: 5, MID: 4, FWD: 1 },
};

function isUuidLike(v: any) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

type Step = "MATCHDAY" | "FORMATION" | "GK" | "DEF" | "MID" | "FWD" | "REVIEW";

export default function LineupWizardScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id;

  const [loading, setLoading] = useState(true);

  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [matchdays, setMatchdays] = useState<MatchdayRow[]>([]);
  const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null);

  const [formation, setFormation] = useState<FormationKey | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);

  const [step, setStep] = useState<Step>("MATCHDAY");
  const [saving, setSaving] = useState(false);

  // selections
  const [gk, setGk] = useState<RosterRow | null>(null);
  const [defs, setDefs] = useState<RosterRow[]>([]);
  const [mids, setMids] = useState<RosterRow[]>([]);
  const [fwds, setFwds] = useState<RosterRow[]>([]);

  // load base: my team + open matchdays
  useEffect(() => {
    let cancelled = false;

    async function loadBase() {
      try {
        setLoading(true);
        if (!leagueId || !isUuidLike(leagueId)) throw new Error("leagueId non valido");

        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        if (!uid) {
          Alert.alert("Login richiesto", "Devi essere loggato per inserire la formazione.");
          router.push("/(auth)/login" as any);
          return;
        }

        // my team in this league
        const { data: ut, error: utErr } = await supabase
          .from("user_team")
          .select(`role, team:teams ( id, league_id )`)
          .eq("user_id", uid)
          .eq("team.league_id", leagueId)
          .limit(1);

        if (utErr) throw utErr;

        const myTeam = (ut ?? [])[0] as any;
        const tId = myTeam?.team?.id ?? null;
        if (!tId) throw new Error("Non ho trovato la tua squadra in questa lega.");

        // matchdays
        const { data: md, error: mdErr } = await supabase
          .from("league_matchdays")
          .select("matchday,status")
          .eq("league_id", leagueId)
          .order("matchday", { ascending: true });

        if (mdErr) throw mdErr;

        const list = (md ?? []) as MatchdayRow[];
        const firstOpen = list.find((x) => x.status === "OPEN")?.matchday ?? null;

        if (!cancelled) {
          setMyTeamId(tId);
          setMatchdays(list);
          setSelectedMatchday(firstOpen ?? (list[0]?.matchday ?? null));
          setStep("MATCHDAY");
        }
      } catch (e: any) {
        console.error("Lineup loadBase error:", e?.message ?? e);
        if (!cancelled) {
          setMyTeamId(null);
          setMatchdays([]);
          setSelectedMatchday(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBase();
    return () => {
      cancelled = true;
    };
  }, [leagueId, router]);

  // load roster once myTeamId is known
  useEffect(() => {
    let cancelled = false;

    async function loadRoster() {
      if (!myTeamId) return;
      try {
        const { data, error } = await supabase
          .from("rosters")
          .select("id,api_player_id,cached_display_name,cached_role,cached_team_name")
          .eq("team_id", myTeamId)
          .is("released_at", null);

        if (error) throw error;
        if (!cancelled) setRoster((data ?? []) as any);
      } catch (e: any) {
        console.error("Lineup loadRoster error:", e?.message ?? e);
        if (!cancelled) setRoster([]);
      }
    }

    loadRoster();
    return () => {
      cancelled = true;
    };
  }, [myTeamId]);

  const mdOptions = useMemo(() => {
    // ti faccio vedere tutte, ma puoi filtrare solo OPEN se vuoi
    return matchdays;
  }, [matchdays]);

  const formationSpec = formation ? FORMATIONS[formation] : null;

  const normalizeRole = (r: string | null): CanonicalRole | null => {
    if (!r) return null;
    const x = r.toLowerCase();
    if (x.includes("port")) return "Portiere";
    if (x.includes("dif")) return "Difensore";
    if (x.includes("centr")) return "Centrocampista";
    if (x.includes("att")) return "Attaccante";
    return null;
  };

  const rosterByRole = useMemo(() => {
    const gks = roster.filter((p) => normalizeRole(p.cached_role) === "Portiere");
    const d = roster.filter((p) => normalizeRole(p.cached_role) === "Difensore");
    const m = roster.filter((p) => normalizeRole(p.cached_role) === "Centrocampista");
    const f = roster.filter((p) => normalizeRole(p.cached_role) === "Attaccante");
    return { gks, d, m, f };
  }, [roster]);

  const resetSelections = () => {
    setGk(null);
    setDefs([]);
    setMids([]);
    setFwds([]);
  };

  const goNext = () => {
    if (step === "MATCHDAY") return setStep("FORMATION");
    if (step === "FORMATION") return setStep("GK");
    if (step === "GK") return setStep("DEF");
    if (step === "DEF") return setStep("MID");
    if (step === "MID") return setStep("FWD");
    if (step === "FWD") return setStep("REVIEW");
  };

  const goBack = () => {
    if (step === "MATCHDAY") {
      if (router.canGoBack()) router.back();
      else router.push("/");
      return;
    }
    if (step === "FORMATION") return setStep("MATCHDAY");
    if (step === "GK") return setStep("FORMATION");
    if (step === "DEF") return setStep("GK");
    if (step === "MID") return setStep("DEF");
    if (step === "FWD") return setStep("MID");
    if (step === "REVIEW") return setStep("FWD");
  };

  const canProceed = () => {
    if (step === "MATCHDAY") return selectedMatchday != null;
    if (step === "FORMATION") return formation != null;
    if (step === "GK") return gk != null;
    if (step === "DEF") return !!formationSpec && defs.length === formationSpec.DEF;
    if (step === "MID") return !!formationSpec && mids.length === formationSpec.MID;
    if (step === "FWD") return !!formationSpec && fwds.length === formationSpec.FWD;
    if (step === "REVIEW") return true;
    return false;
  };

  async function saveLineup() {
    try {
      if (!myTeamId || selectedMatchday == null || !formation) {
        Alert.alert("Errore", "Dati mancanti.");
        return;
      }

      const dayRow = matchdays.find((d) => d.matchday === selectedMatchday);
      if (dayRow?.status !== "OPEN") {
        Alert.alert("Non disponibile", "Questa giornata non è aperta.");
        return;
      }

      // validate
      const spec = FORMATIONS[formation];
      if (!gk || defs.length !== spec.DEF || mids.length !== spec.MID || fwds.length !== spec.FWD) {
        Alert.alert("Formazione incompleta", "Completa tutti i ruoli prima di salvare.");
        return;
      }

      setSaving(true);

      // 1) esiste già una lineup per team+matchday?
      const { data: existing, error: exErr } = await supabase
        .from("lineups")
        .select("id")
        .eq("team_id", myTeamId)
        .eq("matchday", selectedMatchday)
        .maybeSingle();

      if (exErr) throw exErr;

      let lineupId = existing?.id ?? null;

      if (lineupId) {
        // update formation
        const { error: upErr } = await supabase
          .from("lineups")
          .update({ formation })
          .eq("id", lineupId);

        if (upErr) throw upErr;

        // wipe players and reinsert
        const { error: delErr } = await supabase
          .from("lineup_players")
          .delete()
          .eq("lineup_id", lineupId);

        if (delErr) throw delErr;
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("lineups")
          .insert({ team_id: myTeamId, matchday: selectedMatchday, formation })
          .select("id")
          .single();

        if (insErr) throw insErr;
        lineupId = ins.id;
      }

      // 2) insert lineup_players (slot: 1..N)
      const starters: RosterRow[] = [
        gk,
        ...defs,
        ...mids,
        ...fwds,
      ];

      const payload = starters.map((p, idx) => ({
        lineup_id: lineupId,
        api_player_id: p.api_player_id,
        slot: idx + 1,
        is_starter: true,
      }));

      const { error: lpErr } = await supabase.from("lineup_players").insert(payload);
      if (lpErr) throw lpErr;

      Alert.alert("Salvata!", `Formazione salvata per G${selectedMatchday}.`);
      setStep("REVIEW");
    } catch (e: any) {
      console.error("saveLineup error:", e?.message ?? e);
      Alert.alert("Errore", e?.message ?? "Impossibile salvare la formazione.");
    } finally {
      setSaving(false);
    }
  }

  const PlayerPick = ({
    player,
    selected,
    onPress,
  }: {
    player: RosterRow;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? colors.success : colors.secondary,
        backgroundColor: selected ? colors.secondary : colors.background,
      }}
    >
      <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }} numberOfLines={1}>
        {player.cached_display_name ?? `#${player.api_player_id}`}
      </Text>
      <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
        {player.cached_team_name ?? "—"}
      </Text>
    </TouchableOpacity>
  );

  const titleByStep: Record<Step, string> = {
    MATCHDAY: "Scegli giornata",
    FORMATION: "Scegli modulo",
    GK: "Scegli portiere",
    DEF: "Scegli difensori",
    MID: "Scegli centrocampisti",
    FWD: "Scegli attaccanti",
    REVIEW: "Riepilogo",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 12, gap: 16 }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontFamily: fonts.semibold, color: colors.text }}>
              Formazione
            </Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }}>
              {titleByStep[step]}
              {selectedMatchday != null ? ` • G${selectedMatchday}` : ""}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : !myTeamId ? (
          <Text style={{ paddingHorizontal: 12, fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
            Non riesco a trovare la tua squadra in questa lega.
          </Text>
        ) : (
          <>
            {/* STEP CONTENT */}
            <View style={{ paddingHorizontal: 12, gap: 12 }}>
              {step === "MATCHDAY" ? (
                <View style={{ gap: 8 }}>
                  {mdOptions.map((d) => {
                    const active = d.matchday === selectedMatchday;
                    const disabled = d.status !== "OPEN";
                    return (
                      <TouchableOpacity
                        key={d.matchday}
                        onPress={() => !disabled && setSelectedMatchday(d.matchday)}
                        activeOpacity={0.85}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: active ? colors.success : colors.secondary,
                          opacity: disabled ? 0.5 : 1,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }}>
                          Giornata {d.matchday}
                        </Text>
                        <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }}>
                          Stato: {d.status}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}

              {step === "FORMATION" ? (
                <View style={{ gap: 8 }}>
                  {(Object.keys(FORMATIONS) as FormationKey[]).map((f) => {
                    const active = formation === f;
                    return (
                      <TouchableOpacity
                        key={f}
                        onPress={() => {
                          setFormation(f);
                          resetSelections();
                        }}
                        activeOpacity={0.85}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: active ? colors.success : colors.secondary,
                          backgroundColor: active ? colors.secondary : colors.background,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }}>
                          {f}
                        </Text>
                        <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 }}>
                          Dif {FORMATIONS[f].DEF} • Cen {FORMATIONS[f].MID} • Att {FORMATIONS[f].FWD}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}

              {step === "GK" ? (
                <View style={{ gap: 8 }}>
                  {!rosterByRole.gks.length ? (
                    <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
                      Non hai portieri in rosa.
                    </Text>
                  ) : (
                    rosterByRole.gks.map((p) => (
                      <PlayerPick
                        key={p.id}
                        player={p}
                        selected={gk?.id === p.id}
                        onPress={() => setGk(p)}
                      />
                    ))
                  )}
                </View>
              ) : null}

              {step === "DEF" && formationSpec ? (
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
                    Seleziona {formationSpec.DEF} difensori ({defs.length}/{formationSpec.DEF})
                  </Text>

                  {rosterByRole.d.map((p) => {
                    const selected = defs.some((x) => x.id === p.id);
                    return (
                      <PlayerPick
                        key={p.id}
                        player={p}
                        selected={selected}
                        onPress={() => {
                          setDefs((prev) => {
                            if (selected) return prev.filter((x) => x.id !== p.id);
                            if (prev.length >= formationSpec.DEF) return prev; // blocco
                            return [...prev, p];
                          });
                        }}
                      />
                    );
                  })}
                </View>
              ) : null}

              {step === "MID" && formationSpec ? (
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
                    Seleziona {formationSpec.MID} centrocampisti ({mids.length}/{formationSpec.MID})
                  </Text>

                  {rosterByRole.m.map((p) => {
                    const selected = mids.some((x) => x.id === p.id);
                    return (
                      <PlayerPick
                        key={p.id}
                        player={p}
                        selected={selected}
                        onPress={() => {
                          setMids((prev) => {
                            if (selected) return prev.filter((x) => x.id !== p.id);
                            if (prev.length >= formationSpec.MID) return prev;
                            return [...prev, p];
                          });
                        }}
                      />
                    );
                  })}
                </View>
              ) : null}

              {step === "FWD" && formationSpec ? (
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
                    Seleziona {formationSpec.FWD} attaccanti ({fwds.length}/{formationSpec.FWD})
                  </Text>

                  {rosterByRole.f.map((p) => {
                    const selected = fwds.some((x) => x.id === p.id);
                    return (
                      <PlayerPick
                        key={p.id}
                        player={p}
                        selected={selected}
                        onPress={() => {
                          setFwds((prev) => {
                            if (selected) return prev.filter((x) => x.id !== p.id);
                            if (prev.length >= formationSpec.FWD) return prev;
                            return [...prev, p];
                          });
                        }}
                      />
                    );
                  })}
                </View>
              ) : null}

              {step === "REVIEW" ? (
                <View style={{ gap: 8 }}>
                  <View style={styles.box}>
                    <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }}>
                      Modulo: {formation ?? "—"}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 8 }}>
                      Portiere: {gk?.cached_display_name ?? "—"}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 8 }}>
                      Difensori: {defs.map((x) => x.cached_display_name).filter(Boolean).join(", ") || "—"}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 8 }}>
                      Centrocampisti: {mids.map((x) => x.cached_display_name).filter(Boolean).join(", ") || "—"}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 8 }}>
                      Attaccanti: {fwds.map((x) => x.cached_display_name).filter(Boolean).join(", ") || "—"}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Footer buttons */}
            <View style={{ paddingHorizontal: 12, gap: 12 }}>
              {step !== "REVIEW" ? (
                <TouchableOpacity
                  onPress={() => {
                    if (!canProceed()) return;
                    goNext();
                  }}
                  activeOpacity={0.85}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: canProceed() ? colors.success : colors.secondary,
                    opacity: canProceed() ? 1 : 0.6,
                    alignItems: "center",
                  }}
                  disabled={!canProceed()}
                >
                  <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: colors.primary }}>
                    Avanti
                  </Text>
                </TouchableOpacity>
              ) : null}

              {step === "REVIEW" ? (
                <TouchableOpacity
                  onPress={saveLineup}
                  activeOpacity={0.85}
                  disabled={saving}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: colors.success,
                    opacity: saving ? 0.6 : 1,
                    alignItems: "center",
                  }}
                >
                  {saving ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: colors.primary }}>
                      Salva formazione
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {step === "REVIEW" ? (
                <TouchableOpacity
                  onPress={() => setStep("MATCHDAY")}
                  activeOpacity={0.85}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.secondary,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }}>
                    Cambia giornata / modulo
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
