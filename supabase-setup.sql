-- Script SQL pour créer la table products dans Supabase
-- Exécutez ce script dans le SQL Editor de votre dashboard Supabase

-- Créer la table products
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Créer un index sur la catégorie pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Créer un index sur in_stock pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);

-- Ajouter une politique RLS (Row Level Security) pour permettre la lecture publique
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture publique (SELECT)
CREATE POLICY "Enable read access for all users" ON products
FOR SELECT USING (true);

-- Politique pour permettre l'insertion publique (pour le seeding automatique)
CREATE POLICY "Enable insert access for all users" ON products
FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour publique
CREATE POLICY "Enable update access for all users" ON products
FOR UPDATE USING (true);

-- Politique pour permettre la suppression publique
CREATE POLICY "Enable delete access for all users" ON products
FOR DELETE USING (true);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();