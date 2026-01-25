// app/theme.tsx
import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "./constants/colors";
import { Fonts } from "./constants/fonts";

// Manteniamo la splash finché non carichiamo i font
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  // In dev può lanciare se chiamato due volte: ignoriamo in sicurezza
}

type Theme = {
  colors: typeof Colors;
  fonts: typeof Fonts;
};

const defaultTheme: Theme = {
  colors: Colors,
  fonts: {
    regular: "Onest-Regular",
    semibold: "Onest-SemiBold",
    bold: "Onest-Bold",
  },
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [fontsLoaded, fontError] = useFonts({
    "Onest-Regular": require("./assets/fonts/Onest-Regular.ttf"),
    "Onest-SemiBold": require("./assets/fonts/Onest-SemiBold.ttf"),
    "Onest-Bold": require("./assets/fonts/Onest-Bold.ttf"),
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