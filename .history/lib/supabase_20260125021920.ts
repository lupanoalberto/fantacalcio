import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Storage web sicuro (evita ReferenceError se localStorage non è disponibile)
 */
const webStorage = {
  getItem: async (key: string) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

const storage = Platform.OS === "web" ? webStorage : AsyncStorage;

/**
 * Client "dummy" per non bloccare l'app se .env non è caricato.
 * In questo caso disabilitiamo persistenza e logghiamo l'errore.
 */
function createSafeSupabaseClient() {
  const missing =
    !SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.length < 10 || SUPABASE_ANON_KEY.length < 20;

  if (missing) {
    console.warn(
      "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
        "Supabase will be disabled until you fix .env and restart with -c."
    );

    // Client "inoffensivo": URL/KEY fittizi + sessione non persistita
    return createClient("http://localhost:54321", "anon-key", {
      auth: {
        storage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      // opzionale: timeout più generoso su reti lente
      fetch: (input, init) =>
        fetch(input, { ...init, signal: (init as any)?.signal }),
    },
  });
}

export const supabase = createSafeSupabaseClient();
