// app/notifications.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "./theme";
import Header from "../components/Header";

export default function Notifications() {
  const { colors, fonts } = useTheme();

  // Mock notifiche per ora
  const notifications = [
    {
      id: 1,
      title: "Risultati aggiornati!",
      message: "La tua lega 'Amici del Bar' è stata aggiornata con i nuovi punteggi.",
      time: "2h fa",
    },
    {
      id: 2,
      title: "Mercato aperto",
      message: "Il calciomercato è ora disponibile per la tua lega.",
      time: "1 giorno fa",
    },
    {
      id: 3,
      title: "Nuova notizia",
      message: "Scopri le ultime dal mondo del calcio nella sezione Notizie.",
      time: "3 giorni fa",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title="Notifiche" showBackArrow />

      <ScrollView contentContainerStyle={[styles.content, { gap: 16, }]}>
        {notifications.map((notif) => (
          <View
            key={notif.id}
            style={[styles.card, { backgroundColor: colors.secondary }]}
          >
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontFamily: fonts.medium },
                ]}
              >
                {notif.title}
              </Text>
              <Text
                style={[
                  styles.time,
                  { color: colors.textSecondary, fontFamily: fonts.regular },
                ]}
              >
                {notif.time}
              </Text>
            </View>
            <Text
              style={[
                styles.message,
                { color: colors.textSecondary, fontFamily: fonts.regular },
              ]}
            >
              {notif.message}
            </Text>
          </View>
        ))}

        {notifications.length === 0 && (
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fonts.regular,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            Nessuna notifica al momento 🔔
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
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    padding: 16,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
  },
  time: {
    fontSize: 13,
    opacity: 0.8,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
