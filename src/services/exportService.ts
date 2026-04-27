import { Card } from '../types/card';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths, Directory } from 'expo-file-system';

export function cardsToCSV(cards: Card[]): string {
  const headers = [
    'Name', 'Collection', 'Set', 'Year', 'Number', 'Edition', 'Rarity',
    'Condition', 'PSA Estimate', 'Graded', 'Grade', 'Value USD', 'Value CAD',
    'Confidence %', 'Recommendation', 'Location', 'Tags', 'Notes', 'Added',
  ];

  const rows = cards.map((c) => [
    csvEscape(c.card_name),
    c.collection_type,
    csvEscape(c.set_name ?? ''),
    c.year?.toString() ?? '',
    csvEscape(c.card_number ?? ''),
    csvEscape(c.edition ?? ''),
    csvEscape(c.rarity ?? ''),
    c.condition_simple ?? '',
    c.condition_psa_estimate?.toString() ?? '',
    c.is_graded ? 'Yes' : 'No',
    c.graded_score?.toString() ?? '',
    c.estimated_value_usd?.toFixed(2) ?? '',
    c.estimated_value_cad?.toFixed(2) ?? '',
    c.value_confidence_pct?.toString() ?? '',
    c.ai_recommendation ?? '',
    csvEscape(c.location ?? ''),
    csvEscape(c.tags.join('; ')),
    csvEscape(c.notes ?? ''),
    c.created_at,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function cardsToJSON(cards: Card[]): string {
  const exported = cards.map((c) => ({
    name: c.card_name,
    collection: c.collection_type,
    set: c.set_name,
    year: c.year,
    number: c.card_number,
    edition: c.edition,
    rarity: c.rarity,
    language: c.language,
    condition: c.condition_simple,
    psa_estimate: c.condition_psa_estimate,
    is_graded: c.is_graded,
    grading_company: c.grading_company,
    graded_score: c.graded_score,
    cert_number: c.grading_cert_number,
    value_usd: c.estimated_value_usd,
    value_cad: c.estimated_value_cad,
    confidence_pct: c.value_confidence_pct,
    recommendation: c.ai_recommendation,
    recommendation_reasoning: c.ai_recommendation_reasoning,
    location: c.location,
    tags: c.tags,
    notes: c.notes,
    condition_notes: c.condition_notes,
    added: c.created_at,
  }));
  return JSON.stringify(exported, null, 2);
}

export async function exportAndShare(content: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    const mimeType = filename.endsWith('.csv') ? 'text/csv;charset=utf-8;' : 'application/json';
    const blob = new Blob(['﻿' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    return;
  }

  const exportDir = new Directory(Paths.cache, 'exports');
  if (!exportDir.exists) {
    exportDir.create({ intermediates: true });
  }
  const file = new File(exportDir, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, {
      mimeType: filename.endsWith('.csv') ? 'text/csv' : 'application/json',
      dialogTitle: `Export ${filename}`,
    });
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
