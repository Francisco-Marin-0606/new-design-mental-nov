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

interface CarouselItemProps {
  item: HypnosisSession;
  index: number;
  cardWidth: number;
  cardSpacing: number;
  snapInterval: number;
  scrollX: Animated.Value;
  onPress: (session: HypnosisSession) => void;
}

function CarouselItem({ item, index, cardWidth, cardSpacing, snapInterval, scrollX, onPress }: CarouselItemProps) {
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



  const pressScale = useRef(new Animated.Value(1)).current;
  const combinedScale = Animated.multiply(scale, pressScale);

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [pressScale]);

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          width: cardWidth,
          marginRight: index === HYPNOSIS_SESSIONS.length - 1 ? 0 : cardSpacing,
          transform: [{ scale: combinedScale }, { translateY }],
        },
      ]}
    >
      <Pressable
        testID="carousel-card"
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
        style={({ pressed }) => [
          styles.cardColumn,
          pressed && { opacity: 0.2 }
        ]}
      >
        {/*
          Sombra y contenedor exterior (mantiene sombras sin recortar)
          y contenedor interior con overflow:hidden para recortar el BlurView
        */}
        <View style={styles.cardShadow}>
          <View style={styles.cardInner}>
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} resizeMode="cover" />
          </View>
        </View>

        <Text style={[styles.cardTitle, { width: cardWidth }]} numberOfLines={3}>
          {item.title}
        </Text>

        {index === 0 && (
          <View style={styles.badge} testID="listen-badge">
            <Text style={styles.badgeText}>NUEVA</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const HYPNOSIS_SESSIONS_RAW: HypnosisSession[] = [
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

const HYPNOSIS_SESSIONS: HypnosisSession[] = [...HYPNOSIS_SESSIONS_RAW].reverse();

type ViewMode = 'carousel' | 'list' | 'previous';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<HypnosisSession | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Tamaño/espaciado estilo “foto 1”
  const cardWidth = useMemo(() => Math.min(263.35, screenWidth * 1.725), [screenWidth]);
  const cardSpacing = 20;
  const snapInterval = cardWidth + cardSpacing;
  const sidePadding = (screenWidth - cardWidth) / 2;

  const scrollX = useRef(new Animated.Value(0)).current;
  const currentIndexRef = useRef<number>(0);
  const lastHapticIndexRef = useRef<number>(0);

  const carouselScrollOffsetRef = useRef<number>(0);
  const listScrollOffsetRef = useRef<number>(0);
  const previousScrollOffsetRef = useRef<number>(0);

  const carouselFlatListRef = useRef<FlatList<HypnosisSession>>(null);
  const listFlatListRef = useRef<FlatList<HypnosisSession>>(null);
  const previousFlatListRef = useRef<FlatList<HypnosisSession>>(null);

  const isFirstLoadRef = useRef<boolean>(true);
  const [isCarouselReady, setIsCarouselReady] = useState<boolean>(true);

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
      carouselScrollOffsetRef.current = x;
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

  const handleCardPress = useCallback(async (session: HypnosisSession) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    setSelectedSession(session);
    handleOpen();
  }, [handleOpen]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<HypnosisSession>) => (
      <CarouselItem
        item={item}
        index={index}
        cardWidth={cardWidth}
        cardSpacing={cardSpacing}
        snapInterval={snapInterval}
        scrollX={scrollX}
        onPress={handleCardPress}
      />
    ),
    [cardWidth, cardSpacing, snapInterval, scrollX, handleCardPress]
  );

  const keyExtractor = useCallback((i: HypnosisSession) => i.id, []);

  const handleViewModeChange = useCallback(async (mode: ViewMode) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (mode === 'carousel' && !isFirstLoadRef.current && carouselScrollOffsetRef.current > 0) {
        setIsCarouselReady(false);
      }
      
      setViewMode(mode);
      isFirstLoadRef.current = false;
      slideAnim.setValue(50);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (mode === 'carousel' && carouselScrollOffsetRef.current > 0) {
          requestAnimationFrame(() => {
            carouselFlatListRef.current?.scrollToOffset({
              offset: carouselScrollOffsetRef.current,
              animated: false,
            });
            setTimeout(() => {
              setIsCarouselReady(true);
            }, 100);
          });
        } else if (mode === 'list' && listScrollOffsetRef.current > 0) {
          setTimeout(() => {
            listFlatListRef.current?.scrollToOffset({
              offset: listScrollOffsetRef.current,
              animated: false,
            });
          }, 50);
        } else if (mode === 'previous' && previousScrollOffsetRef.current > 0) {
          setTimeout(() => {
            previousFlatListRef.current?.scrollToOffset({
              offset: previousScrollOffsetRef.current,
              animated: false,
            });
          }, 50);
        }
      });
    });
  }, [fadeAnim, slideAnim]);

  const renderListItem = useCallback(
    ({ item }: ListRenderItemInfo<HypnosisSession>) => (
      <Pressable
        style={styles.listItem}
        onPress={() => handleCardPress(item)}
        android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
      >
        <Image source={{ uri: item.imageUri }} style={styles.listItemImage} resizeMode="cover" />
        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </Pressable>
    ),
    [handleCardPress]
  );

  const onListScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    listScrollOffsetRef.current = e?.nativeEvent?.contentOffset?.y ?? 0;
  }, []);

  const onPreviousScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    previousScrollOffsetRef.current = e?.nativeEvent?.contentOffset?.y ?? 0;
  }, []);

  const showToggle = HYPNOSIS_SESSIONS.length > 8;

  return (
    <View style={styles.root} testID="root-fullscreen">
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safe} testID="safe-area">
        <View style={styles.container}>
          <View style={styles.headerRow} testID="header-row">
            <Text style={styles.headerTitle}>Mis hipnosis</Text>
            <View style={styles.headerRight}>
              <Image
                source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/TuercaConfig.png' }}
                style={styles.headerIcon}
                resizeMode="contain"
                testID="header-settings-icon"
                accessibilityLabel="Configuración"
              />
            </View>
          </View>

          {showToggle && (
            <View style={styles.toggleRow} testID="toggle-under-title">
              <View style={styles.toggleContainer}>
                <Pressable
                  style={[styles.toggleOption, viewMode === 'carousel' && styles.toggleOptionActive]}
                  onPress={() => handleViewModeChange('carousel')}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                  testID="toggle-carousel"
                  accessibilityLabel="Vista carrusel"
                >
                  <View style={styles.toggleIconCarouselVertical}>
                    <View style={[styles.toggleIconBarSingle, viewMode === 'carousel' && styles.toggleIconActiveBg]} />
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.toggleOption, viewMode === 'list' && styles.toggleOptionActive]}
                  onPress={() => handleViewModeChange('list')}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                  testID="toggle-list"
                  accessibilityLabel="Vista lista"
                >
                  <View style={styles.toggleIconList}>
                    <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveBg]} />
                    <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveBg]} />
                    <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveBg]} />
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.toggleOption, styles.toggleOptionText, viewMode === 'previous' && styles.toggleOptionActive]}
                  onPress={() => handleViewModeChange('previous')}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                  testID="toggle-previous"
                  accessibilityLabel="Anteriores"
                >
                  <Text numberOfLines={1} style={[styles.toggleText, viewMode === 'previous' && styles.toggleTextActive]}>Anteriores</Text>
                </Pressable>
              </View>
            </View>
          )}

          {viewMode === 'carousel' ? (
            <Animated.View style={[styles.carouselContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              {!isCarouselReady && (
                <View style={styles.skeletonContainer}>
                  <View style={styles.skeletonCarouselWrapper}>
                    <View style={[styles.skeletonCard, styles.skeletonCardSide, { width: cardWidth * 0.9 }]} />
                    <View style={[styles.skeletonCard, styles.skeletonCardCenter, { width: cardWidth }]}>
                      <View style={styles.skeletonImage} />
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonTitleShort} />
                    </View>
                    <View style={[styles.skeletonCard, styles.skeletonCardSide, { width: cardWidth * 0.9 }]} />
                  </View>
                </View>
              )}
              <Animated.FlatList
                ref={carouselFlatListRef}
                data={HYPNOSIS_SESSIONS}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces
                alwaysBounceHorizontal
                overScrollMode={Platform.OS === 'android' ? 'always' : 'auto'}
                decelerationRate="fast"
                snapToInterval={snapInterval}
                snapToAlignment="start"
                onMomentumScrollEnd={onMomentumScrollEnd}
                testID="hypnosis-carousel"
                initialScrollIndex={isFirstLoadRef.current ? 0 : undefined}
                getItemLayout={(data: ArrayLike<HypnosisSession> | null | undefined, index: number) => ({
                  length: snapInterval,
                  offset: index * snapInterval,
                  index,
                })}
                contentContainerStyle={{ paddingLeft: sidePadding, paddingRight: sidePadding, paddingTop: 48, paddingBottom: 48 }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false, listener: onScroll }
                )}
                scrollEventThrottle={16}
                style={!isCarouselReady ? { opacity: 0 } : undefined}
              />
            </Animated.View>
          ) : viewMode === 'list' ? (
            <Animated.View style={[styles.listContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              <FlatList
                ref={listFlatListRef}
                data={HYPNOSIS_SESSIONS}
                keyExtractor={keyExtractor}
                renderItem={renderListItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContentContainer}
                testID="hypnosis-list"
                onScroll={onListScroll}
                scrollEventThrottle={16}
              />
            </Animated.View>
          ) : (
            <Animated.View style={[styles.listContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              <FlatList
                ref={previousFlatListRef}
                data={HYPNOSIS_SESSIONS.slice(Math.floor(HYPNOSIS_SESSIONS.length / 2))}
                keyExtractor={keyExtractor}
                renderItem={renderListItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContentContainer}
                testID="hypnosis-previous-list"
                ListEmptyComponent={<Text style={styles.emptyText}>Sin anteriores</Text>}
                onScroll={onPreviousScroll}
                scrollEventThrottle={16}
              />
            </Animated.View>
          )}
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

      <SwipeUpModal
        visible={modalVisible}
        onClose={handleClose}
        imageUri={selectedSession?.imageUri ?? ''}
        title={selectedSession?.title ?? ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#170501' },
  safe: { flex: 1, backgroundColor: '#170501' },
  container: { flex: 1, paddingTop: 24, paddingBottom: 20, justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 54,
    paddingRight: 54,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32.4,
    fontWeight: '700',
    color: '#fbefd9',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 28,
    height: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingLeft: 54,
    paddingRight: 54,
    marginBottom: 8,
  },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 239, 217, 0.15)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 6,
    alignItems: 'center',
  },
  toggleOption: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toggleOptionText: {
    paddingHorizontal: 10,
  },
  toggleOptionActive: {
    backgroundColor: '#c9841e',
  },
  toggleIconCarouselVertical: {
    width: 12,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIconBar: {
    width: 5,
    height: 14,
    backgroundColor: 'rgba(251, 239, 217, 0.6)',
    borderRadius: 2,
  },
  toggleIconBarSingle: {
    width: 12,
    height: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 239, 217, 0.6)',
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  toggleIconActiveBg: {
    borderColor: '#fbefd9',
  },
  toggleIconList: {
    width: 16,
    height: 12,
    justifyContent: 'space-between',
  },
  toggleIconListLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(251, 239, 217, 0.6)',
    borderRadius: 1,
  },
  toggleText: {
    color: 'rgba(251, 239, 217, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fbefd9',
  },

  // Carrusel
  carouselContainer: {
    flex: 1,
    position: 'relative',
  },
  cardWrapper: {
    alignItems: 'flex-start',
  },
  cardColumn: {
    alignSelf: 'stretch',
  },

  // Contenedor de sombra (no recorta sombras)
  cardShadow: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 18,
    backgroundColor: 'transparent',
  },

  // Contenedor interior que recorta la imagen + blur
  cardInner: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden', // clave para que el blur no se vea como "bloque"
    backgroundColor: '#2a1410',
    position: 'relative',
    justifyContent: 'center',
  },

  cardImage: { width: '100%', height: '100%' },



  cardTitle: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: '600',
    color: '#fbefd9',
    textAlign: 'left',
    paddingHorizontal: 4,
    lineHeight: 30,
  },

  badge: {
    marginTop: 15,
    alignSelf: 'flex-start',
    backgroundColor: '#c9841e',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fbefd9',
    letterSpacing: 0.2,
  },

  // Pie
  bottomSection: { paddingHorizontal: 44, paddingBottom: 65, paddingTop: 0 },
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
  nextButtonText: { fontSize: 20, fontWeight: '700', color: '#ffffff', opacity: 0.3 },

  listContainer: {
    flex: 1,
    paddingHorizontal: 44,
  },
  listContentContainer: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemImage: {
    width: 60,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#2a1410',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbefd9',
    lineHeight: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(251, 239, 217, 0.6)',
    marginTop: 24,
  },
  skeletonContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    bottom: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonCarouselWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  skeletonCard: {
    alignItems: 'flex-start',
  },
  skeletonCardSide: {
    aspectRatio: 4 / 5,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 239, 217, 0.05)',
    opacity: 0.5,
  },
  skeletonCardCenter: {
    alignItems: 'flex-start',
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 239, 217, 0.1)',
  },
  skeletonTitle: {
    width: '90%',
    height: 26,
    marginTop: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
  },
  skeletonTitleShort: {
    width: '60%',
    height: 26,
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
  },
});
