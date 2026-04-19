import { Platform } from 'react-native';
import { API_CONFIG } from '../../config/api';

export async function uploadCardImage(uri: string): Promise<string> {
  let base64Data: string;

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    const FileSystem = require('expo-file-system');
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    base64Data = `data:image/jpeg;base64,${b64}`;
  }

  const res = await fetch(`${API_CONFIG.apiBaseUrl}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: base64Data }),
  });

  if (!res.ok) throw new Error('Image upload failed');
  const { url } = await res.json();
  return url;
}
