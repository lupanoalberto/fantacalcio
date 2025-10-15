import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../theme";
import Header from "../../components/Header";

export default function NotificationDetail() {
  const { id } = useLocalSearchParams();
  const { colors, fonts } = useTheme();

  // Mock dati (in futuro collegabile al backend o context)
  const notifications = [
    {
      id: "1",
      title: "Risultati aggiornati!",
      message:
        "La tua lega 'Amici del Bar' è stata aggiornata con i nuovi punteggi. Controlla la classifica aggiornata nella sezione Leghe.",
      time: "2 ore fa",
      type: "info",
    },
    {
      id: "2",
      title: "Mercato aperto",
      message:
        "Il calciomercato è ora disponibile per la tua lega. Approfittane per rinforzare la tua squadra!",
      time: "1 giorno fa",
      type: "alert",
    },
    {
      id: "3",
      title: "Nuova notizia",
      message:
        "Scopri le ultime dal mondo del calcio nella sezione Notizie. Restare aggiornati è un vantaggio competitivo!",
      time: "3 giorni fa",
      type: "news",
    },
  ];

  const notification = notifications.find((item) => item.id === id);

  if (!notification) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text
          style={[
            styles.errorText,
            { color: colors.textSecondary, fontFamily: fonts.regular },
          ]}
        >
          Notifica non trovata 🔔
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Notifiche" showBackArrow={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: fonts.medium },
          ]}
        >
          {notification.title}
        </Text>

        <Text
          style={[
            styles.time,
            { color: colors.textSecondary, fontFamily: fonts.regular },
          ]}
        >
          {notification.time}
        </Text>

        <View>
          <Text
            style={[
              styles.message,
              { color: colors.textSecondary, fontFamily: fonts.regular },
            ]}
          >
            {notification.message}
          </Text>
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
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    marginBottom: 8,
  },
  time: {
    fontSize: 13,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 18,
  },
});