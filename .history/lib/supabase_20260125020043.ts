// lib/supabase.ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// 🔐 Recupero variabili da app.json / app.config.ts
const supabaseUrl =
  ((Constants.expoConfig?.extra as any)?.SUPABASE_URL as string) ?? "";

const supabaseAnonKey =
  ((Constants.expoConfig?.extra as any)?.SUPABASE_ANON_KEY as string) ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY in app.json extra."
  );
}

// ✅ Client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // fondamentale per Expo
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ---------------------------------------------
// 🔎 Helpers Auth (usati in più punti)
// ---------------------------------------------

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session;
}

// ---------------------------------------------
// 🔎 Helpers League (pattern standard)
// ---------------------------------------------

export async function requireAuthUser() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  return session.user;
}
