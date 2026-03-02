import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { Link, useRouter } from "expo-router";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSignup() {
    setErrorMsg(null);

    if (!email.includes("@")) return setErrorMsg("Email non valida.");
    if (password.length < 8) return setErrorMsg("Password: minimo 8 caratteri.");
    if (password !== confirm) return setErrorMsg("Le password non coincidono.");

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) return setErrorMsg(error.message);

    // Se hai email confirmation attiva, l’utente deve confermare la mail.
    // In ogni caso, puoi rimandarlo al login.
    router.replace("/(auth)/login");
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Crea account</Text>

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
      <TextInput
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        placeholder="Conferma password"
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}
      />

      {errorMsg ? <Text style={{ color: "red" }}>{errorMsg}</Text> : null}

      <Pressable
        onPress={onSignup}
        disabled={loading}
        style={{ borderWidth: 1, borderRadius: 8, padding: 12, alignItems: "center" }}
      >
        {loading ? <ActivityIndicator /> : <Text>Registrati</Text>}
      </Pressable>

      <Text>
        Hai già un account? <Link href="/(auth)/login">Accedi</Link>
      </Text>
    </View>
  );
}
