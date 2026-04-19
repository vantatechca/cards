# CardVault

A React Native (Expo) mobile app for tracking and valuing trading card collections — hockey, Magic: The Gathering, and Yu-Gi-Oh. Scan cards with your camera, get AI-powered identification and condition grading, and track your collection's value over time.

## Live Demo

- **Frontend:** https://cards-1-vl8n.onrender.com
- **Backend API:** https://cards-0rs7.onrender.com

## Features

- **Camera Scanning** — Point your camera at a card or upload a photo; Claude AI identifies it and estimates condition
- **AI Identification & Grading** — Claude API identifies card name, set, year, rarity and grades condition (PSA estimate)
- **Multi-Source Pricing** — Pulls data from eBay sold listings, TCG API, Scryfall, and YGOPRODeck for accurate valuation
- **AI Recommendations** — Buy / sell / hold / watch signals per card with reasoning
- **Collection Management** — Browse, filter, and sort your cards in a grid view
- **Card Image Storage** — Card photos uploaded and stored via Cloudinary
- **Dashboard** — Portfolio value charts and collection breakdowns
- **Search** — Full-text search across your entire collection
- **Offline Support** — Queue changes locally and sync when back online

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Navigation | Expo Router + React Navigation |
| Database | Neon (PostgreSQL) |
| Backend API | Node.js / Express (deployed on Render) |
| Image Storage | Cloudinary |
| State | Zustand + TanStack Query |
| AI | Claude API (card ID, grading, recommendations) |
| Pricing | eBay, TCG API, Scryfall, YGOPRODeck |

## Pricing Sources

| Source | Card Types | Data |
|---|---|---|
| eBay Production API | Hockey, MTG, Yu-Gi-Oh | Real sold listings |
| TCG API (tcgapi.dev) | MTG, Yu-Gi-Oh | Market prices |
| Scryfall | MTG only | Market prices (free) |
| YGOPRODeck | Yu-Gi-Oh only | TCGPlayer + eBay + Amazon prices (free) |

## Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- Expo Go app on your phone (for quick testing), or Android/iOS simulator
- A [Neon](https://neon.tech) database
- A [Cloudinary](https://cloudinary.com) account
- API keys (see Environment Variables below)

## Setup

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Configure frontend environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_USE_MOCKS=false
```

### 3. Configure backend environment variables

Create `server/.env`:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
CLAUDE_API_KEY=sk-ant-your-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EBAY_APP_ID=your-ebay-app-id
EBAY_CERT_ID=your-ebay-cert-id
EBAY_SANDBOX=false
TCGAPI_KEY=your-tcgapi-key
```

### 4. Set up the database

In your Neon SQL editor, run:

```
supabase/migrations/001_initial_schema.sql
```

## Running Locally

**Terminal 1 — Backend:**
```bash
cd server
node index.js
```

**Terminal 2 — Frontend:**
```bash
npm start
```

Then press `w` for web or scan the QR code with Expo Go.

## Running Commands

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS |
| `npm run web` | Open in browser |
| `npm test` | Run Jest test suite |

## Deployment (Render)

**Backend (Web Service):**
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `node index.js`
- Add all `server/.env` variables to Render environment

**Frontend (Static Site):**
- Build Command: `npx expo export --platform web`
- Publish Directory: `dist`
- Add `EXPO_PUBLIC_API_URL` pointing to your backend Render URL

## Project Structure

```
cards/
├── app/                    # Expo Router entry points
├── server/                 # Express.js backend API
│   ├── index.js            # API routes (cards, pricing proxies, AI proxy)
│   └── package.json
├── src/
│   ├── core/               # Navigation, providers
│   ├── screens/            # Feature screens
│   ├── components/         # Shared UI components
│   ├── services/
│   │   ├── ai/             # Claude identification, grading, recommendations
│   │   ├── pricing/        # eBay, TCG API, Scryfall, YGOPRODeck
│   │   ├── camera/         # Image capture, compression, Cloudinary upload
│   │   └── supabase/       # Card, price check, snapshot repositories
│   ├── stores/             # Zustand state
│   └── types/              # TypeScript types
├── supabase/
│   └── migrations/         # Neon SQL schema
├── .env.example
└── app.json
```

## Database Schema

Three main tables in Neon:

- **`cards`** — Master card records with AI identification, condition, pricing, and recommendation fields
- **`price_checks`** — Audit trail of every pricing lookup per card
- **`collection_snapshots`** — Daily portfolio value snapshots for trend charts

## Notes

- Set `EXPO_PUBLIC_USE_MOCKS=true` to develop without real API keys
- Camera capture button on web opens file picker automatically
- All external API calls (Claude, eBay, TCG API) go through the backend server to avoid CORS issues and keep keys secure
- eBay requires Production API key with sold/completed listings scope
