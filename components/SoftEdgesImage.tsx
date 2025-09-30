import React from 'react';
import { Image, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

type Props = {
  uri: string;
  /** Radio geométrico de las esquinas (igual que antes en tu card) */
  borderRadius?: number;
  /** Suavidad del borde (0–50 aprox). 22–30 ≈ PowerPoint */
  featherPct?: number;
  /** Ej: { width: '100%', aspectRatio: 4/5 } */
  style?: ViewStyle;
  /** cover por defecto */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
};

export default function SoftEdgesImage({
  uri,
  borderRadius = 16,
  featherPct = 24,
  style,
  resizeMode = 'cover',
}: Props) {
  // Web: fallback sin máscara (MaskedView no está soportado en todos los targets web)
  if (Platform.OS === 'web') {
    return (
      <View style={[style, { borderRadius, overflow: 'hidden' }]}
        testID="soft-edges-image-web"
      >
        <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode={resizeMode} />
      </View>
    );
  }

  // Clamp seguro para el gradiente
  const innerStop = Math.max(0, Math.min(100, 100 - featherPct));

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]} testID="soft-edges-image-native">
      <MaskedView
        style={StyleSheet.absoluteFillObject}
        maskElement={
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <RadialGradient id="soft" cx="50%" cy="50%" r="50%">
                {/* Centro: opaco */}
                <Stop offset="0%" stopColor="#000" stopOpacity={1} />
                {/* Mantiene nítido hasta innerStop% */}
                <Stop offset={`${innerStop}%`} stopColor="#000" stopOpacity={1} />
                {/* Se desvanece a transparente en el borde */}
                <Stop offset="100%" stopColor="#000" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {/* El rect usa el gradiente como alfa del mask */}
            <Rect x="0" y="0" width="100" height="100" fill="url(#soft)" />
          </Svg>
        }
      >
        <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode={resizeMode} />
      </MaskedView>
    </View>
  );
}
