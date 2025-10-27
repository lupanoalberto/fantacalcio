import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "./theme";
import Header from "../components/Header";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { getFootballNews } from "@/services/newsApi";
import LeagueSelector from "@/components/LeagueSelector";
import { Colors } from "@/constants/colors";

type LeagueName = "Serie A" | "Premier League" | "LaLiga";

export default function NewsPage() {
  const { colors, fonts } = useTheme();
  const [selectedLeague, setSelectedLeague] = useState<LeagueName>("Serie A");

  const leagues: LeagueName[] = ["Serie A", "Premier League", "LaLiga"];
  const router = useRouter();

  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const data = await getFootballNews(selectedLeague);
      setNews(data);
    };
    fetchNews();
  }, [selectedLeague]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER con back arrow */}
      <Header title="Notizie" showBackArrow={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content]}
      >

        <View>
          <LeagueSelector
            leagues={leagues}
            selectedLeague={selectedLeague}
            onSelect={(league) => setSelectedLeague(league as LeagueName)}
          />
        </View>
        <View style={[{ marginTop: 16, gap: 16 }]}>
          {news.length > 0 ? (
            news.map((item, index) => {
              const date = new Date(item.publishedAt);
              const timeLabel = date.toLocaleString("it-IT", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  style={[styles.card, { backgroundColor: colors.primary }]}
                  onPress={() => router.push((`/news/${String(item.id)}`) as Href)}

                >
                  <Image source={{ uri: item.urlToImage }} style={styles.image} />
                  <View style={styles.textContainer}>
                    <View style={[{ gap: 8, }]}>
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
                        {timeLabel}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={3}
                      style={[
                        styles.excerpt,
                        { color: colors.textSecondary, fontFamily: fonts.regular },
                      ]}
                    >
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })) : (
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  card: {
    borderRadius: 8,
    overflow: "hidden",
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  image: {
    width: "100%",
    height: 180,
  },
  textContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    flexDirection: "column",
    gap: 8,
  },
  title: {
    fontSize: 14,
    flex: 1,
  },
  time: {
    fontSize: 12,
  },
  excerpt: {
    fontSize: 12,
  },
});
