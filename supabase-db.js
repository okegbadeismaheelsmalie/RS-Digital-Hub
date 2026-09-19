import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// Client instances
export let supabaseAdmin = null;

if (IS_SUPABASE_CONFIGURED) {
  try {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log('[RS Hub Datastore] Supabase client initialized successfully.');
  } catch (err) {
    console.error('[RS Hub Datastore] Failed to initialize Supabase client:', err.message);
    if (IS_PRODUCTION) {
      throw new Error(`Production database configuration failed: ${err.message}`);
    }
  }
} else {
  if (IS_PRODUCTION) {
    console.error('[RS Hub Datastore] CRITICAL: Running in production mode but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing!');
  } else {
    console.log('[RS Hub Datastore] Running in PREVIEW MODE with high-fidelity in-memory persistence.');
  }
}

// -----------------------------------------------------------------------------
// In-Memory Database (Preview & Fallback)
// -----------------------------------------------------------------------------
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'rs_hub_salt_2026').digest('hex');
}

export const INITIAL_ADMIN_EMAIL = 'okegbadeismaheelsmalie@gmail.com';
export const INITIAL_ADMIN_PHONE = '09117035399';
export const INITIAL_ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || 'RoyalSmalie@1';

export const memoryDb = {
  profiles: [
    {
      id: 'admin-rs-001',
      full_name: 'Royal Smalie 👑',
      email: INITIAL_ADMIN_EMAIL,
      whatsapp_phone: INITIAL_ADMIN_PHONE,
      role: 'admin',
      password_hash: hashPassword(INITIAL_ADMIN_PASS),
      avatar_url: '',
      created_at: new Date('2026-01-01T00:00:00Z').toISOString()
    },
    {
      id: 'cust-demo-001',
      full_name: 'Adebayo Balogun',
      email: 'client@example.com',
      whatsapp_phone: '+2348023456789',
      role: 'customer',
      password_hash: hashPassword('ClientDemo@123'),
      avatar_url: '',
      created_at: new Date('2026-02-15T09:30:00Z').toISOString()
    }
  ],
  services: [
    { id: 'srv-1', slug: 'website-development', name: 'Website Development', icon: '🌐', base_price: 50000 },
    { id: 'srv-2', slug: 'graphic-design', name: 'Graphic Design', icon: '🎨', base_price: 15000 },
    { id: 'srv-3', slug: 'ai-solutions', name: 'AI Solutions', icon: '🤖', base_price: 80000 },
    { id: 'srv-4', slug: 'web-applications', name: 'Web Applications', icon: '📱', base_price: 120000 },
    { id: 'srv-5', slug: 'computer-training', name: 'Computer Training', icon: '💻', base_price: 30000 },
    { id: 'srv-6', slug: 'technical-support', name: 'Technical Support', icon: '🛠', base_price: 25000 }
  ],
  pricing_rules: [
    {
      id: 'pr-1',
      service_slug: 'website-development',
      tier_name: 'Starter',
      tier_description: 'Ideal for individuals, landing pages, and small businesses.',
      base_price: 50000,
      estimated_days: 7,
      features: [
        '1-3 Custom Responsive Pages',
        'Mobile & Tablet Responsive',
        'Contact Form & WhatsApp Button',
        'Basic Google SEO Setup',
        'Fast CDN Hosting Deployment',
        '1 Round of Revisions'
      ],
      addons: [
        { id: 'speed', name: 'Speed Optimization & Caching', price: 15000 },
        { id: 'seo', name: 'Advanced Search Engine Optimization', price: 20000 },
        { id: 'cms', name: 'Blog / Content Manager Integration', price: 25000 }
      ]
    },
    {
      id: 'pr-2',
      service_slug: 'website-development',
      tier_name: 'Standard',
      tier_description: 'Complete corporate website with modern interactive UI and CMS.',
      base_price: 150000,
      estimated_days: 14,
      features: [
        'Up to 7 Custom Designed Pages',
        'Dynamic Content Management System',
        'Google Analytics & Search Console',
        'Social Media Integration & Feeds',
        'Custom Interactive Inquiry Forms',
        'WhatsApp AI Chatbot Integration',
        '3 Rounds of Revisions'
      ],
      addons: [
        { id: 'ecommerce', name: 'Online Payment Integration (Paystack/Card)', price: 40000 },
        { id: 'copy', name: 'Professional Content Copywriting', price: 25000 }
      ]
    },
    {
      id: 'pr-3',
      service_slug: 'website-development',
      tier_name: 'Premium',
      tier_description: 'Enterprise or full e-commerce storefront with client portal.',
      base_price: 350000,
      estimated_days: 25,
      features: [
        'Unlimited Pages & Custom Architecture',
        'E-Commerce Storefront & Inventory',
        'Automated Invoicing & Customer Portal',
        'Integrated Payment Gateways (Flutterwave/Paystack)',
        'Speed Audited (95+ Google PageSpeed)',
        'Comprehensive 6-Month Maintenance Care',
        'Unlimited Revisions during build'
      ],
      addons: [
        { id: 'mobile_app', name: 'Companion Progressive Web App (PWA)', price: 60000 },
        { id: 'custom_api', name: 'Third-Party ERP / CRM API Integration', price: 50000 }
      ]
    },
    {
      id: 'pr-4',
      service_slug: 'graphic-design',
      tier_name: 'Logo & Identity',
      tier_description: 'Professional vector brand logo and visual guidelines.',
      base_price: 25000,
      estimated_days: 5,
      features: [
        '3 Unique Creative Logo Concepts',
        'Full Vector Source Files (AI, SVG, PDF, PNG)',
        'Brand Color Palette & Typography Specification',
        'Social Media Profile Avatar & Banner Assets',
        '3 Rounds of Revisions'
      ],
      addons: [
        { id: 'card', name: 'Business Card & Letterhead Design', price: 15000 }
      ]
    },
    {
      id: 'pr-5',
      service_slug: 'graphic-design',
      tier_name: 'Full Brand Kit',
      tier_description: 'End-to-end brand identity kit for scaling corporate presence.',
      base_price: 60000,
      estimated_days: 10,
      features: [
        'Comprehensive Corporate Brand Identity Book',
        'Marketing Promotional Flyers (3 Print-Ready Sets)',
        'Branded Social Media Templates (5 Editable Sets)',
        'Company Letterhead, Envelope & ID Card Layouts',
        'Full Copyright Ownership Transfer'
      ],
      addons: [
        { id: 'pitch_deck', name: 'Investor Pitch Deck Presentation (10 slides)', price: 30000 }
      ]
    },
    {
      id: 'pr-6',
      service_slug: 'ai-solutions',
      tier_name: 'AI Chatbot & Automation',
      tier_description: 'Intelligent conversational AI trained on your specific business data.',
      base_price: 100000,
      estimated_days: 14,
      features: [
        'Custom Knowledge-Base RAG Integration',
        'Interactive Website Chat Widget Deployment',
        'Lead Capture & Real-Time WhatsApp / Email Alerts',
        'Automated Appointment Booking & FAQ Handling',
        '30-Day Free Fine-Tuning & Monitoring'
      ],
      addons: [
        { id: 'crm_sync', name: 'Google Sheets / Notion / CRM Live Sync', price: 30000 }
      ]
    },
    {
      id: 'pr-7',
      service_slug: 'web-applications',
      tier_name: 'Custom Web Application',
      tier_description: 'Bespoke database-backed web application and operational portal.',
      base_price: 250000,
      estimated_days: 30,
      features: [
        'Full-Stack Architecture (Node.js & Database)',
        'Role-Based Access Control (Admin vs Client vs Staff)',
        'Interactive Analytics Dashboards & Data Exports',
        'Secure Payment & Invoicing Automation',
        'PWA Offline Capability Included'
      ],
      addons: [
        { id: 'cloud_infra', name: 'Dedicated Cloud Infrastructure Provisioning', price: 50000 }
      ]
    }
  ],
  projects: [
    {
      id: 'proj-demo-001',
      project_code: 'RDH-0001',
      client_id: 'cust-demo-001',
      client_name: 'Adebayo Balogun',
      client_email: 'client@example.com',
      phone: '+2348023456789',
      service_id: 'srv-1',
      service_type: 'Website Development',
      title: 'Corporate E-Commerce Portal',
      description: 'Modern 7-page e-commerce website with Paystack integration and customer order tracking.',
      budget: 150000,
      deadline: '2026-04-30',
      status: 'IN_PROGRESS',
      progress: 65,
      created_at: new Date('2026-02-16T10:00:00Z').toISOString(),
      updated_at: new Date('2026-03-01T14:30:00Z').toISOString()
    }
  ],
  project_activity: [
    {
      id: 'act-001',
      project_id: 'proj-demo-001',
      activity_type: 'SUBMITTED',
      title: 'Project Initialized',
      description: 'Project request submitted by Adebayo Balogun.',
      created_at: new Date('2026-02-16T10:00:00Z').toISOString()
    },
    {
      id: 'act-002',
      project_id: 'proj-demo-001',
      activity_type: 'ESTIMATE_ACCEPTED',
      title: 'Estimate EST-2026-001 Accepted',
      description: 'Client approved proposal of ₦150,000.',
      created_at: new Date('2026-02-17T11:20:00Z').toISOString()
    },
    {
      id: 'act-003',
      project_id: 'proj-demo-001',
      activity_type: 'PAYMENT_VERIFIED',
      title: 'Deposit Payment Verified',
      description: 'Deposit of ₦75,000 verified by Royal Smalie. Development commenced.',
      created_at: new Date('2026-02-18T15:00:00Z').toISOString()
    }
  ],
  project_files: [
    {
      id: 'file-001',
      project_id: 'proj-demo-001',
      uploader_id: 'cust-demo-001',
      file_name: 'Brand_Assets_Pack.zip',
      file_size: 4200000,
      file_type: 'application/zip',
      file_path: '/uploads/demo-brand-pack.zip',
      file_category: 'reference',
      created_at: new Date('2026-02-16T10:15:00Z').toISOString()
    }
  ],
  estimates: [
    {
      id: 'est-demo-001',
      estimate_number: 'EST-2026-001',
      project_id: 'proj-demo-001',
      project_code: 'RDH-0001',
      project_title: 'Corporate E-Commerce Portal',
      client_id: 'cust-demo-001',
      status: 'ACCEPTED',
      subtotal: 150000,
      discount: 0,
      tax: 0,
      total: 150000,
      notes: 'Includes dynamic CMS, payment gateway integration, and 30-day post-launch support.',
      valid_until: '2026-03-15',
      accepted_at: new Date('2026-02-17T11:20:00Z').toISOString(),
      created_at: new Date('2026-02-16T14:00:00Z').toISOString(),
      items: [
        { id: 'ei-1', description: 'Core Website UI/UX Design & Frontend Build (7 Pages)', quantity: 1, unit_price: 90000, amount: 90000 },
        { id: 'ei-2', description: 'E-Commerce Engine, Cart & Paystack Gateway Setup', quantity: 1, unit_price: 40000, amount: 40000 },
        { id: 'ei-3', description: 'Google SEO Setup, Speed Optimization & SSL CDN', quantity: 1, unit_price: 20000, amount: 20000 }
      ]
    }
  ],
  invoices: [
    {
      id: 'inv-demo-001',
      invoice_number: 'INV-2026-001',
      project_id: 'proj-demo-001',
      project_code: 'RDH-0001',
      project_title: 'Corporate E-Commerce Portal',
      client_id: 'cust-demo-001',
      estimate_id: 'est-demo-001',
      status: 'PARTIALLY_PAID',
      amount: 150000,
      paid_amount: 75000,
      due_date: '2026-03-31',
      notes: '50% Commencement Deposit received (₦75,000). Remaining 50% balance (₦75,000) due upon final milestone deployment.',
      created_at: new Date('2026-02-17T12:00:00Z').toISOString(),
      items: [
        { id: 'ii-1', description: '50% Commencement Deposit — Corporate E-Commerce Portal', quantity: 1, unit_price: 75000, amount: 75000 },
        { id: 'ii-2', description: '50% Final Milestone Balance — Upon Live Deployment', quantity: 1, unit_price: 75000, amount: 75000 }
      ]
    }
  ],
  payments: [
    {
      id: 'pay-demo-001',
      payment_reference: 'RS-OPAY-994821',
      invoice_id: 'inv-demo-001',
      invoice_number: 'INV-2026-001',
      project_id: 'proj-demo-001',
      client_id: 'cust-demo-001',
      client_name: 'Adebayo Balogun',
      amount: 75000,
      payment_method: 'Direct Bank Transfer',
      proof_file_url: '/uploads/sample-transfer-receipt.png',
      status: 'VERIFIED',
      payment_date: new Date('2026-02-18T14:30:00Z').toISOString(),
      notes: '50% upfront commitment transfer via OPay app.',
      admin_notes: 'Bank transaction confirmed in OPay business account.',
      verified_by: 'admin-rs-001',
      verified_at: new Date('2026-02-18T15:00:00Z').toISOString(),
      created_at: new Date('2026-02-18T14:35:00Z').toISOString()
    }
  ],
  messages: [
    {
      id: 'msg-001',
      project_id: 'proj-demo-001',
      sender_id: 'admin-rs-001',
      sender_name: 'Royal Smalie 👑',
      sender_role: 'admin',
      recipient_id: 'cust-demo-001',
      message: 'Welcome to RS Digital Hub, Adebayo! We have initiated development on your e-commerce storefront. Feel free to message here anytime.',
      read: true,
      created_at: new Date('2026-02-19T09:00:00Z').toISOString()
    }
  ],
  notifications: [
    {
      id: 'notif-demo-001',
      user_id: 'cust-demo-001',
      title: 'Payment Verified 🎉',
      message: 'Your ₦75,000 deposit for Corporate E-Commerce Portal was verified. Development is active!',
      type: 'payment',
      link: '/dashboard#invoices',
      read: false,
      created_at: new Date('2026-02-18T15:00:00Z').toISOString()
    }
  ],
  payment_settings: {
    id: 'ps-001',
    bank_name: 'OPay / First Bank of Nigeria',
    account_name: 'RS Digital Hub / Okegbade Ismaheel Smalie',
    account_number: '9117035399',
    currency: 'NGN (₦)',
    routing_info: 'Account Type: Business / Current | Branch: Lagos, Nigeria',
    payment_notes: 'Please use your Project Code (e.g., RDH-0001) or Invoice Number (INV-2026-001) as the transfer description/narration. Upload your transfer receipt immediately in this portal for rapid verification.',
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
  }
};

// -----------------------------------------------------------------------------
// Initialization: Ensure Admin & Baseline Tables in Supabase
// -----------------------------------------------------------------------------
export async function initializeDatastore() {
  if (!IS_SUPABASE_CONFIGURED || !supabaseAdmin) {
    return;
  }

  try {
    console.log('[RS Hub Datastore] Verifying Supabase connection and tables...');

    // 1. Check if profiles table is accessible
    const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('id, email, role').limit(5);
    if (pErr) {
      console.warn('[RS Hub Datastore] Profiles table query notice:', pErr.message);
    } else {
      console.log(`[RS Hub Datastore] Supabase connected. Found ${profiles?.length || 0} existing profiles.`);
    }

    // 2. Ensure initial admin exists in Supabase Auth & profiles
    const cleanAdminEmail = INITIAL_ADMIN_EMAIL.toLowerCase();
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      let adminUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === cleanAdminEmail);

      if (!adminUser) {
        console.log('[RS Hub Datastore] Provisioning initial administrator in Supabase Auth...');
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanAdminEmail,
          password: INITIAL_ADMIN_PASS,
          email_confirm: true,
          user_metadata: {
            full_name: 'Royal Smalie 👑',
            whatsapp_phone: INITIAL_ADMIN_PHONE
          }
        });

        if (!createErr && newUser?.user) {
          adminUser = newUser.user;
          console.log('[RS Hub Datastore] Administrator user created in Supabase Auth.');
        } else if (createErr) {
          console.warn('[RS Hub Datastore] Admin Auth user notice:', createErr.message);
        }
      }

      if (adminUser) {
        // Ensure profile row exists with admin role
        await supabaseAdmin.from('profiles').upsert({
          id: adminUser.id,
          email: cleanAdminEmail,
          full_name: 'Royal Smalie 👑',
          whatsapp_phone: INITIAL_ADMIN_PHONE,
          phone: INITIAL_ADMIN_PHONE,
          role: 'admin',
          updated_at: new Date().toISOString()
        });
        console.log('[RS Hub Datastore] Administrator profile secured with role="admin".');
      }
    } catch (authErr) {
      console.warn('[RS Hub Datastore] Admin auto-provision notice:', authErr.message);
    }

    // 3. Ensure payment settings exist in Supabase
    try {
      const { data: existingPs } = await supabaseAdmin.from('payment_settings').select('id').limit(1);
      if (!existingPs || existingPs.length === 0) {
        await supabaseAdmin.from('payment_settings').insert({
          bank_name: memoryDb.payment_settings.bank_name,
          account_name: memoryDb.payment_settings.account_name,
          account_number: memoryDb.payment_settings.account_number,
          currency: memoryDb.payment_settings.currency,
          routing_info: memoryDb.payment_settings.routing_info,
          payment_notes: memoryDb.payment_settings.payment_notes,
          is_active: true
        });
        console.log('[RS Hub Datastore] Baseline payment settings seeded into Supabase.');
      }
    } catch (psErr) {
      console.warn('[RS Hub Datastore] Payment settings check notice:', psErr.message);
    }

  } catch (err) {
    console.error('[RS Hub Datastore] Initialization error:', err.message);
  }
}

// -----------------------------------------------------------------------------
// Data Access Repositories (Unified Supabase + In-Memory Fallback)
// -----------------------------------------------------------------------------

// --- PROFILES & USERS ---
export async function getProfileById(userId) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      console.warn('getProfileById error:', error.message);
      return null;
    }
    return data;
  }
  return memoryDb.profiles.find(p => p.id === userId) || null;
}

export async function getProfileByEmail(email) {
  const clean = String(email || '').toLowerCase().trim();
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').ilike('email', clean).maybeSingle();
    if (error) {
      console.warn('getProfileByEmail error:', error.message);
      return null;
    }
    return data;
  }
  return memoryDb.profiles.find(p => p.email.toLowerCase() === clean) || null;
}

export async function updateProfile(userId, { full_name, whatsapp_phone }) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const updates = { updated_at: new Date().toISOString() };
    if (full_name) updates.full_name = full_name.trim();
    if (whatsapp_phone !== undefined) {
      updates.whatsapp_phone = whatsapp_phone.trim();
      updates.phone = whatsapp_phone.trim();
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  const user = memoryDb.profiles.find(p => p.id === userId);
  if (!user) throw new Error('User not found');
  if (full_name) user.full_name = full_name.trim();
  if (whatsapp_phone !== undefined) user.whatsapp_phone = whatsapp_phone.trim();
  return user;
}

export async function listCustomers() {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('listCustomers error:', error.message);
      return [];
    }
    return data || [];
  }
  return memoryDb.profiles.filter(p => p.role === 'customer');
}

// --- PROJECTS ---
export async function listProjects(userId, userRole, userEmail) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    let query = supabaseAdmin.from('projects').select('*').order('created_at', { ascending: false });
    if (userRole !== 'admin') {
      query = query.or(`customer_id.eq.${userId},client_id.eq.${userId},client_email.ilike.${userEmail}`);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('listProjects error:', error.message);
      return [];
    }
    return data || [];
  }

  let list = memoryDb.projects;
  if (userRole !== 'admin') {
    list = list.filter(p => p.client_id === userId || p.client_email.toLowerCase() === (userEmail || '').toLowerCase());
  }
  return list;
}

export async function getProjectById(projectIdOrCode, userId, userRole, userEmail) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectIdOrCode);
    let query = supabaseAdmin.from('projects').select('*');
    if (isUuid) {
      query = query.or(`id.eq.${projectIdOrCode},project_code.eq.${projectIdOrCode}`);
    } else {
      query = query.eq('project_code', projectIdOrCode);
    }

    const { data: project, error } = await query.maybeSingle();
    if (error || !project) return null;

    // IDOR Authorization check
    if (userRole !== 'admin' &&
        project.customer_id !== userId &&
        project.client_id !== userId &&
        project.client_email?.toLowerCase() !== (userEmail || '').toLowerCase()) {
      const err = new Error('Access denied to this project.');
      err.status = 403;
      throw err;
    }

    // Parallel fetch related details
    const [actRes, filesRes, estRes, invRes, msgRes] = await Promise.all([
      supabaseAdmin.from('project_activity').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('project_files').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('estimates').select('*, items:estimate_items(*)').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('invoices').select('*, items:invoice_items(*)').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('messages').select('*').eq('project_id', project.id).order('created_at', { ascending: true })
    ]);

    return {
      project,
      activity: actRes.data || [],
      files: filesRes.data || [],
      estimates: estRes.data || [],
      invoices: invRes.data || [],
      messages: msgRes.data || []
    };
  }

  // In-Memory
  const project = memoryDb.projects.find(p => p.id === projectIdOrCode || p.project_code === projectIdOrCode);
  if (!project) return null;

  if (userRole !== 'admin' &&
      project.client_id !== userId &&
      project.client_email.toLowerCase() !== (userEmail || '').toLowerCase()) {
    const err = new Error('Access denied to this project.');
    err.status = 403;
    throw err;
  }

  const activity = memoryDb.project_activity.filter(a => a.project_id === project.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const files = memoryDb.project_files.filter(f => f.project_id === project.id);
  const estimates = memoryDb.estimates.filter(e => e.project_id === project.id);
  const invoices = memoryDb.invoices.filter(i => i.project_id === project.id);
  const messages = memoryDb.messages.filter(m => m.project_id === project.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return {
    project,
    activity,
    files,
    estimates,
    invoices,
    messages
  };
}

export async function createProject({ name, email, phone, service, budget, deadline, description, clientId }) {
  const cleanEmail = email.trim().toLowerCase();

  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    // Generate next project code from total projects count
    const { count } = await supabaseAdmin.from('projects').select('*', { count: 'exact', head: true });
    const nextNum = (count || 0) + 1;
    const projectCode = `RDH-${String(nextNum).padStart(4, '0')}`;

    // Lookup service by name or slug
    const { data: srvList } = await supabaseAdmin.from('services').select('id, name, slug');
    const matchedSrv = srvList?.find(s => s.name?.toLowerCase() === service.toLowerCase() || s.slug === service.toLowerCase());

    const newProject = {
      project_code: projectCode,
      customer_id: clientId || null,
      client_id: clientId || null,
      client_name: name.trim(),
      client_email: cleanEmail,
      phone: phone.trim(),
      service_id: matchedSrv ? matchedSrv.id : null,
      service_type: service,
      title: `${service} Project`,
      description: description.trim(),
      budget: budget ? Number(budget) : null,
      budget_estimate: budget ? Number(budget) : null,
      deadline: deadline || null,
      project_status: 'submitted',
      status: 'SUBMITTED',
      progress: 0
    };

    const { data: createdProj, error: insErr } = await supabaseAdmin
      .from('projects')
      .insert(newProject)
      .select('*')
      .single();

    if (insErr) {
      throw new Error(`Failed to insert project into Supabase: ${insErr.message}`);
    }

    // Insert timeline activity
    await supabaseAdmin.from('project_activity').insert({
      project_id: createdProj.id,
      activity_type: 'status_change',
      title: 'Project Submitted',
      message: `Project request created by ${name.trim()}.`,
      description: `Project request created by ${name.trim()}.`,
      new_status: 'SUBMITTED'
    });

    // Notify admin
    await createNotification({
      user_id: 'admin-rs-001',
      title: 'New Project Received 🚀',
      message: `${name} submitted ${service} project (${projectCode}).`,
      type: 'project',
      link: '/admin#projects',
      related_project_id: createdProj.id
    });

    // Notify client if registered
    if (clientId) {
      await createNotification({
        user_id: clientId,
        title: 'Project Request Received',
        message: `Your project ${projectCode} has been received and is under review.`,
        type: 'project',
        link: '/dashboard#projects',
        related_project_id: createdProj.id
      });
    }

    return createdProj;
  }

  // In-Memory Fallback
  const nextNumber = memoryDb.projects.length + 1;
  const projectCode = `RDH-${String(nextNumber).padStart(4, '0')}`;
  const matchedService = memoryDb.services.find(s => s.name.toLowerCase() === service.toLowerCase() || s.slug === service.toLowerCase());

  const newProject = {
    id: `proj-${Date.now()}`,
    project_code: projectCode,
    client_id: clientId || null,
    client_name: name.trim(),
    client_email: cleanEmail,
    phone: phone.trim(),
    service_id: matchedService ? matchedService.id : 'srv-1',
    service_type: service,
    title: `${service} Project`,
    description: description.trim(),
    budget: budget ? Number(budget) : null,
    deadline: deadline || null,
    status: 'SUBMITTED',
    progress: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  memoryDb.projects.unshift(newProject);

  memoryDb.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: newProject.id,
    activity_type: 'SUBMITTED',
    title: 'Project Submitted',
    description: `Project request created by ${name}.`,
    created_at: new Date().toISOString()
  });

  await createNotification({
    user_id: 'admin-rs-001',
    title: 'New Project Received 🚀',
    message: `${name} submitted ${service} project (${projectCode}).`,
    type: 'project',
    link: '/admin#projects'
  });

  if (clientId) {
    await createNotification({
      user_id: clientId,
      title: 'Project Request Received',
      message: `Your project ${projectCode} has been received and is under review.`,
      type: 'project',
      link: '/dashboard#projects'
    });
  }

  return newProject;
}

export async function updateProjectStatus(projectIdOrCode, { status, progress, notes, actorId }) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectIdOrCode);
    let findQuery = supabaseAdmin.from('projects').select('*');
    if (isUuid) findQuery = findQuery.or(`id.eq.${projectIdOrCode},project_code.eq.${projectIdOrCode}`);
    else findQuery = findQuery.eq('project_code', projectIdOrCode);

    const { data: project, error: findErr } = await findQuery.maybeSingle();
    if (findErr || !project) throw new Error('Project not found');

    const updates = { updated_at: new Date().toISOString() };
    if (status) {
      updates.status = status.toUpperCase();
      updates.project_status = status.toLowerCase();
    }
    if (progress !== undefined) {
      updates.progress = Math.min(100, Math.max(0, Number(progress)));
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', project.id)
      .select('*')
      .single();

    if (updErr) throw new Error(updErr.message);

    // Insert timeline entry
    await supabaseAdmin.from('project_activity').insert({
      project_id: project.id,
      actor_id: actorId || null,
      activity_type: 'status_change',
      title: `Project Status: ${updated.status}`,
      message: notes || `Status changed to ${updated.status} (${updated.progress}% complete).`,
      description: notes || `Status changed to ${updated.status} (${updated.progress}% complete).`,
      new_status: updated.status
    });

    // Notify client
    const targetUserId = updated.customer_id || updated.client_id;
    if (targetUserId) {
      await createNotification({
        user_id: targetUserId,
        title: 'Project Status Updated',
        message: `Your project ${updated.project_code} is now ${updated.status} (${updated.progress}% complete).`,
        type: 'project',
        link: '/dashboard#projects',
        related_project_id: updated.id
      });
    }

    return updated;
  }

  // In-Memory
  const project = memoryDb.projects.find(p => p.id === projectIdOrCode || p.project_code === projectIdOrCode);
  if (!project) throw new Error('Project not found');

  if (status) project.status = status.toUpperCase();
  if (progress !== undefined) project.progress = Math.min(100, Math.max(0, Number(progress)));
  project.updated_at = new Date().toISOString();

  memoryDb.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: project.id,
    activity_type: 'STATUS_CHANGE',
    title: `Project Status: ${project.status}`,
    description: notes || `Project progress updated to ${project.progress}%. Status set to ${project.status}.`,
    created_at: new Date().toISOString()
  });

  if (project.client_id) {
    await createNotification({
      user_id: project.client_id,
      title: 'Project Status Updated',
      message: `Your project ${project.project_code} is now ${project.status} (${project.progress}% complete).`,
      type: 'project',
      link: '/dashboard#projects'
    });
  }

  return project;
}

// --- ESTIMATES ---
export async function listEstimates(userId, userRole) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    let query = supabaseAdmin.from('estimates').select('*, items:estimate_items(*)').order('created_at', { ascending: false });
    if (userRole !== 'admin') {
      query = query.or(`customer_id.eq.${userId},client_id.eq.${userId}`);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('listEstimates error:', error.message);
      return [];
    }
    return data || [];
  }

  let list = memoryDb.estimates;
  if (userRole !== 'admin') {
    list = list.filter(e => e.client_id === userId);
  }
  return list;
}

export async function createEstimate({ project_id, client_id, items, discount, notes, valid_until }) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    // Find project
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project_id);
    let pq = supabaseAdmin.from('projects').select('*');
    if (isUuid) pq = pq.or(`id.eq.${project_id},project_code.eq.${project_id}`);
    else pq = pq.eq('project_code', project_id);

    const { data: project } = await pq.maybeSingle();
    if (!project) throw new Error('Project not found');

    const targetClientId = client_id || project.customer_id || project.client_id;
    if (!targetClientId) throw new Error('Target client account is required for estimate.');

    const { count } = await supabaseAdmin.from('estimates').select('*', { count: 'exact', head: true });
    const estNum = `EST-2026-${String((count || 0) + 1).padStart(3, '0')}`;

    const processedItems = items.map(item => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      return {
        description: item.description || 'Project deliverable',
        quantity: qty,
        unit_price: price,
        amount: qty * price
      };
    });

    const subtotal = processedItems.reduce((acc, i) => acc + i.amount, 0);
    const discountVal = Number(discount) || 0;
    const total = Math.max(0, subtotal - discountVal);

    const { data: est, error: estErr } = await supabaseAdmin
      .from('estimates')
      .insert({
        estimate_number: estNum,
        project_id: project.id,
        customer_id: targetClientId,
        client_id: targetClientId,
        status: 'sent',
        subtotal,
        discount: discountVal,
        total,
        notes: notes || '',
        valid_until: valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      })
      .select('*')
      .single();

    if (estErr) throw new Error(estErr.message);

    // Insert items
    if (processedItems.length > 0) {
      await supabaseAdmin.from('estimate_items').insert(
        processedItems.map(i => ({ ...i, estimate_id: est.id }))
      );
    }

    // Add activity
    await supabaseAdmin.from('project_activity').insert({
      project_id: project.id,
      activity_type: 'estimate_created',
      title: `Estimate ${estNum} Issued`,
      message: `Estimate for ₦${total.toLocaleString()} created and sent to client.`,
      description: `Estimate for ₦${total.toLocaleString()} created and sent to client.`
    });

    // Notify client
    await createNotification({
      user_id: targetClientId,
      title: `Estimate ${estNum} Issued`,
      message: `A new estimate of ₦${total.toLocaleString()} is available for review on ${project.title}.`,
      type: 'estimate',
      link: '/dashboard#estimates',
      related_project_id: project.id
    });

    return { ...est, items: processedItems, project_code: project.project_code, project_title: project.title };
  }

  // In-Memory
  const project = memoryDb.projects.find(p => p.id === project_id || p.project_code === project_id);
  if (!project) throw new Error('Project not found');

  const targetClientId = client_id || project.client_id;
  const processedItems = items.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    return {
      id: `ei-${Date.now()}-${idx}`,
      description: item.description || 'Project deliverable',
      quantity: qty,
      unit_price: price,
      amount: qty * price
    };
  });

  const subtotal = processedItems.reduce((acc, i) => acc + i.amount, 0);
  const discountVal = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountVal);
  const estNum = `EST-2026-${String(memoryDb.estimates.length + 1).padStart(3, '0')}`;

  const newEstimate = {
    id: `est-${Date.now()}`,
    estimate_number: estNum,
    project_id: project.id,
    project_code: project.project_code,
    project_title: project.title,
    client_id: targetClientId,
    status: 'SENT',
    subtotal,
    discount: discountVal,
    tax: 0,
    total,
    notes: notes || '',
    valid_until: valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    items: processedItems
  };

  memoryDb.estimates.unshift(newEstimate);

  memoryDb.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: project.id,
    activity_type: 'ESTIMATE_CREATED',
    title: `Estimate ${estNum} Issued`,
    description: `Estimate for ₦${total.toLocaleString()} created and sent to client.`,
    created_at: new Date().toISOString()
  });

  await createNotification({
    user_id: targetClientId,
    title: `Estimate ${estNum} Issued`,
    message: `A new estimate of ₦${total.toLocaleString()} is available for review on ${project.title}.`,
    type: 'estimate',
    link: '/dashboard#estimates'
  });

  return newEstimate;
}

export async function respondToEstimate(estimateIdOrNum, action, userId, userRole) {
  const isAccept = action === 'accept';
  const newStatus = isAccept ? 'accepted' : 'declined';
  const displayStatus = isAccept ? 'ACCEPTED' : 'DECLINED';

  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(estimateIdOrNum);
    let q = supabaseAdmin.from('estimates').select('*, items:estimate_items(*)');
    if (isUuid) q = q.or(`id.eq.${estimateIdOrNum},estimate_number.eq.${estimateIdOrNum}`);
    else q = q.eq('estimate_number', estimateIdOrNum);

    const { data: est, error } = await q.maybeSingle();
    if (error || !est) throw new Error('Estimate not found');

    if (userRole !== 'admin' && est.customer_id !== userId && est.client_id !== userId) {
      const err = new Error('Unauthorized to respond to this estimate.');
      err.status = 403;
      throw err;
    }

    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (isAccept) updates.accepted_at = new Date().toISOString();
    else updates.declined_at = new Date().toISOString();

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('estimates')
      .update(updates)
      .eq('id', est.id)
      .select('*')
      .single();

    if (updErr) throw new Error(updErr.message);

    // If accepted, update project status to approved
    if (isAccept && est.project_id) {
      await supabaseAdmin
        .from('projects')
        .update({ project_status: 'approved', status: 'APPROVED', updated_at: new Date().toISOString() })
        .eq('id', est.project_id);
    }

    // Timeline activity
    await supabaseAdmin.from('project_activity').insert({
      project_id: est.project_id,
      activity_type: isAccept ? 'estimate_accepted' : 'estimate_declined',
      title: `Estimate ${est.estimate_number} ${displayStatus}`,
      message: isAccept ? `Estimate of ₦${est.total.toLocaleString()} accepted by client.` : `Client requested modifications or declined estimate.`,
      description: isAccept ? `Estimate of ₦${est.total.toLocaleString()} accepted by client.` : `Client requested modifications or declined estimate.`
    });

    // Notify admin
    await createNotification({
      user_id: 'admin-rs-001',
      title: isAccept ? 'Estimate Accepted 🎉' : 'Estimate Declined',
      message: `Client ${isAccept ? 'accepted' : 'declined'} ${est.estimate_number} (₦${est.total.toLocaleString()}).`,
      type: 'estimate',
      link: '/admin#estimates',
      related_project_id: est.project_id
    });

    return updated;
  }

  // In-Memory
  const est = memoryDb.estimates.find(e => e.id === estimateIdOrNum || e.estimate_number === estimateIdOrNum);
  if (!est) throw new Error('Estimate not found');

  if (userRole !== 'admin' && est.client_id !== userId) {
    const err = new Error('Unauthorized to respond to this estimate.');
    err.status = 403;
    throw err;
  }

  est.status = displayStatus;
  if (isAccept) {
    est.accepted_at = new Date().toISOString();
    const proj = memoryDb.projects.find(p => p.id === est.project_id);
    if (proj && (proj.status === 'SUBMITTED' || proj.status === 'REVIEWING')) {
      proj.status = 'APPROVED';
    }
  } else {
    est.declined_at = new Date().toISOString();
  }

  memoryDb.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: est.project_id,
    activity_type: isAccept ? 'ESTIMATE_ACCEPTED' : 'ESTIMATE_DECLINED',
    title: `Estimate ${est.estimate_number} ${displayStatus}`,
    description: isAccept ? `Estimate of ₦${est.total.toLocaleString()} accepted by client.` : `Client requested modifications or declined estimate.`,
    created_at: new Date().toISOString()
  });

  await createNotification({
    user_id: 'admin-rs-001',
    title: isAccept ? 'Estimate Accepted 🎉' : 'Estimate Declined',
    message: `Client ${isAccept ? 'accepted' : 'declined'} ${est.estimate_number} (₦${est.total.toLocaleString()}).`,
    type: 'estimate',
    link: '/admin#estimates'
  });

  return est;
}

// --- INVOICES ---
export async function listInvoices(userId, userRole) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    let query = supabaseAdmin.from('invoices').select('*, items:invoice_items(*)').order('created_at', { ascending: false });
    if (userRole !== 'admin') {
      query = query.or(`customer_id.eq.${userId},client_id.eq.${userId}`);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('listInvoices error:', error.message);
      return [];
    }
    return data || [];
  }

  let list = memoryDb.invoices;
  if (userRole !== 'admin') {
    list = list.filter(i => i.client_id === userId);
  }
  return list;
}

export async function createInvoice({ project_id, client_id, estimate_id, amount, due_date, notes, items }) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project_id);
    let pq = supabaseAdmin.from('projects').select('*');
    if (isUuid) pq = pq.or(`id.eq.${project_id},project_code.eq.${project_id}`);
    else pq = pq.eq('project_code', project_id);

    const { data: project } = await pq.maybeSingle();
    if (!project) throw new Error('Project not found');

    const targetClientId = client_id || project.customer_id || project.client_id;
    const { count } = await supabaseAdmin.from('invoices').select('*', { count: 'exact', head: true });
    const invNum = `INV-2026-${String((count || 0) + 1).padStart(3, '0')}`;

    const { data: invoice, error: invErr } = await supabaseAdmin
      .from('invoices')
      .insert({
        invoice_number: invNum,
        project_id: project.id,
        customer_id: targetClientId,
        client_id: targetClientId,
        estimate_id: estimate_id || null,
        amount: Number(amount),
        paid_amount: 0,
        status: 'sent',
        due_date,
        notes: notes || ''
      })
      .select('*')
      .single();

    if (invErr) throw new Error(invErr.message);

    // Items
    const processedItems = (items && Array.isArray(items) && items.length > 0)
      ? items.map(i => ({
          invoice_id: invoice.id,
          description: i.description || 'Project Milestone',
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || Number(amount),
          amount: Number(i.amount) || Number(amount)
        }))
      : [{
          invoice_id: invoice.id,
          description: `${project.title} — Project Milestone`,
          quantity: 1,
          unit_price: Number(amount),
          amount: Number(amount)
        }];

    await supabaseAdmin.from('invoice_items').insert(processedItems);

    // Timeline activity
    await supabaseAdmin.from('project_activity').insert({
      project_id: project.id,
      activity_type: 'invoice_issued',
      title: `Invoice ${invNum} Issued`,
      message: `Invoice for ₦${Number(amount).toLocaleString()} created with due date ${due_date}.`,
      description: `Invoice for ₦${Number(amount).toLocaleString()} created with due date ${due_date}.`
    });

    // Notify client
    if (targetClientId) {
      await createNotification({
        user_id: targetClientId,
        title: `Invoice ${invNum} Issued`,
        message: `An invoice for ₦${Number(amount).toLocaleString()} has been issued for ${project.title}.`,
        type: 'invoice',
        link: '/dashboard#invoices',
        related_project_id: project.id,
        related_invoice_id: invoice.id
      });
    }

    return { ...invoice, items: processedItems, project_code: project.project_code, project_title: project.title };
  }

  // In-Memory
  const project = memoryDb.projects.find(p => p.id === project_id || p.project_code === project_id);
  if (!project) throw new Error('Project not found');

  const targetClientId = client_id || project.client_id;
  const invNum = `INV-2026-${String(memoryDb.invoices.length + 1).padStart(3, '0')}`;

  const processedItems = (items && Array.isArray(items) && items.length > 0)
    ? items.map((i, idx) => ({
        id: `ii-${Date.now()}-${idx}`,
        description: i.description || 'Project Milestone',
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || Number(amount),
        amount: Number(i.amount) || Number(amount)
      }))
    : [{
        id: `ii-${Date.now()}-0`,
        description: `${project.title} — Project Milestone`,
        quantity: 1,
        unit_price: Number(amount),
        amount: Number(amount)
      }];

  const newInvoice = {
    id: `inv-${Date.now()}`,
    invoice_number: invNum,
    project_id: project.id,
    project_code: project.project_code,
    project_title: project.title,
    client_id: targetClientId,
    estimate_id: estimate_id || null,
    status: 'ISSUED',
    amount: Number(amount),
    paid_amount: 0,
    due_date,
    notes: notes || '',
    created_at: new Date().toISOString(),
    items: processedItems
  };

  memoryDb.invoices.unshift(newInvoice);

  memoryDb.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: project.id,
    activity_type: 'INVOICE_ISSUED',
    title: `Invoice ${invNum} Issued`,
    description: `Invoice for ₦${Number(amount).toLocaleString()} created with due date ${due_date}.`,
    created_at: new Date().toISOString()
  });

  if (targetClientId) {
    await createNotification({
      user_id: targetClientId,
      title: `Invoice ${invNum} Issued`,
      message: `An invoice for ₦${Number(amount).toLocaleString()} has been issued for ${project.title}.`,
      type: 'invoice',
      link: '/dashboard#invoices'
    });
  }

  return newInvoice;
}

export async function updateInvoiceStatus(invoiceIdOrNum, { status, paid_amount }) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceIdOrNum);
    let q = supabaseAdmin.from('invoices').select('*');
    if (isUuid) q = q.or(`id.eq.${invoiceIdOrNum},invoice_number.eq.${invoiceIdOrNum}`);
    else q = q.eq('invoice_number', invoiceIdOrNum);

    const { data: inv } = await q.maybeSingle();
    if (!inv) throw new Error('Invoice not found');

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status.toLowerCase();
    if (paid_amount !== undefined) updates.paid_amount = Number(paid_amount);

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('invoices')
      .update(updates)
      .eq('id', inv.id)
      .select('*')
      .single();

    if (updErr) throw new Error(updErr.message);
    return updated;
  }

  // In-Memory
  const invoice = memoryDb.invoices.find(i => i.id === invoiceIdOrNum || i.invoice_number === invoiceIdOrNum);
  if (!invoice) throw new Error('Invoice not found');
  if (status) invoice.status = status;
  if (paid_amount !== undefined) invoice.paid_amount = Number(paid_amount);
  return invoice;
}

// --- PAYMENTS ---
export async function listPayments(userId, userRole) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    let query = supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false });
    if (userRole !== 'admin') {
      query = query.or(`customer_id.eq.${userId},client_id.eq.${userId}`);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('listPayments error:', error.message);
      return [];
    }
    return data || [];
  }

  let list = memoryDb.payments;
  if (userRole !== 'admin') {
    list = list.filter(p => p.client_id === userId);
  }
  return list;
}

export async function submitPayment({ invoice_id, amount, payment_method, reference, proof_file_url, userId, userRole, userName }) {
  const refUpper = reference.trim().toUpperCase();

  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    // Find invoice and verify ownership
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoice_id);
    let iq = supabaseAdmin.from('invoices').select('*');
    if (isUuid) iq = iq.or(`id.eq.${invoice_id},invoice_number.eq.${invoice_id}`);
    else iq = iq.eq('invoice_number', invoice_id);

    const { data: invoice } = await iq.maybeSingle();
    if (!invoice) throw new Error('Invoice not found');

    // IDOR Protection: Must own the invoice unless admin
    if (userRole !== 'admin' && invoice.customer_id !== userId && invoice.client_id !== userId) {
      const err = new Error('Access denied: You cannot submit payment for an invoice that does not belong to you.');
      err.status = 403;
      throw err;
    }

    // Check duplicate reference
    const { data: existingRef } = await supabaseAdmin.from('payments').select('id').or(`reference.eq.${refUpper},payment_reference.eq.${refUpper}`).maybeSingle();
    if (existingRef) {
      const err = new Error('A payment with this reference code has already been submitted.');
      err.status = 400;
      throw err;
    }

    const newPay = {
      reference: refUpper,
      payment_reference: refUpper,
      invoice_id: invoice.id,
      project_id: invoice.project_id,
      customer_id: userId,
      client_id: userId,
      amount: Number(amount),
      payment_method: payment_method || 'Bank Transfer',
      proof_url: proof_file_url || null,
      proof_file_url: proof_file_url || null,
      status: 'submitted', // ALWAYS forced to pending / submitted
      payment_date: new Date().toISOString()
    };

    const { data: payment, error: pErr } = await supabaseAdmin
      .from('payments')
      .insert(newPay)
      .select('*')
      .single();

    if (pErr) throw new Error(pErr.message);

    // Timeline entry
    await supabaseAdmin.from('project_activity').insert({
      project_id: invoice.project_id,
      activity_type: 'payment_submitted',
      title: 'Payment Proof Submitted',
      message: `Payment of ₦${Number(amount).toLocaleString()} (Ref: ${refUpper}) submitted for verification.`,
      description: `Payment of ₦${Number(amount).toLocaleString()} (Ref: ${refUpper}) submitted for verification.`
    });

    // Notify admin
    await createNotification({
      user_id: 'admin-rs-001',
      title: 'New Payment Submitted 💰',
      message: `${userName} submitted ₦${Number(amount).toLocaleString()} for ${invoice.invoice_number}.`,
      type: 'payment',
      link: '/admin#payments',
      related_project_id: invoice.project_id,
      related_invoice_id: invoice.id
    });

    return payment;
  }

  // In-Memory
  const invoice = memoryDb.invoices.find(i => i.id === invoice_id || i.invoice_number === invoice_id);
  if (!invoice) throw new Error('Invoice not found');

  if (userRole !== 'admin' && invoice.client_id !== userId) {
    const err = new Error('Access denied: You cannot submit payment for an invoice that does not belong to you.');
    err.status = 403;
    throw err;
  }

  const existing = memoryDb.payments.find(p => p.payment_reference === refUpper);
  if (existing) {
    const err = new Error('A payment with this reference code has already been submitted.');
    err.status = 400;
    throw err;
  }

  const newPayment = {
    id: `pay-${Date.now()}`,
    payment_reference: refUpper,
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    project_id: invoice.project_id,
    client_id: userId,
    client_name: userName,
    amount: Number(amount),
    payment_method: payment_method || 'Bank Transfer',
    proof_file_url: proof_file_url || null,
    status: 'PENDING', // Forced server-side
    admin_notes: '',
    created_at: new Date().toISOString()
  };

  memoryDb.payments.unshift(newPayment);

  memoryDb.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: invoice.project_id,
    activity_type: 'PAYMENT_SUBMITTED',
    title: 'Payment Proof Submitted',
    description: `Payment of ₦${Number(amount).toLocaleString()} (Ref: ${refUpper}) submitted for verification.`,
    created_at: new Date().toISOString()
  });

  await createNotification({
    user_id: 'admin-rs-001',
    title: 'New Payment Submitted 💰',
    message: `${userName} submitted ₦${Number(amount).toLocaleString()} for ${invoice.invoice_number}.`,
    type: 'payment',
    link: '/admin#payments'
  });

  return newPayment;
}

export async function verifyPayment(paymentIdOrRef, adminId, notes) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentIdOrRef);
    let pq = supabaseAdmin.from('payments').select('*');
    if (isUuid) pq = pq.or(`id.eq.${paymentIdOrRef},reference.eq.${paymentIdOrRef},payment_reference.eq.${paymentIdOrRef}`);
    else pq = pq.or(`reference.eq.${paymentIdOrRef},payment_reference.eq.${paymentIdOrRef}`);

    const { data: payment } = await pq.maybeSingle();
    if (!payment) throw new Error('Payment record not found');

    const verifiedAt = new Date().toISOString();
    const { data: updatedPayment, error: updErr } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'verified',
        verified_by: adminId,
        verified_at: verifiedAt,
        admin_notes: notes || 'Verified in official bank records',
        updated_at: verifiedAt
      })
      .eq('id', payment.id)
      .select('*')
      .single();

    if (updErr) throw new Error(updErr.message);

    // Update associated invoice
    if (payment.invoice_id) {
      const { data: invoice } = await supabaseAdmin.from('invoices').select('*').eq('id', payment.invoice_id).maybeSingle();
      if (invoice) {
        const newPaid = Number(invoice.paid_amount || 0) + Number(payment.amount);
        const invStatus = newPaid >= Number(invoice.amount) ? 'paid' : 'partially_paid';
        await supabaseAdmin.from('invoices').update({
          paid_amount: newPaid,
          status: invStatus,
          updated_at: verifiedAt
        }).eq('id', invoice.id);
      }
    }

    // Project activity
    if (payment.project_id) {
      await supabaseAdmin.from('project_activity').insert({
        project_id: payment.project_id,
        actor_id: adminId,
        activity_type: 'payment_submitted',
        title: 'Payment Verified ✅',
        message: `Payment of ₦${Number(payment.amount).toLocaleString()} (Ref: ${payment.reference || payment.payment_reference}) verified by Royal Smalie.`,
        description: `Payment of ₦${Number(payment.amount).toLocaleString()} (Ref: ${payment.reference || payment.payment_reference}) verified by Royal Smalie.`
      });
    }

    // Notify client
    const targetUserId = payment.customer_id || payment.client_id;
    if (targetUserId) {
      await createNotification({
        user_id: targetUserId,
        title: 'Payment Verified! 👑',
        message: `Your payment of ₦${Number(payment.amount).toLocaleString()} has been verified. Thank you!`,
        type: 'payment',
        link: '/dashboard#invoices',
        related_project_id: payment.project_id,
        related_invoice_id: payment.invoice_id
      });
    }

    return updatedPayment;
  }

  // In-Memory
  const payment = memoryDb.payments.find(p => p.id === paymentIdOrRef || p.payment_reference === paymentIdOrRef);
  if (!payment) throw new Error('Payment record not found');

  payment.status = 'VERIFIED';
  payment.verified_by = adminId;
  payment.verified_at = new Date().toISOString();
  if (notes) payment.admin_notes = notes;

  const invoice = memoryDb.invoices.find(i => i.id === payment.invoice_id);
  if (invoice) {
    invoice.paid_amount = (invoice.paid_amount || 0) + payment.amount;
    invoice.status = invoice.paid_amount >= invoice.amount ? 'PAID' : 'PARTIALLY_PAID';
  }

  memoryDb.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: payment.project_id,
    activity_type: 'PAYMENT_VERIFIED',
    title: 'Payment Verified ✅',
    description: `Payment of ₦${payment.amount.toLocaleString()} (Ref: ${payment.payment_reference}) verified by Royal Smalie.`,
    created_at: new Date().toISOString()
  });

  await createNotification({
    user_id: payment.client_id,
    title: 'Payment Verified! 👑',
    message: `Your payment of ₦${payment.amount.toLocaleString()} has been verified. Thank you!`,
    type: 'payment',
    link: '/dashboard#invoices'
  });

  return payment;
}

export async function rejectPayment(paymentIdOrRef, adminId, reason) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentIdOrRef);
    let pq = supabaseAdmin.from('payments').select('*');
    if (isUuid) pq = pq.or(`id.eq.${paymentIdOrRef},reference.eq.${paymentIdOrRef},payment_reference.eq.${paymentIdOrRef}`);
    else pq = pq.or(`reference.eq.${paymentIdOrRef},payment_reference.eq.${paymentIdOrRef}`);

    const { data: payment } = await pq.maybeSingle();
    if (!payment) throw new Error('Payment record not found');

    const rejReason = reason || 'Payment reference could not be verified in bank records.';
    const { data: updatedPayment, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'rejected',
        admin_notes: rejReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    const targetUserId = payment.customer_id || payment.client_id;
    if (targetUserId) {
      await createNotification({
        user_id: targetUserId,
        title: 'Payment Verification Unsuccessful',
        message: `Your payment reference ${payment.reference || payment.payment_reference} could not be verified: ${rejReason}`,
        type: 'payment',
        link: '/dashboard#invoices',
        related_project_id: payment.project_id
      });
    }

    return updatedPayment;
  }

  // In-Memory
  const payment = memoryDb.payments.find(p => p.id === paymentIdOrRef || p.payment_reference === paymentIdOrRef);
  if (!payment) throw new Error('Payment record not found');

  payment.status = 'REJECTED';
  payment.admin_notes = reason || 'Payment reference could not be verified in bank records.';

  await createNotification({
    user_id: payment.client_id,
    title: 'Payment Verification Unsuccessful',
    message: `Your payment reference ${payment.payment_reference} could not be verified: ${payment.admin_notes}`,
    type: 'payment',
    link: '/dashboard#invoices'
  });

  return payment;
}

// --- MESSAGES ---
export async function listMessages(projectId, userId, userRole) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    let query = supabaseAdmin.from('messages').select('*').order('created_at', { ascending: true });

    if (projectId) {
      // Must check project ownership if customer
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
      let pq = supabaseAdmin.from('projects').select('id, customer_id, client_id');
      if (isUuid) pq = pq.or(`id.eq.${projectId},project_code.eq.${projectId}`);
      else pq = pq.eq('project_code', projectId);

      const { data: proj } = await pq.maybeSingle();
      if (!proj) throw new Error('Project not found');

      if (userRole !== 'admin' && proj.customer_id !== userId && proj.client_id !== userId) {
        const err = new Error('Access denied to project messages.');
        err.status = 403;
        throw err;
      }
      query = query.eq('project_id', proj.id);
    } else if (userRole !== 'admin') {
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId},customer_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('listMessages error:', error.message);
      return [];
    }
    return data || [];
  }

  // In-Memory
  let list = memoryDb.messages;
  if (projectId) {
    const proj = memoryDb.projects.find(p => p.id === projectId || p.project_code === projectId);
    if (!proj) throw new Error('Project not found');
    if (userRole !== 'admin' && proj.client_id !== userId) {
      const err = new Error('Access denied to project messages.');
      err.status = 403;
      throw err;
    }
    list = list.filter(m => m.project_id === proj.id);
  } else if (userRole !== 'admin') {
    const userProjIds = memoryDb.projects.filter(p => p.client_id === userId).map(p => p.id);
    list = list.filter(m => m.sender_id === userId || m.recipient_id === userId || userProjIds.includes(m.project_id));
  }
  return list;
}

export async function sendMessage({ projectId, message, userId, userRole, userName }) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    let pq = supabaseAdmin.from('projects').select('*');
    if (isUuid) pq = pq.or(`id.eq.${projectId},project_code.eq.${projectId}`);
    else pq = pq.eq('project_code', projectId);

    const { data: project } = await pq.maybeSingle();
    if (!project) throw new Error('Project not found');

    if (userRole !== 'admin' && project.customer_id !== userId && project.client_id !== userId) {
      const err = new Error('Access denied: Cannot send message to project you do not own.');
      err.status = 403;
      throw err;
    }

    const recipientId = userRole === 'admin' ? (project.customer_id || project.client_id) : 'admin-rs-001';

    const { data: newMsg, error } = await supabaseAdmin
      .from('messages')
      .insert({
        project_id: project.id,
        customer_id: project.customer_id || project.client_id,
        sender_id: userId,
        recipient_id: recipientId,
        sender_role: userRole,
        message: message.trim(),
        read: false
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Notify recipient
    if (recipientId) {
      await createNotification({
        user_id: recipientId,
        title: `New Message on ${project.project_code}`,
        message: `${userName}: "${message.trim().substring(0, 60)}..."`,
        type: 'message',
        link: userRole === 'admin' ? '/dashboard#messages' : '/admin#messages',
        related_project_id: project.id
      });
    }

    return { ...newMsg, sender_name: userName };
  }

  // In-Memory
  const project = memoryDb.projects.find(p => p.id === projectId || p.project_code === projectId);
  if (!project) throw new Error('Project not found');

  if (userRole !== 'admin' && project.client_id !== userId) {
    const err = new Error('Access denied: Cannot send message to project you do not own.');
    err.status = 403;
    throw err;
  }

  const recipientId = userRole === 'admin' ? project.client_id : 'admin-rs-001';
  const newMessage = {
    id: `msg-${Date.now()}`,
    project_id: project.id,
    sender_id: userId,
    sender_name: userName,
    sender_role: userRole,
    recipient_id: recipientId,
    message: message.trim(),
    read: false,
    created_at: new Date().toISOString()
  };

  memoryDb.messages.push(newMessage);

  if (recipientId) {
    await createNotification({
      user_id: recipientId,
      title: `New Message on ${project.project_code}`,
      message: `${userName}: "${message.trim().substring(0, 60)}..."`,
      type: 'message',
      link: userRole === 'admin' ? '/dashboard#messages' : '/admin#messages'
    });
  }

  return newMessage;
}

// --- NOTIFICATIONS ---
export async function listNotifications(userId) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('listNotifications error:', error.message);
      return { notifications: [], unreadCount: 0 };
    }

    const list = data || [];
    const unreadCount = list.filter(n => !n.read).length;
    return { notifications: list, unreadCount };
  }

  const list = memoryDb.notifications
    .filter(n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const unreadCount = list.filter(n => !n.read).length;
  return { notifications: list, unreadCount };
}

export async function markNotificationsRead(userId, notifId) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    let q = supabaseAdmin.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('user_id', userId);
    if (notifId) q = q.eq('id', notifId);
    await q;
    return true;
  }

  if (notifId) {
    const n = memoryDb.notifications.find(item => item.id === notifId && item.user_id === userId);
    if (n) n.read = true;
  } else {
    memoryDb.notifications.forEach(n => {
      if (n.user_id === userId) n.read = true;
    });
  }
  return true;
}

export async function createNotification({ user_id, title, message, type, link, related_project_id, related_invoice_id }) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id,
        title,
        message,
        type: type || 'info',
        link: link || null,
        related_project_id: related_project_id || null,
        related_invoice_id: related_invoice_id || null,
        read: false
      });
      return;
    } catch (e) {
      console.warn('createNotification DB error:', e.message);
    }
  }

  memoryDb.notifications.push({
    id: `notif-${Date.now()}`,
    user_id,
    title,
    message,
    type: type || 'info',
    link: link || null,
    read: false,
    created_at: new Date().toISOString()
  });
}

// --- PRICING & PAYMENT SETTINGS ---
export async function getPricingData() {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const [sRes, prRes] = await Promise.all([
      supabaseAdmin.from('services').select('*').order('name'),
      supabaseAdmin.from('pricing_rules').select('*').order('created_at')
    ]);

    return {
      services: sRes.data || memoryDb.services,
      pricing_rules: prRes.data || memoryDb.pricing_rules
    };
  }

  return {
    services: memoryDb.services,
    pricing_rules: memoryDb.pricing_rules
  };
}

export async function updatePricingRule(ruleId, updates) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.base_price !== undefined) payload.base_price = Number(updates.base_price);
    if (updates.tier_description !== undefined) payload.tier_description = updates.tier_description;
    if (updates.estimated_days !== undefined) payload.estimated_days = Number(updates.estimated_days);
    if (updates.features) payload.features = updates.features;
    if (updates.addons) payload.addons = updates.addons;

    const { data, error } = await supabaseAdmin
      .from('pricing_rules')
      .update(payload)
      .eq('id', ruleId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const rule = memoryDb.pricing_rules.find(r => r.id === ruleId);
  if (!rule) throw new Error('Pricing rule not found');
  if (updates.base_price !== undefined) rule.base_price = Number(updates.base_price);
  if (updates.tier_description !== undefined) rule.tier_description = updates.tier_description;
  if (updates.estimated_days !== undefined) rule.estimated_days = Number(updates.estimated_days);
  if (updates.features) rule.features = updates.features;
  if (updates.addons) rule.addons = updates.addons;
  return rule;
}

export async function getPaymentSettings() {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('payment_settings').select('*').eq('is_active', true).maybeSingle();
    if (error || !data) return memoryDb.payment_settings;
    return data;
  }
  return memoryDb.payment_settings;
}

export async function updatePaymentSettings(updates) {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.bank_name) payload.bank_name = updates.bank_name;
    if (updates.account_name) payload.account_name = updates.account_name;
    if (updates.account_number) payload.account_number = updates.account_number;
    if (updates.routing_info !== undefined) payload.routing_info = updates.routing_info;
    if (updates.payment_notes !== undefined) payload.payment_notes = updates.payment_notes;

    const { data: existing } = await supabaseAdmin.from('payment_settings').select('id').limit(1).maybeSingle();
    let res;
    if (existing) {
      res = await supabaseAdmin.from('payment_settings').update(payload).eq('id', existing.id).select('*').single();
    } else {
      res = await supabaseAdmin.from('payment_settings').insert({ ...payload, is_active: true }).select('*').single();
    }

    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  if (updates.bank_name) memoryDb.payment_settings.bank_name = updates.bank_name;
  if (updates.account_name) memoryDb.payment_settings.account_name = updates.account_name;
  if (updates.account_number) memoryDb.payment_settings.account_number = updates.account_number;
  if (updates.routing_info !== undefined) memoryDb.payment_settings.routing_info = updates.routing_info;
  if (updates.payment_notes !== undefined) memoryDb.payment_settings.payment_notes = updates.payment_notes;
  memoryDb.payment_settings.updated_at = new Date().toISOString();
  return memoryDb.payment_settings;
}

// --- ADMIN METRICS ---
export async function getAdminMetrics() {
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const [custRes, projRes, estRes, invRes, payRes, msgRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabaseAdmin.from('projects').select('id, status'),
      supabaseAdmin.from('estimates').select('id, status'),
      supabaseAdmin.from('invoices').select('id, status, amount, paid_amount'),
      supabaseAdmin.from('payments').select('id, status, amount'),
      supabaseAdmin.from('messages').select('id, read, sender_role')
    ]);

    const totalCustomers = custRes.count || 0;
    const projects = projRes.data || [];
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => ['REVIEWING', 'APPROVED', 'IN_PROGRESS', 'REVIEW', 'reviewing', 'approved', 'in_progress', 'revision'].includes(p.status)).length;
    const completedProjects = projects.filter(p => ['COMPLETED', 'completed'].includes(p.status)).length;

    const estimates = estRes.data || [];
    const pendingEstimates = estimates.filter(e => ['SENT', 'sent'].includes(e.status)).length;

    const invoices = invRes.data || [];
    const unpaidInvoices = invoices.filter(i => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE', 'sent', 'partially_paid', 'overdue'].includes(i.status)).length;

    const payments = payRes.data || [];
    const totalVerifiedRevenue = payments
      .filter(p => ['VERIFIED', 'verified'].includes(p.status))
      .reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const pendingPaymentsCount = payments.filter(p => ['PENDING', 'submitted', 'pending'].includes(p.status)).length;

    const messages = msgRes.data || [];
    const unreadMessagesCount = messages.filter(m => !m.read && m.sender_role === 'customer').length;

    return {
      totalCustomers,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingEstimates,
      unpaidInvoices,
      totalVerifiedRevenue,
      pendingPaymentsCount,
      unreadMessagesCount
    };
  }

  // In-Memory
  const totalCustomers = memoryDb.profiles.filter(p => p.role === 'customer').length;
  const totalProjects = memoryDb.projects.length;
  const activeProjects = memoryDb.projects.filter(p => ['REVIEWING', 'APPROVED', 'IN_PROGRESS', 'REVIEW'].includes(p.status)).length;
  const completedProjects = memoryDb.projects.filter(p => p.status === 'COMPLETED').length;
  const pendingEstimates = memoryDb.estimates.filter(e => e.status === 'SENT').length;
  const unpaidInvoices = memoryDb.invoices.filter(i => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status)).length;

  const totalVerifiedRevenue = memoryDb.payments
    .filter(p => p.status === 'VERIFIED')
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingPaymentsCount = memoryDb.payments.filter(p => p.status === 'PENDING').length;
  const unreadMessagesCount = memoryDb.messages.filter(m => !m.read && m.sender_role === 'customer').length;

  return {
    totalCustomers,
    totalProjects,
    activeProjects,
    completedProjects,
    pendingEstimates,
    unpaidInvoices,
    totalVerifiedRevenue,
    pendingPaymentsCount,
    unreadMessagesCount
  };
}

// --- FILE STORAGE & UPLOAD ---
export async function uploadFileRecord({ fileBuffer, originalName, mimeType, size, projectId, uploaderId, category, uploadDir }) {
  const ext = path.extname(originalName) || '';
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBase}${ext}`;

  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    const bucket = category === 'payment_proof' ? 'payment-proofs' : 'project-attachments';
    const folder = category === 'payment_proof' ? uploaderId : (projectId || uploaderId);
    const storagePath = `${folder}/${uniqueName}`;

    const { data: uploadData, error: upErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (upErr) {
      console.warn(`Supabase storage upload error in bucket "${bucket}":`, upErr.message);
      // fallback write to local if storage fails
      const localPath = path.join(uploadDir, uniqueName);
      await fs.promises.writeFile(localPath, fileBuffer);
    }

    // Generate signed URL for secure private retrieval
    let signedUrl = '';
    try {
      const { data: signData } = await supabaseAdmin.storage.from(bucket).createSignedUrl(storagePath, 60 * 60 * 24); // 24hr link
      signedUrl = signData?.signedUrl || '';
    } catch (se) {
      console.warn('createSignedUrl notice:', se.message);
    }

    const publicUrl = signedUrl || `/uploads/${uniqueName}`;

    // Insert into project_files
    let fileRecord = {
      project_id: projectId || null,
      uploader_id: uploaderId,
      file_name: originalName,
      file_size: size,
      file_type: mimeType,
      file_path: publicUrl,
      file_category: category || 'document'
    };

    try {
      const { data: insRecord } = await supabaseAdmin.from('project_files').insert(fileRecord).select('*').single();
      if (insRecord) fileRecord = insRecord;
    } catch (fe) {
      console.warn('project_files insert error:', fe.message);
    }

    return fileRecord;
  }

  // In-Memory & Local Disk
  const localPath = path.join(uploadDir, uniqueName);
  await fs.promises.writeFile(localPath, fileBuffer);

  const fileRecord = {
    id: `file-${Date.now()}`,
    project_id: projectId || null,
    uploader_id: uploaderId,
    file_name: originalName,
    file_size: size,
    file_type: mimeType,
    file_path: `/uploads/${uniqueName}`,
    file_category: category || 'document',
    created_at: new Date().toISOString()
  };

  memoryDb.project_files.push(fileRecord);
  return fileRecord;
}
