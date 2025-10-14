import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "./theme";
import Header from "../components/Header";

export default function NewsPage() {
  const { colors, fonts } = useTheme();

  // Mock notizie (stesse del carosello + più contenuti)
  const newsList = [
    {
      id: 1,
      title: "Champions League: serata di gol e spettacolo",
      excerpt:
        "Il Real Madrid travolge il Bayern e vola in finale con una prestazione scintillante di Vinicius e Bellingham.",
      image:
        "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=800",
      time: "1h fa",
    },
    {
      id: 2,
      title: "Serie A: la Roma sogna la Champions",
      excerpt:
        "La squadra di De Rossi supera l'Atalanta e ora punta con decisione al quarto posto. Dybala decisivo dal dischetto.",
      image:
        "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800",
      time: "3h fa",
    },
    {
      id: 3,
      title: "Premier League: lotta serrata in vetta",
      excerpt:
        "City e Arsenal continuano la corsa punto a punto per il titolo. Guardiola: 'Non possiamo più sbagliare nulla'.",
      image:
        "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800",
      time: "5h fa",
    },
    {
      id: 4,
      title: "Europa League: la Fiorentina sogna in grande",
      excerpt:
        "Vittoria importante per la Viola che mette un piede in semifinale. Italiano: 'Serve umiltà, ma possiamo arrivare in fondo'.",
      image:
        "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800",
      time: "1 giorno fa",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER con back arrow */}
      <Header title="Notizie" showBackArrow />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {newsList.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={[styles.card, { backgroundColor: colors.secondary }]}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.textContainer}>
              <View style={styles.headerRow}>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontFamily: fonts.medium },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.time,
                    { color: colors.textSecondary, fontFamily: fonts.regular },
                  ]}
                >
                  {item.time}
                </Text>
              </View>
              <Text
                numberOfLines={3}
                style={[
                  styles.excerpt,
                  { color: colors.textSecondary, fontFamily: fonts.regular },
                ]}
              >
                {item.excerpt}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {newsList.length === 0 && (
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            Nessuna notizia disponibile 📰
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 180,
  },
  textContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    flex: 1,
    paddingRight: 8,
  },
  time: {
    fontSize: 13,
    opacity: 0.8,
  },
  excerpt: {
    fontSize: 13,
    lineHeight: 18,
  },
});
