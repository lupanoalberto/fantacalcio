import React, { useEffect, useMemo, useRef, useState } from "react";
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
type MatchdayRow = {
  matchday: number;
  status: "OPEN" | "LOCKED" | "FINALIZED";
};

type RosterRow = {
  id: string;
  api_player_id: number;
  cached_display_name: string | null;
  cached_role: string | null;
  cached_team_name: string | null;
};

type FormationKey =
  | "3-5-2"
  | "3-4-3"
  | "4-4-2"
  | "4-3-3"
  | "4-5-1"
  | "5-3-2"
  | "5-4-1";

const FORMATIONS: Record<
  FormationKey,
  { DEF: number; MID: number; FWD: number }
> = {
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

type Step =
  | "MATCHDAY"
  | "FORMATION"
  | "GK"
  | "DEF"
  | "MID"
  | "FWD"
  | "BENCH"
  | "REVIEW";

// ✅ Regole lega dinamiche (da leagues.scoring_json.rules)
type LeagueRules = {
  rosterSize: number;
  quotas: { P: number; D: number; C: number; A: number };
};

const DEFAULT_RULES: LeagueRules = {
  rosterSize: 25,
  quotas: { P: 3, D: 8, C: 8, A: 6 },
};

export default function LineupWizardScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const leagueId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [matchdays, setMatchdays] = useState<MatchdayRow[]>([]);
  const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null);

  const [formation, setFormation] = useState<FormationKey | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);

  const [step, setStep] = useState<Step>("MATCHDAY");

  // selections starters
  const [gk, setGk] = useState<RosterRow | null>(null);
  const [defs, setDefs] = useState<RosterRow[]>([]);
  const [mids, setMids] = useState<RosterRow[]>([]);
  const [fwds, setFwds] = useState<RosterRow[]>([]);

  const [existingLineupId, setExistingLineupId] = useState<string | null>(null);
  const [loadingLineup, setLoadingLineup] = useState(false);

  // bench
  const [bench, setBench] = useState<RosterRow[]>([]);

  // ✅ rules
  const [leagueRules, setLeagueRules] = useState<LeagueRules>(DEFAULT_RULES);

  // ✅ panchina dinamica: 25 -> 14, 11 -> 0
  const benchSize = useMemo(() => {
    return Math.max(0, leagueRules.rosterSize - 11);
  }, [leagueRules.rosterSize]);

  // ---------- helpers ----------
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
    const gks = roster.filter(
      (p) => normalizeRole(p.cached_role) === "Portiere",
    );
    const d = roster.filter(
      (p) => normalizeRole(p.cached_role) === "Difensore",
    );
    const m = roster.filter(
      (p) => normalizeRole(p.cached_role) === "Centrocampista",
    );
    const f = roster.filter(
      (p) => normalizeRole(p.cached_role) === "Attaccante",
    );
    return { gks, d, m, f };
  }, [roster]);

  const rosterCounts = useMemo(() => {
    const counts: Record<CanonicalRole, number> = {
      Portiere: rosterByRole.gks.length,
      Difensore: rosterByRole.d.length,
      Centrocampista: rosterByRole.m.length,
      Attaccante: rosterByRole.f.length,
    };
    return counts;
  }, [rosterByRole]);

  // ✅ roster complete in base alle regole della lega
  const rosterIsComplete = useMemo(() => {
    const requiredTotal = leagueRules.rosterSize;

    const requiredByRole: Record<CanonicalRole, number> = {
      Portiere: leagueRules.quotas.P,
      Difensore: leagueRules.quotas.D,
      Centrocampista: leagueRules.quotas.C,
      Attaccante: leagueRules.quotas.A,
    };

    if (roster.length < requiredTotal) return false;

    const roles: CanonicalRole[] = [
      "Portiere",
      "Difensore",
      "Centrocampista",
      "Attaccante",
    ];
    for (const r of roles) {
      if (rosterCounts[r] < requiredByRole[r]) return false;
    }
    return true;
  }, [roster.length, rosterCounts, leagueRules]);

  const formationSpec = formation ? FORMATIONS[formation] : null;

  const selectedStartersSet = useMemo(() => {
    const ids = new Set<string>();
    if (gk) ids.add(gk.id);
    defs.forEach((p) => ids.add(p.id));
    mids.forEach((p) => ids.add(p.id));
    fwds.forEach((p) => ids.add(p.id));
    return ids;
  }, [gk, defs, mids, fwds]);

  const remainingForBench = useMemo(() => {
    return roster.filter((p) => !selectedStartersSet.has(p.id));
  }, [roster, selectedStartersSet]);

  const resetSelections = () => {
    setGk(null);
    setDefs([]);
    setMids([]);
    setFwds([]);
    setBench([]);
  };

  // ---------- load base: my team + league rules + matchdays ----------
  useEffect(() => {
    let cancelled = false;

    async function loadBase() {
      try {
        setLoading(true);
        if (!leagueId || !isUuidLike(leagueId))
          throw new Error("leagueId non valido");

        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        if (!uid) {
          Alert.alert(
            "Login richiesto",
            "Devi essere loggato per inserire la formazione.",
          );
          router.push("/(auth)/login" as any);
          return;
        }

        // ✅ Lega: prendo rules (roster_size + role_quotas)
        const { data: league, error: lErr } = await supabase
          .from("leagues")
          .select("id, scoring_json, roster_size")
          .eq("id", leagueId)
          .maybeSingle();

        if (lErr) throw lErr;

        const rules = (league as any)?.scoring_json?.rules;
        const rosterSize = Number(
          rules?.roster_size ??
            (league as any)?.roster_size ??
            DEFAULT_RULES.rosterSize,
        );

        const quotasObj = rules?.role_quotas ?? null;

        const quotas = {
          P: Number(quotasObj?.P ?? DEFAULT_RULES.quotas.P),
          D: Number(quotasObj?.D ?? DEFAULT_RULES.quotas.D),
          C: Number(quotasObj?.C ?? DEFAULT_RULES.quotas.C),
          A: Number(quotasObj?.A ?? DEFAULT_RULES.quotas.A),
        };

        if (!cancelled) {
          setLeagueRules({ rosterSize, quotas });
        }

        // 1️⃣ squadre dell’utente in quella lega (senza join)
        const { data: teams, error: tErr } = await supabase
          .from("teams")
          .select("id")
          .eq("league_id", leagueId)
          .limit(1);

        if (tErr) throw tErr;

        const foundTeamId = teams?.[0]?.id ?? null;
        if (!foundTeamId) {
          throw new Error("Non ho trovato la tua squadra in questa lega.");
        }

        // matchdays
        const { data: md, error: mdErr } = await supabase
          .from("league_matchdays")
          .select("matchday,status")
          .eq("league_id", leagueId)
          .order("matchday", { ascending: true });

        if (mdErr) throw mdErr;

        const list = (md ?? []) as MatchdayRow[];
        const firstOpen =
          list.find((x) => x.status === "OPEN")?.matchday ?? null;

        if (!cancelled) {
          setMyTeamId(String(foundTeamId));
          setMatchdays(list);
          setSelectedMatchday(firstOpen ?? list[0]?.matchday ?? null);
          setStep("MATCHDAY");
        }
      } catch (e: any) {
        console.error("Lineup loadBase error:", e?.message ?? e);
        if (!cancelled) {
          setMyTeamId(null);
          setMatchdays([]);
          setSelectedMatchday(null);
          setLeagueRules(DEFAULT_RULES);
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

  // ---------- load roster ----------
  useEffect(() => {
    let cancelled = false;

    async function loadRoster() {
      if (!myTeamId) return;
      try {
        const { data, error } = await supabase
          .from("rosters")
          .select(
            "id,api_player_id,cached_display_name,cached_role,cached_team_name",
          )
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

  const mdOptions = useMemo(() => matchdays, [matchdays]);

  const titleByStep: Record<Step, string> = {
    MATCHDAY: "Scegli giornata",
    FORMATION: "Scegli modulo",
    GK: "Scegli portiere",
    DEF: "Scegli difensori",
    MID: "Scegli centrocampisti",
    FWD: "Scegli attaccanti",
    BENCH: "Scegli panchina",
    REVIEW: "Riepilogo",
  };

  const goNext = () => {
    if (step === "MATCHDAY") return setStep("FORMATION");
    if (step === "FORMATION") return setStep("GK");
    if (step === "GK") return setStep("DEF");
    if (step === "DEF") return setStep("MID");
    if (step === "MID") return setStep("FWD");
    if (step === "FWD") return setStep("BENCH");
    if (step === "BENCH") return setStep("REVIEW");
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
    if (step === "BENCH") return setStep("FWD");
    if (step === "REVIEW") return setStep("BENCH");
  };

  const canProceed = () => {
    if (!rosterIsComplete) return false;
    if (step === "MATCHDAY") return selectedMatchday != null;
    if (step === "FORMATION") return formation != null;
    if (step === "GK") return gk != null;
    if (step === "DEF")
      return !!formationSpec && defs.length === formationSpec.DEF;
    if (step === "MID")
      return !!formationSpec && mids.length === formationSpec.MID;
    if (step === "FWD")
      return !!formationSpec && fwds.length === formationSpec.FWD;
    if (step === "BENCH") return bench.length === benchSize; // ✅ panchina dinamica
    if (step === "REVIEW") return true;
    return false;
  };
  // ...
  const lastAutoStepRef = useRef<Step | null>(null);

  useEffect(() => {
    if (!formationSpec) return;

    // evita doppio trigger sullo stesso step
    if (lastAutoStepRef.current === step) return;

    const shouldAuto =
      (step === "GK" && !!gk) ||
      (step === "DEF" && defs.length === formationSpec.DEF) ||
      (step === "MID" && mids.length === formationSpec.MID) ||
      (step === "FWD" && fwds.length === formationSpec.FWD) ||
      (step === "BENCH" && bench.length === benchSize);

    if (!rosterIsComplete) return;
    if (!shouldAuto) return;

    lastAutoStepRef.current = step;

    // piccola delay per non “saltare” troppo e dare feedback visivo
    const t = setTimeout(() => {
      goNext();
      lastAutoStepRef.current = null; // sblocca step successivo
    }, 250);

    return () => clearTimeout(t);
  }, [
    step,
    rosterIsComplete,
    formationSpec,
    gk,
    defs.length,
    mids.length,
    fwds.length,
    bench.length,
    benchSize,
  ]);

  useEffect(() => {
  if (!myTeamId) return;
  if (selectedMatchday == null) return;
  if (!roster.length) return;

  loadExistingLineup(myTeamId, selectedMatchday).catch((e) => {
    console.warn("loadExistingLineup failed:", e?.message ?? e);
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [myTeamId, selectedMatchday, roster.length]);


  async function loadExistingLineup(teamId: string, matchday: number) {
  setLoadingLineup(true);
  try {
    // 1) prendo lineup
    const { data: lu, error: luErr } = await supabase
      .from("lineups")
      .select("id, formation")
      .eq("team_id", teamId)
      .eq("matchday", matchday)
      .maybeSingle();

    if (luErr) throw luErr;

    if (!lu?.id) {
      setExistingLineupId(null);
      return;
    }

    setExistingLineupId(lu.id);
    setFormation(lu.formation as FormationKey);

    // 2) prendo lineup_players
    const { data: lps, error: lpErr } = await supabase
      .from("lineup_players")
      .select("api_player_id, slot, is_starter")
      .eq("lineup_id", lu.id)
      .order("slot", { ascending: true });

    if (lpErr) throw lpErr;

    // 3) mappo api_player_id -> roster row
    const byApiId = new Map<number, RosterRow>();
    roster.forEach((r) => byApiId.set(r.api_player_id, r));

    const starters = (lps ?? [])
      .filter((x: any) => x.is_starter)
      .sort((a: any, b: any) => a.slot - b.slot)
      .map((x: any) => byApiId.get(x.api_player_id))
      .filter(Boolean) as RosterRow[];

    const benchPlayers = (lps ?? [])
      .filter((x: any) => !x.is_starter)
      .sort((a: any, b: any) => a.slot - b.slot)
      .map((x: any) => byApiId.get(x.api_player_id))
      .filter(Boolean) as RosterRow[];

    // ✅ Ricostruisco: gk = primo, poi DEF/MID/FWD per ruolo
    const starterGk = starters.find((p) => normalizeRole(p.cached_role) === "Portiere") ?? null;
    const starterDefs = starters.filter((p) => normalizeRole(p.cached_role) === "Difensore");
    const starterMids = starters.filter((p) => normalizeRole(p.cached_role) === "Centrocampista");
    const starterFwds = starters.filter((p) => normalizeRole(p.cached_role) === "Attaccante");

    setGk(starterGk);
    setDefs(starterDefs);
    setMids(starterMids);
    setFwds(starterFwds);

    // bench
    setBench(benchPlayers);

    // vai direttamente al riepilogo
    setStep("REVIEW");
  } finally {
    setLoadingLineup(false);
  }
}


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

      const spec = FORMATIONS[formation];
      if (
        !gk ||
        defs.length !== spec.DEF ||
        mids.length !== spec.MID ||
        fwds.length !== spec.FWD
      ) {
        Alert.alert(
          "Formazione incompleta",
          "Completa tutti i ruoli prima di salvare.",
        );
        return;
      }

      if (bench.length !== benchSize) {
        Alert.alert(
          "Panchina incompleta",
          `Seleziona ${benchSize} giocatori in panchina.`,
        );
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
        const { error: upErr } = await supabase
          .from("lineups")
          .update({ formation })
          .eq("id", lineupId);

        if (upErr) throw upErr;

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

      // 2) insert lineup_players
      // slot: 1..11 titolari, poi panchina 12..(11+benchSize)
      const starters: RosterRow[] = [gk, ...defs, ...mids, ...fwds];

      const startersPayload = starters.map((p, idx) => ({
        lineup_id: lineupId,
        api_player_id: p.api_player_id,
        slot: idx + 1,
        is_starter: true,
      }));

      const benchPayload = bench.map((p, i) => ({
        lineup_id: lineupId,
        api_player_id: p.api_player_id,
        slot: 11 + (i + 1),
        is_starter: false,
      }));

      const payload = [...startersPayload, ...benchPayload];

      const { error: lpErr } = await supabase
        .from("lineup_players")
        .insert(payload);
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
    disabled,
    onPress,
  }: {
    player: RosterRow;
    selected: boolean;
    disabled?: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!!disabled}
      style={{
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? colors.success : colors.secondary,
        backgroundColor: selected ? colors.secondary : colors.background,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text }}
        numberOfLines={1}
      >
        {player.cached_display_name ?? `#${player.api_player_id}`}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontFamily: fonts.regular,
          color: colors.textSecondary,
          marginTop: 4,
        }}
        numberOfLines={1}
      >
        {player.cached_team_name ?? "—"}
      </Text>
    </TouchableOpacity>
  );

  // ---------- UI ----------
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 12, gap: 16 }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={goBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: fonts.semibold,
                color: colors.text,
              }}
            >
              Formazione
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: fonts.regular,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              {titleByStep[step]}
              {selectedMatchday != null ? ` • G${selectedMatchday}` : ""}
              {formation ? ` • ${formation}` : ""}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.success} />
        ) : !myTeamId ? (
          <Text
            style={{
              paddingHorizontal: 12,
              fontSize: 13,
              fontFamily: fonts.regular,
              color: colors.textSecondary,
            }}
          >
            Non riesco a trovare la tua squadra in questa lega.
          </Text>
        ) : !rosterIsComplete ? (
          <View style={{ paddingHorizontal: 12, gap: 8 }}>
            <View style={[styles.box, { borderColor: colors.secondary }]}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: fonts.semibold,
                  color: colors.text,
                }}
              >
                Rosa incompleta
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  marginTop: 8,
                }}
              >
                Devi avere una rosa completa per inserire la formazione.
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  marginTop: 12,
                }}
              >
                Totale: {roster.length}/{leagueRules.rosterSize}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
              >
                POR: {rosterCounts.Portiere}/{leagueRules.quotas.P} · DIF:{" "}
                {rosterCounts.Difensore}/{leagueRules.quotas.D}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.regular,
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
              >
                CEN: {rosterCounts.Centrocampista}/{leagueRules.quotas.C} · ATT:{" "}
                {rosterCounts.Attaccante}/{leagueRules.quotas.A}
              </Text>
            </View>
          </View>
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
                        onPress={() =>
                          !disabled && setSelectedMatchday(d.matchday)
                        }
                        activeOpacity={0.85}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: active
                            ? colors.success
                            : colors.secondary,
                          opacity: disabled ? 0.5 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: fonts.semibold,
                            color: colors.text,
                          }}
                        >
                          Giornata {d.matchday}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: fonts.regular,
                            color: colors.textSecondary,
                            marginTop: 4,
                          }}
                        >
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
                          borderColor: active
                            ? colors.success
                            : colors.secondary,
                          backgroundColor: active
                            ? colors.secondary
                            : colors.background,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: fonts.semibold,
                            color: colors.text,
                          }}
                        >
                          {f}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: fonts.regular,
                            color: colors.textSecondary,
                            marginTop: 4,
                          }}
                        >
                          Dif {FORMATIONS[f].DEF} • Cen {FORMATIONS[f].MID} •
                          Att {FORMATIONS[f].FWD}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}

              {step === "GK" ? (
                <View style={{ gap: 8 }}>
                  {!rosterByRole.gks.length ? (
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.regular,
                        color: colors.textSecondary,
                      }}
                    >
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
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: fonts.regular,
                      color: colors.textSecondary,
                    }}
                  >
                    Seleziona {formationSpec.DEF} difensori ({defs.length}/
                    {formationSpec.DEF})
                  </Text>

                  {rosterByRole.d.map((p) => {
                    const selected = defs.some((x) => x.id === p.id);
                    const disabled =
                      !selected && defs.length >= formationSpec.DEF;
                    return (
                      <PlayerPick
                        key={p.id}
                        player={p}
                        selected={selected}
                        disabled={disabled}
                        onPress={() => {
                          setDefs((prev) => {
                            if (selected)
                              return prev.filter((x) => x.id !== p.id);
                            if (prev.length >= formationSpec.DEF) return prev;
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
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: fonts.regular,
                      color: colors.textSecondary,
                    }}
                  >
                    Seleziona {formationSpec.MID} centrocampisti ({mids.length}/
                    {formationSpec.MID})
                  </Text>

                  {rosterByRole.m.map((p) => {
                    const selected = mids.some((x) => x.id === p.id);
                    const disabled =
                      !selected && mids.length >= formationSpec.MID;
                    return (
                      <PlayerPick
                        key={p.id}
                        player={p}
                        selected={selected}
                        disabled={disabled}
                        onPress={() => {
                          setMids((prev) => {
                            if (selected)
                              return prev.filter((x) => x.id !== p.id);
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
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: fonts.regular,
                      color: colors.textSecondary,
                    }}
                  >
                    Seleziona {formationSpec.FWD} attaccanti ({fwds.length}/
                    {formationSpec.FWD})
                  </Text>

                  {rosterByRole.f.map((p) => {
                    const selected = fwds.some((x) => x.id === p.id);
                    const disabled =
                      !selected && fwds.length >= formationSpec.FWD;
                    return (
                      <PlayerPick
                        key={p.id}
                        player={p}
                        selected={selected}
                        disabled={disabled}
                        onPress={() => {
                          setFwds((prev) => {
                            if (selected)
                              return prev.filter((x) => x.id !== p.id);
                            if (prev.length >= formationSpec.FWD) return prev;
                            return [...prev, p];
                          });
                        }}
                      />
                    );
                  })}
                </View>
              ) : null}

              {step === "BENCH" ? (
                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: fonts.regular,
                      color: colors.textSecondary,
                    }}
                  >
                    Seleziona {benchSize} giocatori in panchina ({bench.length}/
                    {benchSize})
                  </Text>

                  {remainingForBench.map((p) => {
                    const selected = bench.some((x) => x.id === p.id);
                    const disabled = !selected && bench.length >= benchSize;
                    return (
                      <PlayerPick
                        key={p.id}
                        player={p}
                        selected={selected}
                        disabled={disabled}
                        onPress={() => {
                          setBench((prev) => {
                            if (selected)
                              return prev.filter((x) => x.id !== p.id);
                            if (prev.length >= benchSize) return prev;
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
                  <View style={[styles.box, { borderColor: colors.secondary }]}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.semibold,
                        color: colors.text,
                      }}
                    >
                      Modulo: {formation ?? "—"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.regular,
                        color: colors.textSecondary,
                        marginTop: 12,
                      }}
                    >
                      Portiere: {gk?.cached_display_name ?? "—"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.regular,
                        color: colors.textSecondary,
                        marginTop: 8,
                      }}
                    >
                      Difensori:{" "}
                      {defs
                        .map((x) => x.cached_display_name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.regular,
                        color: colors.textSecondary,
                        marginTop: 8,
                      }}
                    >
                      Centrocampisti:{" "}
                      {mids
                        .map((x) => x.cached_display_name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.regular,
                        color: colors.textSecondary,
                        marginTop: 8,
                      }}
                    >
                      Attaccanti:{" "}
                      {fwds
                        .map((x) => x.cached_display_name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.semibold,
                        color: colors.text,
                        marginTop: 12,
                      }}
                    >
                      Panchina ({bench.length}/{benchSize})
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.regular,
                        color: colors.textSecondary,
                        marginTop: 8,
                      }}
                    >
                      {bench
                        .map((x) => x.cached_display_name)
                        .filter(Boolean)
                        .join(", ") || "—"}
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
                    backgroundColor: canProceed()
                      ? colors.success
                      : colors.secondary,
                    opacity: canProceed() ? 1 : 0.6,
                    alignItems: "center",
                  }}
                  disabled={!canProceed()}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: fonts.bold,
                      color: colors.primary,
                    }}
                  >
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
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.bold,
                        color: colors.primary,
                      }}
                    >
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
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: fonts.semibold,
                      color: colors.text,
                    }}
                  >
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
