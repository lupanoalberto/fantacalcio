import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import { useTheme } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import { Colors } from "@/constants/colors";

export default function HelpPage() {
  const { colors, fonts } = useTheme();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: "Come posso creare o unirmi a una lega?",
      answer:
        "Dalla Home, nella sezione 'Le tue leghe', tocca '+ Crea o unisciti a una lega' e segui le istruzioni per crearne una nuova o entrare in una già esistente.",
    },
    {
      id: 2,
      question: "Posso modificare la mia formazione dopo averla salvata?",
      answer:
        "Sì, puoi modificarla fino all'inizio della prima partita della giornata. Dopo quel momento, la formazione viene bloccata automaticamente.",
    },
    {
      id: 3,
      question: "Come vengono aggiornati i punteggi?",
      answer:
        "I punteggi vengono aggiornati automaticamente dopo ogni partita in base alle valutazioni ufficiali dei giocatori.",
    },
  ];

  const videos = [
    {
      id: 1,
      title: "Guida rapida: come creare la tua lega",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      id: 2,
      title: "Come gestire la tua formazione",
      url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    },
  ];

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    {/* HEADER */}
      <Header
        title="Fantacalcio"
        showBackArrow={false}
      />
    <ScrollView
      showsVerticalScrollIndicator={false}
    >

      {/* ===================== SEZIONE FAQ ===================== */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontFamily: fonts.bold, marginTop: 8, },
        ]}
      >
        Domande frequenti
      </Text>

      <View style={[{ paddingHorizontal: 16, gap: 4, }]}>
        {faqs.map((item) => (
          <View
            key={item.id}
            style={[styles.faqCard, { backgroundColor: colors.primary }]}
          >
            <TouchableOpacity
              onPress={() => setOpenFAQ(openFAQ === item.id ? null : item.id)}
              activeOpacity={0.8}
              style={styles.faqHeader}
            >
              <Text
                style={[
                  styles.faqQuestion,
                  { color: colors.text, fontFamily: fonts.semibold },
                ]}
              >
                {item.question}
              </Text>
              <Ionicons
                name={openFAQ === item.id ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {openFAQ === item.id && (
              <Text
                style={[
                  styles.faqAnswer,
                  { color: colors.textSecondary, fontFamily: fonts.regular },
                ]}
              >
                {item.answer}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* ===================== SEZIONE CONTATTI ===================== */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontFamily: fonts.bold, marginTop: 16, },
        ]}
      >
        Contatti
      </Text>

      <View style={[{ paddingHorizontal: 16, gap: 4, }]}>
        <TouchableOpacity
          onPress={() => Linking.openURL("mailto:support@fantacalcioapp.com")}
          activeOpacity={0.8}
          style={[styles.card, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="mail-outline" size={24} color={colors.success} />
          <Text
            style={[
              styles.contactText,
              { color: colors.text, fontFamily: fonts.regular },
            ]}
          >
            support@fantacalcioapp.com
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openLink("https://instagram.com")}
          activeOpacity={0.8}
          style={[styles.card, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="logo-instagram" size={20} color={colors.success} />
          <Text
            style={[
              styles.contactText,
              { color: colors.text, fontFamily: fonts.regular },
            ]}
          >
            Seguici su Instagram
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===================== SEZIONE VIDEO TUTORIAL ===================== */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontFamily: fonts.bold, marginTop: 16, },
        ]}
      >
        Video tutorial
      </Text>

      <View style={[{ paddingHorizontal: 16, gap: 4, paddingBottom: 16 }]}>
        {videos.map((vid) => (
          <TouchableOpacity
            key={vid.id}
            onPress={() => openLink(vid.url)}
            activeOpacity={0.85}
            style={[styles.card, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="play-circle-outline" size={24} color={colors.success} />
            <Text
              style={[
                styles.videoTitle,
                { color: colors.text, fontFamily: fonts.semibold },
              ]}
            >
              {vid.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  faqCard: {
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  faqQuestion: {
    fontSize: 12,
  },
  faqAnswer: {
    fontSize: 12,
  },
  contactText: {
    fontSize: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  videoTitle: {
    fontSize: 12,
    flexShrink: 1,
  },
});
