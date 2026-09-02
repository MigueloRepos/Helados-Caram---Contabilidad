import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react';

const SQL_CONTENT = `-- ============================================================================
-- HELADOS CARAM — ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'frank' CHECK (role IN ('admin', 'frank')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA FLAVORS (SABORES)
CREATE TABLE IF NOT EXISTS public.flavors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA DAILY_CLOSINGS (CIERRES DIARIOS)
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

-- 4. TABLA DAILY_CLOSING_FLAVORS (SABORES POR CIERRE)
CREATE TABLE IF NOT EXISTS public.daily_closing_flavors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_id UUID NOT NULL REFERENCES public.daily_closings(id) ON DELETE CASCADE,
    flavor_id UUID NOT NULL REFERENCES public.flavors(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_closing_flavor UNIQUE (closing_id, flavor_id)
);

-- 5. TABLA AUDIT_LOGS
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

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON public.daily_closings(closing_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_closings_user ON public.daily_closings(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_closing_flavors_closing ON public.daily_closing_flavors(closing_id);
CREATE INDEX IF NOT EXISTS idx_daily_closing_flavors_flavor ON public.daily_closing_flavors(flavor_id);
CREATE INDEX IF NOT EXISTS idx_flavors_active ON public.flavors(active);

-- 7. TRIGGERS DE CÁLCULOS
CREATE OR REPLACE FUNCTION public.calculate_daily_closing_financials()
RETURNS TRIGGER AS $$
BEGIN
    NEW.workers_salary := COALESCE(NEW.workers_salary, 0.00);
    NEW.delivery_salary := COALESCE(NEW.delivery_salary, 0.00);
    NEW.other_expenses := COALESCE(NEW.other_expenses, 0.00);
    NEW.delivered_to_frank := COALESCE(NEW.delivered_to_frank, 0.00);
    NEW.total_sales := COALESCE(NEW.total_sales, 0.00);
    
    NEW.total_expenses := NEW.workers_salary + NEW.delivery_salary + NEW.other_expenses;
    NEW.balance := NEW.total_sales - NEW.total_expenses;
    NEW.remaining_balance := NEW.balance - NEW.delivered_to_frank;
    NEW.updated_at := timezone('utc'::text, now());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_closing_financials ON public.daily_closings;
CREATE TRIGGER trigger_calculate_closing_financials
    BEFORE INSERT OR UPDATE ON public.daily_closings
    FOR EACH ROW EXECUTE FUNCTION public.calculate_daily_closing_financials();

-- Trigger para nuevo usuario de auth.users a profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_user_role TEXT;
BEGIN
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

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closing_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies Profiles
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile or Admin can update any" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR auth.uid() = id);

-- Policies Flavors
CREATE POLICY "Flavors are viewable by all authenticated users" ON public.flavors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only Admin can insert flavors" ON public.flavors FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Only Admin can update flavors" ON public.flavors FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Only Admin can delete flavors" ON public.flavors FOR DELETE TO authenticated USING (public.is_admin());

-- Policies Closings
CREATE POLICY "Daily closings viewable by authenticated users" ON public.daily_closings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create daily closings" ON public.daily_closings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin or owner can update daily closings" ON public.daily_closings FOR UPDATE TO authenticated USING (public.is_admin() OR auth.uid() = user_id);
CREATE POLICY "Only Admin can delete daily closings" ON public.daily_closings FOR DELETE TO authenticated USING (public.is_admin());

-- Policies Daily Closing Flavors
CREATE POLICY "Closing flavors viewable by authenticated users" ON public.daily_closing_flavors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert closing flavors" ON public.daily_closing_flavors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update closing flavors" ON public.daily_closing_flavors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only Admin or creator can delete closing flavors" ON public.daily_closing_flavors FOR DELETE TO authenticated USING (true);

-- 9. STORAGE BUCKET AVATARS
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 10. SEED FLAVORS
INSERT INTO public.flavors (name, active) VALUES
    ('Chocolate', true),
    ('Vainilla', true),
    ('Fresa', true),
    ('Mantecado', true),
    ('Cookies & Cream', true),
    ('Dulce de Leche', true),
    ('Coco', true),
    ('Mango', true)
ON CONFLICT (name) DO NOTHING;
`;

export const SqlScriptModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Script SQL para Supabase (PostgreSQL)"
      description="Copia y ejecuta este script en el SQL Editor de tu proyecto Supabase para crear las tablas, triggers y RLS."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-amber-600" />
            PostgreSQL 15+ compatible
          </span>
          <div className="flex items-center gap-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700"
            >
              Abrir Supabase <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Todo el SQL
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 bg-stone-900 text-amber-200 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[50vh] leading-relaxed border border-stone-800">
            {SQL_CONTENT}
          </pre>
        </div>

        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-xs text-stone-600 dark:text-stone-300">
          <p className="font-semibold text-stone-800 dark:text-stone-200 mb-1">Pasos recomendados:</p>
          <p>1. Pega y ejecuta el SQL en <strong>Supabase SQL Editor</strong>.</p>
          <p>2. Crea tu usuario en <strong>Authentication → Users</strong>.</p>
          <p>3. El primer usuario registrado obtendrá automáticamente el rol <strong>admin</strong>.</p>
        </div>
      </div>
    </Modal>
  );
};
