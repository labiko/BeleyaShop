-- Script de debug pour le badge "Livraison 3J"
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table products
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name LIKE '%delivery%' OR column_name LIKE '%three%'
ORDER BY column_name;

-- 2. Lister TOUS les produits avec leur statut de livraison 3J
SELECT 
    id,
    name,
    category,
    three_day_delivery_eligible,
    price,
    stock_quantity,
    created_at
FROM products 
ORDER BY name;

-- 3. Rechercher spécifiquement les produits Samsung
SELECT 
    id,
    name,
    category,
    three_day_delivery_eligible,
    price,
    stock_quantity
FROM products 
WHERE LOWER(name) LIKE '%samsung%' 
   OR LOWER(name) LIKE '%galaxy%'
   OR LOWER(description) LIKE '%samsung%'
ORDER BY name;

-- 4. Compter les produits éligibles vs non éligibles
SELECT 
    three_day_delivery_eligible,
    COUNT(*) as count,
    string_agg(name, ', ') as products
FROM products 
GROUP BY three_day_delivery_eligible;

-- 5. Vérifier si le champ three_day_delivery_eligible existe et son type
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name = 'three_day_delivery_eligible';

-- 6. Script de correction - ACTIVER la livraison 3J pour Samsung Galaxy S 25
-- DÉCOMMENTEZ LA LIGNE SUIVANTE UNIQUEMENT SI NÉCESSAIRE
-- UPDATE products SET three_day_delivery_eligible = true WHERE LOWER(name) LIKE '%samsung%galaxy%s%25%';

-- 7. Vérifier après correction (à exécuter après l'UPDATE si nécessaire)
-- SELECT id, name, three_day_delivery_eligible FROM products WHERE LOWER(name) LIKE '%samsung%';

-- 8. Exemple de requête pour activer la livraison 3J pour un produit spécifique par ID
-- UPDATE products SET three_day_delivery_eligible = true WHERE id = [ID_DU_PRODUIT_SAMSUNG];

-- 9. Vérifier les produits avec livraison 3J activée
SELECT 
    id,
    name,
    three_day_delivery_eligible,
    category
FROM products 
WHERE three_day_delivery_eligible = true
ORDER BY name;

-- 10. Recherche par mots-clés pour trouver le Samsung Galaxy S 25
SELECT 
    id,
    name,
    three_day_delivery_eligible
FROM products 
WHERE name ILIKE '%Samsung Galaxy S 25%' 
   OR name ILIKE '%Samsung Galaxy S25%'
   OR name ILIKE '%Galaxy S 25%'
   OR name ILIKE '%Galaxy S25%';