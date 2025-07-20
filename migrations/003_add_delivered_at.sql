-- =====================================================
-- Migration: Ajouter colonne delivered_at
-- Date: 2025-01-20
-- Description: Ajoute la colonne delivered_at pour stocker
--              la date/heure de validation de livraison
-- =====================================================

-- 1. Ajouter la colonne delivered_at
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- 2. Mettre à jour les commandes déjà livrées avec updated_at
UPDATE orders 
SET delivered_at = updated_at 
WHERE status = 'delivered' 
AND delivered_at IS NULL;

-- 3. Créer un trigger pour mettre à jour delivered_at automatiquement
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

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_delivered_at' 
        AND event_object_table = 'orders'
    ) THEN
        CREATE TRIGGER trigger_update_delivered_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION trigger_update_delivered_at();
    END IF;
END $$;

-- 4. Créer un index pour les requêtes par date de livraison
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at) 
WHERE delivered_at IS NOT NULL;

-- 5. Vérification finale
SELECT 
    COUNT(*) as total_delivered_orders,
    COUNT(delivered_at) as orders_with_delivered_at
FROM orders 
WHERE status = 'delivered';

-- Afficher quelques exemples
SELECT 
    id, 
    order_number, 
    status,
    created_at,
    confirmed_at,
    delivered_at
FROM orders 
WHERE status = 'delivered'
ORDER BY delivered_at DESC
LIMIT 10;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

/*
Instructions d'utilisation:
1. Exécuter ce script dans l'éditeur SQL de Supabase
2. Vérifier que toutes les commandes livrées ont une delivered_at
3. Le champ sera automatiquement mis à jour pour les nouvelles livraisons

Note: Ce script est idempotent - il peut être exécuté plusieurs fois sans problème
*/