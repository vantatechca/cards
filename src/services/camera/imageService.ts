import { File, Directory, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { IMAGE_MAX_SIZE_BYTES } from '../../utils/constants';

/**
 * Compress image to fit under IMAGE_MAX_SIZE_BYTES (2MB).
 * Tries quality 0.8 first, then steps down until it fits.
 */
export async function compressImage(uri: string): Promise<string> {
  const qualities = [0.8, 0.6, 0.4, 0.3];

  for (const quality of qualities) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }], // max 1600px wide — plenty for card detail
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    );

    // Check file size via fetch (works for both file:// and content:// URIs)
    try {
      const response = await fetch(result.uri);
      const blob = await response.blob();
      if (blob.size <= IMAGE_MAX_SIZE_BYTES) {
        return result.uri;
      }
    } catch {
      // If size check fails, return current result
      return result.uri;
    }
  }

  // Fallback: return lowest quality attempt
  const fallback = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG },
  );
  return fallback.uri;
}

/**
 * Check if image quality is likely too low for AI identification.
 * Returns { ok, reason } — if not ok, show a retake prompt.
 */
export async function checkImageQuality(uri: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const info = await ImageManipulator.manipulateAsync(uri, [], {});
    if (info.width < 400 || info.height < 400) {
      return { ok: false, reason: 'Image resolution is too low for accurate identification.' };
    }
    // Check if the image is very small (likely blurry/corrupt)
    const response = await fetch(uri);
    const blob = await response.blob();
    if (blob.size < 20_000) {
      return { ok: false, reason: 'Image file is too small — it may be blurry or corrupt.' };
    }
    return { ok: true };
  } catch {
    return { ok: true }; // Don't block on check failure
  }
}

export async function saveToLocal(uri: string, filename: string): Promise<string> {
  const cardsDir = new Directory(Paths.cache, 'cards');
  if (!cardsDir.exists) {
    cardsDir.create({ intermediates: true });
  }
  const source = new File(uri);
  const dest = new File(cardsDir, filename);
  if (dest.exists) {
    dest.delete();
  }
  source.copy(dest);
  return dest.uri;
}

export function generateCardImagePath(
  collectionType: string,
  cardId: string,
  side: 'front' | 'back'
): string {
  return `cards/${collectionType}/${cardId}_${side}.jpg`;
}
