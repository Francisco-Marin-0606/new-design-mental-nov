import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import * as SystemUI from "expo-system-ui";
import { StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Only prevent auto hide on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="index" options={{ headerShown: false, statusBarTranslucent: true, statusBarBackgroundColor: 'transparent' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (Platform.OS !== 'web') {
          await SystemUI.setBackgroundColorAsync("transparent").catch((e) => console.log("SystemUI error", e));
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.log('App initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.flex} testID="gesture-root">
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
