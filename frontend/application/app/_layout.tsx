import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular: require("@expo-google-fonts/montserrat/400Regular/Montserrat_400Regular.ttf"),
    Montserrat_500Medium: require("@expo-google-fonts/montserrat/500Medium/Montserrat_500Medium.ttf"),
    Montserrat_600SemiBold: require("@expo-google-fonts/montserrat/600SemiBold/Montserrat_600SemiBold.ttf"),
    Montserrat_700Bold: require("@expo-google-fonts/montserrat/700Bold/Montserrat_700Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="register-form" options={{ headerShown: false }} />
        <Stack.Screen name="register-agency" options={{ headerShown: false }} />
        <Stack.Screen name="(locataire)" options={{ headerShown: false }} />
        <Stack.Screen name="bien/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
