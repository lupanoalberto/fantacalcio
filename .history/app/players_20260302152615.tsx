import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  getCompetitionPlayers,
  CompetitionPlayer,
} from "../services/footballApi";
import { useTheme } from "@/theme";
import Header from "@/components/Header";
import { LinearGradient } from "expo-linear-gradient";
import { goBack } from "expo-router/build/global-state/routing";

type SortDir = "asc" | "desc";

type CanonicalRole = "Portiere" | "Difensore" | "Centrocampista" | "Attaccante";

function mapRole(position?: string): CanonicalRole | null {
  if (!position) return null;
  const p = position.toLowerCase().trim();

  // PORTIERE
  if (
    p.includes("goalkeeper") ||
    p.includes("keeper") ||
    p === "gk" ||
    p.includes("portiere")
  )
    return "Portiere";

  // DIFENSORE
  if (
    p.includes("defender") ||
    p.includes("back") ||
    p.includes("centre-back") ||
    p.includes("center-back") ||
    p.includes("fullback") ||
    p.includes("difens")
  )
    return "Difensore";

  // CENTROCAMPISTA
  if (
    p.includes("midfielder") ||
    p.includes("midfield") ||
    p.includes("winger") ||
    p.includes("wide") ||
    p.includes("centrocamp")
  )
    return "Centrocampista";

  // ATTACCANTE
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

const LEAGUE_CODES: Record<string, string> = {
  "Serie A": "SA",
  "Premier League": "PL",
  LaLiga: "PD",
};

export default function PlayersScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { league } = useLocalSearchParams();
  const selectedLeague = (league as string) ?? "Serie A";

  const [players, setPlayers] = useState<CompetitionPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtri
  const [roleFilter, setRoleFilter] = useState<CanonicalRole | "Tutti">(
    "Tutti",
  );
  const [teamFilter, setTeamFilter] = useState<string>("Tutte");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Modals
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const data = await getCompetitionPlayers(selectedLeague);
        setPlayers(data);

        // reset filtri al cambio competizione
        setRoleFilter("Tutti");
        setTeamFilter("Tutte");
        setSortDir("asc");
      } catch (err) {
        console.error("❌ Errore caricamento giocatori:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [selectedLeague]);

  // Ruoli fissi (solo 4 + Tutti)
  const roleOptions: (CanonicalRole | "Tutti")[] = [
    "Tutti",
    "Portiere",
    "Difensore",
    "Centrocampista",
    "Attaccante",
  ];

  // Squadre dai dati
  const teamOptions = useMemo(() => {
    const map = new Map<string, string>(); // teamId -> name
    players.forEach((p) => {
      const id = String(p.team?.id ?? "");
      if (!id) return;
      const name = p.team?.shortName ?? p.team?.name ?? "Sconosciuta";
      map.set(id, name);
    });

    const arr = Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "it"));

    return [{ id: "Tutte", name: "Tutte" }, ...arr];
  }, [players]);

  const teamLabel = useMemo(() => {
    if (teamFilter === "Tutte") return "Tutte";
    return teamOptions.find((t) => t.id === teamFilter)?.name ?? "—";
  }, [teamFilter, teamOptions]);

  // Filtri + sort applicati
  const visiblePlayers = useMemo(() => {
    let list = [...players];

    if (roleFilter !== "Tutti") {
      list = list.filter((p) => mapRole(p.position) === roleFilter);
    }

    if (teamFilter !== "Tutte") {
      list = list.filter((p) => String(p.team?.id) === teamFilter);
    }

    list.sort((a, b) => {
      const cmp = (a.name ?? "").localeCompare(b.name ?? "", "it", {
        sensitivity: "base",
      });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [players, roleFilter, teamFilter, sortDir]);

  const FilterChip = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        padding: 12,
        borderRadius: 16,
        backgroundColor: colors.opacity,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        alignSelf: "flex-start",
      }}
    >
      <View>
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: fonts.regular,
            fontSize: 10,
          }}
        >
          {label}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: colors.text,
            fontFamily: fonts.semibold,
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={12} color={colors.text} />
    </TouchableOpacity>
  );

  const Sheet = ({
    visible,
    title,
    onClose,
    children,
  }: {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable style={styles.overlay} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
          >
            {title}
          </Text>

          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {children}
      </View>
    </Modal>
  );

  const OptionRow = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.dayRow,
        {
          borderColor: colors.opacity ?? "rgba(0,0,0,0.08)",
          backgroundColor: active ? colors.opacity : colors.background,
        },
      ]}
    >
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.regular,
          fontSize: 10,
        }}
      >
        {label}
      </Text>

      {active ? (
        <Ionicons name="checkmark" size={18} color={colors.blue} />
      ) : null}
    </TouchableOpacity>
  );

  const renderPlayerRow = (player: CompetitionPlayer) => {
    const role = mapRole(player.position) ?? "-";
    const photo =
      player?.photo ??
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

    return (
      <TouchableOpacity
        key={`${player.id}`}
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "../player/[id]",
            params: {
              id: String(player.id),
              // passa la lega ESATTAMENTE com’è arrivata alla pagina Players
              // (può essere "Serie A" o "SA" o "Premier League" o "PL" o "LaLiga" o "PD")
              league: String(league ?? selectedLeague),
            },
          } as any)
        }
        style={[
          styles.dayRow,
          {
            borderColor: colors.opacity,
          },
        ]}
      >
        <Image
          source={{
            uri: photo,
          }}
          style={{ width: 48, height: 48, borderRadius: 12 }}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.semibold,
              fontSize: 12,
            }}
            numberOfLines={1}
          >
            {player.name}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 10,
            }}
          >
            {role}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
          style={[
            {
              flex: 1,
              backgroundColor: "#0d0d0d",
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View
            style={{
              padding: 8,
              paddingHorizontal: 16,
              paddingTop: 8 + insets.top,
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              height: 64 + insets.top,
            }}
          >
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                color: colors.white,
                fontFamily: fonts.bold,
                fontSize: 16,
                paddingRight: 32,
                textAlign: "center",
              }}
            >
              Calendario
            </Text>
          </View>
    
          <LinearGradient
            colors={[
              "#0d0d0d",
              colors.background,
              colors.orange,
              colors.background,
            ]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                gap: 24,
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  backgroundColor: colors.opacity,
                  borderBottomWidth: 1,
                  borderColor: colors.opacity,
                  padding: 8,
                }}
              >
                {roleOptions.map(roleOption) => }
              </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={colors.blue} />
        ) : (
          <>
            {/* ✅ FILTRI (ripristinati) */}
            <View
              style={{
                width: "100%",
                flexDirection: "column",
                marginHorizontal: 12,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <FilterChip
                  label="Ruolo"
                  value={roleFilter}
                  onPress={() => setIsRoleOpen(true)}
                />
                <FilterChip
                  label="Squadra"
                  value={teamLabel}
                  onPress={() => setIsTeamOpen(true)}
                />
                <FilterChip
                  label="Ordine"
                  value={sortDir === "asc" ? "A → Z" : "Z → A"}
                  onPress={() => setIsSortOpen(true)}
                />
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                  textAlign: "left",
                }}
              >
                {visiblePlayers.length} giocatori
              </Text>
            </View>

            {/* ✅ Lista */}
            <View style={{ flexDirection: "column" }}>
              {visiblePlayers.map(renderPlayerRow)}
            </View>
          </>
        )}
      </ScrollView>
      </LinearGradient>

      {/* ✅ Sheet Ruolo */}
      <Sheet
        visible={isRoleOpen}
        title="Filtra per ruolo"
        onClose={() => setIsRoleOpen(false)}
      >
        <ScrollView
          style={{ maxHeight: 420 }}
          showsVerticalScrollIndicator={false}
        >
          {roleOptions.map((r) => (
            <OptionRow
              key={r}
              label={r}
              active={r === roleFilter}
              onPress={() => {
                setRoleFilter(r);
                setIsRoleOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </Sheet>

      {/* ✅ Sheet Squadra */}
      <Sheet
        visible={isTeamOpen}
        title="Filtra per squadra"
        onClose={() => setIsTeamOpen(false)}
      >
        <ScrollView
          style={{ maxHeight: 420 }}
          showsVerticalScrollIndicator={false}
        >
          {teamOptions.map((t) => (
            <OptionRow
              key={t.id}
              label={t.name}
              active={t.id === teamFilter}
              onPress={() => {
                setTeamFilter(t.id);
                setIsTeamOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </Sheet>

      {/* ✅ Sheet Ordinamento */}
      <Sheet
        visible={isSortOpen}
        title="Ordina"
        onClose={() => setIsSortOpen(false)}
      >
        <OptionRow
          label="A → Z"
          active={sortDir === "asc"}
          onPress={() => {
            setSortDir("asc");
            setIsSortOpen(false);
          }}
        />
        <OptionRow
          label="Z → A"
          active={sortDir === "desc"}
          onPress={() => {
            setSortDir("desc");
            setIsSortOpen(false);
          }}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingBottom: 0,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  dayRow: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
