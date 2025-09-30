import React, { memo } from 'react';
import { Image, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Defs, RadialGradient, Stop, Rect, ClipPath } from 'react-native-svg';

interface Props {
  uri: string;
  borderRadius?: number;
  feather?: number; // 0-100 suggested (percentage of size to keep solid)
  style?: ViewStyle;
}

function SoftEdgesImageBase({ uri, borderRadius = 16, feather = 28, style }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View style={[style, { borderRadius, overflow: 'hidden' }]}>
        <Image source={{ uri }} style={[StyleSheet.absoluteFillObject, { borderRadius }]} resizeMode="cover" />
      </View>
    );
  }

  const featherClamped = Math.max(0, Math.min(100, feather));

  return (
    <MaskedView
      style={style}
      maskElement={
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip">
              <Rect x="0" y="0" width="100" height="100" rx={borderRadius / 2} ry={borderRadius / 2} />
            </ClipPath>
            <RadialGradient id="soft" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#000" stopOpacity={1} />
              <Stop offset={`${100 - featherClamped}%`} stopColor="#000" stopOpacity={1} />
              <Stop offset="100%" stopColor="#000" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" clipPath="url(#clip)" fill="url(#soft)" />
        </Svg>
      }
    >
      <Image source={{ uri }} style={[StyleSheet.absoluteFillObject, { borderRadius }]} resizeMode="cover" />
    </MaskedView>
  );
}

export const SoftEdgesImage = memo(SoftEdgesImageBase);
export default SoftEdgesImage;