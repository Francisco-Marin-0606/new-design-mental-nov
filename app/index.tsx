import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
import { MoreVertical, Play, Download, MessageCircle, Edit3, Settings, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import SwipeUpModal from '@/components/SwipeUpModal';
import PlayerModal from '@/components/PlayerModal';

interface HypnosisSession {
  id: string;
  title: string;
  imageUri: string;
  durationSec: number;
}

type DownloadState = 'idle' | 'downloading' | 'completed';

interface DownloadInfo {
  progress: number;
  state: DownloadState;
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

interface ListItemProps {
  item: HypnosisSession;
  onPress: (session: HypnosisSession) => void;
  onMenuPress: (session: HypnosisSession) => void;
  viewMode: ViewMode;
  downloadInfo?: DownloadInfo;
}

function ListItem({ item, onPress, onMenuPress, viewMode, downloadInfo }: ListItemProps) {
  const pressScale = useRef(new Animated.Value(1)).current;

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

  const handleMenuPress = useCallback(async (e: any) => {
    e.stopPropagation();
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    onMenuPress(item);
  }, [item, onMenuPress]);

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <Pressable
        style={styles.listItem}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
      >
        {({ pressed }) => (
          <>
            <Image source={{ uri: item.imageUri }} style={[styles.listItemImage, pressed && { opacity: 0.2 }]} resizeMode="cover" />
            <View style={[styles.listItemContent, pressed && { opacity: 0.2 }]}>
              <Text style={styles.listItemTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.durationRow}>
                {downloadInfo?.state === 'downloading' && (
                  <View style={styles.downloadingIconContainer}>
                    <Download size={12} color="#ff9a2e" />
                    <Text style={styles.downloadingPercentage}>{Math.max(0, Math.min(100, Math.round(downloadInfo.progress)))}%</Text>
                  </View>
                )}
                {downloadInfo?.state === 'completed' && (
                  <View style={[styles.durationIconCircle, styles.durationIconCircleCompleted]}>
                    <Check size={12} color="#ffffff" />
                  </View>
                )}
                <Text style={styles.durationText}>Duración {formatDuration(item.durationSec)}</Text>
              </View>
            </View>

            <Pressable
              style={styles.menuButton}
              onPress={handleMenuPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertical color="#fbefd9" size={20} />
            </Pressable>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
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
          {index === 0 && (
            <View style={styles.badge} testID="listen-badge">
              <Text style={styles.badgeText}>NUEVA</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardTitle, { width: cardWidth }]} numberOfLines={3}>
          {item.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const HYPNOSIS_SESSIONS_RAW: HypnosisSession[] = [
  { id: '1', title: 'Calma profunda en los Colomos', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 30 * 60 + 14 },
  { id: '2', title: 'Célula de sanación y calma', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 20 * 60 + 24 },
  { id: '3', title: 'El reloj quieto sobre la mesa', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 18 * 60 + 5 },
  { id: '4', title: 'Respiración profunda para relajarte', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 25 * 60 + 10 },
  { id: '5', title: 'Meditación guiada para la noche', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 42 * 60 + 2 },
  { id: '6', title: 'Sueño reparador y tranquilo hoy', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 35 * 60 + 33 },
  { id: '7', title: 'Paz interior en cada respiración', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 19 * 60 + 11 },
  { id: '8', title: 'Energía positiva para tu día', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 28 * 60 + 46 },
  { id: '9', title: 'Liberación emocional suave y guiada', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 21 * 60 + 7 },
  { id: '10', title: 'Conexión espiritual serena y profunda', imageUri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/PruebaCarruselnaranja.jpg', durationSec: 31 * 60 + 54 },
];

const HYPNOSIS_SESSIONS: HypnosisSession[] = [...HYPNOSIS_SESSIONS_RAW].reverse();

type ViewMode = 'carousel' | 'list' | 'previous';

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = minutes.toString();
  const ss = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    const hh = hours.toString();
    const mm2 = minutes.toString().padStart(2, '0');
    return `${hh}:${mm2}:${ss}`;
  }
  return `${mm}:${ss}`;
}

type NavSection = 'hipnosis' | 'aura';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<HypnosisSession | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');
  const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);
  const [menuSession, setMenuSession] = useState<HypnosisSession | null>(null);
  const [menuViewMode, setMenuViewMode] = useState<ViewMode>('carousel');
  const [playerModalVisible, setPlayerModalVisible] = useState<boolean>(false);
  const [playerSession, setPlayerSession] = useState<HypnosisSession | null>(null);
  const [navSection, setNavSection] = useState<NavSection>('hipnosis');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [downloads, setDownloads] = useState<Record<string, DownloadInfo>>({});
  const timersRef = useRef<Record<string, NodeJS.Timeout | number>>({});

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

  const cardHeight = useMemo(() => cardWidth * (5 / 4), [cardWidth]);
  const titleHeight = 90;
  const totalCardHeight = cardHeight + titleHeight;

  const isFirstLoadRef = useRef<boolean>(true);
  const [isCarouselReady, setIsCarouselReady] = useState<boolean>(true);

  const toggleIndicatorAnim = useRef(new Animated.Value(0)).current;
  const [toggleButtonLayouts, setToggleButtonLayouts] = useState<{
    carousel: { x: number; width: number };
    list: { x: number; width: number };
    previous: { x: number; width: number };
  }>({ carousel: { x: 0, width: 32 }, list: { x: 0, width: 32 }, previous: { x: 0, width: 0 } });

  const navIndicatorAnim = useRef(new Animated.Value(0)).current;
  const [navButtonLayouts, setNavButtonLayouts] = useState<{
    hipnosis: { x: number; width: number };
    aura: { x: number; width: number };
  }>({ hipnosis: { x: 0, width: 100 }, aura: { x: 0, width: 100 } });

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

  const handleNavSectionChange = useCallback(async (section: NavSection) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }

    const targetPosition = section === 'hipnosis' ? 0 : 1;
    Animated.spring(navIndicatorAnim, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();

    setNavSection(section);
  }, [navIndicatorAnim]);

  const handleViewModeChange = useCallback(async (mode: ViewMode) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }

    const targetPosition = mode === 'carousel' ? 0 : mode === 'list' ? 1 : 2;
    Animated.spring(toggleIndicatorAnim, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();

    const isChangingToPrevious = mode === 'previous';
    const isChangingFromPrevious = viewMode === 'previous';
    const shouldAnimate = isChangingToPrevious || isChangingFromPrevious;

    if (shouldAnimate) {
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
        const enterFrom = mode === 'previous' ? 50 : -50;
        slideAnim.setValue(enterFrom);
        
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
    } else {
      if (mode === 'carousel' && !isFirstLoadRef.current && carouselScrollOffsetRef.current > 0) {
        setIsCarouselReady(false);
      }
      
      setViewMode(mode);
      isFirstLoadRef.current = false;
      
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
      }
    }
  }, [fadeAnim, slideAnim, toggleIndicatorAnim, viewMode]);

  const handleMenuPress = useCallback((session: HypnosisSession, mode: ViewMode) => {
    setMenuSession(session);
    setMenuViewMode(mode);
    setMenuModalVisible(true);
  }, []);

  const handleMenuClose = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    setMenuModalVisible(false);
  }, []);

  const handleMenuAction = useCallback(async (action: string) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    console.log(`Action: ${action} for session:`, menuSession?.title);
    setMenuModalVisible(false);
    
    if (!menuSession) return;

    if (action === 'play') {
      setPlayerSession(menuSession);
      setPlayerModalVisible(true);
    }

    if (action === 'download') {
      const id = menuSession.id;
      setDownloads((prev) => ({
        ...prev,
        [id]: { progress: 0, state: 'downloading' },
      }));
      try {
        const stepMs = 400;
        const handle = setInterval(() => {
          setDownloads((prev) => {
            const current = prev[id] ?? { progress: 0, state: 'downloading' };
            if (current.state !== 'downloading') return prev;
            const next = Math.min(100, (current.progress ?? 0) + Math.floor(5 + Math.random() * 12));
            const state: DownloadState = next >= 100 ? 'completed' : 'downloading';
            return { ...prev, [id]: { progress: next, state } };
          });
        }, stepMs) as unknown as number;
        timersRef.current[id] = handle;
      } catch (e) {
        console.log('Download simulation error', e);
        setDownloads((prev) => ({ ...prev, [id]: { progress: 0, state: 'idle' } }));
      }
    }
  }, [menuSession]);

  const handleListItemPress = useCallback(async (session: HypnosisSession) => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    
    if (viewMode === 'previous') {
      setPlayerSession(session);
      setPlayerModalVisible(true);
    } else {
      setSelectedSession(session);
      handleOpen();
    }
  }, [viewMode, handleOpen]);

  useEffect(() => {
    Object.entries(downloads).forEach(([id, info]) => {
      if (info?.state === 'completed' && timersRef.current[id]) {
        const t = timersRef.current[id];
        if (typeof t === 'number') clearInterval(t as number);
        timersRef.current[id] = 0;
      }
    });
  }, [downloads]);

  const menuDownload: DownloadInfo | undefined = menuSession ? downloads[menuSession.id] : undefined;

  const renderListItem = useCallback(
    ({ item }: ListRenderItemInfo<HypnosisSession>) => (
      <ListItem
        item={item}
        onPress={handleListItemPress}
        onMenuPress={(session) => handleMenuPress(session, viewMode)}
        viewMode={viewMode}
        downloadInfo={downloads[item.id]}
      />
    ),
    [handleListItemPress, handleMenuPress, viewMode, downloads]
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
              <Settings
                color="#fbefd9"
                size={28}
                strokeWidth={1.5}
                testID="header-settings-icon"
                accessibilityLabel="Configuración"
              />
            </View>
          </View>

          {showToggle && (
            <View style={styles.toggleRow} testID="toggle-under-title">
              <View style={styles.toggleContainer}>
                <Animated.View
                  style={[
                    styles.toggleIndicator,
                    {
                      transform: [{
                        translateX: toggleIndicatorAnim.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [
                            toggleButtonLayouts.carousel.x,
                            toggleButtonLayouts.list.x,
                            toggleButtonLayouts.previous.x,
                          ],
                        }),
                      }],
                      width: toggleIndicatorAnim.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [
                          toggleButtonLayouts.carousel.width,
                          toggleButtonLayouts.list.width,
                          toggleButtonLayouts.previous.width,
                        ],
                      }),
                    },
                  ]}
                />
                <Pressable
                  style={styles.toggleOption}
                  onPress={() => handleViewModeChange('carousel')}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                  testID="toggle-carousel"
                  accessibilityLabel="Vista carrusel"
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setToggleButtonLayouts(prev => ({ ...prev, carousel: { x, width } }));
                  }}
                >
                  <View style={styles.toggleIconCarouselVertical}>
                    <View style={[styles.toggleIconBarSingle, viewMode === 'carousel' && styles.toggleIconActiveBg]} />
                  </View>
                </Pressable>
                <Pressable
                  style={styles.toggleOption}
                  onPress={() => handleViewModeChange('list')}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                  testID="toggle-list"
                  accessibilityLabel="Vista lista"
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setToggleButtonLayouts(prev => ({ ...prev, list: { x, width } }));
                  }}
                >
                  <View style={styles.toggleIconList}>
                    <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveListLine]} />
                    <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveListLine]} />
                    <View style={[styles.toggleIconListLine, viewMode === 'list' && styles.toggleIconActiveListLine]} />
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.toggleOption, styles.toggleOptionText]}
                  onPress={() => handleViewModeChange('previous')}
                  android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
                  testID="toggle-previous"
                  accessibilityLabel="Anteriores"
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setToggleButtonLayouts(prev => ({ ...prev, previous: { x, width } }));
                  }}
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
                contentContainerStyle={{
                  paddingLeft: sidePadding,
                  paddingRight: sidePadding,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
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

        <View style={styles.footerNav}>
          <View style={styles.navToggleContainer}>
            <Pressable
              style={styles.navToggleOption}
              onPress={() => handleNavSectionChange('hipnosis')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
              testID="nav-hipnosis"
              accessibilityLabel="Hipnosis"
            >
              <Image
                source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/FooterHipnosis.png' }}
                style={[styles.navIconImage, { opacity: navSection === 'hipnosis' ? 1 : 0.2 }]}
                resizeMode="contain"
              />
            </Pressable>
            <Pressable
              style={styles.navToggleOption}
              onPress={() => handleNavSectionChange('aura')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', borderless: true } : undefined}
              testID="nav-aura"
              accessibilityLabel="Aura"
            >
              <Image
                source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/icono_aura.png' }}
                style={[styles.navIconImage, { opacity: navSection === 'aura' ? 1 : 0.2 }]}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <SwipeUpModal
        visible={modalVisible}
        onClose={handleClose}
        imageUri={selectedSession?.imageUri ?? ''}
        title={selectedSession?.title ?? ''}
      />

      {menuModalVisible && (
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuBackdrop} onPress={handleMenuClose} />
          <View style={styles.menuContainer}>
            <View style={styles.menuGradientBg}>
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <SvgLinearGradient id="menuBg" x1="0%" y1="0%" x2="86.6%" y2="50%">
                    <Stop offset="0%" stopColor="#a2380e" stopOpacity={1} />
                    <Stop offset="100%" stopColor="#7c2709" stopOpacity={1} />
                  </SvgLinearGradient>
                </Defs>
                <Rect x={0} y={0} width="100%" height="100%" fill="url(#menuBg)" />
              </Svg>
            </View>
            
            <View style={styles.menuContent}>
              <View style={styles.sheetHandle} />
              <Text style={styles.menuTitle} numberOfLines={2}>{menuSession?.title}</Text>

              <Pressable
                style={styles.menuPrimary}
                onPress={() => handleMenuAction('play')}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.15)' } : undefined}
                testID="menu-primary-play"
                accessibilityLabel="Reproducir"
              >
                <Play color="#1a0d08" size={22} fill="#1a0d08" />
                <Text style={styles.menuPrimaryText}>Reproducir ahora</Text>
              </Pressable>

              <View style={styles.menuDivider} />

              <Pressable
                style={[styles.menuItem, { overflow: 'hidden' }]}
                onPress={() => handleMenuAction('download')}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
                testID="menu-download"
                accessibilityLabel="Descargar"
              >
                {menuDownload?.state === 'downloading' && (
                  <View 
                    style={[
                      styles.menuItemProgressBar,
                      { width: `${Math.max(0, Math.min(100, Math.round(menuDownload.progress)))}%` }
                    ]}
                  />
                )}
                <View style={[styles.menuIconContainer, styles.menuIconAccent]}>
                  {menuDownload?.state === 'completed' ? (
                    <Check color="#ffffff" size={20} />
                  ) : (
                    <Download color="#ffffff" size={20} />
                  )}
                </View>
                <Text style={styles.menuItemText}>
                  {menuDownload?.state === 'completed' ? 'Descargada' : 'Descargar'}
                </Text>
                {menuDownload?.state === 'downloading' && (
                  <Text style={styles.menuItemMeta}>{Math.max(0, Math.min(100, Math.round(menuDownload.progress)))}%</Text>
                )}
              </Pressable>

              {menuViewMode === 'previous' && (
                <>
                  <View style={styles.menuDivider} />
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => handleMenuAction('qa')}
                    android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
                    testID="menu-qa"
                    accessibilityLabel="Preguntas y respuestas"
                  >
                    <View style={styles.menuIconContainer}>
                      <MessageCircle color="#ffffff" size={20} />
                    </View>
                    <Text style={styles.menuItemText}>Preguntas y respuestas</Text>
                  </Pressable>

                  <Pressable
                    style={styles.menuItem}
                    onPress={() => handleMenuAction('rename')}
                    android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
                    testID="menu-rename"
                    accessibilityLabel="Cambiar nombre"
                  >
                    <View style={styles.menuIconContainer}>
                      <Edit3 color="#ffffff" size={20} />
                    </View>
                    <Text style={styles.menuItemText}>Cambiar nombre</Text>
                  </Pressable>
                </>
              )}

              <View style={styles.menuSpacer} />
              <Pressable
                style={styles.menuCancel}
                onPress={handleMenuClose}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.15)' } : undefined}
                testID="menu-cancel"
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.menuCancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <PlayerModal
        visible={playerModalVisible}
        onClose={() => setPlayerModalVisible(false)}
        mode="audio"
        title={playerSession?.title}
        mediaUri="https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Carrusel%20V2/Mental%20Login%20Background_1.mp4"
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
    paddingLeft: 44,
    paddingRight: 44,
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
    paddingLeft: 44,
    paddingRight: 44,
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
    position: 'relative',
  },
  toggleIndicator: {
    position: 'absolute',
    height: 32,
    backgroundColor: '#c9841e',
    borderRadius: 6,
    top: 4,
  },
  toggleOption: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  toggleOptionText: {
    paddingHorizontal: 10,
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
  toggleIconActiveListLine: {
    backgroundColor: '#fbefd9',
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
    justifyContent: 'center',
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
    position: 'relative',
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
    position: 'absolute',
    top: -17.5,
    right: 16,
    backgroundColor: '#c9841e',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fbefd9',
    letterSpacing: 0.2,
  },

  // Pie
  bottomSection: { paddingHorizontal: 44, paddingBottom: 0, paddingTop: 0 },
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
    marginBottom: 60,
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
    paddingRight: 40,
  },
  durationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 239, 217, 0.3)',
  },
  durationIconCircleCompleted: {
    backgroundColor: '#c9841e',
    borderColor: '#c9841e',
  },
  durationText: {
    color: 'rgba(251, 239, 217, 0.6)',
    fontSize: 14,
  },
  downloadingLabel: {
    color: '#ff9a2e',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  downloadingIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 154, 46, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  downloadingPercentage: {
    color: '#ff9a2e',
    fontSize: 12,
    fontWeight: '700',
  },
  menuButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -5 }],
    padding: 4,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  menuContainer: {
    borderRadius: 20,
    width: '92%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  menuGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    lineHeight: 28,
  },
  menuPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  menuPrimaryText: {
    color: '#1a0d08',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
    position: 'relative',
  },
  menuItemProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
  },
  menuIconContainer: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconAccent: {
    width: 22,
    height: 22,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    letterSpacing: 0.2,
  },
  menuItemMeta: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    opacity: 0.9,
  },
  menuSpacer: {
    height: 12,
  },
  menuCancel: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCancelText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(251, 239, 217, 0.6)',
    marginTop: 24,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 44,
    paddingBottom: 20,
    paddingTop: 10,
    marginBottom: 15,
  },
  navToggleContainer: {
    flexDirection: 'row',
    gap: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navToggleOption: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navToggleText: {
    color: 'rgba(251, 239, 217, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navToggleTextActive: {
    color: '#fbefd9',
  },
  navIconImage: {
    width: 42,
    height: 42,
  },
  skeletonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingTop: -190,
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
