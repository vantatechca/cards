export const API_CONFIG = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  claude: {
    apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
    model: 'claude-sonnet-4-6',
  },
  ebay: {
    appId: process.env.EXPO_PUBLIC_EBAY_APP_ID || '',
    baseUrl: 'https://api.ebay.com',
  },
  tcgplayer: {
    apiKey: process.env.EXPO_PUBLIC_TCGPLAYER_API_KEY || '',
    baseUrl: 'https://api.tcgplayer.com',
  },
  cardmarket: {
    appToken: process.env.EXPO_PUBLIC_CARDMARKET_APP_TOKEN || '',
    baseUrl: 'https://api.cardmarket.com/ws/v2.0',
  },
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS !== 'false', // default true
} as const;
