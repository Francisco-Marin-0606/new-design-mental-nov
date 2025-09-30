import { useEffect, useMemo, useRef } from 'react';
import { Animated, LayoutChangeEvent, Platform } from 'react-native';
import React from "react";

export type UseParallaxHoverParams = {
  intensity?: number; // 0-100 percentage multiplier
  maxOffsetX?: number; // px clamp on X
  maxOffsetY?: number; // px clamp on Y
  enabled?: boolean;
};

export type UseParallaxHoverResult = {
  ref: React.RefObject<any>;
  animatedStyle: { transform: ({ translateX: Animated.Value } | { translateY: Animated.Value })[] } | {};
  onLayout: (e: LayoutChangeEvent) => void;
  reset: () => void;
};

export function useParallaxHover(params?: UseParallaxHoverParams): UseParallaxHoverResult {
  const { intensity = 10, maxOffsetX = 400, maxOffsetY = 2000, enabled = true } = params ?? {};

  const x = useRef<Animated.Value>(new Animated.Value(0)).current;
  const y = useRef<Animated.Value>(new Animated.Value(0)).current;
  const ref = useRef<any>(null);
  const layoutRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  const driver = Platform.OS === 'web' ? false : true;

  const reset = () => {
    Animated.spring(x, { toValue: 0, useNativeDriver: driver, speed: 20, bounciness: 6 }).start();
    Animated.spring(y, { toValue: 0, useNativeDriver: driver, speed: 20, bounciness: 6 }).start();
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { x: left, y: top, width, height } = e.nativeEvent.layout;
    layoutRef.current = { left, top, width, height };
  };

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    const handleMouseMove = (ev: MouseEvent) => {
      try {
        const node: any = ref.current as any;
        let rect: { left: number; top: number; width: number; height: number } | null = null;

        if (node && typeof (node as any).getBoundingClientRect === 'function') {
          rect = (node as any).getBoundingClientRect();
        } else if (layoutRef.current) {
          rect = layoutRef.current;
        }

        if (!rect) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = ev.clientX - centerX;
        let dy = ev.clientY - centerY;

        dx = Math.max(Math.min(dx, maxOffsetX), -maxOffsetX);
        dy = Math.max(Math.min(dy, maxOffsetY), -maxOffsetY);

        const factor = (intensity ?? 10) / 100;
        const targetX = dx * factor;
        const targetY = dy * factor;

        Animated.spring(x, { toValue: targetX, useNativeDriver: driver, speed: 20, bounciness: 6 }).start();
        Animated.spring(y, { toValue: targetY, useNativeDriver: driver, speed: 20, bounciness: 6 }).start();
      } catch (err) {
        console.log('[useParallaxHover] mousemove error', err);
      }
    };

    const handleMouseLeave = () => {
      reset();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, intensity, maxOffsetX, maxOffsetY, x, y, driver]);

  const animatedStyle = useMemo(() => {
    if (!enabled) return {};
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  }, [enabled, x, y]);

  return { ref, animatedStyle, onLayout, reset };
}
