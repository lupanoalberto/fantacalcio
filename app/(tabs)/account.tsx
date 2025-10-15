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

export default function AccountPage() {
  const { colors, fonts } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [shareData, setShareData] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
          <Header
            title="Fantacalcio"
            showBackArrow={false}
          />
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* ================== SEZIONE INFORMAZIONI PERSONALI ================== */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontFamily: fonts.medium },
        ]}
      >
        Informazioni personali
      </Text>

      <View style={[styles.card, { backgroundColor: colors.primary, gap: 8, }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Nome</Text>
          <Text style={[styles.value, { color: colors.text }]}>Alberto Lupano</Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <Text style={[styles.value, { color: colors.text }]}>alberto@gmail.com</Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <Text style={[styles.value, { color: colors.text }]}>********</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.editButton}>
          <Ionicons name="pencil-outline" size={16} color={colors.success} />
          <Text
            style={{
              color: colors.success,
              fontFamily: fonts.medium,
              fontSize: 13,
              marginLeft: 4,
            }}
          >
            Modifica
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================== SEZIONE PRIVACY E PERMESSI ================== */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontFamily: fonts.medium },
        ]}
      >
        Privacy e permessi
      </Text>

      <View style={[styles.card, { backgroundColor: colors.primary, gap: 8, }]}>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Notifiche push
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.secondary, true: colors.success }}
            thumbColor={colors.text}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Condividi dati di utilizzo
          </Text>
          <Switch
            value={shareData}
            onValueChange={setShareData}
            trackColor={{ false: colors.secondary, true: colors.success }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      {/* ================== SEZIONE ALTRO ================== */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontFamily: fonts.medium },
        ]}
      >
        Altro
      </Text>

      <View style={[styles.card, { backgroundColor: colors.primary, gap: 16, }]}>
        <TouchableOpacity activeOpacity={0.8} style={styles.optionRow}>
          <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Termini e condizioni
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.optionRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Invia feedback
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.optionRow}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.optionText, { color: colors.error }]}>Esci</Text>
        </TouchableOpacity>
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
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    alignSelf: "flex-end",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 13,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionText: {
    fontSize: 13,
  },
});
