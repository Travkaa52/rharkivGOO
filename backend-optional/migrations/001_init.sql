-- Kharkiv GO — початкова схема бази даних
-- Застосування: psql $DATABASE_URL -f migrations/001_init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE transport_kind AS ENUM ('metro', 'tram', 'trolleybus', 'bus');
CREATE TYPE vehicle_state AS ENUM ('moving', 'stopped', 'accelerating', 'braking', 'offline');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  kinds transport_kind[] NOT NULL,
  is_accessible BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_stops_name ON stops USING gin (to_tsvector('simple', name));
CREATE INDEX idx_stops_location ON stops (lat, lng);

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind transport_kind NOT NULL,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#0B3D2E',
  headsign_forward TEXT NOT NULL,
  headsign_backward TEXT NOT NULL,
  first_departure TIME NOT NULL,
  last_departure TIME NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 10
);

CREATE INDEX idx_routes_number ON routes (number);
CREATE INDEX idx_routes_kind ON routes (kind);

CREATE TABLE route_stops (
  route_id UUID NOT NULL REFERENCES routes (id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES stops (id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  arrival_offset_sec INTEGER NOT NULL,
  PRIMARY KEY (route_id, stop_id, sequence_order)
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes (id) ON DELETE CASCADE,
  external_code TEXT, -- код бортового GPS-трекера
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION NOT NULL DEFAULT 0,
  speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 0,
  state vehicle_state NOT NULL DEFAULT 'offline',
  occupancy TEXT,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_route ON vehicles (route_id);

CREATE TABLE favorite_stops (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES stops (id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stop_id)
);

CREATE TABLE favorite_routes (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes (id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, route_id)
);

CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stop', 'route', 'address')),
  result_id UUID,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_history_user ON search_history (user_id, searched_at DESC);
