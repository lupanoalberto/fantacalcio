import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { ThemeProvider } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // session iniziale
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // listener auth
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* pubblico */}
          <Stack.Screen name="(auth)" />

          {/* app protetta */}
          {session ? (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="leagues" />
            </>
          ) : (
            <Stack.Screen name="(auth)/login" />
          )}
        </Stack>
      </View>
    </ThemeProvider>
  );
}
