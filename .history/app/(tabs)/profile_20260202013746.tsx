import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

export default function ProfileScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) console.log("getSession error:", error);

      const user = data.session?.user ?? null;

      if (mounted) {
        const l =
          (user?.user_metadata?.username as string) ||
          (user?.user_metadata?.name as string) ||
          user?.email ||
          "Utente";

        setLabel(user ? l : "Non loggato");
        setLoading(false);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // reset stack verso login
      router.replace("/(auth)/login" as any);
    } catch (e: any) {
      Alert.alert("Errore", e?.message ?? "Logout non riuscito");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/" as any);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontFamily: fonts.semibold, color: colors.text }}>
          Profilo
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 12, paddingTop: 24, gap: 12 }}>
          <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary }}>
            Sessione:
          </Text>
          <Text style={{ fontSize: 18, fontFamily: fonts.semibold, color: colors.text }}>
            {label}
          </Text>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            style={{
              marginTop: 12,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.success,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: colors.primary }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
