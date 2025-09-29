import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  useWindowDimensions,
  Easing,
  Platform,
  Text,
  Image,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { X } from 'lucide-react-native';

interface VideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function VideoPlayerModal({ visible, onClose }: VideoPlayerModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  const webVideoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  


  const easeInOut = Easing.out(Easing.cubic);
  const DURATION_OPEN = 600;
  const DURATION_CLOSE = 600;






  const closeModal = useCallback(() => {
    // Pause video when closing
    if (Platform.OS !== 'web') {
      if (videoRef.current && status?.isLoaded) {
        videoRef.current.pauseAsync();
      }
    } else {
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
  }, [opacity, translateY, screenHeight, onClose, easeInOut, status]);

  const panResponder = useMemo(
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
          const shouldClose = gs.dy > 120 || gs.vy > 0.6;
          if (shouldClose) {
            closeModal();
          } else {
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                easing: easeInOut,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                easing: easeInOut,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
      }),
    [closeModal, easeInOut, opacity, screenHeight, translateY]
  );

  const togglePlayPause = useCallback(() => {
    if (Platform.OS !== 'web') {
      if (videoRef.current && status?.isLoaded) {
        if (isPlaying) {
          videoRef.current.pauseAsync();
        } else {
          videoRef.current.playAsync();
        }
      }
    } else {
      if (webVideoRef.current) {
        if (isPlaying) {
          webVideoRef.current.pause();
        } else {
          webVideoRef.current.play();
        }
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, status]);

  const skipBackward = useCallback(() => {
    const newTime = Math.max(currentTime - 10000, 0);
    
    if (Platform.OS !== 'web') {
      if (videoRef.current && status?.isLoaded) {
        videoRef.current.setPositionAsync(newTime);
      }
    } else {
      if (webVideoRef.current) {
        webVideoRef.current.currentTime = newTime / 1000;
      }
    }
  }, [currentTime, status]);

  const skipForward = useCallback(() => {
    const newTime = Math.min(currentTime + 10000, duration);
    
    if (Platform.OS !== 'web') {
      if (videoRef.current && status?.isLoaded) {
        videoRef.current.setPositionAsync(newTime);
      }
    } else {
      if (webVideoRef.current) {
        webVideoRef.current.currentTime = newTime / 1000;
      }
    }
  }, [currentTime, duration, status]);

  const formatTime = useCallback((timeMs: number) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const openModal = useCallback(() => {
    if (isDraggingRef.current) return;
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
      if (Platform.OS !== 'web') {
        if (videoRef.current) {
          videoRef.current.playAsync();
        }
      } else {
        if (webVideoRef.current) {
          webVideoRef.current.play();
        }
      }
      setIsPlaying(true);
    });
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

  useEffect(() => {
    if (Platform.OS !== 'web' && status?.isLoaded) {
      setCurrentTime(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);
    }
  }, [status]);

  useEffect(() => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      const video = webVideoRef.current;
      
      const updateTime = () => {
        setCurrentTime(video.currentTime * 1000);
        setDuration(video.duration * 1000);
      };
      
      const updatePlayState = () => {
        setIsPlaying(!video.paused);
      };
      
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', updateTime);
      video.addEventListener('play', updatePlayState);
      video.addEventListener('pause', updatePlayState);
      
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', updateTime);
        video.removeEventListener('play', updatePlayState);
        video.removeEventListener('pause', updatePlayState);
      };
    }
  }, [visible]);



  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="video-player-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" testID="video-backdrop" />
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }],
          },
        ]}
        testID="video-player-container"
      >
        {/* Video */}
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
            onPlaybackStatusUpdate={setStatus}
            testID="background-video"
          />
        ) : (
          <View style={[styles.video, styles.webVideoFallback]} testID="web-video-fallback">
            <video
              ref={webVideoRef}
              style={styles.webVideo}
              autoPlay
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



        {/* Drag area */}
        <Animated.View style={styles.dragArea} {...panResponder.panHandlers} testID="video-drag-area">
          <View style={styles.handle} />
        </Animated.View>

        {/* Controls overlay */}
        <View 
          style={styles.controlsContainer} 
          pointerEvents="box-none"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Meditación Guiada</Text>
            <Text style={styles.subtitle}>Relajación profunda</Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={closeModal} testID="video-close-button">
            <X color="#ffffff" size={24} />
          </TouchableOpacity>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Timeline */}
            <View style={styles.timelineContainer}>
              <View style={styles.timeline}>
                <View style={[styles.timelineProgress, { width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }]} />
                <View style={[styles.timelineThumb, { left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }]} />
              </View>
              
              {/* Time markers */}
              <View style={styles.timeMarkers}>
                <Text style={styles.timeText}>0:00</Text>
                <Text style={styles.timeText}>2:30</Text>
                <Text style={styles.timeText}>5:00</Text>
                <Text style={styles.timeText}>7:30</Text>
                <Text style={styles.timeText}>10:00</Text>
              </View>
            </View>

            {/* Navigation Controls */}
            <View style={styles.navigationControls}>
              <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
                <Image
                  source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/10SegsRetroceder.png' }}
                  style={styles.skipIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
                <Image
                  source={{
                    uri: isPlaying
                      ? 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/PausaV3.png'
                      : 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Play.png'
                  }}
                  style={styles.playPauseIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
                <Image 
                  source={{ uri: 'https://mental-app-images.nyc3.cdn.digitaloceanspaces.com/Mental%20%7C%20Aura_v2/Netflix/10Segs.png' }}
                  style={styles.skipIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Current Time */}
            <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          </View>
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
    zIndex: 2000, // Higher than SwipeUpModal
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  dragArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: 8,
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
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    zIndex: 30,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 30,
  },
  timelineContainer: {
    width: '100%',
    marginBottom: 20,
  },
  timeline: {
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
  timeMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTime: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  skipIcon: {
    width: 30,
    height: 30,
  },
  playPauseIcon: {
    width: 40,
    height: 40,
  },
});