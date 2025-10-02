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

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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

  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="settings-overlay">
      <Pressable style={styles.backdrop} onPress={closeModal}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity, backgroundColor: '#000000' }]} />
      </Pressable>
      
      <Animated.View
        style={[
          styles.modalContainer,
          {
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
            <Text style={styles.subscriptionLabel}>Suscripción</Text>
            <Text style={styles.subscriptionType}>Mensual</Text>
            <View style={styles.activeButton}>
              <Text style={styles.activeButtonText}>ACTIVA</Text>
            </View>
          </View>

          <View style={styles.menuSection}>
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={() => handleMenuAction('manage-subscription')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
              testID="menu-manage-subscription"
            >
              <View style={styles.menuIconContainer}>
                <User color="#ffffff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Gestionar suscripción</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={() => handleMenuAction('edit-profile')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
              testID="menu-edit-profile"
            >
              <View style={styles.menuIconContainer}>
                <Edit3 color="#ffffff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Editar mi perfil</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={() => handleMenuAction('faq')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
              testID="menu-faq"
            >
              <View style={styles.menuIconContainer}>
                <HelpCircle color="#ffffff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Preguntas frecuentes</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={() => handleMenuAction('contact')}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.1)' } : undefined}
              testID="menu-contact"
            >
              <View style={styles.menuIconContainer}>
                <Mail color="#ffffff" size={20} />
              </View>
              <Text style={styles.menuItemText}>Contacto</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
            onPress={() => handleMenuAction('logout')}
            android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.15)' } : undefined}
            testID="logout-button"
          >
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </Pressable>

          <Text style={styles.versionText}>Versión de la app 3.1.63</Text>

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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    paddingBottom: 40,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 239, 217, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fbefd9',
    marginBottom: 32,
    marginTop: 8,
  },
  subscriptionSection: {
    marginBottom: 32,
  },
  subscriptionLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#fbefd9',
    marginBottom: 4,
  },
  subscriptionType: {
    fontSize: 16,
    fontWeight: '400',
    color: '#fbefd9',
    marginBottom: 16,
  },
  activeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2d5f1e',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  menuSection: {
    gap: 0,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 239, 217, 0.08)',
    marginBottom: 12,
  },
  menuItemPressed: {
    opacity: 0.6,
  },
  menuIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.4)',
    textAlign: 'center',
    marginBottom: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 24,
  },
  footerLinkText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(251, 239, 217, 0.6)',
    textAlign: 'center',
  },
});
