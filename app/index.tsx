import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, ImageBackground, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeUpModal from '@/components/SwipeUpModal';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleOpen = useCallback(() => {
    console.log('[HomeScreen] Opening SwipeUpModal via background press');
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    console.log('[HomeScreen] Closing SwipeUpModal');
    setModalVisible(false);
  }, []);

  return (
    <View style={styles.root} testID="root-fullscreen">
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safe} testID="safe-area">
        <ImageBackground
          testID="home-hero-image"
          accessibilityLabel="Imagen de fondo"
          source={{
            uri:
              'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/IMG_7923.PNG',
          }}
          resizeMode="cover"
          style={styles.bg}
          imageStyle={styles.bgImage}
        >
          <Pressable
            testID="open-modal-touch-area"
            onPress={handleOpen}
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
            style={styles.touchFill}
            accessibilityRole="button"
            accessibilityHint="Toca cualquier parte para abrir"
          />
        </ImageBackground>
      </SafeAreaView>

      <SwipeUpModal visible={modalVisible} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgImage: {},
  touchFill: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
