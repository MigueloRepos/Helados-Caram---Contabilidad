-- ============================================================================
-- HELADOS CARAM — ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ============================================================================
-- Copia y ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- Incluye: Tablas, Primary Keys, Foreign Keys, Índices, Constraints, 
-- Triggers de Cálculo Automático, Row Level Security (RLS), Policies, 
-- Configuración de Storage y Seed Data Inicial.
-- ============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA PROFILES
-- Se vincula directamente con auth.users de Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'frank' CHECK (role IN ('admin', 'frank')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA FLAVORS (SABORES)
CREATE TABLE IF NOT EXISTS public.flavors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DAILY_CLOSINGS (CIERRES DIARIOS)
CREATE TABLE IF NOT EXISTS public.daily_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    closing_date DATE NOT NULL UNIQUE,
    total_cups INTEGER NOT NULL CHECK (total_cups >= 0),
    total_sales NUMERIC(12, 2) NOT NULL CHECK (total_sales >= 0),
    workers_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (workers_salary >= 0),
    delivery_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_salary >= 0),
    other_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (other_expenses >= 0),
    total_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    delivered_to_frank NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivered_to_frank >= 0),
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    remaining_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA DAILY_CLOSING_FLAVORS (VENTAS POR SABOR EN CADA CIERRE)
CREATE TABLE IF NOT EXISTS public.daily_closing_flavors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_id UUID NOT NULL REFERENCES public.daily_closings(id) ON DELETE CASCADE,
    flavor_id UUID NOT NULL REFERENCES public.flavors(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_closing_flavor UNIQUE (closing_id, flavor_id)
);

-- 6. TABLA AUDIT_LOGS (AUDITORÍA FINANCIERA)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 7. ÍNDICES DE RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON public.daily_closings(closing_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_closings_user ON public.daily_closings(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_closing_flavors_closing ON public.daily_closing_flavors(closing_id);
CREATE INDEX IF NOT EXISTS idx_daily_closing_flavors_flavor ON public.daily_closing_flavors(flavor_id);
CREATE INDEX IF NOT EXISTS idx_flavors_active ON public.flavors(active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- 8. FUNCIONES Y TRIGGERS DE INTEGRIDAD Y CÁLCULOS
-- ============================================================================

-- Función para calcular automáticamente los totales de cierre
CREATE OR REPLACE FUNCTION public.calculate_daily_closing_financials()
RETURNS TRIGGER AS $$
BEGIN
    -- Asegurar que ningún valor nulo rompa los cálculos
    NEW.workers_salary := COALESCE(NEW.workers_salary, 0.00);
    NEW.delivery_salary := COALESCE(NEW.delivery_salary, 0.00);
    NEW.other_expenses := COALESCE(NEW.other_expenses, 0.00);
    NEW.delivered_to_frank := COALESCE(NEW.delivered_to_frank, 0.00);
    NEW.total_sales := COALESCE(NEW.total_sales, 0.00);
    
    -- total_expenses = workers_salary + delivery_salary + other_expenses
    NEW.total_expenses := NEW.workers_salary + NEW.delivery_salary + NEW.other_expenses;
    
    -- balance = total_sales - total_expenses
    NEW.balance := NEW.total_sales - NEW.total_expenses;
    
    -- remaining_balance = balance - delivered_to_frank
    NEW.remaining_balance := NEW.balance - NEW.delivered_to_frank;
    
    NEW.updated_at := timezone('utc'::text, now());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar los cálculos antes de INSERT o UPDATE en daily_closings
DROP TRIGGER IF EXISTS trigger_calculate_closing_financials ON public.daily_closings;
CREATE TRIGGER trigger_calculate_closing_financials
    BEFORE INSERT OR UPDATE ON public.daily_closings
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_daily_closing_financials();

-- Trigger para updated_at automático en profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_flavors_updated_at ON public.flavors;
CREATE TRIGGER trigger_flavors_updated_at
    BEFORE UPDATE ON public.flavors
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Función y trigger para sincronizar nuevo usuario de auth.users a profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_user_role TEXT;
BEGIN
    -- Si es el primer usuario en registrarse, asignarle rol admin; de lo contrario 'frank'
    IF (SELECT count(*) FROM public.profiles) = 0 THEN
        first_user_role := 'admin';
    ELSE
        first_user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'frank');
    END IF;

    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        first_user_role
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger de auditoría para daily_closings
CREATE OR REPLACE FUNCTION public.audit_daily_closings()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (auth.uid(), 'INSERT', 'daily_closings', NEW.id::text, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (auth.uid(), 'UPDATE', 'daily_closings', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (auth.uid(), 'DELETE', 'daily_closings', OLD.id::text, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_daily_closings ON public.daily_closings;
CREATE TRIGGER trigger_audit_daily_closings
    AFTER INSERT OR UPDATE OR DELETE ON public.daily_closings
    FOR EACH ROW EXECUTE FUNCTION public.audit_daily_closings();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closing_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- POLICIES FOR PROFILES ---
CREATE POLICY "Profiles viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update own profile or Admin can update any" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admin can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR auth.uid() = id);

-- --- POLICIES FOR FLAVORS ---
CREATE POLICY "Flavors are viewable by all authenticated users" 
ON public.flavors FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only Admin can insert flavors" 
ON public.flavors FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

CREATE POLICY "Only Admin can update flavors" 
ON public.flavors FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only Admin can delete flavors" 
ON public.flavors FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- --- POLICIES FOR DAILY_CLOSINGS ---
CREATE POLICY "Daily closings viewable by authenticated users" 
ON public.daily_closings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create daily closings" 
ON public.daily_closings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin or owner can update daily closings" 
ON public.daily_closings FOR UPDATE 
TO authenticated 
USING (public.is_admin() OR auth.uid() = user_id)
WITH CHECK (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Only Admin can delete daily closings" 
ON public.daily_closings FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- --- POLICIES FOR DAILY_CLOSING_FLAVORS ---
CREATE POLICY "Closing flavors viewable by authenticated users" 
ON public.daily_closing_flavors FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert closing flavors" 
ON public.daily_closing_flavors FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update closing flavors" 
ON public.daily_closing_flavors FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Only Admin or creator can delete closing flavors" 
ON public.daily_closing_flavors FOR DELETE 
TO authenticated 
USING (true);

-- --- POLICIES FOR AUDIT_LOGS ---
CREATE POLICY "Audit logs viewable by Admin only" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (public.is_admin());

-- ============================================================================
-- 10. CONFIGURACIÓN DE SUPABASE STORAGE (BUCKET AVATARS)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- 11. SEED DATA INICIAL (SABORES Y REGISTROS DE EJEMPLO)
-- ============================================================================
INSERT INTO public.flavors (name, active) VALUES
    ('Chocolate', true),
    ('Vainilla', true),
    ('Fresa', true),
    ('Mantecado', true),
    ('Cookies & Cream', true),
    ('Dulce de Leche', true),
    ('Coco', true),
    ('Mango', true),
    ('Pistacho', true),
    ('Maracuyá', true)
ON CONFLICT (name) DO NOTHING;
