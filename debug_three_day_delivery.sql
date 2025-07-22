-- =====================================================
-- Script de diagnostic pour badge "Livraison 3J"
-- Date: 2025-01-22
-- Description: Vérifier et corriger les données de livraison
-- =====================================================

-- 1. Vérifier la structure de la table products
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 2. Vérifier tous les produits et leur éligibilité
SELECT 
    id,
    name,
    category,
    stock_quantity,
    in_stock,
    three_day_delivery_eligible,
    CASE 
        WHEN three_day_delivery_eligible = true THEN '✅ ÉLIGIBLE'
        ELSE '❌ NON ÉLIGIBLE'
    END as eligibility_status
FROM products 
ORDER BY name;

-- 3. Rechercher spécifiquement les produits Samsung/Galaxy
SELECT 
    id,
    name,
    category,
    stock_quantity,
    in_stock,
    three_day_delivery_eligible,
    created_at
FROM products 
WHERE LOWER(name) LIKE '%samsung%' 
   OR LOWER(name) LIKE '%galaxy%'
ORDER BY name;

-- 4. Statistiques par catégorie
SELECT 
    category,
    COUNT(*) as total_products,
    COUNT(CASE WHEN three_day_delivery_eligible = true THEN 1 END) as eligible_products,
    ROUND(
        COUNT(CASE WHEN three_day_delivery_eligible = true THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as percentage_eligible
FROM products 
GROUP BY category
ORDER BY category;

-- 5. Si des produits Samsung existent mais ne sont pas éligibles, les corriger
-- ATTENTION: Décommentez seulement après vérification manuelle
/*
UPDATE products 
SET three_day_delivery_eligible = true 
WHERE (LOWER(name) LIKE '%samsung%' OR LOWER(name) LIKE '%galaxy%')
  AND three_day_delivery_eligible = false
  AND in_stock = true
  AND stock_quantity > 0;
*/

-- 6. Vérification finale
SELECT 
    'Produits Samsung/Galaxy éligibles:' as info,
    COUNT(*) as count
FROM products 
WHERE (LOWER(name) LIKE '%samsung%' OR LOWER(name) LIKE '%galaxy%')
  AND three_day_delivery_eligible = true;

-- =====================================================
-- Instructions d'utilisation:
-- 1. Exécutez d'abord les requêtes SELECT pour diagnostiquer
-- 2. Si nécessaire, décommentez et exécutez la requête UPDATE
-- 3. Vérifiez dans l'application web après mise à jour
-- =====================================================