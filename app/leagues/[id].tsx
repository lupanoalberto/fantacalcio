import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLeagueStore } from '../../store/leagueStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MatchCard from '@/components/MatchCard';
import NewsCarousel from '@/components/NewsCarousel';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "../theme";

export default function LeagueDashboardScreen() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams();
  const { activeLeague, setActiveLeague, loading } = useLeagueStore();
  const router = useRouter();

  useEffect(() => {
    setActiveLeague(String(id));
  }, [id]);

  if (loading || !activeLeague) return <Text style={{ padding: 16 }}>Caricamento...</Text>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title={activeLeague.name} showBackArrow={true} />

      <ScrollView style={styles.content}>
        <View style={[styles.row, { marginBottom: 16, marginHorizontal: 16, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.secondary, backgroundColor: colors.primary, borderRadius: 8, }]}>
          <View style={styles.logo}>

          </View>
          <View style={styles.column}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: fonts.semibold, }}>
              {activeLeague.selectedLeague}
            </Text>
            <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: colors.text }}>{activeLeague.members.length}</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.editButton}>
              <Ionicons name="pencil-outline" size={16} color={colors.gold} />
              <Text
                style={{
                  color: colors.gold,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  marginLeft: 4,
                }}
              >
                Modifica
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.buttonContainer, styles.row, { marginHorizontal: 16, }]}>
          <TouchableOpacity style={[styles.button, styles.column]}>
            <Ionicons name="football-outline" color={colors.text} size={18} />
            <Text style={{ color: colors.text, fontSize: 12, fontFamily: fonts.semibold, }}>
              Giocatori
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.column]}>
            <FontAwesome6 name="arrow-right-arrow-left" color={colors.text} size={18} />
            <Text style={{ color: colors.text, fontSize: 12, fontFamily: fonts.semibold, }}>
              Scambi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.column]}>
            <Ionicons name="shirt-outline" color={colors.text} size={18} />
            <Text style={{ color: colors.text, fontSize: 12, fontFamily: fonts.semibold, }}>
              Squadre
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, }}>
          <Text style={{ color: colors.text, fontSize: 16, fontFamily: fonts.bold, marginBottom: 8, marginTop: 16, }}>
            Prossima partita
          </Text>
          <LinearGradient style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 2, borderRadius: 8, }} colors={[colors.gold, colors.light, colors.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <TouchableOpacity style={{ width:"100%", paddingTop: 12, paddingHorizontal: 16, paddingBottom: 10, }}>
              <Text style={{ color: colors.primary, fontSize: 14, fontFamily: fonts.bold, marginHorizontal: "auto", }}>
                Inserisci formazione
              </Text>
            </TouchableOpacity>
            <MatchCard key={`1`}
              idx={'1'}
              homeTeam={'Scarsenal'}
              awayTeam={'Al legri'}
              scoreHome={'-'}
              scoreAway={'-'}
              time={'Giornata 6'}
              homeLogo={'https://png.pngtree.com/png-vector/20190116/ourmid/pngtree-vector-shield-icon-png-image_322145.jpg'}
              awayLogo={'https://png.pngtree.com/png-vector/20190116/ourmid/pngtree-vector-shield-icon-png-image_322145.jpg'}>
            </MatchCard>
          </LinearGradient>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontFamily: fonts.bold, marginBottom: 8, marginTop: 16 }}>
            Ultimi risultati
          </Text>
          <View style={[styles.buttonContainer, styles.row]}>
            <TouchableOpacity style={[styles.button, styles.column]}>
              <Text style={{ color: colors.text, fontSize: 14, fontFamily: fonts.bold, }}>
                1 - 1
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: fonts.semibold, }}>
                67.5
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.column, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.error }]}>
              <Text style={{ color: colors.error, fontSize: 14, fontFamily: fonts.bold, }}>
                2 - 0
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: fonts.semibold, }}>
                60.0
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.column, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.success }]}>
              <Text style={{ color: colors.success, fontSize: 14, fontFamily: fonts.bold, }}>
                1 - 0
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: fonts.semibold, }}>
                70.5
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <NewsCarousel selectedLeague={activeLeague.selectedLeague} />
        </View>

        <View>
          <TouchableOpacity style={[styles.button, styles.row, { backgroundColor: colors.error, margin: 16, paddingVertical: 12, paddingHorizontal: 16 }]} onPress={() => router.push("/(tabs)")}>
            <Ionicons name="trash-outline" color={colors.text} size={18} />
            <Text style={{ color: colors.text, fontSize: 14, fontFamily: fonts.semibold, }}>
              Abbandona lega
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    marginTop: 8,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  column: {
    flex: 1,
    flexDirection: "column",
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: Colors.secondary,
    borderRadius: 8
  },
  buttonContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  between: {
    justifyContent: "space-between"
  },
  card: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
});