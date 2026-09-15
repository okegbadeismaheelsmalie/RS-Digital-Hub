-- =============================================================================
-- RS Digital Hub — Unified Production Database Schema
-- Run this script in the Supabase SQL Editor to initialize all tables,
-- RLS policies, triggers, and storage buckets in one execution.
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- 2.1 Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    whatsapp_phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar_url TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2.2 Services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    base_price NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.services (slug, name, description, icon, base_price)
VALUES 
    ('website-development', 'Website Development', 'Corporate websites, e-commerce stores, portfolio showcases, blogs, and portals.', '🌐', 50000.00),
    ('graphic-design', 'Graphic Design & Brand Identity', 'Logos, full brand guidelines, flyers, banners, social media packages, and UI design.', '🎨', 15000.00),
    ('ai-solutions', 'AI Solutions & Intelligent Chatbots', 'Customer service AI agents, automated workflow integration, and custom AI tools.', '🤖', 80000.00),
    ('web-applications', 'Web Applications & Portals', 'Full-stack software, portals, SaaS platforms, and operational dashboards.', '📱', 120000.00),
    ('computer-training', 'Computer Training & Digital Skills', 'One-on-one and cohort training in Web Development, Python, Graphic Design, and Office Suites.', '💻', 30000.00),
    ('technical-support', 'Technical Support & Maintenance', 'Website maintenance, security hardening, bug fixes, updates, and speed optimization.', '🛠', 25000.00)
ON CONFLICT (slug) DO NOTHING;

-- 2.3 Pricing Rules
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_slug TEXT NOT NULL REFERENCES public.services(slug) ON DELETE CASCADE,
    tier_name TEXT NOT NULL,
    tier_description TEXT,
    base_price NUMERIC(12, 2) NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    addons JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_days INTEGER DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(service_slug, tier_name)
);

INSERT INTO public.pricing_rules (service_slug, tier_name, tier_description, base_price, features, addons, estimated_days)
VALUES 
    ('website-development', 'Starter', 'Ideal for individuals, landing pages, and small portfolios.', 50000.00, 
     '["1-3 Custom Pages", "Mobile Responsive", "Contact Form Integration", "Basic SEO Setup", "1 Round of Revisions"]'::jsonb,
     '[{"id": "speed", "name": "Speed Optimization & CDN", "price": 15000}, {"id": "seo", "name": "Advanced Google SEO", "price": 20000}, {"id": "cms", "name": "Blog / Content Manager", "price": 25000}]'::jsonb, 7),
    ('website-development', 'Standard', 'Complete business website with CMS and professional branding.', 150000.00,
     '["Up to 7 Pages", "Custom UI/UX Design", "Content Management System", "Google Analytics & SEO", "Social Media Integration", "WhatsApp Chatbot", "3 Rounds of Revisions"]'::jsonb,
     '[{"id": "ecommerce", "name": "Online Payment Gateway", "price": 40000}, {"id": "copy", "name": "Professional Copywriting", "price": 25000}]'::jsonb, 14),
    ('website-development', 'Premium', 'Full-scale corporate or e-commerce website with advanced integrations.', 350000.00,
     '["Unlimited Pages", "Custom Dynamic Architecture", "Full E-Commerce / Storefront", "Payment Gateways (Paystack/Flutterwave)", "Client Portal / Dashboard", "Priority 24/7 Support"]'::jsonb,
     '[{"id": "maintenance", "name": "6-Month Maintenance Care", "price": 80000}]'::jsonb, 25),
    ('graphic-design', 'Logo & Identity', 'Professional brand identity and logo pack.', 25000.00,
     '["3 Unique Logo Concepts", "Vector Source Files (AI, SVG, PNG)", "Color Palette & Typography Guide", "Social Media Display Assets"]'::jsonb,
     '[{"id": "flyer", "name": "Matching Business Card & Letterhead", "price": 15000}]'::jsonb, 5),
    ('graphic-design', 'Full Brand Kit', 'Complete brand identity kit, stationery, social kit.', 60000.00,
     '["Full Brand Book", "Marketing Flyers (3 sets)", "Social Media Templates (5 sets)", "Print-Ready Vector Assets"]'::jsonb,
     '[]'::jsonb, 10),
    ('ai-solutions', 'AI Chatbot & Automation', 'Custom trained AI assistant for your website or business operations.', 100000.00,
     '["Custom Knowledge Base Integration", "Website Widget Deployment", "Lead Capture & Email Alerts", "WhatsApp or Telegram Integration"]'::jsonb,
     '[{"id": "crm", "name": "CRM / Spreadsheet Sync", "price": 30000}]'::jsonb, 14),
    ('web-applications', 'Custom Web Application', 'Custom database-driven web application with authentication and workflows.', 250000.00,
     '["User Authentication & RBAC", "Database Architecture", "Custom Dashboard & Workflows", "API Integrations", "Automated Email Alerts"]'::jsonb,
     '[{"id": "mobile", "name": "PWA Offline Support", "price": 50000}]'::jsonb, 30)
ON CONFLICT (service_slug, tier_name) DO NOTHING;

-- 2.4 Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    project_status TEXT NOT NULL DEFAULT 'submitted' 
        CHECK (project_status IN ('submitted', 'reviewing', 'approved', 'in_progress', 'waiting_for_customer', 'revision', 'completed', 'cancelled')),
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('low', 'standard', 'high', 'urgent')),
    budget_estimate NUMERIC(12, 2),
    budget NUMERIC(12, 2),
    final_amount NUMERIC(12, 2),
    start_date DATE,
    expected_completion_date DATE,
    deadline DATE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON public.projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(project_code);

-- 2.5 Project Activity
CREATE TABLE IF NOT EXISTS public.project_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    message TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project_id ON public.project_activity(project_id);

-- 2.6 Project Files
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    file_path TEXT NOT NULL,
    file_category TEXT NOT NULL DEFAULT 'reference' CHECK (file_category IN ('reference', 'deliverable', 'payment_proof', 'document')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);

-- 2.7 Estimates & Items
CREATE TABLE IF NOT EXISTS public.estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_number TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    adjustments NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
    valid_until DATE,
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.estimate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_estimates_project_id ON public.estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON public.estimates(customer_id);

-- 2.8 Invoices & Items
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);

-- 2.9 Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT NOT NULL UNIQUE,
    payment_reference TEXT,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
    proof_url TEXT,
    proof_file_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('pending', 'submitted', 'verified', 'rejected')),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    admin_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);

-- 2.10 Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL DEFAULT 'customer' CHECK (sender_role IN ('customer', 'admin')),
    message TEXT NOT NULL,
    attachment_url TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);

-- 2.11 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    related_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- 2.12 Payment Settings (Secure Bank Details)
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN (₦)',
    routing_info TEXT,
    payment_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.payment_settings (bank_name, account_name, account_number, currency, routing_info, payment_notes)
VALUES (
    'OPay / First Bank of Nigeria',
    'RS Digital Hub / Royal Smalie',
    '09117035399',
    'NGN (₦)',
    'Sort Code: 011 / Branch: Lagos, Nigeria',
    'Please include your Invoice or Project Number (e.g. RDH-0001) in your transfer description. After payment, upload your payment receipt or enter the transaction reference in your customer dashboard.'
) ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on auth.users signup with admin protection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_role TEXT := 'customer';
BEGIN
    -- Only the designated administrator email receives the admin role
    IF LOWER(NEW.email) = 'okegbadeismaheelsmalie@gmail.com' THEN
        initial_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, full_name, email, phone, whatsapp_phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'whatsapp_phone'),
        COALESCE(NEW.raw_user_meta_data->>'whatsapp_phone', NEW.raw_user_meta_data->>'phone'),
        initial_role
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        whatsapp_phone = COALESCE(EXCLUDED.whatsapp_phone, public.profiles.whatsapp_phone),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if current authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK ((auth.uid() = id AND role = 'customer') OR public.is_admin());

-- Services & Pricing Policies
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Services are viewable by everyone" 
    ON public.services FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Services are manageable by admin" ON public.services;
CREATE POLICY "Services are manageable by admin" 
    ON public.services FOR ALL 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Pricing rules are viewable by everyone" ON public.pricing_rules;
CREATE POLICY "Pricing rules are viewable by everyone" 
    ON public.pricing_rules FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Pricing rules are manageable by admin" ON public.pricing_rules;
CREATE POLICY "Pricing rules are manageable by admin" 
    ON public.pricing_rules FOR ALL 
    USING (public.is_admin());

-- Projects Policies
DROP POLICY IF EXISTS "Clients can view own projects" ON public.projects;
CREATE POLICY "Clients can view own projects" 
    ON public.projects FOR SELECT 
    USING (customer_id = auth.uid() OR client_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Clients can insert own projects" ON public.projects;
CREATE POLICY "Clients can insert own projects" 
    ON public.projects FOR INSERT 
    WITH CHECK (customer_id = auth.uid() OR client_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
CREATE POLICY "Admins can manage all projects" 
    ON public.projects FOR ALL 
    USING (public.is_admin());

-- Project Activity Policies
DROP POLICY IF EXISTS "View activity for permitted projects" ON public.project_activity;
CREATE POLICY "View activity for permitted projects" 
    ON public.project_activity FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_activity.project_id 
              AND (projects.customer_id = auth.uid() OR projects.client_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Insert activity for permitted projects" ON public.project_activity;
CREATE POLICY "Insert activity for permitted projects" 
    ON public.project_activity FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Project Files Policies
DROP POLICY IF EXISTS "View files for permitted projects" ON public.project_files;
CREATE POLICY "View files for permitted projects" 
    ON public.project_files FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_files.project_id 
              AND (projects.customer_id = auth.uid() OR projects.client_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Insert files for permitted projects" ON public.project_files;
CREATE POLICY "Insert files for permitted projects" 
    ON public.project_files FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_files.project_id 
              AND (projects.customer_id = auth.uid() OR projects.client_id = auth.uid() OR public.is_admin())
        )
    );

-- Estimates Policies
DROP POLICY IF EXISTS "Clients can view own estimates" ON public.estimates;
CREATE POLICY "Clients can view own estimates" 
    ON public.estimates FOR SELECT 
    USING (customer_id = auth.uid() OR client_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Clients can respond to estimates" ON public.estimates;
CREATE POLICY "Clients can respond to estimates" 
    ON public.estimates FOR UPDATE 
    USING (customer_id = auth.uid() OR client_id = auth.uid() OR public.is_admin())
    WITH CHECK (status IN ('accepted', 'declined') OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all estimates" ON public.estimates;
CREATE POLICY "Admins can manage all estimates" 
    ON public.estimates FOR ALL 
    USING (public.is_admin());

DROP POLICY IF EXISTS "View estimate items" ON public.estimate_items;
CREATE POLICY "View estimate items" 
    ON public.estimate_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.estimates 
            WHERE estimates.id = estimate_items.estimate_id 
              AND (estimates.customer_id = auth.uid() OR estimates.client_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Admins can manage estimate items" ON public.estimate_items;
CREATE POLICY "Admins can manage estimate items" 
    ON public.estimate_items FOR ALL 
    USING (public.is_admin());

-- Invoices Policies
DROP POLICY IF EXISTS "Clients can view own invoices" ON public.invoices;
CREATE POLICY "Clients can view own invoices" 
    ON public.invoices FOR SELECT 
    USING (customer_id = auth.uid() OR client_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
CREATE POLICY "Admins can manage all invoices" 
    ON public.invoices FOR ALL 
    USING (public.is_admin());

DROP POLICY IF EXISTS "View invoice items" ON public.invoice_items;
CREATE POLICY "View invoice items" 
    ON public.invoice_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE invoices.id = invoice_items.invoice_id 
              AND (invoices.customer_id = auth.uid() OR invoices.client_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Admins can manage invoice items" ON public.invoice_items;
CREATE POLICY "Admins can manage invoice items" 
    ON public.invoice_items FOR ALL 
    USING (public.is_admin());

-- Payments Policies
DROP POLICY IF EXISTS "Clients can view own payments" ON public.payments;
CREATE POLICY "Clients can view own payments" 
    ON public.payments FOR SELECT 
    USING (customer_id = auth.uid() OR client_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Clients can submit payments" ON public.payments;
CREATE POLICY "Clients can submit payments" 
    ON public.payments FOR INSERT 
    WITH CHECK (customer_id = auth.uid() OR client_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments" 
    ON public.payments FOR ALL 
    USING (public.is_admin());

-- Messages Policies
DROP POLICY IF EXISTS "View messages" ON public.messages;
CREATE POLICY "View messages" 
    ON public.messages FOR SELECT 
    USING (
        sender_id = auth.uid() 
        OR recipient_id = auth.uid() 
        OR customer_id = auth.uid() 
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = messages.project_id 
              AND (projects.customer_id = auth.uid() OR projects.client_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Send messages" ON public.messages;
CREATE POLICY "Send messages" 
    ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL AND sender_id = auth.uid());

DROP POLICY IF EXISTS "Update message read status" ON public.messages;
CREATE POLICY "Update message read status" 
    ON public.messages FOR UPDATE 
    USING (recipient_id = auth.uid() OR public.is_admin());

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
    ON public.notifications FOR SELECT 
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
    ON public.notifications FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Insert notifications" ON public.notifications;
CREATE POLICY "Insert notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

-- Payment Settings Policies
DROP POLICY IF EXISTS "Payment settings viewable by authenticated users" ON public.payment_settings;
CREATE POLICY "Payment settings viewable by authenticated users" 
    ON public.payment_settings FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Payment settings manageable by admin" ON public.payment_settings;
CREATE POLICY "Payment settings manageable by admin" 
    ON public.payment_settings FOR ALL 
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. STORAGE BUCKETS & STORAGE POLICIES
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS storage;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('payment-proofs', 'payment-proofs', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('project-attachments', 'project-attachments', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'text/plain']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'payment-proofs' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "View payment proofs" ON storage.objects;
CREATE POLICY "View payment proofs"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'payment-proofs'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );

DROP POLICY IF EXISTS "Upload project attachments" ON storage.objects;
CREATE POLICY "Upload project attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'project-attachments'
        AND auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "View project attachments" ON storage.objects;
CREATE POLICY "View project attachments"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'project-attachments'
        AND (
            auth.uid() IS NOT NULL
            OR public.is_admin()
        )
    );

DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "User avatar upload" ON storage.objects;
CREATE POLICY "User avatar upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Admin full access on storage objects" ON storage.objects;
CREATE POLICY "Admin full access on storage objects"
    ON storage.objects FOR ALL
    USING (public.is_admin());
