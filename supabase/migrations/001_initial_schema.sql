-- =============================================================================
-- RS Digital Hub — Database Schema Migration 001: Initial Schema
-- Tables: profiles, services, pricing_rules, projects, project_activity,
--         estimates, estimate_items, invoices, invoice_items, payments,
--         payment_settings, messages, notifications
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (extends auth.users)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 2. Services Table
-- -----------------------------------------------------------------------------
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

-- Seed baseline services
INSERT INTO public.services (slug, name, description, icon, base_price)
VALUES 
    ('website-development', 'Website Development', 'Corporate websites, e-commerce stores, portfolio showcases, blogs, and portals.', '🌐', 50000.00),
    ('graphic-design', 'Graphic Design & Brand Identity', 'Logos, full brand guidelines, flyers, banners, social media packages, and UI design.', '🎨', 15000.00),
    ('ai-solutions', 'AI Solutions & Intelligent Chatbots', 'Customer service AI agents, automated workflow integration, and custom AI tools.', '🤖', 80000.00),
    ('web-applications', 'Web Applications & Portals', 'Full-stack software, portals, SaaS platforms, and operational dashboards.', '📱', 120000.00),
    ('computer-training', 'Computer Training & Digital Skills', 'One-on-one and cohort training in Web Development, Python, Graphic Design, and Office Suites.', '💻', 30000.00),
    ('technical-support', 'Technical Support & Maintenance', 'Website maintenance, security hardening, bug fixes, updates, and speed optimization.', '🛠', 25000.00)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Pricing Rules Table (for Project Estimator)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 4. Projects Table
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 5. Project Activity Timeline Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL, -- 'status_change', 'estimate_created', 'invoice_issued', 'payment_submitted', 'note_added'
    message TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project_id ON public.project_activity(project_id);

-- -----------------------------------------------------------------------------
-- 6. Project Files Table
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 7. Estimates Table & Items
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 8. Invoices Table & Items
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 9. Payments Table
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 10. Messages Table
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 11. Notifications Table
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 12. Payment Settings Table (Protected Business Instructions)
-- -----------------------------------------------------------------------------
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
-- 13. Functions & Automated Triggers
-- -----------------------------------------------------------------------------

-- Auto-update updated_at timestamps
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

-- Auto-create profile on auth.users signup with role protection
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
