// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // Reindirizza automaticamente alla navigazione a tab
  return <Redirect href="/(tabs)/serie-a" />;
}
