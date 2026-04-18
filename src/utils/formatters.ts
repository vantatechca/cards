import { USD_TO_CAD_RATE } from './constants';

export function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatCad(amount: number | null | undefined): string {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
}

export function usdToCad(usd: number, rate: number = USD_TO_CAD_RATE): number {
  return Math.round(usd * rate * 100) / 100;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function formatConfidence(pct: number | null | undefined): string {
  if (pct == null) return 'N/A';
  return `${pct}%`;
}

export function formatPsa(score: number | null | undefined): string {
  if (score == null) return 'N/A';
  return `PSA ${score.toFixed(1)}`;
}
