import { API_CONFIG } from '../../config/api';

const FALLBACK_RATE = 1.36;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedRate: number | null = null;
let cacheTime = 0;

async function fetchLiveRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) return FALLBACK_RATE;
    const data = await res.json();
    return data?.rates?.CAD ?? FALLBACK_RATE;
  } catch {
    return FALLBACK_RATE;
  }
}

export async function getUsdToCadRate(): Promise<number> {
  if (API_CONFIG.useMocks) return FALLBACK_RATE;

  const now = Date.now();
  if (cachedRate !== null && now - cacheTime < CACHE_TTL_MS) return cachedRate;

  const rate = await fetchLiveRate();
  cachedRate = rate;
  cacheTime = now;
  return rate;
}
