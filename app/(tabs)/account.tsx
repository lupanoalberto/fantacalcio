import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { useTheme } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import { Colors } from "@/constants/colors";

export default function AccountPage() {
  const { colors, fonts } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [shareData, setShareData] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <Header title="Fantacalcio" showBackArrow={false} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* ================== SEZIONE INFORMAZIONI PERSONALI ================== */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.bold, marginTop: 8 },
          ]}
        >
          Informazioni personali
        </Text>

        <View style={[{ gap: 4 }]}>
          <View style={[styles.card, { backgroundColor: colors.primary }]}>
            <Text
              style={[
                {
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                },
              ]}
            >
              Nome
            </Text>
            <Text
              style={[
                {
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                },
              ]}
            >
              Alberto Lupano
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.primary }]}>
            <Text
              style={[
                {
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                },
              ]}
            >
              Email
            </Text>
            <Text
              style={[
                {
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                },
              ]}
            >
              lupano.alberto2124@gmail.com
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.primary }]}>
            <Text
              style={[
                {
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                },
              ]}
            >
              Password
            </Text>
            <Text
              style={[
                {
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                },
              ]}
            >
              ********
            </Text>
            
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
            <Ionicons name="pencil-outline" size={16} color={colors.success} />
            <Text
              style={[
                {
                  color: colors.success,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  alignSelf: "flex-end",
                  marginRight: 16,
                },
              ]}
            >
              Modifica
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================== SEZIONE PRIVACY E PERMESSI ================== */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.bold, marginTop: 8 },
          ]}
        >
          Informazioni personali
        </Text>

        <View style={[{ gap: 4 }]}>
          <View style={[styles.card, { backgroundColor: colors.primary }]}>
            <Text
              style={[
                {
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                },
              ]}
            >
              Notifiche push
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.secondary, true: colors.success }}
              style={{ padding: 0, margin: 0 }}
              thumbColor={colors.text}
            />
          </View>
          <View style={[styles.card, { backgroundColor: colors.primary }]}>
            <Text
              style={[
                {
                  color: colors.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                },
              ]}
            >
              Condividi dati di utilizzo
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.secondary, true: colors.success }}
              style={{ padding: 0, margin: 0 }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        {/* ================== SEZIONE ALTRO ================== */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.bold, marginTop: 16 },
          ]}
        >
          Altro
        </Text>

        <View style={[{ gap: 4 }]}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.primary, justifyContent: "flex-start" },
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={16}
              color={colors.text}
            />
            <Text
              style={[
                {
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                },
              ]}
            >
              Termini e condizioni
            </Text>
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.primary, justifyContent: "flex-start" },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={colors.text}
            />
            <Text
              style={[
                {
                  color: colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                },
              ]}
            >
              Invia un feedback
            </Text>
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.primary, justifyContent: "flex-start" },
            ]}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.error} />
            <Text
              style={[
                {
                  color: colors.error,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                },
              ]}
            >
              Esci
            </Text>
          </View>
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
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-end",
  },
  switchRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 12,
  },
  optionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionText: {
    fontSize: 12,
  },
});
