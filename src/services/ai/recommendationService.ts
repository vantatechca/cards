import { RecommendationResult } from '../../types/ai';
import { API_CONFIG } from '../../config/api';
import { buildRecommendationPrompt } from './prompts';

// ---------------------------------------------------------------------------
// Input type for the public API
// ---------------------------------------------------------------------------

export interface RecommendationInput {
  card_name: string;
  set_name: string;
  year: number;
  edition: string;
  psa_estimate: number;
  condition_simple: string;
  estimated_value_usd: number;
  value_confidence_pct: number;
  ebay_summary?: string;
  tcgplayer_summary?: string;
  cardmarket_summary?: string;
}

// ---------------------------------------------------------------------------
// Mock data -- varied recommendations
// ---------------------------------------------------------------------------

const MOCK_RECOMMENDATIONS: RecommendationResult[] = [
  {
    recommendation: 'hold',
    reasoning:
      'This card has been trending upward in value over the past 6 months with consistent demand. Given its current condition grade and rarity, the market suggests further appreciation. The upcoming tournament season could drive additional demand. Recommend holding for 3-6 months to maximize return.',
    price_trend: 'rising',
    demand_level: 'high',
    rarity_assessment: 'rare',
    suggested_sell_price_usd: 145.0,
    best_platform_to_sell: 'ebay',
  },
  {
    recommendation: 'sell_now',
    reasoning:
      'Market data indicates this card is near its peak value. Recent reprints in a supplemental set have introduced additional supply, and historically this leads to a 15-25% decline within 2-3 months. eBay sold listings show strong recent demand at current prices. Selling now captures the maximum value before the price correction.',
    price_trend: 'declining',
    demand_level: 'medium',
    rarity_assessment: 'uncommon',
    suggested_sell_price_usd: 32.5,
    best_platform_to_sell: 'tcgplayer',
  },
  {
    recommendation: 'buy_more',
    reasoning:
      'This card is currently undervalued relative to its historical average. The recent dip appears to be a short-term market correction rather than a fundamental shift. With its rarity and playability in competitive formats, demand is likely to rebound. At the current price point, acquiring additional copies represents good value.',
    price_trend: 'stable',
    demand_level: 'high',
    rarity_assessment: 'very_rare',
    suggested_sell_price_usd: 275.0,
    best_platform_to_sell: 'cardmarket',
  },
  {
    recommendation: 'watch',
    reasoning:
      'There is insufficient market data to make a strong recommendation. The card has low trading volume with only a handful of recent sales across major platforms. The value estimate carries low confidence. Recommend monitoring eBay sold listings and TCGPlayer price history over the next 30 days to establish a clearer trend before making a decision.',
    price_trend: 'stable',
    demand_level: 'low',
    rarity_assessment: 'common',
    suggested_sell_price_usd: 8.0,
    best_platform_to_sell: 'facebook_groups',
  },
  {
    recommendation: 'sell_now',
    reasoning:
      'This card has hit an all-time high following a recent tournament performance. Social media hype is driving speculative buying, but the price is unlikely to sustain at this level once the hype cycle ends. CardMarket trend data shows European prices already starting to dip. Selling on TCGPlayer now will capture peak North American demand.',
    price_trend: 'rising',
    demand_level: 'high',
    rarity_assessment: 'rare',
    suggested_sell_price_usd: 89.99,
    best_platform_to_sell: 'tcgplayer',
  },
  {
    recommendation: 'hold',
    reasoning:
      'Vintage cards in this grade range have shown consistent 8-12% annual appreciation. The card is from a classic set with a finite supply, and collector demand remains steady. There is no urgency to sell, and the long-term trend favors patience. Consider professional grading to potentially unlock further value if the card grades higher than estimated.',
    price_trend: 'rising',
    demand_level: 'medium',
    rarity_assessment: 'very_rare',
    suggested_sell_price_usd: 520.0,
    best_platform_to_sell: 'ebay',
  },
  {
    recommendation: 'sell_now',
    reasoning:
      'This common card from a recent set has limited long-term upside. Supply is abundant and demand is tied to the current competitive meta. Selling through a local shop avoids shipping costs and platform fees, maximizing your net return on a lower-value card.',
    price_trend: 'declining',
    demand_level: 'low',
    rarity_assessment: 'common',
    suggested_sell_price_usd: 2.5,
    best_platform_to_sell: 'local_shop',
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Mock implementation
// ---------------------------------------------------------------------------

async function getRecommendationMock(): Promise<RecommendationResult> {
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 800));
  return { ...pickRandom(MOCK_RECOMMENDATIONS) };
}

// ---------------------------------------------------------------------------
// Real implementation -- text-only Claude call (no images)
// ---------------------------------------------------------------------------

async function getRecommendationReal(
  cardData: RecommendationInput,
): Promise<RecommendationResult> {
  const prompt = buildRecommendationPrompt(cardData);

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
      messages: [
        {
          role: 'user',
          content: prompt,
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
  const result: RecommendationResult = JSON.parse(cleaned);
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getRecommendation(
  cardData: RecommendationInput,
): Promise<RecommendationResult> {
  if (API_CONFIG.useMocks) {
    return getRecommendationMock();
  }
  return getRecommendationReal(cardData);
}
