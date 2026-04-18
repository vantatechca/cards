import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');

interface OnboardingPage {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  bgColor: string;
}

const PAGES: OnboardingPage[] = [
  {
    icon: 'camera',
    iconColor: '#2563eb',
    title: 'Scan Your Cards',
    subtitle:
      'Point your camera at any hockey, Magic: The Gathering, or Yu-Gi-Oh! card. AI identifies it instantly.',
    bgColor: '#eff6ff',
  },
  {
    icon: 'sparkles',
    iconColor: '#7c3aed',
    title: 'AI-Powered Pricing',
    subtitle:
      'Get real-time valuations from eBay, TCGPlayer, and CardMarket with confidence scores so you know how accurate each price is.',
    bgColor: '#f5f3ff',
  },
  {
    icon: 'trending-up',
    iconColor: '#059669',
    title: 'Smart Sell Decisions',
    subtitle:
      'AI analyzes market trends and tells you when to sell, hold, or buy more. Track your entire collection value over time.',
    bgColor: '#ecfdf5',
  },
  {
    icon: 'shield-checkmark',
    iconColor: '#dc2626',
    title: 'Your Vault, Secured',
    subtitle:
      'PIN and biometric protection keep your collection data safe. Export anytime as CSV or JSON.',
    bgColor: '#fef2f2',
  },
];

export function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const handleNext = () => {
    if (currentIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const renderPage = ({ item }: { item: OnboardingPage }) => (
    <View style={[styles.page, { backgroundColor: item.bgColor }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon} size={80} color={item.iconColor} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  const isLastPage = currentIndex === PAGES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {!isLastPage && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, currentIndex === i && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaBtn} onPress={handleNext}>
        <Text style={styles.ctaText}>
          {isLastPage ? "Let's Go!" : 'Next'}
        </Text>
        {!isLastPage && (
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        )}
      </TouchableOpacity>

      {/* App branding */}
      <Text style={styles.brandText}>CardVault</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  page: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    backgroundColor: '#2563eb',
    width: 24,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  brandText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
    paddingBottom: 40,
  },
});
