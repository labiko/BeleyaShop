-- =====================================================
-- Script d'initialisation complète de la base de données BeleyaShop
-- Incluant le système d'éligibilité livraison 3 jours
-- Date: 2025-01-21
-- =====================================================

-- Supprimer les tables si elles existent (pour un reset complet)
-- ATTENTION: Décommentez uniquement si vous voulez supprimer toutes les données
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;

-- =====================================================
-- TABLE PRODUCTS - Catalogue des produits
-- =====================================================

-- Créer la table products avec la colonne three_day_delivery_eligible
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  three_day_delivery_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_three_day_delivery ON products(three_day_delivery_eligible) 
WHERE three_day_delivery_eligible = true;

-- Activer Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour permettre l'accès public (utile pour le développement)
CREATE POLICY "Enable read access for all users" ON products
FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON products
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON products
FOR UPDATE USING (true);

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

-- =====================================================
-- TABLE ORDERS - Commandes en attente de validation
-- =====================================================

-- Créer la table orders pour les commandes en attente
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE,
  customer_phone TEXT,
  customer_location_lat DECIMAL(10, 8),
  customer_location_lng DECIMAL(11, 8),
  customer_location_accuracy INTEGER,
  customer_address TEXT,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'delivered')),
  whatsapp_message TEXT,
  delivery_code TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by TEXT
);

-- Créer la table order_items pour les articles de chaque commande
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index pour optimiser les requêtes sur les commandes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at) 
WHERE delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Activer RLS pour les tables orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les commandes
CREATE POLICY "Enable read access for all users on orders" ON orders
FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users on orders" ON orders
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users on orders" ON orders
FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users on orders" ON orders
FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users on order_items" ON order_items
FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users on order_items" ON order_items
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users on order_items" ON order_items
FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users on order_items" ON order_items
FOR DELETE USING (true);

-- Trigger pour mettre à jour automatiquement updated_at sur orders
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction et trigger pour mettre à jour delivered_at automatiquement
CREATE OR REPLACE FUNCTION trigger_update_delivered_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Marquer la date de livraison quand le statut passe à 'delivered'
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        NEW.delivered_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivered_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_update_delivered_at();

-- =====================================================
-- DONNÉES INITIALES - Produits de démonstration
-- =====================================================

-- Inserer des produits de test avec eligibilite livraison 3 jours
INSERT INTO products (name, description, price, image, category, stock_quantity, in_stock, three_day_delivery_eligible) VALUES
('Creme Nivea Soft', 'Creme hydratante pour peau douce et soyeuse. Enrichie en jojoba et vitamine E.', 100000, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop&crop=center', 'cremes', 50, true, true),
('Creme Vaseline Intensive Care', 'Soin intensif pour peaux tres seches. Hydratation 24h garantie.', 120000, 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400&h=400&fit=crop&crop=center', 'cremes', 30, true, true),
('Gel Douche Dove', 'Gel douche hydratant au 1/4 de creme hydratante. Douceur incomparable.', 80000, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center', 'gels', 75, true, true),
('Gel Douche Johnson''s Baby', 'Formule douce specialement concue pour les peaux sensibles.', 75000, 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop&crop=center', 'gels', 40, true, true),
('Parfum CK One', 'Parfum mixte Calvin Klein. Fraicheur moderne et elegante.', 250000, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&crop=center', 'parfums', 15, true, false),
('Parfum Adidas Dynamic Pulse', 'Parfum homme energisant. Notes fraiches et sportives.', 180000, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop&crop=center', 'parfums', 25, true, false),
('Creme L''Occitane Karite', 'Creme nourrissante au beurre de karite. Reparation intense.', 150000, 'https://images.unsplash.com/photo-1556228852-33462d9de1a5?w=400&h=400&fit=crop&crop=center', 'cremes', 20, true, true),
('Gel Exfoliant Neutrogena', 'Gel nettoyant exfoliant pour une peau nette et purifiee.', 90000, 'https://images.unsplash.com/photo-1556228894-56c2f0ba90aa?w=400&h=400&fit=crop&crop=center', 'gels', 35, true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================

-- Verification du nombre de produits crees
SELECT 
    'Produits crees' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN three_day_delivery_eligible = true THEN 1 END) as eligible_3j
FROM products;

-- Verification par categorie
SELECT 
    category,
    COUNT(*) as total_products,
    COUNT(CASE WHEN three_day_delivery_eligible = true THEN 1 END) as eligible_products,
    COUNT(CASE WHEN in_stock = true THEN 1 END) as in_stock_products
FROM products 
GROUP BY category
ORDER BY category;

-- Afficher les produits eligibles a la livraison 3 jours
SELECT 
    name,
    category,
    stock_quantity,
    three_day_delivery_eligible as eligible_3j
FROM products 
WHERE three_day_delivery_eligible = true
ORDER BY category, name;

-- =====================================================
-- SUCCES - Base de donnees initialisee !
-- =====================================================
SELECT 'Base de donnees BeleyaShop initialisee avec succes !' as status;