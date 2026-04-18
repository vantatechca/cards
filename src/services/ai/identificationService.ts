import { CardIdentificationResult } from '../../types/ai';
import { API_CONFIG } from '../../config/api';
import { CARD_IDENTIFICATION_PROMPT } from './prompts';
import { compressImage } from '../camera/imageService';

// ---------------------------------------------------------------------------
// Mock data -- realistic sample cards across all three types
// ---------------------------------------------------------------------------

const MOCK_HOCKEY_CARDS: CardIdentificationResult[] = [
  {
    card_type: 'hockey',
    card_name: 'Connor McDavid',
    set_name: 'Upper Deck Young Guns',
    year: 2015,
    card_number: '201',
    edition: 'Base',
    rarity: 'Rare',
    language: 'English',
    identification_confidence: 0.95,
    notes: 'Young Guns rookie card, excellent centering visible',
    team: 'Edmonton Oilers',
    position: 'Center',
    is_rookie: true,
  },
  {
    card_type: 'hockey',
    card_name: 'Wayne Gretzky',
    set_name: 'O-Pee-Chee',
    year: 1979,
    card_number: '18',
    edition: 'Base',
    rarity: 'Ultra Rare',
    language: 'English',
    identification_confidence: 0.92,
    notes: 'Iconic rookie card, shows mild surface wear consistent with age',
    team: 'Edmonton Oilers',
    position: 'Center',
    is_rookie: true,
  },
  {
    card_type: 'hockey',
    card_name: 'Sidney Crosby',
    set_name: 'Upper Deck',
    year: 2005,
    card_number: '1',
    edition: 'Young Guns',
    rarity: 'Rare',
    language: 'English',
    identification_confidence: 0.88,
    notes: 'Rookie card, slight off-center printing noted',
    team: 'Pittsburgh Penguins',
    position: 'Center',
    is_rookie: true,
  },
  {
    card_type: 'hockey',
    card_name: 'Auston Matthews',
    set_name: 'Upper Deck Series 1',
    year: 2016,
    card_number: '201',
    edition: 'Young Guns',
    rarity: 'Rare',
    language: 'English',
    identification_confidence: 0.91,
    notes: 'Clean card, no visible defects',
    team: 'Toronto Maple Leafs',
    position: 'Center',
    is_rookie: true,
  },
];

const MOCK_MAGIC_CARDS: CardIdentificationResult[] = [
  {
    card_type: 'magic',
    card_name: 'Black Lotus',
    set_name: 'Alpha',
    year: 1993,
    card_number: 'N/A',
    edition: 'Base',
    rarity: 'Rare',
    language: 'English',
    identification_confidence: 0.85,
    notes: 'Power Nine card, corners show light wear',
    mana_cost: '{0}',
    card_type_mtg: 'Artifact',
    power_toughness: undefined,
  },
  {
    card_type: 'magic',
    card_name: 'Liliana of the Veil',
    set_name: 'Innistrad',
    year: 2011,
    card_number: '105',
    edition: 'Base',
    rarity: 'Mythic Rare',
    language: 'English',
    identification_confidence: 0.93,
    notes: 'Planeswalker, pack-fresh appearance',
    mana_cost: '{1}{B}{B}',
    card_type_mtg: 'Planeswalker',
    power_toughness: undefined,
  },
  {
    card_type: 'magic',
    card_name: 'Tarmogoyf',
    set_name: 'Future Sight',
    year: 2007,
    card_number: '153',
    edition: 'Base',
    rarity: 'Rare',
    language: 'English',
    identification_confidence: 0.9,
    notes: 'Original printing, light edge whitening on top',
    mana_cost: '{1}{G}',
    card_type_mtg: 'Creature',
    power_toughness: '*/1+*',
  },
  {
    card_type: 'magic',
    card_name: 'Ragavan, Nimble Pilferer',
    set_name: 'Modern Horizons 2',
    year: 2021,
    card_number: '138',
    edition: 'Base',
    rarity: 'Mythic Rare',
    language: 'English',
    identification_confidence: 0.96,
    notes: 'Near perfect condition, sharp corners throughout',
    mana_cost: '{R}',
    card_type_mtg: 'Creature',
    power_toughness: '2/1',
  },
];

const MOCK_YUGIOH_CARDS: CardIdentificationResult[] = [
  {
    card_type: 'yugioh',
    card_name: 'Blue-Eyes White Dragon',
    set_name: 'Legend of Blue Eyes White Dragon',
    year: 2002,
    card_number: 'LOB-001',
    edition: '1st Edition',
    rarity: 'Ultra Rare',
    language: 'English',
    identification_confidence: 0.94,
    notes: '1st Edition LOB, holographic eye visible, slight edge wear',
    card_type_ygo: 'Monster',
    attribute: 'LIGHT',
    level_rank: 8,
    atk_def: '3000/2500',
  },
  {
    card_type: 'yugioh',
    card_name: 'Dark Magician',
    set_name: 'Starter Deck Yugi',
    year: 2002,
    card_number: 'SDY-006',
    edition: 'Unlimited',
    rarity: 'Ultra Rare',
    language: 'English',
    identification_confidence: 0.91,
    notes: 'Classic artwork variant, card shows minor surface scratching',
    card_type_ygo: 'Monster',
    attribute: 'DARK',
    level_rank: 7,
    atk_def: '2500/2100',
  },
  {
    card_type: 'yugioh',
    card_name: 'Pot of Greed',
    set_name: 'Starter Deck Kaiba',
    year: 2002,
    card_number: 'SDK-042',
    edition: 'Unlimited',
    rarity: 'Common',
    language: 'English',
    identification_confidence: 0.97,
    notes: 'Banned staple spell card, clean condition',
    card_type_ygo: 'Spell',
    attribute: undefined,
    level_rank: undefined,
    atk_def: undefined,
  },
  {
    card_type: 'yugioh',
    card_name: 'Ash Blossom & Joyous Spring',
    set_name: 'Maximum Crisis',
    year: 2017,
    card_number: 'MACR-EN036',
    edition: '1st Edition',
    rarity: 'Secret Rare',
    language: 'English',
    identification_confidence: 0.93,
    notes: 'Secret Rare holo pattern intact, no visible flaws',
    card_type_ygo: 'Monster',
    attribute: 'FIRE',
    level_rank: 3,
    atk_def: '0/1800',
  },
];

const ALL_MOCK_CARDS = [
  ...MOCK_HOCKEY_CARDS,
  ...MOCK_MAGIC_CARDS,
  ...MOCK_YUGIOH_CARDS,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

async function identifyCardMock(): Promise<CardIdentificationResult> {
  // Simulate a small network delay
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
  return { ...pickRandom(ALL_MOCK_CARDS) };
}

// ---------------------------------------------------------------------------
// Real implementation -- calls Claude API with vision
// ---------------------------------------------------------------------------

async function readImageAsBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
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

async function identifyCardReal(
  frontImageUri: string,
  backImageUri?: string,
): Promise<CardIdentificationResult> {
  // Compress before sending to API (reduces payload size and latency)
  const compressedFront = await compressImage(frontImageUri);
  const compressedBack = backImageUri ? await compressImage(backImageUri) : undefined;

  const frontBase64 = await readImageAsBase64(compressedFront);
  const frontMediaType = inferMediaType(frontImageUri);

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
      system: CARD_IDENTIFICATION_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: compressedBack
                ? 'Identify this trading card. The first image is the front and the second image is the back.'
                : 'Identify this trading card from the front image.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Claude API error (${response.status}): ${errorBody}`,
    );
  }

  const json = await response.json();
  const text: string = json.content?.[0]?.text ?? '';

  // Claude may wrap JSON in a code fence -- strip it
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const result: CardIdentificationResult = JSON.parse(cleaned);
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function identifyCard(
  frontImageUri: string,
  backImageUri?: string,
): Promise<CardIdentificationResult> {
  if (API_CONFIG.useMocks) {
    return identifyCardMock();
  }
  return identifyCardReal(frontImageUri, backImageUri);
}
