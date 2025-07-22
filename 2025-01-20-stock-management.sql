-- Script SQL pour ajouter la gestion de stock - 20 Janvier 2025
-- Exécutez ce script dans le SQL Editor de votre dashboard Supabase

-- =====================================================
-- MISE À JOUR TABLE PRODUCTS - Ajouter stock_quantity
-- =====================================================

-- Ajouter la colonne stock_quantity si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
        ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Colonne stock_quantity ajoutée à la table products';
    ELSE
        RAISE NOTICE 'Colonne stock_quantity existe déjà dans la table products';
    END IF;
END $$;

-- Mettre à jour les produits existants avec un stock par défaut
UPDATE products SET stock_quantity = 50 WHERE stock_quantity = 0 AND category = 'cremes';
UPDATE products SET stock_quantity = 75 WHERE stock_quantity = 0 AND category = 'gels';
UPDATE products SET stock_quantity = 25 WHERE stock_quantity = 0 AND category = 'parfums';

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

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Enable read access for orders" ON orders;
DROP POLICY IF EXISTS "Enable insert access for orders" ON orders;
DROP POLICY IF EXISTS "Enable update access for orders" ON orders;
DROP POLICY IF EXISTS "Enable read access for order_items" ON order_items;
DROP POLICY IF EXISTS "Enable insert access for order_items" ON order_items;
DROP POLICY IF EXISTS "Enable update access for order_items" ON order_items;

-- Politiques RLS pour orders (lecture et écriture publique pour demo)
CREATE POLICY "Enable read access for orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for orders" ON orders FOR UPDATE USING (true);

-- Politiques RLS pour order_items (lecture et écriture publique pour demo)
CREATE POLICY "Enable read access for order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for order_items" ON order_items FOR UPDATE USING (true);

-- Trigger pour mettre à jour updated_at sur orders (utilise la fonction existante)
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
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

-- =====================================================
-- VÉRIFICATIONS ET NOTIFICATIONS
-- =====================================================

-- Vérifier que tout s'est bien passé
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Compter les tables créées
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('orders', 'order_items') 
    AND table_schema = 'public';
    
    -- Compter les fonctions créées
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_name IN ('check_stock_availability', 'reduce_product_stock', 'confirm_order')
    AND routine_schema = 'public';
    
    RAISE NOTICE '✅ Gestion de stock installée avec succès!';
    RAISE NOTICE '📊 Tables créées/vérifiées: %', table_count;
    RAISE NOTICE '⚙️ Fonctions créées: %', function_count;
    RAISE NOTICE '🎯 Le système de gestion de stock est prêt à fonctionner!';
END $$;