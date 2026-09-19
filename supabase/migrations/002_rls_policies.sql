-- =============================================================================
-- RS Digital Hub — Database Schema Migration 002: Row Level Security (RLS)
-- Enables strict multi-tenant authorization for customers and admins
-- =============================================================================

-- Enable RLS across all tables
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

-- -----------------------------------------------------------------------------
-- 1. Profiles Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK ((auth.uid() = id AND role = 'customer') OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. Services & Pricing Policies
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3. Projects Policies
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 4. Project Activity Policies
-- -----------------------------------------------------------------------------
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
    WITH CHECK (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_activity.project_id 
              AND (projects.customer_id = auth.uid() OR projects.client_id = auth.uid())
        )
    );

-- -----------------------------------------------------------------------------
-- 5. Project Files Policies
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 6. Estimates Policies
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 7. Invoices Policies
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 8. Payments Policies
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 9. Messages Policies
-- -----------------------------------------------------------------------------
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
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND sender_id = auth.uid()
        AND (
            public.is_admin() OR EXISTS (
                SELECT 1 FROM public.projects 
                WHERE projects.id = messages.project_id 
                  AND (projects.customer_id = auth.uid() OR projects.client_id = auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Update message read status" ON public.messages;
CREATE POLICY "Update message read status" 
    ON public.messages FOR UPDATE 
    USING (recipient_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 10. Notifications Policies
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 11. Payment Settings Policies (Secured from anonymous scraping)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Payment settings viewable by authenticated users" ON public.payment_settings;
CREATE POLICY "Payment settings viewable by authenticated users" 
    ON public.payment_settings FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Payment settings manageable by admin" ON public.payment_settings;
CREATE POLICY "Payment settings manageable by admin" 
    ON public.payment_settings FOR ALL 
    USING (public.is_admin());
