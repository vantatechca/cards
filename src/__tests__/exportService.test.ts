import { cardsToCSV, cardsToJSON } from '../services/exportService';
import { Card } from '../types/card';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'test-id-1',
    collection_type: 'hockey',
    card_name: 'Wayne Gretzky',
    set_name: 'O-Pee-Chee',
    year: 1979,
    card_number: '18',
    edition: 'Base',
    rarity: 'Ultra Rare',
    language: 'English',
    photo_url_front: 'file:///front.jpg',
    photo_url_back: null,
    ai_identification_raw: null,
    ai_confidence_identification: 92,
    condition_psa_estimate: 8,
    condition_simple: 'Near Mint',
    condition_notes: 'Minor surface wear',
    is_graded: false,
    grading_company: null,
    graded_score: null,
    grading_cert_number: null,
    estimated_value_usd: 1250.5,
    estimated_value_cad: 1700.68,
    value_confidence_pct: 85,
    value_source_breakdown: null,
    proof_links: null,
    last_valued_at: '2025-03-15T12:00:00Z',
    ai_recommendation: 'hold',
    ai_recommendation_reasoning: 'Vintage card with steady appreciation',
    tags: ['rookie', 'legend'],
    notes: 'Gift from grandfather',
    location: 'Top-loader, Binder A',
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2025-03-15T12:00:00Z',
    ...overrides,
  };
}

describe('cardsToCSV', () => {
  it('includes header row', () => {
    const csv = cardsToCSV([]);
    const headers = csv.split('\n')[0];
    expect(headers).toContain('Name');
    expect(headers).toContain('Collection');
    expect(headers).toContain('Value USD');
    expect(headers).toContain('Value CAD');
    expect(headers).toContain('Confidence %');
  });

  it('exports a single card correctly', () => {
    const csv = cardsToCSV([makeCard()]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2); // header + 1 card

    const row = lines[1];
    expect(row).toContain('Wayne Gretzky');
    expect(row).toContain('hockey');
    expect(row).toContain('O-Pee-Chee');
    expect(row).toContain('1979');
    expect(row).toContain('1250.50');
    expect(row).toContain('hold');
  });

  it('escapes commas in values', () => {
    const csv = cardsToCSV([makeCard({ card_name: 'Card, The Great' })]);
    expect(csv).toContain('"Card, The Great"');
  });

  it('escapes double quotes in values', () => {
    const csv = cardsToCSV([makeCard({ card_name: 'Card "Awesome" Edition' })]);
    expect(csv).toContain('"Card ""Awesome"" Edition"');
  });

  it('exports multiple cards', () => {
    const cards = [
      makeCard({ id: '1', card_name: 'Card A' }),
      makeCard({ id: '2', card_name: 'Card B' }),
      makeCard({ id: '3', card_name: 'Card C' }),
    ];
    const lines = cardsToCSV(cards).split('\n');
    expect(lines).toHaveLength(4); // header + 3 cards
  });

  it('handles null values gracefully', () => {
    const csv = cardsToCSV([makeCard({
      set_name: null,
      year: null,
      estimated_value_usd: null,
      estimated_value_cad: null,
    })]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    // Should not throw
  });

  it('joins tags with semicolons', () => {
    const csv = cardsToCSV([makeCard({ tags: ['rookie', 'legend', 'grail'] })]);
    expect(csv).toContain('rookie; legend; grail');
  });
});

describe('cardsToJSON', () => {
  it('exports valid JSON', () => {
    const json = cardsToJSON([makeCard()]);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it('maps Card fields to export-friendly names', () => {
    const json = cardsToJSON([makeCard()]);
    const parsed = JSON.parse(json);
    const card = parsed[0];

    expect(card.name).toBe('Wayne Gretzky');
    expect(card.collection).toBe('hockey');
    expect(card.set).toBe('O-Pee-Chee');
    expect(card.year).toBe(1979);
    expect(card.number).toBe('18');
    expect(card.value_usd).toBe(1250.5);
    expect(card.value_cad).toBe(1700.68);
    expect(card.confidence_pct).toBe(85);
    expect(card.recommendation).toBe('hold');
    expect(card.tags).toEqual(['rookie', 'legend']);
  });

  it('exports multiple cards', () => {
    const cards = [makeCard({ id: '1' }), makeCard({ id: '2' })];
    const parsed = JSON.parse(cardsToJSON(cards));
    expect(parsed).toHaveLength(2);
  });

  it('handles null optional fields', () => {
    const json = cardsToJSON([makeCard({
      set_name: null,
      notes: null,
      grading_company: null,
    })]);
    const parsed = JSON.parse(json);
    expect(parsed[0].set).toBeNull();
    expect(parsed[0].notes).toBeNull();
  });

  it('includes condition notes', () => {
    const json = cardsToJSON([makeCard({ condition_notes: 'Slight wear on edges' })]);
    const parsed = JSON.parse(json);
    expect(parsed[0].condition_notes).toBe('Slight wear on edges');
  });
});
