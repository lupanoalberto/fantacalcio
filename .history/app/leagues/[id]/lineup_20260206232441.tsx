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
    if (roste
