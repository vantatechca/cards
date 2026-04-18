import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList } from '../../types/navigation';
import { useCamera } from '../../hooks/useCamera';
import { CardOverlayGuide } from '../../components/camera/CardOverlayGuide';
import { FlashToggle } from '../../components/camera/FlashToggle';
import { useScanStore } from '../../stores/useScanStore';
import { compressImage, checkImageQuality } from '../../services/camera/imageService';

type Props = NativeStackScreenProps<ScanStackParamList, 'Camera'>;

export function CameraScreen({ navigation }: Props) {
  const { cameraRef, permission, requestPermission, facing, flash, cycleFlash, takePicture } =
    useCamera();
  const { frontUri, setFrontUri, setBackUri, setStep } = useScanStore();
  const [capturingBack, setCapturingBack] = useState(false);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          CardVault needs camera access to scan your trading cards.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const processAndCheck = async (uri: string): Promise<string | null> => {
    const compressed = await compressImage(uri);
    const quality = await checkImageQuality(compressed);
    if (!quality.ok) {
      return new Promise((resolve) => {
        Alert.alert('Low Quality Image', `${quality.reason}\n\nRetake for better results?`, [
          { text: 'Use Anyway', onPress: () => resolve(compressed) },
          { text: 'Retake', style: 'cancel', onPress: () => resolve(null) },
        ]);
      });
    }
    return compressed;
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [63, 88],
    });

    if (!result.canceled && result.assets[0]) {
      const processed = await processAndCheck(result.assets[0].uri);
      if (!processed) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFrontUri(processed);
      navigation.navigate('Confirmation', { frontUri: processed });
    }
  };

  const handleCapture = async () => {
    const rawUri = await takePicture();
    if (!rawUri) return;

    const uri = await processAndCheck(rawUri);
    if (!uri) return; // user chose to retake

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!capturingBack) {
      setFrontUri(uri);
      setStep('capturing');
      Alert.alert('Front Captured', 'Capture the back of the card?', [
        {
          text: 'Skip',
          onPress: () => {
            navigation.navigate('Confirmation', { frontUri: uri });
          },
        },
        {
          text: 'Capture Back',
          onPress: () => setCapturingBack(true),
        },
      ]);
    } else {
      setBackUri(uri);
      const front = useScanStore.getState().frontUri!;
      navigation.navigate('Confirmation', { frontUri: front, backUri: uri });
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        <CardOverlayGuide />

        {/* Top bar */}
        <View style={styles.topBar}>
          <FlashToggle flash={flash} onToggle={cycleFlash} />
          <Text style={styles.captureLabel}>
            {capturingBack ? 'Capture Back' : 'Capture Front'}
          </Text>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
            <Ionicons name="images-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <View style={styles.galleryBtn} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  captureLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  galleryBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#2563eb',
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
