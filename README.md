# CardVault

A React Native (Expo) mobile app for tracking and valuing trading card collections — hockey, Magic: The Gathering, and Yu-Gi-Oh. Scan cards with your camera, get AI-powered identification and condition grading, and track your collection's value over time.

## Features

- **Camera Scanning** — Point your camera at a card; Claude AI identifies it and estimates condition
- **Collection Management** — Browse, filter, and sort your cards in a grid view
- **Price Intelligence** — Pulls sold listings from eBay, TCGPlayer, and CardMarket
- **AI Recommendations** — Buy / sell / hold / watch signals per card
- **Dashboard** — Portfolio value charts and collection breakdowns
- **Search** — Full-text search across your entire collection
- **Offline Support** — Queue changes locally and sync when back online
- **Biometric Lock** — Optional Face ID / fingerprint protection

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Navigation | Expo Router + React Navigation |
| Backend | Supabase (Postgres + Storage) |
| State | Zustand + TanStack Query |
| AI | Claude API (card ID, grading, recommendations) |
| Pricing | eBay, TCGPlayer, CardMarket APIs |

## Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- Expo Go app on your phone (for quick testing), or Android/iOS simulator
- A [Supabase](https://supabase.com) project
- API keys (see Environment Variables below)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-your-key        # Card identification & grading
EXPO_PUBLIC_EBAY_APP_ID=your-ebay-app-id          # Sold listings pricing
EXPO_PUBLIC_TCGPLAYER_API_KEY=your-key            # MTG / Yu-Gi-Oh pricing
EXPO_PUBLIC_CARDMARKET_APP_TOKEN=your-token       # European market pricing

EXPO_PUBLIC_USE_MOCKS=true   # Set to false to use real APIs
```

### 3. Set up the database

In your Supabase dashboard, open the SQL editor and run:

```
supabase/migrations/001_initial_schema.sql
```

Then create the card image storage bucket:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('cards', 'cards', true);
```

## Running the App

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server (scan QR with Expo Go) |
| `npm run android` | Open on Android emulator / device |
| `npm run ios` | Open on iOS simulator / device |
| `npm run web` | Open in browser |
| `npm test` | Run Jest test suite |

## Project Structure

```
cards/
├── app/                    # Expo Router entry points
│   ├── _layout.tsx         # Root layout (providers)
│   └── index.tsx           # App entry → React Navigation
├── src/
│   ├── core/
│   │   ├── App.tsx
│   │   ├── navigation/     # Stack & tab navigators
│   │   └── providers/      # Auth, React Query
│   ├── screens/            # Feature screens
│   │   ├── auth/           # Lock screen (biometrics)
│   │   ├── collection/     # Grid, detail, edit
│   │   ├── dashboard/      # Value charts, sell decisions
│   │   ├── onboarding/
│   │   ├── scan/           # Camera + confirmation
│   │   ├── search/
│   │   └── settings/       # Batch reprice
│   ├── components/         # Shared UI components
│   ├── services/           # API clients, offline queue
│   ├── stores/             # Zustand stores
│   └── types/              # TypeScript types
├── supabase/
│   └── migrations/         # SQL schema
├── .env.example
└── app.json                # Expo config
```

## Database Schema

Three main tables in Supabase:

- **`cards`** — Master card records with AI identification, condition, pricing, and recommendation fields
- **`price_checks`** — Audit trail of every pricing lookup per card
- **`collection_snapshots`** — Daily portfolio value snapshots for trend charts

## Notes

- Set `EXPO_PUBLIC_USE_MOCKS=true` in `.env` to develop without real API keys — mock data is returned for all external calls
- Camera permissions are required on device for scanning; the web build falls back to image picker
- The app targets portrait orientation only
