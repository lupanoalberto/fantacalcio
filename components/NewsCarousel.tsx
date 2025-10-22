import React, { useEffect, useState } from "react";
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
import type { Href } from "expo-router";
import { getFootballNews } from "@/services/newsApi";
const { width } = Dimensions.get("window");

type Props = {
  selectedLeague: string;
}

export default function NewsCarousel({ selectedLeague }: Props) {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const data = await getFootballNews(selectedLeague);
      setNews(data.slice(0,3));
    };
    fetchNews();
  }, [selectedLeague]);
  

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
          Notizie dal campo
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
        {news.map((news, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            style={[styles.card, { backgroundColor: colors.primary }]}
            onPress={() => router.push((`/news/${news.id}`) as Href)}
          >
            <Image source={{ uri: news.urlToImage }} style={styles.image} />
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
                {news.description}
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
