import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTheme } from "../app/theme";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const mockNews = [
  {
    id: 1,
    title: "Champions League: serata di gol e spettacolo",
    excerpt: "Il Real Madrid travolge il Bayern e vola in finale.",
    image:
      "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 2,
    title: "Serie A: lotta serrata per il quarto posto",
    excerpt: "La Roma supera l'Atalanta e sogna la Champions.",
    image:
      "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 3,
    title: "Premier League: City e Arsenal a braccetto in vetta",
    excerpt: "Guardiola: 'Non possiamo più sbagliare nulla'.",
    image:
      "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export default function NewsCarousel() {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* TITOLO SEZIONE */}
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.medium },
          ]}
        >
          Notizie dal calcio
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/news")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.linkText,
              { color: colors.success, fontFamily: fonts.medium },
            ]}
          >
            Vedi tutte →
          </Text>
        </TouchableOpacity>

      </View>

      {/* CAROSELLO SCORRIBILE */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      >
        {mockNews.map((news) => (
          <TouchableOpacity
            key={news.id}
            activeOpacity={0.85}
            style={[styles.card, { backgroundColor: colors.secondary }]}
          >
            <Image source={{ uri: news.image }} style={styles.image} />
            <View style={styles.textContainer}>
              <Text
                numberOfLines={2}
                style={[
                  styles.title,
                  { color: colors.text, fontFamily: fonts.medium },
                ]}
              >
                {news.title}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  styles.excerpt,
                  { color: colors.textSecondary, fontFamily: fonts.regular },
                ]}
              >
                {news.excerpt}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </View>
  );
}

const CARD_WIDTH = width * 0.7;
const IMAGE_HEIGHT = width * 0.7 * 9 / 16;

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  card: {
    borderRadius: 8,
    overflow: "hidden",
    width: CARD_WIDTH,
  },
  image: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  textContainer: {
    padding: 16,
  },
  title: { fontSize: 18, marginBottom: 4 },
  excerpt: { fontSize: 13, opacity: 0.8 },
  linkText: {
    fontSize: 13,
  },
});
