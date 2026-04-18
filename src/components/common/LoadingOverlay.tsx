import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  message?: string;
  /** Optional progress 0-100. Shows a progress bar when provided. */
  progress?: number;
  /** Optional step labels like ["Identifying", "Grading", "Pricing"] */
  steps?: string[];
  /** Current step index (0-based) */
  currentStep?: number;
}

export function LoadingOverlay({ message = 'Loading...', progress, steps, currentStep }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.message}>{message}</Text>

        {progress != null && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, progress)}%` }]} />
          </View>
        )}

        {steps && steps.length > 0 && (
          <View style={styles.stepsContainer}>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[
                  styles.stepDot,
                  i < (currentStep ?? 0) && styles.stepDotDone,
                  i === (currentStep ?? 0) && styles.stepDotActive,
                ]} />
                <Text style={[
                  styles.stepLabel,
                  i < (currentStep ?? 0) && styles.stepLabelDone,
                  i === (currentStep ?? 0) && styles.stepLabelActive,
                ]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 240,
  },
  message: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  stepsContainer: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  stepDotDone: {
    backgroundColor: '#059669',
  },
  stepDotActive: {
    backgroundColor: '#2563eb',
  },
  stepLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  stepLabelDone: {
    color: '#059669',
  },
  stepLabelActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
