import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../theme";
import Header from "../../components/Header";

export default function NewsDetail() {
  const { id } = useLocalSearchParams(); // recupera l'id dalla rotta
  const { colors, fonts } = useTheme();

  // Mock dati: in futuro potrai sostituirli con fetch da API o context
  const newsList = [
    {
      id: "1",
      title: "Champions League: serata di gol e spettacolo",
      image:
        "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=800",
      date: "14 ottobre 2025",
      content: `Il Real Madrid travolge il Bayern Monaco 4-1 con una prestazione scintillante di Vinicius Jr e Bellingham. 
      I Blancos dominano la partita e conquistano la finale di Champions League, confermando ancora una volta la loro mentalità europea. 
      Nel secondo tempo il Bayern prova a reagire, ma le ripartenze di Ancelotti sono letali. Ora il Real attende la vincente tra Arsenal e Inter.`,
    },
    {
      id: "2",
      title: "Serie A: la Roma sogna la Champions",
      image:
        "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800",
      date: "13 ottobre 2025",
      content: `La Roma supera l'Atalanta e continua la rincorsa al quarto posto. 
      Dybala e Lukaku trascinano la squadra di De Rossi, che ora si trova a un solo punto dal Napoli. 
      I giallorossi dimostrano maturità e compattezza difensiva, fondamentali in vista del finale di stagione.`,
    },
  ];

  const article = newsList.find((item) => item.id === id);

  if (!article) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
          Notizia non trovata 📰
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Notizie" showBackArrow />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Image source={{ uri: article.image }} style={styles.image} />

        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: fonts.medium },
          ]}
        >
          {article.title}
        </Text>

        <Text
          style={[
            styles.date,
            { color: colors.textSecondary, fontFamily: fonts.regular },
          ]}
        >
          {article.date}
        </Text>

        <Text
          style={[
            styles.text,
            { color: colors.textSecondary, fontFamily: fonts.regular },
          ]}
        >
          {article.content}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 18,
  },
});