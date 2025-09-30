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
  { id: '1', title: 'Calma en los Colomos', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '2', title: 'Célula de sanación', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '3', title: 'El reloj quieto en la mesa', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '4', title: 'Respiración profunda', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '5', title: 'Meditación guiada', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '6', title: 'Sueño reparador', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '7', title: 'Paz interior', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '8', title: 'Energía positiva', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '9', title: 'Liberación emocional', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
  { id: '10', title: 'Conexión espiritual', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarrusel1.png' },
];

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  // Tamaño/espaciado estilo “foto 1”
  const cardWidth = useMemo(() => Math.min(176, screenWidth * 0.31), [screenWidth]);
  const cardSpacing = 20;
  const snapInterval = cardWidth + cardSpacing;
  const sidePadding = (screenWidth - cardWidth) / 2;

  const scrollX = useRef(new Animated.Value(0)).current;

  const handleOpen = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    }
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => setModalVisible(false), []);

  const handleNextHypnosis = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
  }, []);

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
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ESCUCHAR</Text>
            </View>
          </Pressable>

          {/* Título alineado al borde izquierdo de la tarjeta */}
          <Text style={[styles.cardTitle, { width: cardWidth }]} numberOfLines={2}>
            {item.title}
          </Text>
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
            contentContainerStyle={{ paddingLeft: sidePadding, paddingRight: sidePadding, paddingVertical: 18 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
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
  container: { flex: 1, paddingTop: 24, paddingBottom: 20 },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f9eedd',
    marginBottom: 28,
    paddingHorizontal: 24,
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
  },
  cardImage: { width: '100%', height: '100%' },
  cardTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#f9eedd',
    textAlign: 'left',
    paddingHorizontal: 4,
    lineHeight: 26,
  },
  badge: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    backgroundColor: '#d4621f',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.2,
  },

  // Pie
  bottomSection: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12 },
  nextButton: {
    backgroundColor: 'rgba(212, 98, 31, 0.5)',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
