import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { Link, useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onLogin() {
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // ✅ LOGIN OK → vai alla index
    router.replace("/");
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Accedi</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}
      />

      {errorMsg ? <Text style={{ color: "red" }}>{errorMsg}</Text> : null}

      <Pressable
        onPress={onLogin}
        disabled={loading}
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          alignItems: "center",
        }}
      >
        {loading ? <ActivityIndicator /> : <Text>Entra</Text>}
      </Pressable>

      <Text>
        Non hai un account? <Link href="/(auth)/signup">Registrati</Link>
      </Text>
    </View>
  );
}
