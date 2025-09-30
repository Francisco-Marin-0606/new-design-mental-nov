import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Pressable, Platform, Text, ScrollView, Image, useWindowDimensions, Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
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
    imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png',
  },
  {
    id: '2',
    title: 'Célula de sanación',
    imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png',
  },
  {
    id: '3',
    title: 'El reloj quieto en la mesa',
    imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png',
  },
];

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { width: screenWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

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
  const cardSpacing = 12;
  const sidePreview = screenWidth * 0.15;
  const snapInterval = cardWidth + cardSpacing;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { useNativeDriver: false }
    )(event);
  }, [scrollX]);

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
            snapToInterval={snapInterval}
            snapToAlignment="start"
            contentContainerStyle={[styles.carouselContent, { paddingLeft: sidePreview, paddingRight: sidePreview }]}
            style={styles.carousel}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {HYPNOSIS_SESSIONS.map((session, index) => {
              const inputRange = [
                (index - 1) * snapInterval,
                index * snapInterval,
                (index + 1) * snapInterval,
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.8, 1, 0.8],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={session.id}
                  style={[
                    styles.cardWrapper,
                    { 
                      width: cardWidth,
                      marginRight: index < HYPNOSIS_SESSIONS.length - 1 ? cardSpacing : 0,
                      transform: [{ scale }],
                    },
                  ]}
                >
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
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.bottomSection}>
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
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f9eedd',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  carousel: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingVertical: 20,
  },
  cardWrapper: {
    alignItems: 'center',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#f9eedd',
    marginTop: 20,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#d4621f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  nextButton: {
    backgroundColor: 'rgba(212, 98, 31, 0.5)',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
