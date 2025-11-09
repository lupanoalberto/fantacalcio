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
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
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
      <View>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.bold },
          ]}
        >
          Notizie dal campo
        </Text>

      </View>

      {/* CAROSELLO SCORRIBILE */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingRight: 16, alignItems: "center", }}
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
                  { color: colors.text, fontFamily: fonts.semibold },
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
        <View>
          <TouchableOpacity
            onPress={() => router.push("/news")}
            style={[styles.button, { borderColor: colors.secondary, backgroundColor: colors.primary, }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: colors.text, fontFamily: fonts.semibold }]}>
              Vedi tutte
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
}

const CARD_WIDTH = width * 0.7;
const IMAGE_HEIGHT = width * 0.7 * 9 / 16;

const styles = StyleSheet.create({
  container: {
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  card: {
    borderRadius: 8,
    overflow: "hidden",
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  image: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  textContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  title: { fontSize: 14 },
  excerpt: { fontSize: 12 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: { fontSize: 12 },
});
