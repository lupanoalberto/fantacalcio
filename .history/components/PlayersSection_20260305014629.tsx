// components/LiveMatchesSection.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Scroll
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTheme } from "@/theme";
import MatchCard from "./MatchCard";
import { CompetitionPlayer, getCompetitionPlayers, getLiveOrUpcomingMatches } from "../services/footballApi";
import { Href, useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

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

type Props = {
  selectedLeague: string;
};

export default function PlayersSection({ selectedLeague }: Props) {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  const [players, setPlayers] = useState<CompetitionPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtri
  const [roleFilter, setRoleFilter] = useState<CanonicalRole | "Portiere">(
    "Portiere",
  );
  const [teamFilter, setTeamFilter] = useState<string>("Tutte");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const data = await getCompetitionPlayers(selectedLeague);
        setPlayers(data);

        // reset filtri al cambio competizione
        setRoleFilter("Portiere");
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
  const roleOptions: (CanonicalRole | "Portiere")[] = [
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

    if (roleFilter !== "Portiere") {
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
              league: String(selectedLeague),
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
          style={{ width: 40, height: 40, borderRadius: 8 }}
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
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
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
          Giocatori
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
            {roleOptions.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  {
                    minWidth: 24,
                    borderRadius: 24,
                    padding: 8,
                    paddingHorizontal: 16,
                    backgroundColor:
                      roleFilter === r ? colors.white : "transparent",
                  },
                ]}
                onPress={() => {
                  setRoleFilter(r);
                }}
              >
                <Text
                  style={{
                    color: roleFilter === r ? colors.orange : colors.text,
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color={colors.blue} />
          ) : (
            <>
              {/* ✅ Lista */}
              <View
                style={{
                  flexDirection: "column",
                  paddingHorizontal: 16,
                  gap: 8,
                }}
              >
                {visiblePlayers.map(renderPlayerRow)}
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    padding: 12,
  },
  dayRow: {
      padding: 12,
      backgroundColor: Colors.opacity,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderRadius: 12,
    },
});
