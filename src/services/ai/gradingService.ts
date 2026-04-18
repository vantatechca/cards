import { ConditionGradingResult } from '../../types/ai';
import { API_CONFIG } from '../../config/api';
import { CONDITION_GRADING_PROMPT } from './prompts';
import { compressImage } from '../camera/imageService';

// ---------------------------------------------------------------------------
// Mock data -- realistic grading results in the PSA 7-9 range
// ---------------------------------------------------------------------------

const MOCK_GRADING_RESULTS: ConditionGradingResult[] = [
  {
    psa_estimate: 9.0,
    simple_grade: 'Mint',
    centering_score: 9,
    corners_score: 9,
    edges_score: 9,
    surface_score: 9,
    condition_notes:
      'Card presents in excellent condition. Centering is approximately 55/45 left-to-right, well within PSA 9 tolerances. All four corners are sharp with no visible whitening. Edges are clean throughout. Surface is free of scratches, print lines, and staining. Photo-based grading is an estimate; professional grading requires physical inspection.',
    grading_confidence: 0.72,
  },
  {
    psa_estimate: 8.5,
    simple_grade: 'Near Mint',
    centering_score: 8,
    corners_score: 9,
    edges_score: 8,
    surface_score: 9,
    condition_notes:
      'Very clean card overall. Centering is roughly 58/42 left-to-right and 52/48 top-to-bottom. Corners are sharp on all four points. Minor edge whitening visible at the top-right under magnification. Surface looks pristine with strong gloss. This is a photo-based estimate; physical inspection by a professional grader is recommended for a definitive grade.',
    grading_confidence: 0.68,
  },
  {
    psa_estimate: 7.5,
    simple_grade: 'Near Mint',
    centering_score: 7,
    corners_score: 8,
    edges_score: 7,
    surface_score: 8,
    condition_notes:
      'Centering is noticeably off at approximately 62/38 left-to-right, which is the primary detractor. Three corners are sharp; the bottom-left shows the earliest signs of rounding. Light edge whitening along the bottom border. Surface is clean with no creases or indentations visible. Note: photo-based grading is inherently limited and should be treated as an estimate.',
    grading_confidence: 0.65,
  },
  {
    psa_estimate: 8.0,
    simple_grade: 'Near Mint',
    centering_score: 9,
    corners_score: 7,
    edges_score: 8,
    surface_score: 8,
    condition_notes:
      'Good centering at roughly 53/47 both ways. Two corners (top-left and bottom-right) show slight whitening visible at an angle. Edges are generally clean with a tiny nick on the left side. Surface has a faint hairline scratch visible under direct light but does not break the surface layer. Professional grading is recommended for an accurate assessment.',
    grading_confidence: 0.7,
  },
  {
    psa_estimate: 9.5,
    simple_grade: 'Mint',
    centering_score: 10,
    corners_score: 9,
    edges_score: 10,
    surface_score: 9,
    condition_notes:
      'Exceptional card. Centering appears near-perfect at approximately 51/49 in both directions. Corners are razor-sharp. Edges are flawless with no whitening. Surface shows excellent gloss with no print defects. One microscopic print dot noted on the back border but within PSA 9+ tolerance. As always, photo-based grading is an estimate only.',
    grading_confidence: 0.6,
  },
  {
    psa_estimate: 7.0,
    simple_grade: 'Excellent',
    centering_score: 7,
    corners_score: 7,
    edges_score: 7,
    surface_score: 7,
    condition_notes:
      'Centering is off at approximately 60/40 left-to-right and 57/43 top-to-bottom. Two corners show minor whitening. Edge wear is visible along the top and bottom borders. Surface has a light crease that is visible from an angle but does not crack the surface. Overall a solid card but with enough wear to place it in the PSA 7 range. Photo-based grading is an estimate; physical inspection is necessary for a definitive grade.',
    grading_confidence: 0.62,
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

async function gradeCardMock(): Promise<ConditionGradingResult> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 1000));
  return { ...pickRandom(MOCK_GRADING_RESULTS) };
}

// ---------------------------------------------------------------------------
// Real implementation
// ---------------------------------------------------------------------------

async function readImageAsBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function inferMediaType(
  uri: string,
): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function gradeCardReal(
  frontImageUri: string,
  backImageUri?: string,
): Promise<ConditionGradingResult> {
  // Compress before sending to API
  const compressedFront = await compressImage(frontImageUri);
  const compressedBack = backImageUri ? await compressImage(backImageUri) : undefined;

  const frontBase64 = await readImageAsBase64(compressedFront);
  const frontMediaType = inferMediaType(compressedFront);

  const imageContent: Array<{
    type: 'image';
    source: { type: 'base64'; media_type: string; data: string };
  }> = [
    {
      type: 'image',
      source: { type: 'base64', media_type: frontMediaType, data: frontBase64 },
    },
  ];

  if (compressedBack) {
    const backBase64 = await readImageAsBase64(compressedBack);
    const backMediaType = inferMediaType(compressedBack);
    imageContent.push({
      type: 'image',
      source: { type: 'base64', media_type: backMediaType, data: backBase64 },
    });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_CONFIG.claude.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: API_CONFIG.claude.model,
      max_tokens: 1024,
      system: CONDITION_GRADING_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: compressedBack
                ? 'Grade the condition of this trading card. The first image is the front and the second is the back. Assess centering, corners, edges, and surface quality.'
                : 'Grade the condition of this trading card from the front image. Assess centering, corners, edges, and surface quality.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const json = await response.json();
  const text: string = json.content?.[0]?.text ?? '';

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const result: ConditionGradingResult = JSON.parse(cleaned);
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function gradeCard(
  frontImageUri: string,
  backImageUri?: string,
): Promise<ConditionGradingResult> {
  if (API_CONFIG.useMocks) {
    return gradeCardMock();
  }
  return gradeCardReal(frontImageUri, backImageUri);
}
