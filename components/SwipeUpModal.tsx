import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';

import { X, Download, Check } from 'lucide-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import PlayerModal from './PlayerModal';

type DownloadState = 'idle' | 'downloading' | 'completed';
interface ModalDownloadInfo { progress: number; state: DownloadState }

interface SwipeUpModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri?: string;
  title?: string;
  downloadInfo?: ModalDownloadInfo;
  onRequestDownload?: () => void;
}

export default function SwipeUpModal({ visible, onClose, imageUri, title, downloadInfo, onRequestDownload }: SwipeUpModalProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [isClient, setIsClient] = useState(Platform.OS !== 'web');
  
  // Initialize animated values with safe defaults for SSR
  const translateY = useRef(new Animated.Value(isClient ? screenHeight : 1000)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsClient(true);
      translateY.setValue(screenHeight);
    }
  }, [screenHeight, translateY]);

  const [activeTab, setActiveTab] = useState<'mensaje' | 'respuestas'>(() => 'mensaje');

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const [tabWidths, setTabWidths] = useState<{ mensaje: number; respuestas: number }>({ mensaje: 0, respuestas: 0 });
  const [tabPositions, setTabPositions] = useState<{ mensaje: number; respuestas: number }>({ mensaje: 0, respuestas: 0 });
  const tabWidthsRef = useRef(tabWidths);
  const tabPositionsRef = useRef(tabPositions);
  useEffect(() => { tabWidthsRef.current = tabWidths; }, [tabWidths]);
  useEffect(() => { tabPositionsRef.current = tabPositions; }, [tabPositions]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const backgroundTranslateY = useRef(new Animated.Value(0)).current;

  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const [indicatorInitialized, setIndicatorInitialized] = useState<boolean>(false);
  
  // Text animation values
  const textTranslateX = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  const [audioPlayerVisible, setAudioPlayerVisible] = useState<boolean>(false);

  const easeInOut = Easing.out(Easing.cubic);
  const DURATION_OPEN = 600;
  const DURATION_CLOSE = 600;
  const shiftY = useMemo(() => screenHeight * 0.03, [screenHeight]);

  const animateTabIndicator = useCallback((toTab: 'mensaje' | 'respuestas') => {
    const targetX = tabPositionsRef.current[toTab] ?? 0;
    Animated.timing(tabIndicatorPosition, {
      toValue: targetX,
      duration: 350,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: false,
    }).start();
  }, [tabIndicatorPosition]);

  const animateTextTransition = useCallback((direction: 'left' | 'right') => {
    const slideDistance = screenWidth * 0.25;
    const initialTranslateX = direction === 'left' ? slideDistance : -slideDistance;
    
    // Start with content off-screen in the opposite direction
    textTranslateX.setValue(initialTranslateX);
    textOpacity.setValue(0);
    
    // Animate content sliding in with faster animation
    Animated.parallel([
      Animated.timing(textTranslateX, {
        toValue: 0,
        duration: 350,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
    ]).start();
  }, [textTranslateX, textOpacity, screenWidth]);

  const switchToTabSafe = useCallback(async (toTab: 'mensaje' | 'respuestas', direction?: 'left' | 'right') => {
    // Add haptic feedback for tab switches
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    
    // Determine direction if not provided
    const currentTab = activeTabRef.current;
    const autoDirection = (currentTab === 'mensaje' && toTab === 'respuestas') ? 'left' : 'right';
    const slideDirection = direction || autoDirection;
    
    setActiveTab(toTab);
    animateTabIndicator(toTab);
    animateTextTransition(slideDirection);
  }, [animateTabIndicator, animateTextTransition]);

  const switchToTab = useCallback((toTab: 'mensaje' | 'respuestas') => {
    switchToTabSafe(toTab);
  }, [switchToTabSafe]);

  const isDownloading = downloadInfo?.state === 'downloading';
  const isDownloaded = downloadInfo?.state === 'completed';
  const downloadProgress = Math.max(0, Math.min(100, Math.round(downloadInfo?.progress ?? 0)));

  const startDownload = useCallback(async () => {
    if (isDownloading || isDownloaded) return;
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (error) { console.log('Haptic feedback error:', error); }
    }
    onRequestDownload?.();
  }, [isDownloading, isDownloaded, onRequestDownload]);

  const closeModal = useCallback(async () => {
    // Add haptic feedback
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: DURATION_CLOSE,
        easing: easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: DURATION_CLOSE,
        easing: easeInOut,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [opacity, translateY, screenHeight, onClose, easeInOut]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          const hasIntent = Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.vx) > 0.05;
          return isHorizontal && hasIntent;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          textTranslateX.stopAnimation();
          textOpacity.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          const dragResistance = 0.6;
          const maxDrag = screenWidth * 0.4;
          let dragOffset = gestureState.dx * dragResistance;
          dragOffset = Math.max(-maxDrag, Math.min(maxDrag, dragOffset));
          textTranslateX.setValue(dragOffset);
          const fadeAmount = Math.abs(dragOffset) / maxDrag;
          const nextOpacity = 1 - fadeAmount * 0.3;
          textOpacity.setValue(Math.max(0.7, nextOpacity));
        },
        onPanResponderRelease: (_, gestureState) => {
          const distanceThreshold = Math.max(24, screenWidth * 0.15);
          const velocityThreshold = 0.05;
          const isLeftSwipe = gestureState.dx <= -distanceThreshold || gestureState.vx <= -velocityThreshold;
          const isRightSwipe = gestureState.dx >= distanceThreshold || gestureState.vx >= velocityThreshold;
          const currentTab = activeTabRef.current;

          if (isLeftSwipe && currentTab === 'mensaje') {
            switchToTabSafe('respuestas', 'left');
            return;
          }
          if (isRightSwipe && currentTab === 'respuestas') {
            switchToTabSafe('mensaje', 'right');
            return;
          }

          Animated.parallel([
            Animated.spring(textTranslateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 7,
              velocity: Math.abs(gestureState.vx) * 100,
            }),
            Animated.spring(textOpacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 80,
              friction: 7,
            }),
          ]).start();
        },
      }),
    [switchToTabSafe, textTranslateX, textOpacity, screenWidth]
  );

  const openModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: DURATION_OPEN,
        easing: easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: DURATION_OPEN,
        easing: easeInOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, easeInOut]);

  useEffect(() => {
    if (visible) {
      openModal();
    }
  }, [visible, openModal]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(screenHeight);
      opacity.setValue(0);
    }
  }, [visible, translateY, opacity, screenHeight]);

  if (!visible || !isClient) return null;

  return (
    <View style={styles.overlay} testID="swipeup-overlay" pointerEvents={audioPlayerVisible ? 'box-none' : 'auto'}>
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" testID="modal-backdrop" />
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }],
          },
        ]}
        testID="swipeup-container"
      >
        <Animated.View
          style={[
            styles.modalGradientBg,
            {
              transform: [{ translateY: backgroundTranslateY }],
            },
          ]}
          pointerEvents="none"
        >
          {imageUri ? (
            <Animated.Image
              source={{ uri: imageUri }}
              style={styles.modalBgImage}
              resizeMode="cover"
            />
          ) : null}
          <Svg width={screenWidth} height={screenHeight * 1.8}>
            <Defs>
              <SvgLinearGradient id="modalBg" x1="0%" y1="0%" x2="86.6%" y2="50%">
                <Stop offset="0%" stopColor="#a2380e" stopOpacity={1} />
                <Stop offset="100%" stopColor="#7c2709" stopOpacity={1} />
              </SvgLinearGradient>
            </Defs>
            <Rect x={0} y={0} width={screenWidth} height={screenHeight * 1.8} fill="url(#modalBg)" />
          </Svg>
        </Animated.View>
        <View style={[styles.innerShift, { marginTop: shiftY }]} testID="modal-inner">
          <View style={styles.dragArea} testID="drag-area">
            <View style={styles.handle} />
          </View>

          <Animated.ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            testID="modal-scrollview"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              {
                useNativeDriver: false,
                listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                  const offsetY = event.nativeEvent.contentOffset.y;
                  const parallaxOffset = offsetY * 0.5;
                  backgroundTranslateY.setValue(-parallaxOffset);
                },
              }
            )}
            scrollEventThrottle={16}
          >
            <TouchableOpacity style={styles.closeButton} onPress={closeModal} testID="close-button" activeOpacity={0.1}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>

            <View style={styles.content}>
              <View style={styles.imageContainer}>
                <View style={styles.imageShadowContainer}>
                  <Image
                    source={{
                      uri: imageUri || 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/ImagenPrueba.png',
                    }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.title}>{title || 'El reloj quieto\nen la mesa'}</Text>
                <Text style={styles.durationText}>Duración: <Text style={styles.durationLight}>22:53</Text></Text>
              </View>
            </View>

            <View style={styles.actionsSection}>
              <View style={styles.actionsSectionInner}>
                <View style={styles.card} testID="info-actions-card">

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.playBtn}
                      activeOpacity={0.1}
                      onPress={async () => {
                        // Add haptic feedback
                        if (Platform.OS !== 'web') {
                          try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          } catch (error) {
                            console.log('Haptic feedback error:', error);
                          }
                        }
                        setAudioPlayerVisible(true);
                      }}
                      testID="play-button"
                      accessibilityRole="button"
                      accessibilityLabel="Reproducir"
                    >
                      <Image
                        source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/Reproducir.png' }}
                        style={styles.icon}
                      />
                      <Text style={styles.playText}>Reproducir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.downloadBtnSmall, 
                        isDownloading && styles.downloadBtnLoading,
                        isDownloaded && styles.downloadBtnCompleted
                      ]}
                      activeOpacity={isDownloading || isDownloaded ? 1 : 0.2}
                      onPress={startDownload}
                      testID="download-button"
                      accessibilityRole="button"
                      accessibilityLabel={
                        isDownloaded ? 'Descargada' : 
                        isDownloading ? `${downloadProgress}%` : 'Descargar'
                      }
                      disabled={isDownloading || isDownloaded}
                    >
                      {isDownloading && (
                        <View 
                          style={[
                            styles.downloadProgress,
                            { width: `${downloadProgress}%` },
                          ]}
                        />
                      )}
                      {isDownloaded ? (
                        <Check color="#FFFFFF" size={18} />
                      ) : (
                        <Download color="#FFFFFF" size={18} />
                      )}
                      <Text style={styles.downloadText}>
                        {isDownloaded ? 'Descargada' : 
                         isDownloading ? `${downloadProgress}%` : 'Descargar'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.explainBtnWide}
                    activeOpacity={0.2}
                    onPress={async () => {
                      // Add haptic feedback
                      if (Platform.OS !== 'web') {
                        try {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        } catch (error) {
                          console.log('Haptic feedback error:', error);
                        }
                      }
                      console.log('Explicación pressed');
                    }}
                    testID="explain-button"
                    accessibilityRole="button"
                    accessibilityLabel="Ver explicación"
                  >
                    <Image
                      source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/Explicacion.png' }}
                      style={styles.icon}
                    />
                    <Text style={styles.explainText}>Ver explicación</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.tabsSection} {...panResponder.panHandlers}>
              <View style={styles.tabsSectionInner}>
                <View style={styles.tabsContainer}>
                  <View style={styles.tabsRow} testID="tabs-row">
                    <TouchableOpacity
                      onPress={() => switchToTab('mensaje')}
                      activeOpacity={0.1}
                      style={styles.tabButton}
                      testID="tab-mensaje"
                      accessibilityRole="button"
                      accessibilityLabel="Mensaje Para Ti"
                      onLayout={(event) => {
                        const { width, x } = event.nativeEvent.layout;
                        setTabWidths(prev => ({ ...prev, mensaje: width }));
                        setTabPositions(prev => ({ ...prev, mensaje: x }));
                        if (activeTabRef.current === 'mensaje' && !indicatorInitialized) {
                          tabIndicatorPosition.setValue(x);
                          setIndicatorInitialized(true);
                        }
                      }}
                    >
                      <Text style={[styles.tabText, { opacity: activeTab === 'mensaje' ? 1 : 0.3 }]}>Mensaje Para Ti</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => switchToTab('respuestas')}
                      activeOpacity={0.1}
                      style={styles.tabButton}
                      testID="tab-respuestas"
                      accessibilityRole="button"
                      accessibilityLabel="Mis respuestas"
                      onLayout={(event) => {
                        const { width, x } = event.nativeEvent.layout;
                        setTabWidths(prev => ({ ...prev, respuestas: width }));
                        setTabPositions(prev => ({ ...prev, respuestas: x }));
                        if (activeTabRef.current === 'respuestas' && !indicatorInitialized) {
                          tabIndicatorPosition.setValue(x);
                          setIndicatorInitialized(true);
                        }
                      }}
                    >
                      <Text style={[styles.tabText, { opacity: activeTab === 'respuestas' ? 1 : 0.3 }]}>Mis respuestas</Text>
                    </TouchableOpacity>
                  </View>

                  <Animated.View 
                    style={[
                      styles.tabIndicator,
                      {
                        width: activeTab === 'mensaje' ? tabWidths.mensaje : tabWidths.respuestas,
                        transform: [{ translateX: tabIndicatorPosition }],
                      }
                    ]}
                  />
                </View>

                <View style={styles.tabContentContainer}>
                  <Animated.View 
                    style={[
                      styles.animatedContentContainer,
                      {
                        transform: [{ translateX: textTranslateX }],
                        opacity: textOpacity,
                      }
                    ]}
                  >
                    {activeTab === 'mensaje' ? (
                      <Text style={styles.longParagraph} testID="universe-paragraph">
                        Cuando te abras a la posibilidad, el universo te responde con señales sutiles y oportunidades claras.{'\n'}{'\n'}Respira profundo, suelta la prisa y permite que tu confianza marque el ritmo.{'\n'}{'\n'}Cada paso que das desde la calma amplifica tu dirección interior.{'\n'}{'\n'}Estás guiado.{'\n'}{'\n'}Todo lo que buscas también te está buscando a ti.{'\n'}{'\n'}
                        Permítete escuchar lo que ocurre en el silencio entre pensamientos.{'\n'}{'\n'}Allí se ordena lo que importa y se disuelve lo que pesa.{'\n'}{'\n'}No forces, acompasa.{'\n'}{'\n'}Lo que hoy parece lento, en realidad está madurando con precisión.{'\n'}{'\n'}Cada gesto de gratitud abre caminos invisibles, cada acto de presencia te devuelve a casa.{'\n'}{'\n'}
                        Si dudas, vuelve al cuerpo: respira largo, suaviza la mandíbula, suelta los hombros.{'\n'}{'\n'}Mira con ternura lo que sientes.{'\n'}{'\n'}Tu sensibilidad no es un obstáculo, es tu brújula.{'\n'}{'\n'}Cuando caminas desde la honestidad, la vida te sale al encuentro con sincronías que confirman tu rumbo.{'\n'}{'\n'}
                        Honra tus límites, celebra tus avances pequeños y recuerda: lo esencial no grita.{'\n'}{'\n'}Se revela en calma, a su tiempo perfecto.{'\n'}{'\n'}Confía.
                      </Text>
                    ) : (
                      <View style={styles.answersContainer} testID="answers-container">
                        <View style={styles.questionBlock}>
                          <Text style={styles.questionText}>1. Dime, ¿qué te caga de tu vida?</Text>
                          <Text style={styles.answerText}>Ejhshshshshsj</Text>
                          <View style={styles.separator} />
                        </View>
                        
                        <View style={styles.questionBlock}>
                          <Text style={styles.questionText}>2. Si Dios, o el universo, te estuviera leyendo. Y te dijera: &quot;Pide lo que de verdad quieres y te lo cumplo&quot; Lo que sea. ¿Qué pedirías?</Text>
                          <Text style={styles.answerText}>Hsjsjsjsjjs</Text>
                          <View style={styles.separator} />
                        </View>
                        
                        <View style={styles.questionBlock}>
                          <Text style={styles.questionText}>3. Dime tres cosas o personas que, cuando las piensas, te hacen sentir un agradecimiento profundísimo.</Text>
                          <Text style={styles.answerText}>Jsjsjsjsjsj</Text>
                        </View>
                      </View>
                    )}
                  </Animated.View>
                </View>
              </View>
            </View>
          </Animated.ScrollView>
        </View>
      </Animated.View>

      <PlayerModal
        visible={audioPlayerVisible}
        onClose={() => setAudioPlayerVisible(false)}
        mode="audio"
        title={title || 'El reloj quieto en la mesa'}
        mediaUri="https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Para%20ti/Hombre/Del%20miedo%20al%20amor%20-%20Unisex%20Version2.mp3"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  modalContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, overflow: 'hidden' },
  modalGradientBg: { ...StyleSheet.absoluteFillObject, height: '150%' },
  modalBgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.22 },
  gradientFill: { flex: 1 },
  innerShift: { flex: 1, position: 'relative' },
  dragArea: { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  handle: { width: 40, height: 4, backgroundColor: 'transparent', borderRadius: 2, marginBottom: 4 },
  closeButton: { position: 'absolute', top: 24, right: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10, marginRight: 20, marginBottom: 10 },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 120, position: 'relative' },
  content: { paddingHorizontal: 24, paddingTop: 56, marginTop: 40 },
  imageContainer: { alignItems: 'center', marginBottom: 24, alignSelf: 'center', width: '66%', maxWidth: 300, aspectRatio: 4 / 5, position: 'relative' },
  imageShadowContainer: {
    width: '100%', aspectRatio: 4 / 5, shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.45, shadowRadius: 12.5, elevation: 12.5, borderRadius: 16,
  },
  image: { width: '100%', height: '100%', borderRadius: 16 },
  textContainer: { alignItems: 'center', alignSelf: 'center', width: '80%', maxWidth: 344 },
  title: { fontSize: 32, fontWeight: '600', color: '#ffffff', textAlign: 'center', marginBottom: 0, lineHeight: 34 },
  card: {
    alignSelf: 'stretch', width: '100%', backgroundColor: '#984616', borderRadius: 22, paddingVertical: 16, paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  cardOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  infoTextCenter: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center', alignSelf: 'center', width: '100%' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  explainBtnWide: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b36017', paddingVertical: 10, borderRadius: 10, gap: 8,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
  },
  downloadBtnSmall: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: 10, borderRadius: 10, gap: 8,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, position: 'relative', overflow: 'hidden',
  },
  explainText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  playBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 10, gap: 8,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
  },
  playText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  actionsSection: { alignSelf: 'stretch', width: '100%', paddingTop: 24, paddingBottom: 24, marginTop: -24 },
  actionsSectionInner: { alignSelf: 'center', width: '80%', maxWidth: 520 },
  tabsSection: { alignSelf: 'stretch', width: '100%', paddingTop: 24, paddingBottom: 24, backgroundColor: 'transparent' },
  tabsSectionInner: { alignSelf: 'center', width: '80%', maxWidth: 520 },
  tabsContainer: { position: 'relative', marginBottom: 12 },
  tabsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 18, marginBottom: 8 },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, height: 3, backgroundColor: '#ffffff', borderRadius: 1.5 },
  tabButton: { paddingVertical: 4 },
  tabText: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', textAlign: 'left' },
  longParagraph: { fontSize: 18, color: '#ffffff', lineHeight: 24, opacity: 0.95, textAlign: 'left', marginTop: 0 },
  answersContainer: { gap: 32 },
  questionBlock: { gap: 16 },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', lineHeight: 26, textAlign: 'left' },
  answerText: { fontSize: 18, color: '#ffffff', lineHeight: 22, textAlign: 'left' },
  imageFadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 40 },
  imageFadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
  imageFadeLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 40 },
  imageFadeRight: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 40 },
  durationLight: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  durationText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 11, marginBottom: 16 },
  separator: { height: 1, backgroundColor: '#ffffff', opacity: 0.2, marginTop: 8 },
  icon: { width: 18, height: 18, resizeMode: 'contain' },
  downloadBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4621F', paddingVertical: 10, borderRadius: 10, position: 'relative', overflow: 'hidden' },
  downloadBtnLoading: { backgroundColor: '#b36017' },
  downloadBtnCompleted: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  downloadProgress: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 10 },
  downloadText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  tabContentContainer: { flex: 1 },
  animatedContentContainer: { flex: 1 },
});
