import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getDefaultSeasonYear } from "@/services/footballApi";
import Header from "@/components/Header";
import { useTheme } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Mode = "CLASSICO" | "MANTRA";
type ModType = "MOD_DIFESA";

// 🔧 Mappa campionato -> api_league_id
const LEAGUE_ID_MAP: Record<string, number> = {
  "serie a": 135,
  "premier league": 39,
  laliga: 140,
  bundesliga: 78,
  "ligue 1": 61,
};

function normalizeLeagueKey(value?: string) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function toNumberOr(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export default function CreateLeagueScreen() {
  const params = useLocalSearchParams<{ apiLeagueId?: string }>();
  const selectedLeague = params.apiLeagueId;
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();

  const season =
    typeof getDefaultSeasonYear === "function"
      ? getDefaultSeasonYear()
      : new Date().getFullYear();

  // ✅ campi “prima squadra poi lega”
  const [teamName, setTeamName] = useState("La mia squadra");
  const [leagueName, setLeagueName] = useState("");

  // ✅ modalità
  const [mode, setMode] = useState<Mode>("CLASSICO");
  // ✅ modificatore difesa
  const [modEnabled, setModEnabled] = useState(false);
  const [modType, setModType] = useState<ModType>("MOD_DIFESA");

  // ✅ regole base
  const [budget, setBudget] = useState("500");
  const [rosterSize, setRosterSize] = useState("25");
  const [maxPerRealTeam, setMaxPerRealTeam] = useState("3");
  const [minMinutesForVote, setMinMinutesForVote] = useState("15");

  // ✅ quote per ruolo (devono sommare a rosterSize)
  const [quotaP, setQuotaP] = useState("3");
  const [quotaD, setQuotaD] = useState("8");
  const [quotaC, setQuotaC] = useState("8");
  const [quotaA, setQuotaA] = useState("6");

  // ✅ punteggi modificabili (base)
  const [ptsGoal, setPtsGoal] = useState("3");
  const [ptsAssist, setPtsAssist] = useState("1");
  const [ptsYellow, setPtsYellow] = useState("-0.5");
  const [ptsRed, setPtsRed] = useState("-1");
  const [ptsOwnGoal, setPtsOwnGoal] = useState("-2");
  const [ptsGkConceded, setPtsGkConceded] = useState("-1");
  const [ptsGkClean, setPtsGkClean] = useState("1");
  const [ptsPenScored, setPtsPenScored] = useState("3");
  const [ptsPenMissed, setPtsPenMissed] = useState("-3");
  const [ptsPenSaved, setPtsPenSaved] = useState("3");

  // ✅ speciali (modificabili)
  const [ptsCaptain, setPtsCaptain] = useState("0.5");
  const [ptsWoodwork, setPtsWoodwork] = useState("0.5");
  const [ptsPenWon, setPtsPenWon] = useState("0.5");
  const [ptsPenConceded, setPtsPenConceded] = useState("-0.5");
  const [ptsSubGoalExtra, setPtsSubGoalExtra] = useState("0.5");
  const [ptsVarDisallowed, setPtsVarDisallowed] = useState("-0.5");
  const [ptsWinningGoal, setPtsWinningGoal] = useState("0.5");

  // ✅ toggle speciali (abilitati di default, ora disattivabili)
  const [enCaptain, setEnCaptain] = useState(true);
  const [enWoodwork, setEnWoodwork] = useState(true);
  const [enPenWon, setEnPenWon] = useState(true);
  const [enPenConceded, setEnPenConceded] = useState(true);
  const [enSubGoalExtra, setEnSubGoalExtra] = useState(true);
  const [enVarDisallowed, setEnVarDisallowed] = useState(true);
  const [enWinningGoal, setEnWinningGoal] = useState(true);
  // 1) STATE (aggiungi vicino agli altri state della sezione join)
  const [joinTeamName, setJoinTeamName] = useState("La mia squadra");

  // ✅ join league
  const [joinLeagueCode, setJoinLeagueCode] = useState("");
  const [joining, setJoining] = useState(false);

  const [loading, setLoading] = useState(false);

  const computed = useMemo(() => {
    const b = clampInt(toNumberOr(budget, 500), 1, 99999);
    const r = clampInt(toNumberOr(rosterSize, 25), 1, 60);
    const mprt = clampInt(toNumberOr(maxPerRealTeam, 3), 1, 99);
    const mm = clampInt(toNumberOr(minMinutesForVote, 15), 0, 120);

    const qp = clampInt(toNumberOr(quotaP, 3), 0, 60);
    const qd = clampInt(toNumberOr(quotaD, 8), 0, 60);
    const qc = clampInt(toNumberOr(quotaC, 8), 0, 60);
    const qa = clampInt(toNumberOr(quotaA, 6), 0, 60);

    const quotaSum = qp + qd + qc + qa;

    return {
      budget: b,
      rosterSize: r,
      maxPerRealTeam: mprt,
      minMinutes: mm,
      quotas: { P: qp, D: qd, C: qc, A: qa },
      quotaSum,
    };
  }, [
    budget,
    rosterSize,
    maxPerRealTeam,
    minMinutesForVote,
    quotaP,
    quotaD,
    quotaC,
    quotaA,
  ]);

  async function onJoinLeague() {
    const code = joinLeagueCode.trim();
    if (!code) {
      Alert.alert("Codice lega", "Inserisci il codice ID della lega.");
      return;
    }

    const leagueId = Number(code);
    if (!Number.isFinite(leagueId) || leagueId <= 0) {
      Alert.alert(
        "Codice lega",
        "Il codice deve essere un numero valido (es: 123).",
      );
      return;
    }

    // 3) onJoinLeague: validazione + invio al RPC (aggiungi/modifica dentro onJoinLeague)
    const tJoinTeam = joinTeamName.trim();
    if (tJoinTeam.length < 2) {
      Alert.alert(
        "Nome squadra",
        "Inserisci un nome squadra di almeno 2 caratteri.",
      );
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.user?.id) {
      Alert.alert(
        "Login richiesto",
        "Devi essere loggato per unirti ad una lega.",
      );
      router.push("/(auth)/login");
      return;
    }

    setJoining(true);

    // ✅ Tentativo: RPC che inserisce l'utente tra i membri (da creare lato Supabase se non esiste)
    // Atteso: ritorna league_id o un oggetto con league_id
    // ...e nella chiamata RPC passa anche il nome squadra:
    const { data, error } = await supabase.rpc("join_league_by_id", {
      p_league_id: leagueId,
      p_team_name: tJoinTeam,
    });

    setJoining(false);

    if (error) {
      Alert.alert("Errore", error.message);
      return;
    }

    const joinedLeagueId =
      (Array.isArray(data) ? data[0]?.league_id : data?.league_id) ?? leagueId;

    Alert.alert("Ok!", "Sei entrato nella lega.");
    router.replace(`/leagues/${joinedLeagueId}`);
  }

  async function onCreate() {
    const tTeam = teamName.trim();
    if (tTeam.length < 2) {
      Alert.alert(
        "Nome squadra",
        "Inserisci un nome squadra di almeno 2 caratteri.",
      );
      return;
    }

    const tLeague = leagueName.trim();
    if (tLeague.length < 3) {
      Alert.alert("Nome lega", "Inserisci un nome lega di almeno 3 caratteri.");
      return;
    }

    if (!selectedLeague) {
      Alert.alert(
        "Campionato mancante",
        "Non ho trovato il campionato. Torna alla pagina del campionato e riprova.",
      );
      return;
    }

    // ✅ CONVERSIONE SOLO QUI (selectedLeague -> apiLeagueId)
    let apiLeagueId: number | null = null;
    const numeric = Number(selectedLeague);
    if (!Number.isNaN(numeric) && numeric > 0) {
      apiLeagueId = numeric;
    } else {
      const key = normalizeLeagueKey(selectedLeague);
      apiLeagueId = LEAGUE_ID_MAP[key] ?? null;
    }

    if (!apiLeagueId) {
      Alert.alert(
        "Campionato non valido",
        `Impossibile convertire "${selectedLeague}" in un id di campionato valido.`,
      );
      return;
    }

    // ✅ validazione quote ruoli
    if (computed.quotaSum !== computed.rosterSize) {
      Alert.alert(
        "Quote ruoli non valide",
        `La somma quote (P+D+C+A = ${computed.quotaSum}) deve essere uguale alla dimensione rosa (${computed.rosterSize}).`,
      );
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.user?.id) {
      Alert.alert(
        "Login richiesto",
        "Devi essere loggato per creare una lega.",
      );
      router.push("/(auth)/login");
      return;
    }

    // ✅ scoring_json costruito con i valori scelti
    // Nota: speciali ora disattivabili -> enabled=false e value=0 per robustezza server-side
    const scoring_json = {
      rules: {
        min_minutes_for_vote: computed.minMinutes,
        roster_size: computed.rosterSize,
        budget: computed.budget,
        max_players_per_real_team: computed.maxPerRealTeam,
        role_quotas: computed.quotas, // {P,D,C,A}
      },
      events: {
        goal: { value: toNumberOr(ptsGoal, 3), enabled: true },
        assist: { value: toNumberOr(ptsAssist, 1), enabled: true },
        yellow: { value: toNumberOr(ptsYellow, -0.5), enabled: true },
        red: { value: toNumberOr(ptsRed, -1), enabled: true },
        own_goal: { value: toNumberOr(ptsOwnGoal, -2), enabled: true },
        goal_conceded_gk: {
          value: toNumberOr(ptsGkConceded, -1),
          enabled: true,
        },
        clean_sheet_gk: { value: toNumberOr(ptsGkClean, 1), enabled: true },
        penalty_scored: { value: toNumberOr(ptsPenScored, 3), enabled: true },
        penalty_missed: { value: toNumberOr(ptsPenMissed, -3), enabled: true },
        penalty_saved: { value: toNumberOr(ptsPenSaved, 3), enabled: true },
      },
      special: {
        captain_bonus: {
          value: enCaptain ? toNumberOr(ptsCaptain, 0.5) : 0,
          enabled: enCaptain,
          requires_vote: true,
        },
        woodwork: {
          value: enWoodwork ? toNumberOr(ptsWoodwork, 0.5) : 0,
          enabled: enWoodwork,
        },
        penalty_won: {
          value: enPenWon ? toNumberOr(ptsPenWon, 0.5) : 0,
          enabled: enPenWon,
        },
        penalty_conceded: {
          value: enPenConceded ? toNumberOr(ptsPenConceded, -0.5) : 0,
          enabled: enPenConceded,
        },
        sub_goal_extra: {
          value: enSubGoalExtra ? toNumberOr(ptsSubGoalExtra, 0.5) : 0,
          enabled: enSubGoalExtra,
        },
        var_disallowed_goal: {
          value: enVarDisallowed ? toNumberOr(ptsVarDisallowed, -0.5) : 0,
          enabled: enVarDisallowed,
        },
        winning_goal: {
          value: enWinningGoal ? toNumberOr(ptsWinningGoal, 0.5) : 0,
          enabled: enWinningGoal,
        },
      },
      interpretation: { treat_penalty_goal_as_goal_event: false },
      goals: { base: 66, step: 6 },
    };

    setLoading(true);

    const { data, error } = await supabase.rpc(
      "create_league_with_owner_team",
      {
        p_name: tLeague,
        p_mode: mode,
        p_api_league_id: apiLeagueId,
        p_season: season,
        p_scoring_json: scoring_json,
        p_budget: computed.budget,
        p_roster_size: computed.rosterSize,
        p_max_players_per_real_team: computed.maxPerRealTeam,
        p_team_name: tTeam,
        p_mod_enabled: modEnabled,
        p_mod_type: modEnabled ? modType : null,
      },
    );

    setLoading(false);

    if (error) {
      Alert.alert("Errore creazione lega", error.message);
      return;
    }

    const created = Array.isArray(data) ? data[0] : data;
    if (!created?.league_id) {
      Alert.alert(
        "Errore creazione lega",
        "Risposta non valida dal server (league_id mancante).",
      );
      return;
    }

    router.replace(`/leagues/${created.league_id}`);
  }

  // UI helpers
  const Field = ({
    label,
    value,
    onChangeText,
    placeholder,
    disabled,
    keyboardType,
  }: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    disabled?: boolean;
    keyboardType?: "default" | "numeric";
  }) => (
    <View style={{ opacity: disabled ? 0.45 : 1 }}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.primary, fontFamily: fonts.semibold },
        ]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        keyboardType={keyboardType ?? "default"}
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 8,
          borderColor: colors.primary,
          marginTop: 4,
          fontFamily: fonts.regular,
          color: colors.primary,
          fontSize: 12,
        }}
      />
    </View>
  );

  const SpecialRow = ({
    label,
    enabled,
    onToggle,
    value,
    onChangeText,
    hint,
  }: {
    label: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
    value: string;
    onChangeText: (t: string) => void;
    hint?: string;
  }) => (
    <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.primary, fontFamily: fonts.semibold },
            ]}
          >
            {label}
          </Text>
          {hint ? (
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.secondary,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                },
              ]}
            >
              {hint}
            </Text>
          ) : null}
        </View>
        <Switch value={enabled} onValueChange={onToggle} />
      </View>

      <Field
        label="Valore"
        value={value}
        onChangeText={onChangeText}
        disabled={!enabled}
        keyboardType="default"
      />
    </View>
  );

  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom }}>
      <ScrollView style={{ flex: 1 }}>
        {/* ✅ JOIN LEAGUE (prima della creazione) */}
        <View
          style={{ borderWidth: 1, borderRadius: 16, padding: 16, margin: 16 }}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.primary, fontFamily: fonts.semibold },
            ]}
          >
            Unisciti ad una lega
          </Text>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.primary,
                fontFamily: fonts.regular,
                fontSize: 10,
              },
            ]}
          >
            Inserisci l&apos;ID della lega (codice) e unisciti come
            partecipante.
          </Text>

          <View style={{ paddingTop: 8, gap: 8 }}>
            <Field
              label="Codice ID lega"
              value={joinLeagueCode}
              onChangeText={setJoinLeagueCode}
              placeholder="Es. 123"
              keyboardType="numeric"
            />

            <Field
              label="Nome squadra"
              value={joinTeamName}
              onChangeText={setJoinTeamName}
              placeholder="Es. I Fenomeni"
            />
          </View>

          <Pressable
            onPress={onJoinLeague}
            disabled={joining}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              padding: 16,
              alignItems: "center",
              marginTop: 8,
              opacity: joining ? 0.6 : 1,
            }}
          >
            {joining ? (
              <ActivityIndicator />
            ) : (
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                Unisciti
              </Text>
            )}
          </Pressable>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.primary,
              fontFamily: fonts.semibold,
              paddingHorizontal: 16,
              fontSize: 14,
            },
          ]}
        >
          Crea una nuova lega
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.secondary,
              fontFamily: fonts.semibold,
              paddingHorizontal: 16,
              fontSize: 12,
            },
          ]}
        >
          Campionato: {selectedLeague ?? "—"} • Stagione: {season}
        </Text>

        <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          {/* 1) Nome squadra */}
          <Field
            label="Nome squadra"
            value={teamName}
            onChangeText={setTeamName}
            placeholder="La mia squadra"
          />

          {/* 2) Nome lega */}
          <Field
            label="Nome lega"
            value={leagueName}
            onChangeText={setLeagueName}
            placeholder="Nome della lega"
          />

          {/* 3) Modalità */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setMode("CLASSICO")}
              style={{
                flex: 1,
                borderWidth: 1,
                borderRadius: 8,
                padding: 8,
                alignItems: "center",
                opacity: mode === "CLASSICO" ? 1 : 0.6,
              }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.secondary,
                    fontFamily: fonts.semibold,
                  },
                ]}
              >
                Classico
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode("MANTRA")}
              style={{
                flex: 1,
                borderWidth: 1,
                borderRadius: 8,
                padding: 8,
                alignItems: "center",
                opacity: mode === "MANTRA" ? 1 : 0.6,
              }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.primary,
                    fontFamily: fonts.semibold,
                  },
                ]}
              >
                Mantra
              </Text>
            </Pressable>
          </View>

          {/* ✅ MODIFICATORE DIFESA */}
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.primary, fontFamily: fonts.semibold },
                  ]}
                >
                  Modificatore Difesa
                </Text>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.secondary,
                      fontFamily: fonts.regular,
                      fontSize: 10,
                    },
                  ]}
                >
                  Applica bonus/malus in base alla media voto del reparto
                  difensivo.
                </Text>
              </View>

              <Switch value={modEnabled} onValueChange={setModEnabled} />
            </View>
          </View>
        </View>

        {/* 4) Regole lega */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.primary,
              fontFamily: fonts.semibold,
              paddingHorizontal: 16,
              paddingTop: 8,
              fontSize: 14,
            },
          ]}
        >
          Regole
        </Text>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.secondary,
              fontFamily: fonts.semibold,
              paddingHorizontal: 16,
              fontSize: 12,
            },
          ]}
        >
          Seleziona i parametri della lega.
        </Text>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          <Field
            label="Budget"
            value={budget}
            onChangeText={setBudget}
            placeholder="500"
            keyboardType="numeric"
          />
          <Field
            label="Dimensione rosa"
            value={rosterSize}
            onChangeText={setRosterSize}
            placeholder="25"
            keyboardType="numeric"
          />
          <Field
            label="Max giocatori per squadra reale"
            value={maxPerRealTeam}
            onChangeText={setMaxPerRealTeam}
            placeholder="3"
            keyboardType="numeric"
          />
          <Field
            label="Minuti minimi per voto"
            value={minMinutesForVote}
            onChangeText={setMinMinutesForVote}
            placeholder="15"
            keyboardType="numeric"
          />
        </View>

        {/* 5) Quote ruoli */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.primary,
              fontFamily: fonts.semibold,
              paddingHorizontal: 16,
              paddingTop: 8,
              fontSize: 14,
            },
          ]}
        >
          Numero di giocatori
        </Text>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.secondary,
              fontFamily: fonts.semibold,
              paddingHorizontal: 16,
              fontSize: 12,
            },
          ]}
        >
          Somma quote: {computed.quotaSum} / {computed.rosterSize}
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 16,
            marginTop: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Field
              label="P"
              value={quotaP}
              onChangeText={setQuotaP}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="D"
              value={quotaD}
              onChangeText={setQuotaD}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="C"
              value={quotaC}
              onChangeText={setQuotaC}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="A"
              value={quotaA}
              onChangeText={setQuotaA}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* 6) Bonus/Malus */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.primary,
              fontFamily: fonts.semibold,
              paddingHorizontal: 16,
              paddingTop: 8,
              fontSize: 14,
            },
          ]}
        >
          Bonus e malus
        </Text>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          <Field label="Gol" value={ptsGoal} onChangeText={setPtsGoal} />
          <Field label="Assist" value={ptsAssist} onChangeText={setPtsAssist} />
          <Field label="Giallo" value={ptsYellow} onChangeText={setPtsYellow} />
          <Field label="Rosso" value={ptsRed} onChangeText={setPtsRed} />
          <Field
            label="Autogol"
            value={ptsOwnGoal}
            onChangeText={setPtsOwnGoal}
          />
          <Field
            label="Gol subito (solo portiere)"
            value={ptsGkConceded}
            onChangeText={setPtsGkConceded}
          />
          <Field
            label="Porta inviolata (solo portiere)"
            value={ptsGkClean}
            onChangeText={setPtsGkClean}
          />
          <Field
            label="Rigore segnato"
            value={ptsPenScored}
            onChangeText={setPtsPenScored}
          />
          <Field
            label="Rigore sbagliato"
            value={ptsPenMissed}
            onChangeText={setPtsPenMissed}
          />
          <Field
            label="Rigore parato"
            value={ptsPenSaved}
            onChangeText={setPtsPenSaved}
          />
        </View>

        {/* 7) Speciali (ora disattivabili) */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.primary,
              fontFamily: fonts.semibold,
              paddingHorizontal: 16,
              paddingTop: 8,
              fontSize: 14,
            },
          ]}
        >
          Speciali
        </Text>

        <SpecialRow
          label="Capitano"
          hint="Bonus applicato solo se il giocatore prende voto."
          enabled={enCaptain}
          onToggle={setEnCaptain}
          value={ptsCaptain}
          onChangeText={setPtsCaptain}
        />

        <SpecialRow
          label="Palo / Traversa"
          enabled={enWoodwork}
          onToggle={setEnWoodwork}
          value={ptsWoodwork}
          onChangeText={setPtsWoodwork}
        />

        <SpecialRow
          label="Rigore procurato"
          enabled={enPenWon}
          onToggle={setEnPenWon}
          value={ptsPenWon}
          onChangeText={setPtsPenWon}
        />

        <SpecialRow
          label="Rigore concesso"
          enabled={enPenConceded}
          onToggle={setEnPenConceded}
          value={ptsPenConceded}
          onChangeText={setPtsPenConceded}
        />

        <SpecialRow
          label="Gol subentrato (extra)"
          enabled={enSubGoalExtra}
          onToggle={setEnSubGoalExtra}
          value={ptsSubGoalExtra}
          onChangeText={setPtsSubGoalExtra}
        />

        <SpecialRow
          label="Gol annullato VAR"
          enabled={enVarDisallowed}
          onToggle={setEnVarDisallowed}
          value={ptsVarDisallowed}
          onChangeText={setPtsVarDisallowed}
        />

        <SpecialRow
          label="Gol vittoria"
          enabled={enWinningGoal}
          onToggle={setEnWinningGoal}
          value={ptsWinningGoal}
          onChangeText={setPtsWinningGoal}
        />

        <Pressable
          onPress={onCreate}
          disabled={loading || !selectedLeague}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
            marginVertical: 8,
            marginHorizontal: 16,
            opacity: loading || !selectedLeague ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.semibold,
                fontSize: 12,
              }}
            >
              Crea Lega
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 12 },
});
