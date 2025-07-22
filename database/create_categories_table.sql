-- Script SQL pour créer la table categories dans Supabase
-- Exécuter ce script dans l'onglet "SQL Editor" de votre dashboard Supabase

-- Création de la table categories
CREATE TABLE public.categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'cube-outline',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_categories_name ON public.categories(name);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Activation de Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture publique des catégories
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

-- Politique pour permettre toutes les opérations (temporairement sans authentification)
CREATE POLICY "Categories can be managed by everyone" 
ON public.categories FOR ALL 
USING (true);

-- Insertion des catégories par défaut
INSERT INTO public.categories (name, description, icon) VALUES
    ('Soins du visage', 'Crèmes, sérums, masques pour le visage', 'face-outline'),
    ('Maquillage', 'Rouge à lèvres, fond de teint, mascara', 'brush-outline'),
    ('Soins capillaires', 'Shampoing, après-shampoing, masques', 'cut-outline'),
    ('Parfums', 'Eaux de parfum, eaux de toilette', 'flower-outline'),
    ('Soins du corps', 'Crèmes, gels douche, gommages', 'body-outline'),
    ('Solaires', 'Protection solaire, après-soleil', 'sunny-outline');

-- Vérification de l'insertion
SELECT * FROM public.categories ORDER BY created_at;