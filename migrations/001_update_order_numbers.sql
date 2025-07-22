-- =====================================================
-- Migration: Mise à jour des numéros de commande
-- Date: 2025-01-20
-- Description: Migre tous les numéros de commande existants 
--              vers le format GN905EGXXXXX
-- Format: GN (Guinée) + 905 (Conakry) + EG (BeleyaShop) + XXXXX (séquentiel)
-- =====================================================

-- 1. Ajouter la colonne order_number si elle n'existe pas
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;

-- 2. Créer une fonction pour générer des numéros uniques
CREATE OR REPLACE FUNCTION generate_order_number(order_id BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Générer un nouveau numéro
        new_number := CONCAT(
            'GN905EG',
            -- Utiliser l'ID avec padding à 5 chiffres
            LPAD(order_id::text, 5, '0'),
            -- Ajouter 2 chiffres aléatoires
            LPAD(FLOOR(RANDOM() * 100)::text, 2, '0')
        );
        
        -- Vérifier l'unicité
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        -- Limite de sécurité
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Impossible de générer un numéro unique après 100 tentatives';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Mettre à jour toutes les commandes sans numéro valide
DO $$
DECLARE
    r RECORD;
    new_number VARCHAR;
BEGIN
    FOR r IN 
        SELECT id 
        FROM orders 
        WHERE order_number IS NULL 
           OR order_number = ''
           OR order_number NOT LIKE 'GN905EG%'
        ORDER BY created_at ASC
    LOOP
        new_number := generate_order_number(r.id);
        
        UPDATE orders 
        SET order_number = new_number
        WHERE id = r.id;
        
        RAISE NOTICE 'Commande % mise à jour avec le numéro: %', r.id, new_number;
    END LOOP;
END $$;

-- 4. Créer un index sur order_number pour les performances
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- 5. Ajouter une contrainte pour s'assurer que les nouveaux numéros suivent le format
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_order_number_format' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT check_order_number_format 
        CHECK (order_number ~ '^GN905EG[0-9]{7}$');
    END IF;
END $$;

-- 6. Créer un trigger pour générer automatiquement le numéro pour les nouvelles commandes
CREATE OR REPLACE FUNCTION trigger_generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    temp_number VARCHAR;
    counter INTEGER := 0;
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        -- Générer un numéro temporaire basé sur le timestamp
        LOOP
            temp_number := CONCAT(
                'GN905EG',
                LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT % 100000, 5, '0'),
                LPAD(FLOOR(RANDOM() * 100)::INTEGER, 2, '0')
            );
            
            -- Vérifier l'unicité
            IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = temp_number) THEN
                NEW.order_number := temp_number;
                EXIT;
            END IF;
            
            counter := counter + 1;
            IF counter > 100 THEN
                RAISE EXCEPTION 'Impossible de générer un numéro unique';
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'before_insert_order_number' 
        AND event_object_table = 'orders'
    ) THEN
        CREATE TRIGGER before_insert_order_number
        BEFORE INSERT ON orders
        FOR EACH ROW
        EXECUTE FUNCTION trigger_generate_order_number();
    END IF;
END $$;

-- 7. Vérification finale
SELECT 
    COUNT(*) as total_orders,
    COUNT(order_number) as orders_with_number,
    COUNT(CASE WHEN order_number LIKE 'GN905EG%' THEN 1 END) as valid_format_count
FROM orders;

-- 8. Afficher un échantillon des résultats
SELECT 
    id, 
    order_number, 
    created_at,
    total_amount,
    status
FROM orders 
ORDER BY created_at DESC
LIMIT 20;

-- 9. Nettoyer la fonction temporaire (optionnel)
-- DROP FUNCTION IF EXISTS generate_order_number(INTEGER);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

/*
Instructions d'utilisation:
1. Faire une sauvegarde de la table orders avant d'exécuter ce script
2. Exécuter ce script dans l'éditeur SQL de Supabase
3. Vérifier les résultats avec les requêtes de vérification
4. En cas d'erreur, restaurer depuis la sauvegarde

Note: Ce script est idempotent - il peut être exécuté plusieurs fois sans problème
*/