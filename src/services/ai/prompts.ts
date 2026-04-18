export const CARD_IDENTIFICATION_PROMPT = `You are a trading card identification expert. Analyze this card photo and extract:
1. card_type: 'hockey' | 'magic' | 'yugioh'
2. card_name: Full name of the card/player
3. set_name: The set, series, or product this card is from
4. year: Year of release
5. card_number: Number within the set
6. edition: 1st Edition, Unlimited, Holo, Reverse Holo, Base, etc.
7. rarity: Common, Uncommon, Rare, Ultra Rare, Secret Rare, Mythic Rare, etc.
8. language: What language is the card text in
9. identification_confidence: 0.0-1.0 how confident you are
10. notes: Any notable features (error card, misprint, special stamp, autograph, etc.)
For HOCKEY cards: also extract team, position, and whether it's a rookie card.
For MAGIC cards: also extract mana cost, card type (creature/instant/sorcery/etc), and power/toughness if creature.
For YU-GI-OH cards: also extract card type (monster/spell/trap), attribute, level/rank, and ATK/DEF.
Return ONLY valid JSON. If you cannot identify the card with confidence > 0.5, set identification_confidence to your actual confidence and include your best guess with a note explaining uncertainty.`;

export const CONDITION_GRADING_PROMPT = `You are a professional trading card grader. Analyze this card photo and assess its condition.
Evaluate these four PSA grading criteria:
1. CENTERING: Is the card border evenly distributed? Measure approximate left/right and top/bottom ratios.
2. CORNERS: Are all four corners sharp? Any whitening, bending, or rounding?
3. EDGES: Are edges clean and straight? Any whitening, chipping, or roughness?
4. SURFACE: Is the surface clean? Any scratches, print defects, staining, creases, or indentations?
Return:
- psa_estimate: Decimal 1.0-10.0 (PSA scale)
- simple_grade: 'Mint' | 'Near Mint' | 'Excellent' | 'Good' | 'Fair' | 'Poor'
- centering_score: 1-10
- corners_score: 1-10
- edges_score: 1-10
- surface_score: 1-10
- condition_notes: Detailed text describing what you observe
- grading_confidence: 0.0-1.0 (note: photo-based grading is inherently limited, be honest about confidence)
IMPORTANT: Always caveat that photo-based grading is an ESTIMATE. Professional grading requires physical inspection. If the photo quality is poor (blurry, bad lighting, partial card), lower your confidence significantly.
Return ONLY valid JSON.`;

interface RecommendationPromptInput {
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

export function buildRecommendationPrompt(data: RecommendationPromptInput): string {
  const ebayLine = data.ebay_summary
    ? `eBay recent sales: ${data.ebay_summary}`
    : 'eBay recent sales: No data available';
  const tcgplayerLine = data.tcgplayer_summary
    ? `TCGPlayer pricing: ${data.tcgplayer_summary}`
    : 'TCGPlayer pricing: No data available';
  const cardmarketLine = data.cardmarket_summary
    ? `CardMarket pricing: ${data.cardmarket_summary}`
    : 'CardMarket pricing: No data available';

  return `You are a trading card market analyst. Given the following card data, provide a recommendation.

Card: ${data.card_name} (${data.set_name}, ${data.year}, ${data.edition})
Condition: PSA estimate ${data.psa_estimate}, ${data.condition_simple}
Current estimated value: $${data.estimated_value_usd}
Confidence: ${data.value_confidence_pct}%

Market Data:
- ${ebayLine}
- ${tcgplayerLine}
- ${cardmarketLine}

Based on the card's rarity, condition, current market pricing, and demand trends, provide your analysis.

Return ONLY valid JSON with these fields:
- recommendation: 'sell_now' | 'hold' | 'buy_more' | 'watch'
- reasoning: Detailed explanation of your recommendation
- price_trend: 'rising' | 'stable' | 'declining'
- demand_level: 'high' | 'medium' | 'low'
- rarity_assessment: 'very_rare' | 'rare' | 'uncommon' | 'common'
- suggested_sell_price_usd: number
- best_platform_to_sell: 'ebay' | 'tcgplayer' | 'cardmarket' | 'local_shop' | 'facebook_groups'`;
}
