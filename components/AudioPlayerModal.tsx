import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  useWindowDimensions,
  Easing,
  Platform,
  Image,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { X } from 'lucide-react-native';

interface AudioPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export default function AudioPlayerModal({ visible, onClose, title = 'Palabras que no digo' }: AudioPlayerModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const [, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const [position, setPosition] = useState<number>(0);
  const [duration] = useState<number>(1857000);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [gestureShield, setGestureShield] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  const easeInOut = Easing.out(Easing.cubic);
  const DURATION_OPEN = 600;
  const DURATION_CLOSE = 600;
  const DURATION_SNAP = 480;

  const HANDLE_CLOSE_THRESHOLD = Math.max(120, screenHeight * 0.2);

  const formatTime = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const setupAudio = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
      const mockAudio = new Audio.Sound();
      audioRef.current = mockAudio;
    } catch (error) {
      console.log('Error setting up audio:', error);
    }
  }, []);



  const togglePlayPause = useCallback(async () => {
    try {
      const newPlayingState = !isPlaying;
      setIsPlaying(newPlayingState);
      if (Platform.OS === 'web') {
        if (webVideoRef.current) {
          if (newPlayingState) {
            await webVideoRef.current.play();
          } else {
            webVideoRef.current.pause();
          }
        }
      }
      console.log(newPlayingState ? 'Playing audio' : 'Pausing audio');
    } catch (error) {
      console.log('Error toggling playback:', error);
    }
  }, [isPlaying]);

  const seekTo = useCallback(async (newPosition: number) => {
    try {
      if (typeof newPosition !== 'number' || Number.isNaN(newPosition) || newPosition < 0) return;
      setPosition(newPosition);
      console.log('Seeking to:', newPosition);
    } catch (error) {
      console.log('Error seeking:', error);
    }
  }, []);

  const skipForward = useCallback(() => {
    const newPosition = Math.min(position + 10000, duration);
    seekTo(newPosition);
  }, [position, duration, seekTo]);

  const skipBackward = useCallback(() => {
    const newPosition = Math.max(position - 10000, 0);
    seekTo(newPosition);
  }, [position, seekTo]);

  const closeModal = useCallback(() => {
    setIsPlaying(false);

    if (Platform.OS === 'web') {
      if (webVideoRef.current) {
        webVideoRef.current.pause();
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

  const closeBySwipe = useCallback(() => {
    setGestureShield(true);

    setIsPlaying(false);

    if (Platform.OS === 'web') {
      if (webVideoRef.current) {
        webVideoRef.current.pause();
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
      setTimeout(() => {
        setGestureShield(false);
        onClose();
      }, 60);
    });
  }, [DURATION_CLOSE, easeInOut, onClose, opacity, screenHeight, translateY]);

  const handlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gs) => Math.abs(gs.dy) > Math.abs(gs.dx) && Math.abs(gs.dy) > 6,
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
          const shouldClose = gs.dy > HANDLE_CLOSE_THRESHOLD || gs.vy > 0.6;
          if (shouldClose) {
            closeBySwipe();
          } else {
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: 0,
                duration: DURATION_SNAP,
                easing: easeInOut,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 1,
                duration: DURATION_SNAP,
                easing: easeInOut,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
      }),
    [HANDLE_CLOSE_THRESHOLD, closeBySwipe, DURATION_SNAP, easeInOut, opacity, screenHeight, translateY]
  );

  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const sliderWidthValue = 280;
        const newPosition = Math.max(0, Math.min(duration, (gestureState.moveX / sliderWidthValue) * duration));
        setPosition(newPosition);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        const sliderWidthValue = 280;
        const newPosition = Math.max(0, Math.min(duration, (sliderWidthValue > 0 ? (position / sliderWidthValue) * duration : 0)));
        seekTo(newPosition);
      },
    })
  ).current;

  const openModal = useCallback(() => {
    if (isDraggingRef.current) return;
    setupAudio();

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
    ]).start(() => {
      if (Platform.OS === 'web') {
        if (webVideoRef.current) {
          webVideoRef.current.play();
        }
      }
    });
  }, [opacity, translateY, easeInOut, setupAudio]);



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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, []);

  if (!visible) return null;

  const progressPercentage = (position / duration) * 100;

  return (
    <View style={styles.overlay} testID="audio-player-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" testID="audio-backdrop" />
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }],
          },
        ]}
        testID="audio-player-container"
        pointerEvents={gestureShield ? 'none' : 'auto'}
      >
        {Platform.OS !== 'web' ? (
          <Video
            ref={videoRef}
            style={styles.video}
            source={{
              uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/Mental%20Login%20Background.mp4',
            }}
            useNativeControls={false}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isPlaying}
            onPlaybackStatusUpdate={setVideoStatus}
            testID="background-video"
          />
        ) : (
          <View style={[styles.video, styles.webVideoFallback]} testID="web-video-fallback">
            <video
              ref={webVideoRef}
              style={styles.webVideo}
              autoPlay={true}
              loop
              muted
              playsInline
            >
              <source
                src="https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/Mental%20Login%20Background.mp4"
                type="video/mp4"
              />
            </video>
          </View>
        )}



        <View
          style={styles.controlsOverlay}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.dragArea}
            testID="audio-drag-area"
            activeOpacity={1}
            hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
            {...handlePanResponder.panHandlers}
          >
            <View style={styles.handle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={closeModal} testID="audio-close-button">
            <X color="#ffffff" size={24} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Cierra los ojos…</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.playerContainer}>
              <View style={styles.sliderContainer} {...sliderPanResponder.panHandlers}>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderProgress, { width: `${progressPercentage}%` }]} />
                  <View style={[styles.sliderThumb, { left: `${progressPercentage}%` }]} />
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>-{formatTime(duration - position)}</Text>
                </View>
              </View>

              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={skipBackward}
                  testID="skip-backward-button"
                >
                  <Image
                    source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/10SegsRetroceder.png' }}
                    style={styles.skipIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={togglePlayPause}
                  testID="play-pause-button"
                >
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

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={skipForward}
                  testID="skip-forward-button"
                >
                  <Image
                    source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/10Segs.png' }}
                    style={styles.skipIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {gestureShield && (
            <View pointerEvents="auto" style={StyleSheet.absoluteFillObject} />
          )}
        </View>
      </Animated.View>
    </View>
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
  backgroundTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  content: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
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
  playerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  sliderContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 32,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  sliderProgress: {
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    position: 'absolute',
    top: -6,
    marginLeft: -8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
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