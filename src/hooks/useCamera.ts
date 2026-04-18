import { useState, useRef, useCallback } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('auto');
  const cameraRef = useRef<CameraView>(null);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const cycleFlash = useCallback(() => {
    setFlash((prev) => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      base64: false,
    });
    return photo?.uri ?? null;
  }, []);

  return {
    cameraRef,
    permission,
    requestPermission,
    facing,
    flash,
    toggleFacing,
    cycleFlash,
    takePicture,
  };
}
