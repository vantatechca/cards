-- CardVault Database Schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Table: cards (master table)
-- ===========================================
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_type TEXT NOT NULL CHECK (collection_type IN ('hockey', 'magic', 'yugioh')),
  card_name TEXT NOT NULL,
  set_name TEXT,
  year INTEGER,
  card_number TEXT,
  edition TEXT,
  rarity TEXT,
  language TEXT DEFAULT 'English',
  photo_url_front TEXT NOT NULL,
  photo_url_back TEXT,
  ai_identification_raw JSONB,
  ai_confidence_identification DECIMAL(3,2),
  condition_psa_estimate DECIMAL(3,1),
  condition_simple TEXT CHECK (condition_simple IN ('Mint', 'Near Mint', 'Excellent', 'Good', 'Fair', 'Poor')),
  condition_notes TEXT,
  is_graded BOOLEAN DEFAULT false,
  grading_company TEXT,
  graded_score DECIMAL(3,1),
  grading_cert_number TEXT,
  estimated_value_usd DECIMAL(10,2),
  estimated_value_cad DECIMAL(10,2),
  value_confidence_pct INTEGER CHECK (value_confidence_pct BETWEEN 0 AND 100),
  value_source_breakdown JSONB,
  proof_links JSONB,
  last_valued_at TIMESTAMPTZ,
  ai_recommendation TEXT CHECK (ai_recommendation IN ('sell_now', 'hold', 'buy_more', 'watch')),
  ai_recommendation_reasoning TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_cards_collection_type ON cards(collection_type);
CREATE INDEX idx_cards_card_name ON cards(card_name);
CREATE INDEX idx_cards_estimated_value ON cards(estimated_value_usd DESC NULLS LAST);
CREATE INDEX idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX idx_cards_last_valued_at ON cards(last_valued_at DESC NULLS LAST);
CREATE INDEX idx_cards_recommendation ON cards(ai_recommendation);
CREATE INDEX idx_cards_confidence ON cards(value_confidence_pct DESC NULLS LAST);

-- Full-text search index
CREATE INDEX idx_cards_search ON cards USING gin(
  to_tsvector('english', coalesce(card_name, '') || ' ' || coalesce(set_name, '') || ' ' || coalesce(notes, ''))
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- Table: price_checks (pricing audit trail)
-- ===========================================
CREATE TABLE price_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL CHECK (source IN ('ebay_sold', 'tcgplayer', 'cardmarket', 'scrape', 'manual')),
  search_query_used TEXT,
  results_found INTEGER DEFAULT 0,
  avg_sold_price_usd DECIMAL(10,2),
  median_sold_price_usd DECIMAL(10,2),
  min_sold_price_usd DECIMAL(10,2),
  max_sold_price_usd DECIMAL(10,2),
  sample_listings JSONB DEFAULT '[]',
  raw_response JSONB,
  confidence_contribution INTEGER DEFAULT 0
);

CREATE INDEX idx_price_checks_card ON price_checks(card_id, checked_at DESC);
CREATE INDEX idx_price_checks_source ON price_checks(source);

-- ===========================================
-- Table: collection_snapshots (value tracking)
-- ===========================================
CREATE TABLE collection_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  collection_type TEXT CHECK (collection_type IN ('hockey', 'magic', 'yugioh')),
  total_cards INTEGER DEFAULT 0,
  total_estimated_value_usd DECIMAL(12,2) DEFAULT 0,
  total_estimated_value_cad DECIMAL(12,2) DEFAULT 0,
  avg_confidence_pct INTEGER DEFAULT 0,
  top_10_cards JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_date ON collection_snapshots(snapshot_date DESC);
CREATE INDEX idx_snapshots_type ON collection_snapshots(collection_type);

-- ===========================================
-- Storage bucket for card images
-- ===========================================
-- Run this in the Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cards', 'cards', true);
