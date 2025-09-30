import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Pressable, Platform, Text, ScrollView, Image, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import SwipeUpModal from '@/components/SwipeUpModal';

interface HypnosisSession {
  id: string;
  title: string;
  imageUri: string;
}

const HYPNOSIS_SESSIONS: HypnosisSession[] = [
  {
    id: '1',
    title: 'Calma en los Colomos',
    imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/ImagenPrueba.png',
  },
  {
    id: '2',
    title: 'Célula de sanación',
    imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/IMG_7923.PNG',
  },
  {
    id: '3',
    title: 'El reloj quieto en la mesa',
    imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/ImagenPrueba.png',
  },
];

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { width: screenWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleOpen = useCallback(async () => {
    console.log('[HomeScreen] Opening SwipeUpModal via card press');
    
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    console.log('[HomeScreen] Closing SwipeUpModal');
    setModalVisible(false);
  }, []);

  const handleNextHypnosis = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    console.log('Next hypnosis button pressed');
  }, []);

  const cardWidth = screenWidth * 0.7;
  const cardSpacing = 20;

  return (
    <View style={styles.root} testID="root-fullscreen">
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safe} testID="safe-area">
        <View style={styles.container}>
          <Text style={styles.headerTitle}>Mis hipnosis</Text>
          
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardWidth + cardSpacing}
            snapToAlignment="center"
            contentContainerStyle={[styles.carouselContent, { paddingHorizontal: (screenWidth - cardWidth) / 2 }]}
            style={styles.carousel}
          >
            {HYPNOSIS_SESSIONS.map((session) => (
              <View key={session.id} style={[styles.cardWrapper, { width: cardWidth }]}>
                <Pressable
                  style={styles.card}
                  onPress={handleOpen}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
                >
                  <Image
                    source={{ uri: session.imageUri }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>ESCUCHAR</Text>
                  </View>
                </Pressable>
                <Text style={styles.cardTitle}>{session.title}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable
            style={styles.nextButton}
            onPress={handleNextHypnosis}
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
          >
            <Text style={styles.nextButtonText}>Próxima hipnosis en 15 días</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <SwipeUpModal visible={modalVisible} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#170501',
  },
  safe: {
    flex: 1,
    backgroundColor: '#170501',
  },
  container: {
    flex: 1,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#f9eedd',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  carousel: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingVertical: 20,
    gap: 20,
  },
  cardWrapper: {
    marginHorizontal: 10,
  },
  card: {
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2a1410',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9eedd',
    marginTop: 16,
  },
  badge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#d4621f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  nextButton: {
    marginHorizontal: 24,
    marginTop: 40,
    marginBottom: 40,
    backgroundColor: 'rgba(212, 98, 31, 0.5)',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
