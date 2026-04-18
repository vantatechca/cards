import { API_CONFIG } from '../../config/api';

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

const MOCK_USD_TO_CAD = 1.36;

// ---------------------------------------------------------------------------
// Real (placeholder for a live API such as exchangerate-api.com)
// ---------------------------------------------------------------------------

async function fetchLiveRate(): Promise<number> {
  // TODO: Replace with a real currency API call when ready.
  // Example: https://v6.exchangerate-api.com/v6/YOUR_KEY/pair/USD/CAD
  return MOCK_USD_TO_CAD;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getUsdToCadRate(): Promise<number> {
  if (API_CONFIG.useMocks) {
    return MOCK_USD_TO_CAD;
  }

  return fetchLiveRate();
}
