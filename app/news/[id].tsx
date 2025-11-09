import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../theme";
import Header from "../../components/Header";
import { getFootballNews } from "@/services/newsApi";

type Props = {
  selectedLeague: string;
}

export default function NewsDetail({ selectedLeague }: Props) {
  const { id } = useLocalSearchParams(); // recupera l'id dalla rotta
  const { colors, fonts } = useTheme();
  const [news, setNews] = useState<any[]>([]);
  
  useEffect(() => {
      const fetchNews = async () => {
        const data = await getFootballNews(selectedLeague);
        setNews(data);
      };
      fetchNews();
    }, [selectedLeague]);

  const article = news.find((item) => item.id === id);
  let timeLabel = article.publishedAt.toLocaleString("it-IT", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

  if (article) {
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
        <Image source={{ uri: article.urlToImage }} style={styles.image} />

        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: fonts.semibold },
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
          {timeLabel}
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