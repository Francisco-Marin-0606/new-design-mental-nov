import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Text,
  Image,
  useWindowDimensions,
  Animated,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
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
  { id: '1', title: 'Calma profunda en los Colomos', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '2', title: 'Célula de sanación y calma', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '3', title: 'El reloj quieto sobre la mesa', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '4', title: 'Respiración profunda para relajarte', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '5', title: 'Meditación guiada para la noche', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '6', title: 'Sueño reparador y tranquilo hoy', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '7', title: 'Paz interior en cada respiración', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '8', title: 'Energía positiva para tu día', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '9', title: 'Liberación emocional suave y guiada', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
  { id: '10', title: 'Conexión espiritual serena y profunda', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg' },
];

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Tamaño/espaciado estilo “foto 1”
  const cardWidth = useMemo(() => Math.min(263.35, screenWidth * 1.725), [screenWidth]);
  const cardSpacing = 20;
  const snapInterval = cardWidth + cardSpacing;
  const sidePadding = (screenWidth - cardWidth) / 2;

  const scrollX = useRef(new Animated.Value(0)).current;
  const topShift = useMemo(() => Math.round(screenHeight * 0.10), [screenHeight]);
  const currentIndexRef = useRef<number>(0);
  const lastHapticIndexRef = useRef<number>(0);

  const handleOpen = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => setModalVisible(false), []);

  const handleNextHypnosis = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
  }, []);

  const onScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    try {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      const currentIndex = Math.round(x / snapInterval);
      
      if (currentIndex !== lastHapticIndexRef.current) {
        lastHapticIndexRef.current = currentIndex;
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }
      }
    } catch (err) {
      console.log('[Carousel] onScroll error', err);
    }
  }, [snapInterval]);

  const onMomentumScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    try {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      const nextIndex = Math.round(x / snapInterval);
      currentIndexRef.current = nextIndex;
      console.log('[Carousel] momentum end x:', x, 'nextIndex:', nextIndex);
    } catch (err) {
      console.log('[Carousel] onMomentumScrollEnd error', err);
    }
  }, [snapInterval]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<HypnosisSession>) => {
      const inputRange = [
        (index - 1) * snapInterval,
        index * snapInterval,
        (index + 1) * snapInterval,
      ];

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.9, 1, 0.9],
        extrapolate: 'clamp',
      });

      const translateY = scrollX.interpolate({
        inputRange,
        outputRange: [8, 0, 8],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              width: cardWidth,
              marginRight: index === HYPNOSIS_SESSIONS.length - 1 ? 0 : cardSpacing,
              transform: [{ scale }, { translateY }],
            },
          ]}
        >
          <Pressable style={styles.card} onPress={handleOpen} android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}>
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} resizeMode="cover" />

          </Pressable>

          {/* Título alineado al borde izquierdo de la tarjeta */}
          <Text style={[styles.cardTitle, { width: cardWidth }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.badge} testID="listen-badge">
            <Text style={styles.badgeText}>ESCUCHAR</Text>
          </View>
        </Animated.View>
      );
    },
    [cardWidth, cardSpacing, snapInterval, scrollX]
  );

  const keyExtractor = useCallback((i: HypnosisSession) => i.id, []);

  return (
    <View style={styles.root} testID="root-fullscreen">
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safe} testID="safe-area">
        <View style={styles.container}>
          <Text style={styles.headerTitle}>Mis hipnosis</Text>

          <Animated.FlatList
            data={HYPNOSIS_SESSIONS}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            snapToInterval={snapInterval}
            snapToAlignment="start"
            onMomentumScrollEnd={onMomentumScrollEnd}
            testID="hypnosis-carousel"
            initialScrollIndex={HYPNOSIS_SESSIONS.length - 1}
            getItemLayout={(data: ArrayLike<HypnosisSession> | null | undefined, index: number) => ({
              length: snapInterval,
              offset: sidePadding + index * snapInterval,
              index,
            })}
            contentContainerStyle={{ paddingLeft: sidePadding, paddingRight: sidePadding, paddingTop: 18 + topShift, paddingBottom: 18 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false, listener: onScroll }
            )}
            scrollEventThrottle={16}
          />
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
  root: { flex: 1, backgroundColor: '#170501' },
  safe: { flex: 1, backgroundColor: '#170501' },
  container: { flex: 1, paddingTop: 24, paddingBottom: 20, justifyContent: 'center' },
  headerTitle: {
    fontSize: 32.4,
    fontWeight: '700',
    color: '#fbefd9',
    paddingLeft: 54,
    paddingRight: 24,
  },

  // Carrusel
  cardWrapper: {
    alignItems: 'flex-start', // título alineado a la izquierda de la tarjeta
  },
  card: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2a1410',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 18,
    position: 'relative',
    justifyContent: 'center' 
  },
  cardImage: { width: '100%', height: '100%' },
  cardTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#fbefd9',
    textAlign: 'left',
    paddingHorizontal: 4,
    lineHeight: 26,
  },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#d4621f',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.2,
  },

  // Pie
  bottomSection: { paddingHorizontal: 44, paddingBottom: 65, paddingTop: 12 },
  nextButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4d1904',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
});
