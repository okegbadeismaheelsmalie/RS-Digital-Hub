-- =============================================================================
-- RS Digital Hub — Database Schema Migration 003: Storage Buckets & Policies
-- Buckets: payment-proofs (private), project-attachments (private), avatars (public)
-- =============================================================================

-- Ensure storage extension & schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- 1. Provision Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('payment-proofs', 'payment-proofs', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('project-attachments', 'project-attachments', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'text/plain']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 2. Storage Objects Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2.1 Payment Proofs Bucket
-- Customers can upload receipts into their own folder: payment-proofs/<user_id>/...
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'payment-proofs' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can view their own payment proofs; admins can view all
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

-- 2.2 Project Attachments Bucket (Isolated by Project Ownership or User ID)
DROP POLICY IF EXISTS "Upload project attachments" ON storage.objects;
CREATE POLICY "Upload project attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'project-attachments'
        AND auth.uid() IS NOT NULL
        AND (
            public.is_admin()
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM public.projects 
                WHERE (projects.id::text = (storage.foldername(name))[1] OR projects.project_code = (storage.foldername(name))[1])
                  AND (projects.customer_id = auth.uid() OR projects.client_id = auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "View project attachments" ON storage.objects;
CREATE POLICY "View project attachments"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'project-attachments'
        AND (
            public.is_admin()
            OR (storage.foldername(name))[1] = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM public.projects 
                WHERE (projects.id::text = (storage.foldername(name))[1] OR projects.project_code = (storage.foldername(name))[1])
                  AND (projects.customer_id = auth.uid() OR projects.client_id = auth.uid())
            )
        )
    );

-- 2.3 Avatars Bucket (Public Read, Owner Write)
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

DROP POLICY IF EXISTS "User avatar update" ON storage.objects;
CREATE POLICY "User avatar update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Admins full access across all storage buckets
DROP POLICY IF EXISTS "Admin full access on storage objects" ON storage.objects;
CREATE POLICY "Admin full access on storage objects"
    ON storage.objects FOR ALL
    USING (public.is_admin());
