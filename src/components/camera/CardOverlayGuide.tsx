import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_RATIO = 2.5 / 3.5; // Standard trading card ratio
const GUIDE_WIDTH = width * 0.75;
const GUIDE_HEIGHT = GUIDE_WIDTH / CARD_RATIO;

export function CardOverlayGuide() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.guide}>
        {/* Corner markers */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guide: {
    width: GUIDE_WIDTH,
    height: GUIDE_HEIGHT,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: '#fff',
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: '#fff',
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: '#fff',
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: '#fff',
    borderBottomRightRadius: 8,
  },
});
