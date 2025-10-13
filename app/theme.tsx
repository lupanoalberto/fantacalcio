// app/theme.tsx
import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "../constants/colors";

// Manteniamo la splash finché non carichiamo i font
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  // In dev può lanciare se chiamato due volte: ignoriamo in sicurezza
}

type Theme = {
  colors: typeof Colors;
  fonts: {
    regular: string;
    medium: string;
    bold: string;
  };
};

const defaultTheme: Theme = {
  colors: Colors,
  fonts: {
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    bold: "Poppins-Bold",
  },
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // nascondi la splash sia in caso di successo che di errore
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};