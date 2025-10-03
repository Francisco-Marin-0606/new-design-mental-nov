import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Easing,
  Platform,
} from 'react-native';
import { X, User, Edit3, HelpCircle, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BUTTON_STYLES } from '@/constants/buttonStyles';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const buttonAnimations = useRef<{ [key: string]: { scale: Animated.Value; opacity: Animated.Value } }>({}).current;

  const DURATION_OPEN = 400;
  const DURATION_CLOSE = 350;
  const easeInOut = Easing.bezier(0.4, 0.0, 0.2, 1);

  const closeModal = useCallback(async () => {
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

  const handleMenuAction = useCallback(async (action: string) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback error:', error);
      }
    }
    console.log(`Settings action: ${action}`);
  }, []);

  const getButtonAnimation = (buttonId: string) => {
    if (!buttonAnimations[buttonId]) {
      buttonAnimations[buttonId] = {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
      };
    }
    return buttonAnimations[buttonId];
  };

  const handlePressIn = (buttonId: string) => {
    const anim = getButtonAnimation(buttonId);
    
    Animated.parallel([
      Animated.spring(anim.scale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(anim.opacity, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = (buttonId: string) => {
    const anim = getButtonAnimation(buttonId);
    
    Animated.parallel([
      Animated.spring(anim.scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(anim.opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="settings-overlay">
      <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="none" />
      
      <Animated.View
        style={[
          styles.modalContainer,
          {
            height: screenHeight,
            transform: [{ translateY }],
          },
        ]}
        testID="settings-container"
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={closeModal} 
            testID="close-button" 
            activeOpacity={0.6}
          >
            <View style={styles.closeButtonInner}>
              <X color="#fbefd9" size={24} strokeWidth={2} />
            </View>
          </TouchableOpacity>

          <Text style={styles.title}>Mi cuenta</Text>

          <View style={styles.subscriptionSection}>
            <View style={styles.subscriptionRow}>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionLabel}>Suscripción</Text>
                <Text style={styles.subscriptionType}>Mensual</Text>
              </View>
              <View style={styles.budgetContainer}>
                <Text style={styles.budgetText}>ACTIVA</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuSection}>
            <Animated.View
              style={{
                transform: [{ scale: getButtonAnimation('manage-subscription').scale }],
                opacity: getButtonAnimation('manage-subscription').opacity,
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuAction('manage-subscription')}
                onPressIn={() => handlePressIn('manage-subscription')}
                onPressOut={() => handlePressOut('manage-subscription')}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
                testID="menu-manage-subscription"
              >
                <View style={styles.menuIconContainer}>
                  <User color="#ffffff" size={20} />
                </View>
                <Text style={styles.menuItemText}>Gestionar suscripción</Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: getButtonAnimation('edit-profile').scale }],
                opacity: getButtonAnimation('edit-profile').opacity,
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuAction('edit-profile')}
                onPressIn={() => handlePressIn('edit-profile')}
                onPressOut={() => handlePressOut('edit-profile')}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
                testID="menu-edit-profile"
              >
                <View style={styles.menuIconContainer}>
                  <Edit3 color="#ffffff" size={20} />
                </View>
                <Text style={styles.menuItemText}>Editar mi perfil</Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: getButtonAnimation('faq').scale }],
                opacity: getButtonAnimation('faq').opacity,
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuAction('faq')}
                onPressIn={() => handlePressIn('faq')}
                onPressOut={() => handlePressOut('faq')}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
                testID="menu-faq"
              >
                <View style={styles.menuIconContainer}>
                  <HelpCircle color="#ffffff" size={20} />
                </View>
                <Text style={styles.menuItemText}>Preguntas frecuentes</Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: getButtonAnimation('contact').scale }],
                opacity: getButtonAnimation('contact').opacity,
              }}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => handleMenuAction('contact')}
                onPressIn={() => handlePressIn('contact')}
                onPressOut={() => handlePressOut('contact')}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
                testID="menu-contact"
              >
                <View style={styles.menuIconContainer}>
                  <Mail color="#ffffff" size={20} />
                </View>
                <Text style={styles.menuItemText}>Contacto</Text>
              </Pressable>
            </Animated.View>
          </View>

          <Animated.View
            style={{
              transform: [{ scale: getButtonAnimation('logout').scale }],
              opacity: getButtonAnimation('logout').opacity,
            }}
          >
            <Pressable
              style={styles.logoutButton}
              onPress={() => handleMenuAction('logout')}
              onPressIn={() => handlePressIn('logout')}
              onPressOut={() => handlePressOut('logout')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.15)' } : undefined}
              testID="logout-button"
            >
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.versionText}>Versión de la app 3.1.63</Text>

          <View style={styles.footerContainer}>
            <View style={styles.footerLinks}>
            <Pressable
              onPress={() => handleMenuAction('terms')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)', borderless: true } : undefined}
            >
              <Text style={styles.footerLinkText}>Términos de uso</Text>
            </Pressable>
            <Pressable
              onPress={() => handleMenuAction('privacy')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)', borderless: true } : undefined}
            >
              <Text style={styles.footerLinkText}>Políticas de privacidad</Text>
            </Pressable>
            </View>
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
    zIndex: 3000,
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
    backgroundColor: '#170501',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 44,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    top: 85,
    right: 44,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32.4,
    fontWeight: '700',
    color: '#fbefd9',
    marginBottom: 32,
    marginTop: 25,
  },
  subscriptionSection: {
    marginBottom: 12,
    marginTop: 25,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fbefd9',
    marginBottom: 0,
  },
  subscriptionType: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.35)',
  },
  budgetContainer: {
    backgroundColor: '#0f3d09',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    height: 34.14,
    justifyContent: 'center',
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#89e082',
    textAlign: 'center',
    width: '100%',
  },

  menuSection: {
    gap: 0,
    marginBottom: 24,
  },
  menuItem: {
    ...BUTTON_STYLES.primaryButton,
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    marginBottom: 10,
  },

  menuIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    ...BUTTON_STYLES.primaryButtonText,
    flex: 1,
  },
  logoutButton: {
    ...BUTTON_STYLES.primaryButton,
    backgroundColor: '#ff6b35',
    marginBottom: 24,
  },

  logoutButtonText: {
    ...BUTTON_STYLES.primaryButtonText,
  },
  versionText: {
    fontSize: 10.5,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.15)',
    textAlign: 'center',
    marginBottom: 20,
  },
  footerContainer: {
    marginTop: 'auto',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 24,
  },
  footerLinkText: {
    fontSize: 10.5,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.3)',
    textAlign: 'center',
  },
});
