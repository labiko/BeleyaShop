-- =====================================================
-- Migration: Ajouter colonne three_day_delivery_eligible
-- Date: 2025-01-21
-- Description: Ajoute la colonne pour indiquer si un produit
--              est éligible à la livraison à 3 jours ouvrés
-- =====================================================

-- Vérifier si la table products existe avant de procéder
DO $$ 
BEGIN
    -- Vérifier si la table products existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        
        -- 1. Ajouter la colonne three_day_delivery_eligible si elle n'existe pas
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'products' 
                       AND column_name = 'three_day_delivery_eligible') THEN
            ALTER TABLE products 
            ADD COLUMN three_day_delivery_eligible BOOLEAN DEFAULT false;
            
            RAISE NOTICE 'Colonne three_day_delivery_eligible ajoutee a la table products';
        ELSE
            RAISE NOTICE 'Colonne three_day_delivery_eligible existe deja dans la table products';
        END IF;
        
        -- 2. Mettre a jour certains produits pour etre eligibles
        -- Par defaut, on rend les cremes et gels eligibles (mais pas les parfums)
        UPDATE products 
        SET three_day_delivery_eligible = true 
        WHERE category IN ('cremes', 'gels') 
        AND stock_quantity > 5;
        
        RAISE NOTICE 'Produits mis a jour pour eligibilite livraison 3 jours';
        
        -- 3. Creer un index pour les requetes de produits eligibles
        CREATE INDEX IF NOT EXISTS idx_products_three_day_delivery 
        ON products(three_day_delivery_eligible) 
        WHERE three_day_delivery_eligible = true;
        
        RAISE NOTICE 'Index idx_products_three_day_delivery cree';
        
    ELSE
        RAISE EXCEPTION 'La table products n''existe pas. Veuillez d''abord executer le script supabase-setup.sql';
    END IF;
END $$;

-- 4. Vérification finale
SELECT 
    category,
    COUNT(*) as total_products,
    COUNT(CASE WHEN three_day_delivery_eligible = true THEN 1 END) as eligible_products
FROM products 
GROUP BY category
ORDER BY category;

-- Afficher quelques exemples
SELECT 
    id, 
    name,
    category,
    stock_quantity,
    three_day_delivery_eligible
FROM products 
ORDER BY three_day_delivery_eligible DESC, category
LIMIT 10;

-- =====================================================
-- FIN
-- =====================================================