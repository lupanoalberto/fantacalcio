import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

type CanonicalRole = "Portiere" | "Difensore" | "Centrocampista" | "Attaccante";
type Step = "MODULO" | "POR" | "DIF" | "CEN" | "ATT" | "PAN";
type ModuleKey =
  | "3-4-3"
  | "3-5-2"
  | "4-3-3"
  | "4-4-2"
  | "4-5-1"
  | "5-3-2"
  | "5-4-1";

type ModuleSpec = {
  key: ModuleKey;
  dif: number;
  cen: number;
  att: number;
};

const MODULES: ModuleSpec[] = [
  { key: "3-4-3", dif: 3, cen: 4, att: 3 },
  { key: "3-5-2", dif: 3, cen: 5, att: 2 },
  { key: "4-3-3", dif: 4, cen: 3, att: 3 },
  { key: "4-4-2", dif: 4, cen: 4, att: 2 },
  { key: "4-5-1", dif: 4, cen: 5, att: 1 },
  { key: "5-3-2", dif: 5, cen: 3, att: 2 },
  { key: "5-4-1", dif: 5, cen: 4, att: 1 },
];

const AVATAR_FALLBACK =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

/**
 * ✅ ADATTA SOLO SE NECESSARIO (nomi colonne)
 *
 * rosters:
 * - id (uuid)
 * - team_id (uuid)
 * - player_id (number/string)   // id API-Football o interno
 * - name (text)
 * - role (text)                 // "Portiere" | "Difensore" | ...
 * - photo (text)                // url
 * - team_name (text)
 * - team_crest (text)
 *
 * lineups:
 * - id (uuid)
 * - league_id (uuid)
 * - team_id (uuid)
 * - matchday (int)
 * - module (text)
 * - created_at / updated_at
 *
 * lineup_players:
 * - id (uuid)
 * - lineup_id (uuid)
 * - roster_id (uuid)            // FK rosters.id (consigliato)
 * - is_starting (bool)
 * - role (text)
 * - slot_index (int)
 */

const REQUIRED_ROSTER_TOTAL = 25;
const REQUIRED_BY_ROLE: Record<CanonicalRole, number> = {
  Portiere: 3,
  Difensore: 8,
  Centrocampista: 8,
  Attaccante: 6,
};

function mapRole(position?: string): CanonicalRole | null {
  if (!position) return null;
  const p = position.toLowerCase().trim();

  if (
    p.includes("goalkeeper") ||
    p.includes("keeper") ||
    p === "gk" ||
    p.includes("portiere")
  )
    return "Portiere";

  if (
    p.includes("defender") ||
    p.includes("back") ||
    p.includes("centre-back") ||
    p.includes("center-back") ||
    p.includes("fullback") ||
    p.includes("difens")
  )
    return "Difensore";

  if (
    p.includes("midfielder") ||
    p.includes("midfield") ||
    p.includes("winger") ||
    p.includes("wide") ||
    p.includes("centrocamp")
  )
    return "Centrocampista";

  if (
    p.includes("forward") ||
    p.includes("striker") ||
    p.includes("attacker") ||
    p.includes("second striker") ||
    p.includes("wing") ||
    p.includes("attacc")
  )
    return "Attaccante";

  return null;
}

function roleShort(r: CanonicalRole) {
  if (r === "Portiere") return "POR";
  if (r === "Difensore") return "DIF";
  if (r === "Centrocampista") return "CEN";
  return "ATT";
}

function roleFromStep(step: Step): CanonicalRole | null {
  if (step === "POR") return "Portiere";
  if (step === "DIF") return "Difensore";
  if (step === "CEN") return "Centrocampista";
  if (step === "ATT") return "Attaccante";
  return null;
}

type RosterPlayer = {
  rosterId: string; // rosters.id
  playerId: string; // rosters.player_id (api or internal)
  name: string;
  role: CanonicalRole;
  photo?: string | null;
  teamName?: string | null;
  teamCrest?: string | null;
};

function CardRow({ left, right, colors, fonts }: any) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: colors.secondary,
      }}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontFamily: fonts.regular,
          fontSize: 10,
        }}
      >
        {left}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.semibold,
          fontSize: 12,
        }}
      >
        {right}
      </Text>
    </View>
  );
}

function PlayerItem({
  p,
  selectedState,
  disabled,
  onPress,
  colors,
  fonts,
}: {
  p: RosterPlayer;
  selectedState: boolean;
  disabled: boolean;
  onPress: () => void;
  colors: any;
  fonts: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderBottomWidth: 1,
        borderColor: colors.secondary,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Image
          source={{ uri: p.photo || AVATAR_FALLBACK }}
          style={{ width: 40, height: 40, borderRadius: 8 }}
        />
        <View style={{ gap: 2 }}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
          >
            {p.name}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 10,
            }}
          >
            {roleShort(p.role)} · {p.teamName ?? "—"}
          </Text>
        </View>
      </View>

      <View
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 8,
          backgroundColor: selectedState ? colors.success : colors.secondary,
        }}
      >
        <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 10 }}>
          {selectedState ? "Selezionato" : "Seleziona"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function LineupWizardScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const leagueId = (params.leagueId as string) || null;
  const matchday = params.matchday ? Number(params.matchday) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [teamId, setTeamId] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);

  const [step, setStep] = useState<Step>("MODULO");
  const [module, setModule] = useState<ModuleSpec | null>(null);

  const [selected, setSelected] = useState<{
    POR: string[]; // rosterId
    DIF: string[];
    CEN: string[];
    ATT: string[];
  }>({ POR: [], DIF: [], CEN: [], ATT: [] });

  const [bench, setBench] = useState<string[]>([]); // rosterId

  const rosterCounts = useMemo(() => {
    const counts: Record<CanonicalRole, number> = {
      Portiere: 0,
      Difensore: 0,
      Centrocampista: 0,
      Attaccante: 0,
    };
    roster.forEach((p) => (counts[p.role] += 1));
    return counts;
  }, [roster]);

  const rosterIsComplete = useMemo(() => {
    if (roster.length < REQUIRED_ROSTER_TOTAL) return false;
    for (const r of Object.keys(REQUIRED_BY_ROLE) as CanonicalRole[]) {
      if (rosterCounts[r] < REQUIRED_BY_ROLE[r]) return false;
    }
    return true;
  }, [roster.length, rosterCounts]);

  const startersAll = useMemo(() => {
    return new Set([...selected.POR, ...selected.DIF, ...selected.CEN, ...selected.ATT]);
  }, [selected]);

  const remainingForBench = useMemo(() => {
    const used = new Set([...startersAll]);
    return roster.filter((p) => !used.has(p.rosterId));
  }, [roster, startersAll]);

  const stepTitle = useMemo(() => {
    if (step === "MODULO") return "Scegli modulo";
    if (step === "POR") return "Scegli portiere";
    if (step === "DIF") return "Scegli difensori";
    if (step === "CEN") return "Scegli centrocampisti";
    if (step === "ATT") return "Scegli attaccanti";
    return "Scegli panchina";
  }, [step]);

  const roleLimit = useMemo(() => {
    if (!module) return null;
    if (step === "POR") return 1;
    if (step === "DIF") return module.dif;
    if (step === "CEN") return module.cen;
    if (step === "ATT") return module.att;
    return null;
  }, [module, step]);

  const canProceed = useMemo(() => {
    if (step === "MODULO") return !!module;
    if (!module) return false;
    if (step === "POR") return selected.POR.length === 1;
    if (step === "DIF") return selected.DIF.length === module.dif;
    if (step === "CEN") return selected.CEN.length === module.cen;
    if (step === "ATT") return selected.ATT.length === module.att;
    if (step === "PAN") return bench.length >= 1;
    return false;
  }, [step, module, selected, bench]);

  const currentPool = useMemo(() => {
    if (step === "MODULO") return [];
    if (step === "PAN") return remainingForBench;

    const role = roleFromStep(step);
    if (!role) return [];

    return roster.filter((p) => p.role === role);
  }, [step, roster, remainingForBench]);

  async function loadTeamAndRoster() {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) throw new Error("Utente non autenticato.");
    if (!leagueId) throw new Error("leagueId mancante.");

    // 1) team dell’utente nella lega
    const ut = await supabase
      .from("user_team")
      .select("team_id")
      .eq("league_id", leagueId)
      .eq("user_id", userId)
      .maybeSingle();

    if (ut.error) throw ut.error;
    if (!ut.data?.team_id) throw new Error("Team non trovato per questa lega.");
    const tId = String(ut.data.team_id);
    setTeamId(tId);

    // 2) rosa
    const r = await supabase
      .from("rosters")
      .select("id, player_id, name, role, photo, team_name, team_crest")
      .eq("team_id", tId);

    if (r.error) throw r.error;

    const rows = (r.data ?? []) as any[];

    const mapped: RosterPlayer[] = rows
      .map((x) => {
        const rosterId = x.id ? String(x.id) : null;
        const playerId = x.player_id != null ? String(x.player_id) : rosterId;
        const name = x.name ? String(x.name) : null;

        // role può già essere canonico, altrimenti provo a mapRole
        const role: CanonicalRole | null =
          (x.role as CanonicalRole) ?? mapRole(x.position) ?? null;

        if (!rosterId || !name || !role) return null;

        return {
          rosterId,
          playerId: playerId ?? rosterId,
          name,
          role,
          photo: x.photo ?? null,
          teamName: x.team_name ?? null,
          teamCrest: x.team_crest ?? null,
        } satisfies RosterPlayer;
      })
      .filter(Boolean);

    const order: Record<CanonicalRole, number> = {
      Portiere: 1,
      Difensore: 2,
      Centrocampista: 3,
      Attaccante: 4,
    };
    mapped.sort((a, b) => {
      const d = order[a.role] - order[b.role];
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    });

    setRoster(mapped);
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await loadTeamAndRoster();
      } catch (e: any) {
        console.error("❌ loadTeamAndRoster error:", e);
        Alert.alert("Errore", e?.message ?? "Errore caricamento");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [leagueId]);

  function toggleStarter(rosterId: string, role: CanonicalRole) {
    const key = roleShort(role) as "POR" | "DIF" | "CEN" | "ATT";
    const curr = selected[key];
    const already = curr.includes(rosterId);

    const limit = (() => {
      if (!module) return 0;
      if (key === "POR") return 1;
      if (key === "DIF") return module.dif;
      if (key === "CEN") return module.cen;
      return module.att;
    })();

    const usedElsewhere = startersAll.has(rosterId) && !already;
    if (usedElsewhere) return;

    if (already) {
      setSelected((s) => ({ ...s, [key]: s[key].filter((x) => x !== rosterId) }));
      return;
    }

    if (curr.length >= limit) return;

    setSelected((s) => ({ ...s, [key]: [...s[key], rosterId] }));
  }

  function toggleBench(rosterId: string) {
    if (startersAll.has(rosterId)) return;

    setBench((b) => {
      const has = b.includes(rosterId);
      if (has) return b.filter((x) => x !== rosterId);
      return [...b, rosterId];
    });
  }

  function nextStep() {
    if (!canProceed) return;
    if (step === "MODULO") setStep("POR");
    else if (step === "POR") setStep("DIF");
    else if (step === "DIF") setStep("CEN");
    else if (step === "CEN") setStep("ATT");
    else if (step === "ATT") setStep("PAN");
  }

  function prevStep() {
    if (step === "MODULO") return;
    if (step === "POR") setStep("MODULO");
    else if (step === "DIF") setStep("POR");
    else if (step === "CEN") setStep("DIF");
    else if (step === "ATT") setStep("CEN");
    else if (step === "PAN") setStep("ATT");
  }

  async function saveLineup() {
    if (!teamId || !leagueId || !matchday) {
      Alert.alert("Errore", "leagueId, teamId o matchday mancanti.");
      return;
    }
    if (!module) {
      Alert.alert("Modulo", "Seleziona un modulo.");
      return;
    }

    const starters = [...selected.POR, ...selected.DIF, ...selected.CEN, ...selected.ATT];

    if (starters.length !== 11) {
      Alert.alert("Formazione incompleta", "Devi selezionare 11 titolari.");
      return;
    }

    if (selected.POR.length !== 1) {
      Alert.alert("Portiere", "Devi selezionare 1 portiere titolare.");
      return;
    }
    if (selected.DIF.length !== module.dif) {
      Alert.alert("Difensori", `Devi selezionare ${module.dif} difensori.`);
      return;
    }
    if (selected.CEN.length !== module.cen) {
      Alert.alert("Centrocampisti", `Devi selezionare ${module.cen} centrocampisti.`);
      return;
    }
    if (selected.ATT.length !== module.att) {
      Alert.alert("Attaccanti", `Devi selezionare ${module.att} attaccanti.`);
      return;
    }

    if (bench.length < 1) {
      Alert.alert("Panchina", "Seleziona almeno un giocatore in panchina.");
      return;
    }

    try {
      setSaving(true);

      // 1) upsert lineup
      // ⚠️ serve una UNIQUE su (league_id, team_id, matchday)
      const up = await supabase
        .from("lineups")
        .upsert(
          {
            league_id: leagueId,
            team_id: teamId,
            matchday,
            module: module.key,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "league_id,team_id,matchday" },
        )
        .select("id")
        .single();

      if (up.error) throw up.error;
      const lineupId = up.data?.id;
      if (!lineupId) throw new Error("Impossibile ottenere lineupId.");

      // 2) replace lineup_players
      const del = await supabase.from("lineup_players").delete().eq("lineup_id", lineupId);
      if (del.error) throw del.error;

      const payload: any[] = [];

      const pushRole = (ids: string[], role: CanonicalRole, baseIndex: number) => {
        ids.forEach((rid, i) => {
          payload.push({
            lineup_id: lineupId,
            roster_id: rid,
            is_starting: true,
            role,
            slot_index: baseIndex + i,
          });
        });
      };

      pushRole(selected.POR, "Portiere", 0);
      pushRole(selected.DIF, "Difensore", 10);
      pushRole(selected.CEN, "Centrocampista", 20);
      pushRole(selected.ATT, "Attaccante", 30);

      bench.forEach((rid, i) => {
        const p = roster.find((x) => x.rosterId === rid);
        payload.push({
          lineup_id: lineupId,
          roster_id: rid,
          is_starting: false,
          role: p?.role ?? null,
          slot_index: 100 + i,
        });
      });

      const ins = await supabase.from("lineup_players").insert(payload);
      if (ins.error) throw ins.error;

      Alert.alert("Salvata", "Formazione salvata con successo.");
      router.back();
    } catch (e: any) {
      console.error("❌ saveLineup error:", e);
      Alert.alert("Errore", e?.message ?? "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      {/* HEADER */}
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          paddingTop: insets.top + 12,
          paddingHorizontal: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/"))}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 14 }}>
          Formazione · {matchday ? `Giornata ${matchday}` : "—"}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24, gap: 12 }}>
          {/* STATO ROSA */}
          <View style={{ marginHorizontal: 12, borderRadius: 8, overflow: "hidden" }}>
            <View style={{ backgroundColor: colors.primary, padding: 12 }}>
              <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                Stato rosa
              </Text>
              <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 10 }}>
                Devi avere la rosa completa per inserire la formazione.
              </Text>
            </View>

            <View style={{ backgroundColor: colors.background }}>
              <CardRow
                left="Totale giocatori"
                right={`${roster.length}/${REQUIRED_ROSTER_TOTAL}`}
                colors={colors}
                fonts={fonts}
              />
              <CardRow
                left="Portieri"
                right={`${rosterCounts.Portiere}/${REQUIRED_BY_ROLE.Portiere}`}
                colors={colors}
                fonts={fonts}
              />
              <CardRow
                left="Difensori"
                right={`${rosterCounts.Difensore}/${REQUIRED_BY_ROLE.Difensore}`}
                colors={colors}
                fonts={fonts}
              />
              <CardRow
                left="Centrocampisti"
                right={`${rosterCounts.Centrocampista}/${REQUIRED_BY_ROLE.Centrocampista}`}
                colors={colors}
                fonts={fonts}
              />
              <CardRow
                left="Attaccanti"
                right={`${rosterCounts.Attaccante}/${REQUIRED_BY_ROLE.Attaccante}`}
                colors={colors}
                fonts={fonts}
              />

              {!rosterIsComplete ? (
                <View style={{ padding: 12 }}>
                  <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                    Rosa incompleta
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontFamily: fonts.regular,
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    Completa l’asta/acquisti prima di poter inserire la formazione.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* WIZARD */}
          <View style={{ marginHorizontal: 12, borderRadius: 8, overflow: "hidden" }}>
            <View style={{ backgroundColor: colors.primary, padding: 12, gap: 4 }}>
              <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                {stepTitle}
              </Text>

              {step !== "MODULO" && step !== "PAN" && roleLimit != null ? (
                <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 10 }}>
                  Seleziona {roleLimit} · Scelti:{" "}
                  {step === "POR"
                    ? selected.POR.length
                    : step === "DIF"
                      ? selected.DIF.length
                      : step === "CEN"
                        ? selected.CEN.length
                        : selected.ATT.length}
                </Text>
              ) : null}

              {step === "PAN" ? (
                <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 10 }}>
                  Panchina: scegli tra i rimanenti · Selezionati: {bench.length}
                </Text>
              ) : null}

              {module ? (
                <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 10 }}>
                  Modulo: {module.key}
                </Text>
              ) : null}
            </View>

            <View style={{ backgroundColor: colors.background }}>
              {!rosterIsComplete ? (
                <View style={{ padding: 12 }}>
                  <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                    Non puoi procedere
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontFamily: fonts.regular,
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    La lineup è bloccata finché la rosa non è completa.
                  </Text>
                </View>
              ) : step === "MODULO" ? (
                <View style={{ paddingBottom: 8 }}>
                  {MODULES.map((m) => {
                    const active = module?.key === m.key;
                    return (
                      <TouchableOpacity
                        key={m.key}
                        onPress={() => {
                          setModule(m);
                          setSelected({ POR: [], DIF: [], CEN: [], ATT: [] });
                          setBench([]);
                        }}
                        style={{
                          padding: 12,
                          borderBottomWidth: 1,
                          borderColor: colors.secondary,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                          {m.key}
                        </Text>
                        <View
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                            backgroundColor: active ? colors.success : colors.secondary,
                          }}
                        >
                          <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 10 }}>
                            {active ? "Selezionato" : "Scegli"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View>
                  {currentPool.map((p) => {
                    const isStarter = startersAll.has(p.rosterId);
                    const isBench = bench.includes(p.rosterId);

                    const currentRole = roleFromStep(step);
                    const selectingRoleKey =
                      currentRole ? (roleShort(currentRole) as "POR" | "DIF" | "CEN" | "ATT") : null;

                    let disabled = false;

                    if (step === "PAN") {
                      disabled = isStarter;
                    } else if (selectingRoleKey) {
                      const alreadyInThis = selected[selectingRoleKey].includes(p.rosterId);

                      if (isStarter && !alreadyInThis) disabled = true;

                      const limit =
                        selectingRoleKey === "POR"
                          ? 1
                          : selectingRoleKey === "DIF"
                            ? module?.dif ?? 0
                            : selectingRoleKey === "CEN"
                              ? module?.cen ?? 0
                              : module?.att ?? 0;

                      if (!alreadyInThis && selected[selectingRoleKey].length >= limit) disabled = true;
                    }

                    const selectedState = step === "PAN" ? isBench : isStarter;

                    return (
                      <PlayerItem
                        key={p.rosterId}
                        p={p}
                        selectedState={selectedState}
                        disabled={disabled}
                        onPress={() => {
                          if (step === "PAN") toggleBench(p.rosterId);
                          else {
                            const rr = roleFromStep(step);
                            if (!rr) return;
                            toggleStarter(p.rosterId, rr);
                          }
                        }}
                        colors={colors}
                        fonts={fonts}
                      />
                    );
                  })}

                  {currentPool.length === 0 ? (
                    <View style={{ padding: 12 }}>
                      <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 12 }}>
                        Nessun giocatore disponibile per questo step.
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </View>

          {/* ACTIONS */}
          <View style={{ marginHorizontal: 12, gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={prevStep}
                disabled={step === "MODULO" || saving}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.secondary,
                  opacity: step === "MODULO" || saving ? 0.5 : 1,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                  Indietro
                </Text>
              </TouchableOpacity>

              {step !== "PAN" ? (
                <TouchableOpacity
                  onPress={nextStep}
                  disabled={!rosterIsComplete || !canProceed || saving}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: colors.success,
                    opacity: !rosterIsComplete || !canProceed || saving ? 0.5 : 1,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                    Avanti
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={saveLineup}
                  disabled={!rosterIsComplete || !canProceed || saving}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: colors.success,
                    opacity: !rosterIsComplete || !canProceed || saving ? 0.5 : 1,
                    alignItems: "center",
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                      Salva formazione
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* RIEPILOGO */}
            <View style={{ borderRadius: 8, overflow: "hidden" }}>
              <View style={{ backgroundColor: colors.primary, padding: 12 }}>
                <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                  Riepilogo
                </Text>
              </View>
              <View style={{ backgroundColor: colors.background }}>
                <CardRow left="POR" right={`${selected.POR.length}/1`} colors={colors} fonts={fonts} />
                <CardRow
                  left="DIF"
                  right={`${selected.DIF.length}/${module?.dif ?? 0}`}
                  colors={colors}
                  fonts={fonts}
                />
                <CardRow
                  left="CEN"
                  right={`${selected.CEN.length}/${module?.cen ?? 0}`}
                  colors={colors}
                  fonts={fonts}
                />
                <CardRow
                  left="ATT"
                  right={`${selected.ATT.length}/${module?.att ?? 0}`}
                  colors={colors}
                  fonts={fonts}
                />
                <CardRow left="Panchina" right={`${bench.length}`} colors={colors} fonts={fonts} />
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
