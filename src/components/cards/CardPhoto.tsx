import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface Props {
  uri: string;
}

export function CardPhoto({ uri }: Props) {
  // TODO: Add pinch-to-zoom with react-native-gesture-handler
  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: width * 1.4,
    backgroundColor: '#f9fafb',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
