import React, { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

type Props = {
  children: ReactNode;
  borderRadius?: number;
  featherPct?: number;
  style?: ViewStyle;
};

export default function SoftEdgesMask({
  children,
  borderRadius = 16,
  featherPct = 24,
  style,
}: Props) {
  const innerStop = Math.max(0, Math.min(100, 100 - featherPct));

  if (Platform.OS === 'web') {
    return <View style={[style, { borderRadius, overflow: 'hidden' }]}>{children}</View>;
  }

  return (
    <View style={[style, { borderRadius, overflow: 'hidden' }]}>
      <MaskedView
        style={StyleSheet.absoluteFillObject}
        maskElement={
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <RadialGradient id="soft" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#000" stopOpacity={1} />
                <Stop offset={`${innerStop}%`} stopColor="#000" stopOpacity={1} />
                <Stop offset="100%" stopColor="#000" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#soft)" />
          </Svg>
        }
      >
        {children}
      </MaskedView>
    </View>
  );
}
