import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Premium() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sezione Premium 💎</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06151F", justifyContent: "center", alignItems: "center" },
  text: { color: "#f5f5f5", fontFamily: "Poppins_400Regular", fontSize: 16 },
});
