
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { X } from 'lucide-react-native';

export type Mode = 'audio' | 'video';

interface PlayerModalProps {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
  title?: string;
  mediaUri: string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.log('PlayerModal error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer} testID="player-error-boundary">
          <Text style={styles.errorText}>Algo salió mal. Cierra el reproductor e intenta nuevamente.</Text>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

const BACKGROUND_URI =
  'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/Mental%20Login%20Background.mp4';

export default function PlayerModal({ visible, onClose, mode, title = 'Reproductor', mediaUri }: PlayerModalProps) {
  const { height: screenHeight } = useWindowDimensions();

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const isDraggingRef = useRef<boolean>(false);

  const videoRef = useRef<Video>(null);             // principal (video o "pista de audio" oculta)
  const webVideoRef = useRef<HTMLVideoElement | null>(null); // web video visible (o pista)
  const webAudioRef = useRef<HTMLAudioElement | null>(null); // web audio cuando mode === 'audio'

  // === Estado liviano (evitamos guardar "status" entero en state) ===
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // refs para throttling/RAF
  const rafRef = useRef<number | null>(null);

  const easeInOut = Easing.out(Easing.cubic);
  const DURATION_OPEN = 600;
  const DURATION_CLOSE = 600;
  const DURATION_SNAP = 420;
  const HANDLE_CLOSE_THRESHOLD = 100;
  const VELOCITY_CLOSE_THRESHOLD = 0.5;

  const formatTime = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // ====== PLAY/PAUSE ======
  const togglePlayPause = useCallback(async () => {
    try {
      const next = !isPlaying;
      setIsPlaying(next);
      if (Platform.OS === 'web') {
        // En web, accionamos manualmente el <video>/<audio> nativo
        if (mode === 'audio') {
          const el = webAudioRef.current;
          if (el) {
            if (next) await el.play();
            else el.pause();
          }
        } else {
          const el = webVideoRef.current;
          if (el) {
            if (next) await el.play();
            else el.pause();
          }
        }
      }
      // En native NO llamamos playAsync/pauseAsync si usamos shouldPlay,
      // para evitar peleas de estado.
    } catch (err) {
      console.log('togglePlayPause error:', err);
    }
  }, [isPlaying, mode]);

  const skipBy = useCallback(
    async (deltaMs: number) => {
      try {
        const target = Math.max(0, Math.min(duration ?? 0, (position ?? 0) + deltaMs));
        if (Platform.OS === 'web') {
          if (mode === 'audio') {
            const el = webAudioRef.current;
            if (el) el.currentTime = target / 1000;
          } else {
            const el = webVideoRef.current;
            if (el) el.currentTime = target / 1000;
          }
          setPosition(target);
        } else if (videoRef.current) {
          await videoRef.current.setPositionAsync(target);
          setPosition(target);
        }
      } catch (err) {
        console.log('skipBy error:', err);
      }
    },
    [duration, position, mode]
  );

  // ====== Animaciones de apertura/cierre ======
  const closeAnimated = useCallback(
    (done: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: DURATION_CLOSE, easing: easeInOut, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: screenHeight, duration: DURATION_CLOSE, easing: easeInOut, useNativeDriver: true }),
      ]).start(() => done());
    },
    [DURATION_CLOSE, easeInOut, opacity, screenHeight, translateY]
  );

  const closeModal = useCallback(() => {
    try {
      setIsPlaying(false);
      if (Platform.OS === 'web') {
        if (mode === 'audio') webAudioRef.current?.pause();
        else webVideoRef.current?.pause();
      } else {
        // En native dependemos de shouldPlay=false para pausar
        // (evitamos llamadas redundantes a pauseAsync()).
      }
    } catch {}
    closeAnimated(onClose);
  }, [closeAnimated, onClose, mode]);

  // ====== Gestos ======
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gs) => Math.abs(gs.dy) > Math.abs(gs.dx) && Math.abs(gs.dy) > 10,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          translateY.stopAnimation();
          opacity.stopAnimation();
        },
        onPanResponderMove: (_evt, gs) => {
          if (gs.dy > 0) {
            translateY.setValue(gs.dy);
            const progress = Math.min(gs.dy / screenHeight, 1);
            opacity.setValue(1 - progress);
          }
        },
        onPanResponderRelease: (_evt, gs) => {
          isDraggingRef.current = false;
          const shouldClose = gs.dy > HANDLE_CLOSE_THRESHOLD || gs.vy > VELOCITY_CLOSE_THRESHOLD;
          if (shouldClose) {
            closeModal();
          } else {
            Animated.parallel([
              Animated.timing(translateY, { toValue: 0, duration: DURATION_SNAP, easing: easeInOut, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: DURATION_SNAP, easing: easeInOut, useNativeDriver: true }),
            ]).start();
          }
        },
      }),
    [HANDLE_CLOSE_THRESHOLD, VELOCITY_CLOSE_THRESHOLD, DURATION_SNAP, easeInOut, opacity, screenHeight, translateY, closeModal]
  );

  // ====== Apertura ======
  const openModal = useCallback(() => {
    if (isDraggingRef.current) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: DURATION_OPEN, easing: easeInOut, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: DURATION_OPEN, easing: easeInOut, useNativeDriver: true }),
    ]).start(async () => {
      setIsPlaying(true); // fuente de verdad única
      if (Platform.OS === 'web') {
        try {
          if (mode === 'audio') await webAudioRef.current?.play();
          else await webVideoRef.current?.play();
        } catch (err) {
          console.log('openModal play (web) error:', err);
        }
      }
    });
  }, [DURATION_OPEN, easeInOut, opacity, translateY, mode]);

  useEffect(() => {
    if (visible) openModal();
  }, [visible, openModal]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(screenHeight);
      opacity.setValue(0);
      setIsPlaying(false);
    }
  }, [visible, screenHeight, translateY, opacity]);

  // ====== Listener de status (native) con throttle vía rAF ======
  const handlePlaybackStatus = useCallback((s: AVPlaybackStatus) => {
    if (!('isLoaded' in s) || !s.isLoaded) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setPosition(s.positionMillis ?? 0);
      setDuration(s.durationMillis ?? 0);
      setIsPlaying(!!s.isPlaying);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ====== Web events para progreso ======
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = mode === 'audio' ? webAudioRef.current : webVideoRef.current;
    if (!el) return;

    const onTime = () => {
      setPosition((el.currentTime ?? 0) * 1000);
      setDuration((el.duration ?? 0) * 1000);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [visible, mode]);

  if (!visible) return null;

  const progressPct = duration > 0 ? Math.min((position / duration) * 100, 100) : 0;

  return (
    <ErrorBoundary>
      <View style={styles.overlay} testID="player-overlay" pointerEvents="auto">
        <Animated.View style={[styles.backdrop, { opacity }]} testID="player-backdrop" pointerEvents="auto" />

        <Animated.View
          style={[styles.modalContainer, { height: screenHeight, transform: [{ translateY }] }]}
          testID="player-container"
        >
          {mode === 'video' ? (
            Platform.OS !== 'web' ? (
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: mediaUri }}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={isPlaying}
                onPlaybackStatusUpdate={handlePlaybackStatus}
                testID="player-video"
              />
            ) : (
              <View style={[styles.video, styles.webVideoFallback]} testID="player-web-video-fallback">
                <video ref={webVideoRef} style={styles.webVideo} autoPlay loop muted={false} playsInline>
                  <source src={mediaUri} type="video/mp4" />
                </video>
              </View>
            )
          ) : (
            // ======= Modo AUDIO =======
            Platform.OS !== 'web' ? (
              <>
                {/* Fondo visual (muteado) */}
                <Video
                  style={styles.video}
                  source={{ uri: BACKGROUND_URI }}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  isLooping
                  isMuted
                  shouldPlay={isPlaying}
                  // No necesitamos status acá
                />
                {/* Pista de audio "invisible" */}
                <Video
                  ref={videoRef}
                  style={{ width: 0, height: 0 }}
                  source={{ uri: mediaUri }}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  isLooping
                  shouldPlay={isPlaying}
                  onPlaybackStatusUpdate={handlePlaybackStatus}
                  testID="player-audio-hidden"
                />
              </>
            ) : (
              <View style={[styles.video, styles.webVideoFallback]} testID="player-audio-web-bg">
                {/* Fondo visual */}
                <video style={styles.webVideo} autoPlay loop muted playsInline>
                  <source src={BACKGROUND_URI} type="video/mp4" />
                </video>
                {/* Pista de audio real */}
                <audio ref={webAudioRef} autoPlay loop>
                  <source src={mediaUri} />
                </audio>
              </View>
            )
          )}

          <View style={styles.controlsOverlay} pointerEvents="box-none">
            <Animated.View style={styles.dragArea} {...panResponder.panHandlers} testID="player-drag-area">
              <View style={styles.handle} />
            </Animated.View>

            <TouchableOpacity style={styles.closeButton} onPress={closeModal} testID="player-close-button">
              <X color="#ffffff" size={24} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title ?? (mode === 'video' ? 'Video' : 'Audio')}</Text>
              {mode === 'audio' ? <Text style={styles.subtitle}>Cierra los ojos…</Text> : null}
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.timeline}>
                <View style={[styles.timelineProgress, { width: `${progressPct}%` }]} />
                <View style={[styles.timelineThumb, { left: `${progressPct}%` }]} />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>-{formatTime(Math.max(0, (duration || 0) - (position || 0)))}</Text>
              </View>

              <View style={styles.navigationControls}>
                <TouchableOpacity style={styles.controlButton} onPress={() => skipBy(-10000)} testID="player-skip-back">
                  <Image
                    source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/10SegsRetroceder.png' }}
                    style={styles.skipIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause} testID="player-toggle-play">
                  <Image
                    source={{
                      uri: isPlaying
                        ? 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/PausaV3.png'
                        : 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Play.png',
                    }}
                    style={styles.playPauseIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={() => skipBy(10000)} testID="player-skip-forward">
                  <Image
                    source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/10Segs.png' }}
                    style={styles.skipIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3000,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  webVideoFallback: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  dragArea: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
    marginBottom: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  timeline: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 8,
  },
  timelineProgress: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  timelineThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginTop: 8,
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIcon: {
    width: 40,
    height: 40,
  },
  skipIcon: {
    width: 30,
    height: 30,
  },
});
