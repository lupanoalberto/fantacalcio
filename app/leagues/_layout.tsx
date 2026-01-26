import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";

export default function LeaguesLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    async function check() {
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;

      if (error || !data.session?.user) {
        // ✅ se non autenticato, manda al login
        router.replace("/(auth)/login");
        return;
      }

      setChecking(false);
    }

    check();

    // opzionale: se l'utente fa logout mentre è dentro leagues
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.replace("/(auth)/login");
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
