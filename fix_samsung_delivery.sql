-- Script pour corriger le badge Livraison 3J pour Samsung Galaxy S 25
-- À exécuter dans Supabase SQL Editor

-- 1. D'abord, vérifier l'état actuel du produit Samsung
SELECT 
    id,
    name,
    three_day_delivery_eligible,
    in_stock,
    stock_quantity,
    category
FROM products 
WHERE name ILIKE '%Samsung%Galaxy%S%25%' 
   OR name ILIKE '%Galaxy%S%25%'
   OR name ILIKE '%Samsung Galaxy S25%'
   OR name = 'Samsung Galaxy S 25';

-- 2. Si le produit existe mais three_day_delivery_eligible est false ou NULL
-- DÉCOMMENTEZ et MODIFIEZ l'ID ci-dessous avec l'ID réel trouvé dans la requête 1
-- UPDATE products 
-- SET three_day_delivery_eligible = true 
-- WHERE id = [REMPLACER_PAR_ID_SAMSUNG];

-- 3. Alternative : Mise à jour par nom (plus sûre)
UPDATE products 
SET three_day_delivery_eligible = true 
WHERE name = 'Samsung Galaxy S 25';

-- 4. Vérifier que la mise à jour a fonctionné
SELECT 
    id,
    name,
    three_day_delivery_eligible,
    category
FROM products 
WHERE name = 'Samsung Galaxy S 25';

-- 5. Si le produit n'existe pas du tout, le créer (ADAPTER LES VALEURS)
-- INSERT INTO products (
--     name, 
--     description, 
--     price, 
--     image, 
--     category, 
--     in_stock, 
--     stock_quantity,
--     three_day_delivery_eligible,
--     created_at
-- ) VALUES (
--     'Samsung Galaxy S 25',
--     'Samsung Galaxy S 25',
--     12000000,
--     'https://example.com/samsung-s25.jpg',
--     'Téléphones',
--     true,
--     2,
--     true,
--     NOW()
-- );

-- 6. Lister tous les produits avec livraison 3J pour vérification
SELECT 
    id,
    name,
    three_day_delivery_eligible,
    category
FROM products 
WHERE three_day_delivery_eligible = true
ORDER BY name;

-- 7. Vérifier la structure de la colonne (au cas où elle n'existerait pas)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name = 'three_day_delivery_eligible';

-- 8. Si la colonne n'existe pas, la créer (TRÈS RARE)
-- ALTER TABLE products 
-- ADD COLUMN three_day_delivery_eligible BOOLEAN DEFAULT false;

-- 9. Statistiques finales
SELECT 
    three_day_delivery_eligible,
    COUNT(*) as count,
    string_agg(name, ', ' ORDER BY name) as products
FROM products 
GROUP BY three_day_delivery_eligible;