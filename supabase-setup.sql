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
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  three_day_delivery_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Créer un index sur la catégorie pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Créer un index sur in_stock pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);

-- Créer un index pour les produits éligibles à la livraison 3 jours
CREATE INDEX IF NOT EXISTS idx_products_three_day_delivery ON products(three_day_delivery_eligible) 
WHERE three_day_delivery_eligible = true;

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

-- =====================================================
-- TABLE ORDERS - Commandes en attente de validation
-- =====================================================

-- Créer la table orders pour les commandes en attente
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_phone TEXT,
  customer_location_lat DECIMAL(10, 8),
  customer_location_lng DECIMAL(11, 8),
  customer_location_accuracy INTEGER,
  customer_address TEXT,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'delivered')),
  whatsapp_message TEXT,
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
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Activer RLS pour les tables orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour orders (lecture et écriture publique pour demo)
CREATE POLICY "Enable read access for orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for orders" ON orders FOR UPDATE USING (true);

-- Politiques RLS pour order_items (lecture et écriture publique pour demo)
CREATE POLICY "Enable read access for order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for order_items" ON order_items FOR UPDATE USING (true);

-- Trigger pour mettre à jour updated_at sur orders
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTIONS DE GESTION DE STOCK
-- =====================================================

-- Fonction pour vérifier si le stock est suffisant
CREATE OR REPLACE FUNCTION check_stock_availability(product_id_param BIGINT, quantity_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    SELECT stock_quantity INTO current_stock 
    FROM products 
    WHERE id = product_id_param;
    
    RETURN current_stock >= quantity_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour réduire le stock après validation d'une commande
CREATE OR REPLACE FUNCTION reduce_product_stock(order_id_param BIGINT)
RETURNS VOID AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Parcourir tous les articles de la commande
    FOR item_record IN 
        SELECT product_id, quantity 
        FROM order_items 
        WHERE order_id = order_id_param
    LOOP
        -- Réduire le stock du produit
        UPDATE products 
        SET stock_quantity = stock_quantity - item_record.quantity,
            in_stock = CASE 
                WHEN stock_quantity - item_record.quantity <= 0 THEN false 
                ELSE true 
            END
        WHERE id = item_record.product_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour confirmer une commande (à appeler par l'admin)
CREATE OR REPLACE FUNCTION confirm_order(order_id_param BIGINT, admin_name TEXT DEFAULT 'Admin')
RETURNS BOOLEAN AS $$
DECLARE
    order_exists BOOLEAN;
BEGIN
    -- Vérifier que la commande existe et est en attente
    SELECT EXISTS(
        SELECT 1 FROM orders 
        WHERE id = order_id_param AND status = 'pending'
    ) INTO order_exists;
    
    IF NOT order_exists THEN
        RETURN false;
    END IF;
    
    -- Réduire le stock des produits
    PERFORM reduce_product_stock(order_id_param);
    
    -- Marquer la commande comme confirmée
    UPDATE orders 
    SET status = 'confirmed',
        confirmed_at = TIMEZONE('utc'::text, NOW()),
        confirmed_by = admin_name
    WHERE id = order_id_param;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;