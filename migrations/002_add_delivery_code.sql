-- =====================================================
-- Migration: Ajouter code de livraison à 4 chiffres
-- Date: 2025-01-20
-- Description: Ajoute un code de livraison unique à 4 chiffres
--              pour validation par le livreur
-- =====================================================

-- 1. Ajouter la colonne delivery_code
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_code VARCHAR(4);

-- 2. Créer une fonction pour générer un code de livraison unique
CREATE OR REPLACE FUNCTION generate_delivery_code()
RETURNS VARCHAR AS $$
DECLARE
    new_code VARCHAR;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Générer un code à 4 chiffres aléatoire
        new_code := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
        
        -- Vérifier l'unicité (parmi les commandes actives)
        IF NOT EXISTS (
            SELECT 1 FROM orders 
            WHERE delivery_code = new_code 
            AND status IN ('confirmed', 'pending')
        ) THEN
            RETURN new_code;
        END IF;
        
        -- Limite de sécurité
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Impossible de générer un code de livraison unique après 100 tentatives';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Mettre à jour toutes les commandes confirmées sans code
UPDATE orders 
SET delivery_code = generate_delivery_code()
WHERE status = 'confirmed' 
AND (delivery_code IS NULL OR delivery_code = '');

-- 4. Créer un trigger pour générer automatiquement le code lors de la confirmation
CREATE OR REPLACE FUNCTION trigger_generate_delivery_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Générer un code de livraison quand la commande passe à 'confirmed'
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        IF NEW.delivery_code IS NULL OR NEW.delivery_code = '' THEN
            NEW.delivery_code := generate_delivery_code();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_delivery_code_on_confirm' 
        AND event_object_table = 'orders'
    ) THEN
        CREATE TRIGGER trigger_delivery_code_on_confirm
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION trigger_generate_delivery_code();
    END IF;
END $$;

-- 5. Créer un index pour les recherches rapides par code de livraison
CREATE INDEX IF NOT EXISTS idx_orders_delivery_code ON orders(delivery_code) 
WHERE delivery_code IS NOT NULL;

-- 6. Vérification finale
SELECT 
    COUNT(*) as total_confirmed_orders,
    COUNT(delivery_code) as orders_with_delivery_code
FROM orders 
WHERE status = 'confirmed';

-- Afficher quelques exemples
SELECT 
    id, 
    order_number, 
    delivery_code,
    status,
    created_at
FROM orders 
WHERE status = 'confirmed'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

/*
Instructions d'utilisation:
1. Exécuter ce script dans l'éditeur SQL de Supabase
2. Vérifier que toutes les commandes confirmées ont un delivery_code
3. Le code sera automatiquement généré pour les nouvelles confirmations

Note: Ce script est idempotent - il peut être exécuté plusieurs fois sans problème
*/