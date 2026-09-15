import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { handleAiChatRequest } from './netlify/functions/ai-chat.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------------------------
// Supabase Client Initialization (if credentials provided)
// -----------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log('[RS Hub] Connected to Supabase instance:', SUPABASE_URL);
  } catch (err) {
    console.warn('[RS Hub] Supabase init failed, fallback to in-memory store:', err.message);
  }
}

// -----------------------------------------------------------------------------
// In-Memory Database Store (High-Fidelity Persistence for Preview & Fallback)
// -----------------------------------------------------------------------------
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'rs_hub_salt_2026').digest('hex');
}

// Initial Admin Credentials
const INITIAL_ADMIN_EMAIL = 'okegbadeismaheelsmalie@gmail.com';
const INITIAL_ADMIN_PHONE = '09117035399';
const INITIAL_ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || 'RoyalSmalie@1';

const db = {
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
        'Unlimited Custom Pages & Catalog',
        'Full E-Commerce / Storefront Engine',
        'Customer Authentication & Portal',
        'Multiple Payment Gateways',
        'Automated Order & Email Notifications',
        '6-Month Maintenance & Priority Support'
      ],
      addons: [
        { id: 'app', name: 'PWA Mobile App Conversion', price: 50000 }
      ]
    },
    {
      id: 'pr-4',
      service_slug: 'graphic-design',
      tier_name: 'Logo & Identity',
      tier_description: 'Distinctive visual logo and vector brand mark.',
      base_price: 25000,
      estimated_days: 5,
      features: [
        '3 Unique Creative Logo Concepts',
        'Vector Master Files (SVG, AI, PDF, PNG)',
        'Color Palette & Typography System',
        'Social Media Profile & Banner Formats'
      ],
      addons: [
        { id: 'stationery', name: 'Business Card & Letterhead Design', price: 15000 }
      ]
    },
    {
      id: 'pr-5',
      service_slug: 'graphic-design',
      tier_name: 'Full Brand Kit',
      tier_description: 'Complete brand guide, promotional flyers, and marketing kit.',
      base_price: 60000,
      estimated_days: 10,
      features: [
        'Full Brand Identity Guidelines Book',
        'Marketing Flyers & Promo Banners (3 variations)',
        'Social Media Post Templates (5 designs)',
        'High-Resolution Print-Ready Vectors'
      ],
      addons: []
    },
    {
      id: 'pr-6',
      service_slug: 'ai-solutions',
      tier_name: 'AI Chatbot & Automation',
      tier_description: 'Custom-trained virtual assistant for your business.',
      base_price: 100000,
      estimated_days: 14,
      features: [
        'Custom Business Knowledge Base Training',
        'Interactive Website Widget Deployment',
        'Automatic Lead Capture & Email Notifications',
        '24/7 Intelligent Customer Support Handling'
      ],
      addons: [
        { id: 'crm', name: 'Google Sheets / CRM Sync', price: 30000 }
      ]
    },
    {
      id: 'pr-7',
      service_slug: 'web-applications',
      tier_name: 'Custom Web Application',
      tier_description: 'Full-stack dynamic portal, workflow engine, or dashboard.',
      base_price: 250000,
      estimated_days: 30,
      features: [
        'Secure Role-Based Authentication (RBAC)',
        'Relational Database Architecture',
        'Customer/Admin Portals & Workflows',
        'REST API & External Integrations',
        'Automated Activity Timelines & Alerts'
      ],
      addons: [
        { id: 'mobile', name: 'Offline PWA Support', price: 45000 }
      ]
    }
  ],
  payment_settings: {
    bank_name: 'OPay / First Bank of Nigeria',
    account_name: 'RS Digital Hub / Royal Smalie',
    account_number: '09117035399',
    currency: 'NGN (₦)',
    routing_info: 'Account Type: Commercial / Branch: Lagos',
    payment_notes: 'Please include your Invoice or Project Code (e.g. RDH-0001) in your transfer description. After making the bank transfer, enter the payment reference and upload your receipt in your customer portal for instant verification.',
    updated_at: new Date().toISOString()
  },
  projects: [
    {
      id: 'proj-001',
      project_code: 'RDH-0001',
      client_id: 'cust-demo-001',
      client_name: 'Adebayo Balogun',
      client_email: 'client@example.com',
      phone: '+2348023456789',
      service_id: 'srv-1',
      service_type: 'Website Development',
      title: 'IB Auto Care Website Development',
      description: 'Modern mechanic and auto-service company website with appointment booking form, customer testimonials, and WhatsApp integration.',
      budget: 150000,
      deadline: '2026-10-15',
      status: 'IN_PROGRESS',
      progress: 65,
      created_at: new Date('2026-08-20T10:00:00Z').toISOString(),
      updated_at: new Date('2026-09-10T14:30:00Z').toISOString()
    },
    {
      id: 'proj-002',
      project_code: 'RDH-0002',
      client_id: 'cust-demo-001',
      client_name: 'Adebayo Balogun',
      client_email: 'client@example.com',
      phone: '+2348023456789',
      service_id: 'srv-4',
      service_type: 'Web Applications',
      title: 'Gym Tracker Fitness App',
      description: 'Interactive membership and workout tracking web application for fitness members with progress charts and diet logging.',
      budget: 280000,
      deadline: '2026-11-01',
      status: 'APPROVED',
      progress: 25,
      created_at: new Date('2026-09-01T11:20:00Z').toISOString(),
      updated_at: new Date('2026-09-12T16:00:00Z').toISOString()
    }
  ],
  project_activity: [
    {
      id: 'act-1',
      project_id: 'proj-001',
      activity_type: 'SUBMITTED',
      title: 'Project Request Submitted',
      description: 'Initial project request received from Adebayo Balogun.',
      created_at: new Date('2026-08-20T10:00:00Z').toISOString()
    },
    {
      id: 'act-2',
      project_id: 'proj-001',
      activity_type: 'ESTIMATE_CREATED',
      title: 'Estimate EST-2026-001 Created',
      description: 'Detailed project estimate issued by Royal Smalie 👑.',
      created_at: new Date('2026-08-21T14:10:00Z').toISOString()
    },
    {
      id: 'act-3',
      project_id: 'proj-001',
      activity_type: 'ESTIMATE_ACCEPTED',
      title: 'Estimate Accepted by Client',
      description: 'Client accepted project scope and payment terms.',
      created_at: new Date('2026-08-22T09:15:00Z').toISOString()
    },
    {
      id: 'act-4',
      project_id: 'proj-001',
      activity_type: 'STATUS_CHANGE',
      title: 'Development Work Started',
      description: 'Project moved to IN_PROGRESS. UI design concepts completed.',
      created_at: new Date('2026-08-25T11:00:00Z').toISOString()
    },
    {
      id: 'act-5',
      project_id: 'proj-002',
      activity_type: 'SUBMITTED',
      title: 'Project Request Submitted',
      description: 'Gym Tracker specifications submitted for review.',
      created_at: new Date('2026-09-01T11:20:00Z').toISOString()
    },
    {
      id: 'act-6',
      project_id: 'proj-002',
      activity_type: 'APPROVED',
      title: 'Project Approved',
      description: 'RS Digital Hub confirmed project requirements and timeline.',
      created_at: new Date('2026-09-05T15:00:00Z').toISOString()
    }
  ],
  project_files: [
    {
      id: 'file-1',
      project_id: 'proj-001',
      uploader_id: 'admin-rs-001',
      file_name: 'IB_Auto_Care_Design_Mockup_v1.pdf',
      file_size: 2450000,
      file_type: 'application/pdf',
      file_path: '/uploads/sample_mockup.pdf',
      file_category: 'deliverable',
      created_at: new Date('2026-08-28T16:00:00Z').toISOString()
    }
  ],
  estimates: [
    {
      id: 'est-001',
      estimate_number: 'EST-2026-001',
      project_id: 'proj-001',
      client_id: 'cust-demo-001',
      status: 'ACCEPTED',
      subtotal: 150000,
      discount: 10000,
      tax: 0,
      total: 140000,
      notes: 'Includes 7 pages, WhatsApp live chat widget, Google Maps locator, and 3 months technical maintenance.',
      valid_until: '2026-09-30',
      accepted_at: new Date('2026-08-22T09:15:00Z').toISOString(),
      created_at: new Date('2026-08-21T14:10:00Z').toISOString(),
      items: [
        { id: 'ei-1', description: 'Core Website UI/UX Design & 7 Responsive Pages', quantity: 1, unit_price: 100000, amount: 100000 },
        { id: 'ei-2', description: 'Appointment Booking & WhatsApp Integration', quantity: 1, unit_price: 30000, amount: 30000 },
        { id: 'ei-3', description: 'Google SEO & Performance Optimization', quantity: 1, unit_price: 20000, amount: 20000 }
      ]
    },
    {
      id: 'est-002',
      estimate_number: 'EST-2026-002',
      project_id: 'proj-002',
      client_id: 'cust-demo-001',
      status: 'SENT',
      subtotal: 280000,
      discount: 0,
      tax: 0,
      total: 280000,
      notes: 'Full-stack application with user authentication, workout logger, diet calendar, and responsive mobile PWA.',
      valid_until: '2026-10-15',
      created_at: new Date('2026-09-03T16:00:00Z').toISOString(),
      items: [
        { id: 'ei-4', description: 'Database Schema & Auth Engine', quantity: 1, unit_price: 90000, amount: 90000 },
        { id: 'ei-5', description: 'Member Dashboard & Workout Log Workflows', quantity: 1, unit_price: 130000, amount: 130000 },
        { id: 'ei-6', description: 'Progress Charts & PWA Offline Support', quantity: 1, unit_price: 60000, amount: 60000 }
      ]
    }
  ],
  invoices: [
    {
      id: 'inv-001',
      invoice_number: 'INV-2026-001',
      project_id: 'proj-001',
      client_id: 'cust-demo-001',
      estimate_id: 'est-001',
      status: 'PARTIALLY_PAID',
      amount: 140000,
      paid_amount: 70000,
      due_date: '2026-09-30',
      notes: '50% Initial Commencement Deposit received. Balance due upon deployment staging preview.',
      created_at: new Date('2026-08-22T10:00:00Z').toISOString(),
      items: [
        { id: 'ii-1', description: 'IB Auto Care Website Project — Phase 1 & Phase 2', quantity: 1, unit_price: 140000, amount: 140000 }
      ]
    },
    {
      id: 'inv-002',
      invoice_number: 'INV-2026-002',
      project_id: 'proj-002',
      client_id: 'cust-demo-001',
      estimate_id: 'est-002',
      status: 'ISSUED',
      amount: 140000,
      paid_amount: 0,
      due_date: '2026-10-05',
      notes: '50% Initial Deposit for Gym Tracker Web Application.',
      created_at: new Date('2026-09-06T12:00:00Z').toISOString(),
      items: [
        { id: 'ii-2', description: 'Gym Tracker Application — Initial Milestone Deposit', quantity: 1, unit_price: 140000, amount: 140000 }
      ]
    }
  ],
  payments: [
    {
      id: 'pay-001',
      payment_reference: 'RS-PAY-8831920',
      invoice_id: 'inv-001',
      project_id: 'proj-001',
      client_id: 'cust-demo-001',
      amount: 70000,
      payment_method: 'Bank Transfer (OPay)',
      proof_file_url: '/uploads/sample_receipt.png',
      status: 'VERIFIED',
      admin_notes: 'Payment verified via bank alert. Phase 1 unlocked.',
      verified_by: 'admin-rs-001',
      verified_at: new Date('2026-08-23T14:00:00Z').toISOString(),
      created_at: new Date('2026-08-23T11:45:00Z').toISOString()
    }
  ],
  messages: [
    {
      id: 'msg-1',
      project_id: 'proj-001',
      sender_id: 'cust-demo-001',
      sender_name: 'Adebayo Balogun',
      sender_role: 'customer',
      message: 'Hello Royal Smalie! I have submitted the logo and color palette for IB Auto Care.',
      read: true,
      created_at: new Date('2026-08-24T10:15:00Z').toISOString()
    },
    {
      id: 'msg-2',
      project_id: 'proj-001',
      sender_id: 'admin-rs-001',
      sender_name: 'Royal Smalie 👑',
      sender_role: 'admin',
      message: 'Awesome Adebayo! Received. The header navigation and hero banner are already structured. Staging preview will be ready shortly.',
      read: true,
      created_at: new Date('2026-08-24T11:30:00Z').toISOString()
    },
    {
      id: 'msg-3',
      project_id: 'proj-002',
      sender_id: 'cust-demo-001',
      sender_name: 'Adebayo Balogun',
      sender_role: 'customer',
      message: 'Regarding the Gym Tracker, can we add a feature for weight history charts?',
      read: false,
      created_at: new Date('2026-09-12T08:20:00Z').toISOString()
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      user_id: 'cust-demo-001',
      title: 'Payment Verified',
      message: 'Your payment of ₦70,000 for Invoice INV-2026-001 has been verified.',
      type: 'payment',
      link: '/dashboard#invoices',
      read: true,
      created_at: new Date('2026-08-23T14:00:00Z').toISOString()
    },
    {
      id: 'notif-2',
      user_id: 'cust-demo-001',
      title: 'New Estimate Available',
      message: 'Royal Smalie issued estimate EST-2026-002 for Gym Tracker.',
      type: 'estimate',
      link: '/dashboard#estimates',
      read: false,
      created_at: new Date('2026-09-03T16:00:00Z').toISOString()
    },
    {
      id: 'notif-3',
      user_id: 'admin-rs-001',
      title: 'New Client Message',
      message: 'Adebayo Balogun sent an inquiry regarding Gym Tracker.',
      type: 'message',
      link: '/admin#messages',
      read: false,
      created_at: new Date('2026-09-12T08:20:00Z').toISOString()
    }
  ]
};

// Session token store (in-memory token -> user mapping)
const activeSessions = new Map();

// Helper: authenticate token middleware
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.substring(7);
  const session = activeSessions.get(token);
  if (session) {
    req.user = session.user;
    return next();
  }

  // If Supabase is configured, verify the Supabase JWT token
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.SUPABASE_ANON_KEY || SUPABASE_KEY
        }
      });

      if (authRes.ok) {
        const supaUser = await authRes.json();
        // Lookup profile in profiles table
        let profile = null;
        try {
          const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${supaUser.id}&select=*`, {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: process.env.SUPABASE_ANON_KEY || SUPABASE_KEY
            }
          });
          if (profRes.ok) {
            const list = await profRes.json();
            if (Array.isArray(list) && list.length > 0) profile = list[0];
          }
        } catch (pe) {
          console.warn('[RS Hub] Profile lookup warning:', pe.message);
        }

        const isAdmin = (profile && profile.role === 'admin') ||
          (supaUser.email && supaUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase());

        const userObj = {
          id: supaUser.id,
          email: supaUser.email,
          full_name: (profile && (profile.full_name || profile.name)) || supaUser.user_metadata?.full_name || 'Customer',
          whatsapp_phone: (profile && (profile.phone || profile.whatsapp_phone)) || '',
          role: isAdmin ? 'admin' : 'customer'
        };

        // Cache session
        activeSessions.set(token, { user: userObj, expires_at: Date.now() + 3600000 });
        req.user = userObj;
        return next();
      }
    } catch (err) {
      console.warn('[RS Hub] Supabase token auth check warning:', err.message);
    }
  }

  return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------

// Sign Up (Always creates 'customer' role; role cannot be set to 'admin' by client)
app.post(['/api/auth/signup', '/api/auth/register'], (req, res) => {
  const { full_name, email, password, whatsapp_phone } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.profiles.find(p => p.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // Determine role: Only the designated admin email gets 'admin', everyone else is strictly 'customer'
  const role = cleanEmail === INITIAL_ADMIN_EMAIL ? 'admin' : 'customer';

  const newUser = {
    id: `cust-${Date.now()}`,
    full_name: full_name.trim(),
    email: cleanEmail,
    whatsapp_phone: whatsapp_phone ? whatsapp_phone.trim() : '',
    role,
    password_hash: hashPassword(password),
    avatar_url: '',
    created_at: new Date().toISOString()
  };

  db.profiles.push(newUser);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionUser = {
    id: newUser.id,
    full_name: newUser.full_name,
    email: newUser.email,
    whatsapp_phone: newUser.whatsapp_phone,
    role: newUser.role
  };
  activeSessions.set(token, { user: sessionUser, createdAt: Date.now() });

  // Add welcome notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    user_id: newUser.id,
    title: 'Welcome to RS Digital Hub 👑',
    message: 'Your customer account has been created. Start a project or request an estimate anytime!',
    type: 'system',
    link: '/dashboard',
    read: false,
    created_at: new Date().toISOString()
  });

  return res.status(201).json({
    success: true,
    token,
    user: sessionUser
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.profiles.find(p => p.email.toLowerCase() === cleanEmail);

  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionUser = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    whatsapp_phone: user.whatsapp_phone,
    role: user.role
  };
  activeSessions.set(token, { user: sessionUser, createdAt: Date.now() });

  return res.json({
    success: true,
    token,
    user: sessionUser
  });
});

// Get Current Session
app.get('/api/auth/session', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false, user: null });
  }

  const token = authHeader.substring(7);
  const session = activeSessions.get(token);
  if (!session) {
    return res.json({ authenticated: false, user: null });
  }

  return res.json({
    authenticated: true,
    user: session.user
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeSessions.delete(token);
  }
  return res.json({ success: true });
});

// Update Profile
app.put('/api/auth/profile', authenticate, (req, res) => {
  const { full_name, whatsapp_phone } = req.body;
  const user = db.profiles.find(p => p.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (full_name) user.full_name = full_name.trim();
  if (whatsapp_phone !== undefined) user.whatsapp_phone = whatsapp_phone.trim();

  req.user.full_name = user.full_name;
  req.user.whatsapp_phone = user.whatsapp_phone;

  return res.json({ success: true, user: req.user });
});

// Change Password
app.post('/api/auth/change-password', authenticate, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.profiles.find(p => p.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.password_hash !== hashPassword(current_password)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  user.password_hash = hashPassword(new_password);
  return res.json({ success: true, message: 'Password updated successfully.' });
});

// -----------------------------------------------------------------------------
// Projects Endpoints
// -----------------------------------------------------------------------------

// List Projects (Customer sees their own; Admin sees all)
app.get('/api/projects', authenticate, (req, res) => {
  let list = db.projects;
  if (req.user.role !== 'admin') {
    list = list.filter(p => p.client_id === req.user.id || p.client_email === req.user.email);
  }
  return res.json({ success: true, projects: list });
});

// Get Project Details
app.get('/api/projects/:id', authenticate, (req, res) => {
  const project = db.projects.find(p => p.id === req.params.id || p.project_code === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.role !== 'admin' && project.client_id !== req.user.id && project.client_email !== req.user.email) {
    return res.status(403).json({ error: 'Access denied to this project.' });
  }

  const activity = db.project_activity.filter(a => a.project_id === project.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const files = db.project_files.filter(f => f.project_id === project.id);
  const estimates = db.estimates.filter(e => e.project_id === project.id);
  const invoices = db.invoices.filter(i => i.project_id === project.id);
  const messages = db.messages.filter(m => m.project_id === project.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return res.json({
    success: true,
    project,
    activity,
    files,
    estimates,
    invoices,
    messages
  });
});

// Create Project (Authenticated or Public)
const handleCreateProject = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      service,
      budget,
      deadline,
      description
    } = req.body;

    if (!name || !email || !phone || !service || !description) {
      return res.status(400).json({ error: 'Please complete all required project details.' });
    }

    // Determine client_id if token provided
    let clientId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const session = activeSessions.get(authHeader.substring(7));
      if (session) {
        clientId = session.user.id;
      }
    }

    // Match service
    const matchedService = db.services.find(s => s.name.toLowerCase() === service.toLowerCase() || s.slug === service.toLowerCase());
    const serviceId = matchedService ? matchedService.id : 'srv-1';

    // Generate project code
    const nextNumber = db.projects.length + 1;
    const projectCode = `RDH-${String(nextNumber).padStart(4, '0')}`;

    const newProject = {
      id: `proj-${Date.now()}`,
      project_code: projectCode,
      client_id: clientId,
      client_name: name.trim(),
      client_email: email.trim().toLowerCase(),
      phone: phone.trim(),
      service_id: serviceId,
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

    db.projects.unshift(newProject);

    // Add initial activity
    db.project_activity.push({
      id: `act-${Date.now()}`,
      project_id: newProject.id,
      activity_type: 'SUBMITTED',
      title: 'Project Submitted',
      description: `Project request created by ${name}.`,
      created_at: new Date().toISOString()
    });

    // Notify admin
    db.notifications.push({
      id: `notif-${Date.now()}`,
      user_id: 'admin-rs-001',
      title: 'New Project Received 🚀',
      message: `${name} submitted ${service} project (${projectCode}).`,
      type: 'project',
      link: `/admin#projects`,
      read: false,
      created_at: new Date().toISOString()
    });

    // Notify customer if registered
    if (clientId) {
      db.notifications.push({
        id: `notif-${Date.now() + 1}`,
        user_id: clientId,
        title: 'Project Request Received',
        message: `Your project ${projectCode} has been received and is under review.`,
        type: 'project',
        link: `/dashboard#projects`,
        read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(201).json({
      success: true,
      project: newProject
    });

  } catch (error) {
    console.error('Project creation error:', error);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
};

app.post('/api/projects', handleCreateProject);
app.post('/api/create-project', handleCreateProject);
app.post('/.netlify/functions/create-project', handleCreateProject);

// Update Project Status & Progress (Admin Only)
app.put('/api/projects/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status, progress, notes } = req.body;
  const project = db.projects.find(p => p.id === req.params.id || p.project_code === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const validStatuses = ['SUBMITTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'];
  if (status && validStatuses.includes(status)) {
    project.status = status;
  }
  if (progress !== undefined) {
    project.progress = Math.min(100, Math.max(0, Number(progress)));
  }
  project.updated_at = new Date().toISOString();

  // Add activity
  db.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: project.id,
    activity_type: 'STATUS_CHANGE',
    title: `Project Status: ${project.status}`,
    description: notes || `Project progress updated to ${project.progress}%. Status set to ${project.status}.`,
    created_at: new Date().toISOString()
  });

  // Notify client
  if (project.client_id) {
    db.notifications.push({
      id: `notif-${Date.now()}`,
      user_id: project.client_id,
      title: 'Project Status Updated',
      message: `Your project ${project.project_code} is now ${project.status} (${project.progress}% complete).`,
      type: 'project',
      link: `/dashboard#projects`,
      read: false,
      created_at: new Date().toISOString()
    });
  }

  return res.json({ success: true, project });
});

// -----------------------------------------------------------------------------
// Estimates Endpoints
// -----------------------------------------------------------------------------

// List Estimates
app.get('/api/estimates', authenticate, (req, res) => {
  let list = db.estimates;
  if (req.user.role !== 'admin') {
    list = list.filter(e => e.client_id === req.user.id);
  }
  return res.json({ success: true, estimates: list });
});

// Create Estimate (Admin Only)
app.post('/api/estimates', authenticate, requireAdmin, (req, res) => {
  const { project_id, client_id, items, discount, notes, valid_until } = req.body;

  if (!project_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please specify project and at least one item.' });
  }

  const project = db.projects.find(p => p.id === project_id || p.project_code === project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const targetClientId = client_id || project.client_id;
  if (!targetClientId) {
    return res.status(400).json({ error: 'Cannot issue estimate for unassociated client account.' });
  }

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

  const estNum = `EST-2026-${String(db.estimates.length + 1).padStart(3, '0')}`;

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

  db.estimates.unshift(newEstimate);

  // Add timeline entry
  db.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: project.id,
    activity_type: 'ESTIMATE_CREATED',
    title: `Estimate ${estNum} Issued`,
    description: `Estimate for ₦${total.toLocaleString()} created and sent to client.`,
    created_at: new Date().toISOString()
  });

  // Notify client
  db.notifications.push({
    id: `notif-${Date.now()}`,
    user_id: targetClientId,
    title: `Estimate ${estNum} Issued`,
    message: `A new estimate of ₦${total.toLocaleString()} is available for review on ${project.title}.`,
    type: 'estimate',
    link: `/dashboard#estimates`,
    read: false,
    created_at: new Date().toISOString()
  });

  return res.status(201).json({ success: true, estimate: newEstimate });
});

// Accept Estimate (Customer or Admin)
app.put('/api/estimates/:id/accept', authenticate, (req, res) => {
  const est = db.estimates.find(e => e.id === req.params.id || e.estimate_number === req.params.id);
  if (!est) return res.status(404).json({ error: 'Estimate not found' });

  if (req.user.role !== 'admin' && est.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to accept this estimate.' });
  }

  est.status = 'ACCEPTED';
  est.accepted_at = new Date().toISOString();

  // Update project status to APPROVED if currently SUBMITTED
  const proj = db.projects.find(p => p.id === est.project_id);
  if (proj && (proj.status === 'SUBMITTED' || proj.status === 'REVIEWING')) {
    proj.status = 'APPROVED';
  }

  // Add activity
  db.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: est.project_id,
    activity_type: 'ESTIMATE_ACCEPTED',
    title: `Estimate ${est.estimate_number} Accepted`,
    description: `Estimate of ₦${est.total.toLocaleString()} accepted by client.`,
    created_at: new Date().toISOString()
  });

  // Notify admin
  db.notifications.push({
    id: `notif-${Date.now()}`,
    user_id: 'admin-rs-001',
    title: 'Estimate Accepted 🎉',
    message: `Client accepted ${est.estimate_number} (₦${est.total.toLocaleString()}). Ready to generate invoice.`,
    type: 'estimate',
    link: `/admin#estimates`,
    read: false,
    created_at: new Date().toISOString()
  });

  return res.json({ success: true, estimate: est });
});

// Decline Estimate
app.put('/api/estimates/:id/decline', authenticate, (req, res) => {
  const est = db.estimates.find(e => e.id === req.params.id || e.estimate_number === req.params.id);
  if (!est) return res.status(404).json({ error: 'Estimate not found' });

  if (req.user.role !== 'admin' && est.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to decline this estimate.' });
  }

  est.status = 'DECLINED';
  est.declined_at = new Date().toISOString();

  db.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: est.project_id,
    activity_type: 'ESTIMATE_DECLINED',
    title: `Estimate ${est.estimate_number} Declined`,
    description: `Client requested modifications or declined estimate.`,
    created_at: new Date().toISOString()
  });

  return res.json({ success: true, estimate: est });
});

// -----------------------------------------------------------------------------
// Invoices Endpoints
// -----------------------------------------------------------------------------

// List Invoices
app.get('/api/invoices', authenticate, (req, res) => {
  let list = db.invoices;
  if (req.user.role !== 'admin') {
    list = list.filter(i => i.client_id === req.user.id);
  }
  return res.json({ success: true, invoices: list });
});

// Create Invoice (Admin Only)
app.post('/api/invoices', authenticate, requireAdmin, (req, res) => {
  const { project_id, client_id, estimate_id, amount, due_date, notes, items } = req.body;

  if (!project_id || !amount || !due_date) {
    return res.status(400).json({ error: 'Please specify project, amount, and due date.' });
  }

  const project = db.projects.find(p => p.id === project_id || p.project_code === project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const targetClientId = client_id || project.client_id;
  const invNum = `INV-2026-${String(db.invoices.length + 1).padStart(3, '0')}`;

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

  db.invoices.unshift(newInvoice);

  // Add timeline entry
  db.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: project.id,
    activity_type: 'INVOICE_ISSUED',
    title: `Invoice ${invNum} Issued`,
    description: `Invoice for ₦${Number(amount).toLocaleString()} created with due date ${due_date}.`,
    created_at: new Date().toISOString()
  });

  // Notify client
  if (targetClientId) {
    db.notifications.push({
      id: `notif-${Date.now()}`,
      user_id: targetClientId,
      title: `Invoice ${invNum} Issued`,
      message: `An invoice for ₦${Number(amount).toLocaleString()} has been issued for ${project.title}.`,
      type: 'invoice',
      link: `/dashboard#invoices`,
      read: false,
      created_at: new Date().toISOString()
    });
  }

  return res.status(201).json({ success: true, invoice: newInvoice });
});

// Update Invoice Status (Admin Only)
app.put('/api/invoices/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status, paid_amount } = req.body;
  const invoice = db.invoices.find(i => i.id === req.params.id || i.invoice_number === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  if (status) invoice.status = status;
  if (paid_amount !== undefined) invoice.paid_amount = Number(paid_amount);

  return res.json({ success: true, invoice });
});

// -----------------------------------------------------------------------------
// Payments Endpoints
// -----------------------------------------------------------------------------

// List Payments
app.get('/api/payments', authenticate, (req, res) => {
  let list = db.payments;
  if (req.user.role !== 'admin') {
    list = list.filter(p => p.client_id === req.user.id);
  }
  return res.json({ success: true, payments: list });
});

// Submit Payment Reference & Proof (Customer)
app.post('/api/payments', authenticate, (req, res) => {
  const { invoice_id, amount, payment_method, reference, proof_file_url } = req.body;

  if (!invoice_id || !amount || !reference) {
    return res.status(400).json({ error: 'Invoice, payment amount, and transaction reference are required.' });
  }

  const invoice = db.invoices.find(i => i.id === invoice_id || i.invoice_number === invoice_id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const refUpper = reference.trim().toUpperCase();
  const existing = db.payments.find(p => p.payment_reference === refUpper);
  if (existing) {
    return res.status(400).json({ error: 'A payment with this reference code has already been submitted.' });
  }

  const newPayment = {
    id: `pay-${Date.now()}`,
    payment_reference: refUpper,
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    project_id: invoice.project_id,
    client_id: req.user.id,
    client_name: req.user.full_name,
    amount: Number(amount),
    payment_method: payment_method || 'Bank Transfer',
    proof_file_url: proof_file_url || null,
    status: 'PENDING',
    admin_notes: '',
    created_at: new Date().toISOString()
  };

  db.payments.unshift(newPayment);

  // Add timeline entry
  db.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: invoice.project_id,
    activity_type: 'PAYMENT_SUBMITTED',
    title: 'Payment Proof Submitted',
    description: `Payment of ₦${Number(amount).toLocaleString()} (Ref: ${refUpper}) submitted for verification.`,
    created_at: new Date().toISOString()
  });

  // Notify admin
  db.notifications.push({
    id: `notif-${Date.now()}`,
    user_id: 'admin-rs-001',
    title: 'New Payment Submitted 💰',
    message: `${req.user.full_name} submitted ₦${Number(amount).toLocaleString()} for ${invoice.invoice_number}.`,
    type: 'payment',
    link: `/admin#payments`,
    read: false,
    created_at: new Date().toISOString()
  });

  return res.status(201).json({ success: true, payment: newPayment });
});

// Verify Payment (Admin Only)
app.put('/api/payments/:id/verify', authenticate, requireAdmin, (req, res) => {
  const { notes } = req.body;
  const payment = db.payments.find(p => p.id === req.params.id || p.payment_reference === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment record not found' });

  payment.status = 'VERIFIED';
  payment.verified_by = req.user.id;
  payment.verified_at = new Date().toISOString();
  if (notes) payment.admin_notes = notes;

  // Update associated invoice
  const invoice = db.invoices.find(i => i.id === payment.invoice_id);
  if (invoice) {
    invoice.paid_amount = (invoice.paid_amount || 0) + payment.amount;
    if (invoice.paid_amount >= invoice.amount) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }
  }

  // Add activity to project
  db.project_activity.push({
    id: `act-${Date.now()}`,
    project_id: payment.project_id,
    activity_type: 'PAYMENT_VERIFIED',
    title: 'Payment Verified ✅',
    description: `Payment of ₦${payment.amount.toLocaleString()} (Ref: ${payment.payment_reference}) verified by Royal Smalie.`,
    created_at: new Date().toISOString()
  });

  // Notify client
  db.notifications.push({
    id: `notif-${Date.now()}`,
    user_id: payment.client_id,
    title: 'Payment Verified! 👑',
    message: `Your payment of ₦${payment.amount.toLocaleString()} has been verified. Thank you!`,
    type: 'payment',
    link: `/dashboard#invoices`,
    read: false,
    created_at: new Date().toISOString()
  });

  return res.json({ success: true, payment });
});

// Reject Payment (Admin Only)
app.put('/api/payments/:id/reject', authenticate, requireAdmin, (req, res) => {
  const { reason } = req.body;
  const payment = db.payments.find(p => p.id === req.params.id || p.payment_reference === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment record not found' });

  payment.status = 'REJECTED';
  payment.admin_notes = reason || 'Payment reference could not be verified in bank records.';

  db.notifications.push({
    id: `notif-${Date.now()}`,
    user_id: payment.client_id,
    title: 'Payment Verification Unsuccessful',
    message: `Your payment reference ${payment.payment_reference} could not be verified: ${payment.admin_notes}`,
    type: 'payment',
    link: `/dashboard#invoices`,
    read: false,
    created_at: new Date().toISOString()
  });

  return res.json({ success: true, payment });
});

// -----------------------------------------------------------------------------
// Messages Endpoints
// -----------------------------------------------------------------------------

// List Messages (by project or user)
app.get('/api/messages', authenticate, (req, res) => {
  const { project_id } = req.query;
  let list = db.messages;

  if (project_id) {
    list = list.filter(m => m.project_id === project_id);
  } else if (req.user.role !== 'admin') {
    const userProjectIds = db.projects.filter(p => p.client_id === req.user.id).map(p => p.id);
    list = list.filter(m => m.sender_id === req.user.id || m.recipient_id === req.user.id || userProjectIds.includes(m.project_id));
  }

  return res.json({ success: true, messages: list });
});

// Send Message
app.post('/api/messages', authenticate, (req, res) => {
  const { project_id, message } = req.body;

  if (!project_id || !message || !message.trim()) {
    return res.status(400).json({ error: 'Project ID and message content are required.' });
  }

  const project = db.projects.find(p => p.id === project_id || p.project_code === project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const senderRole = req.user.role;
  const recipientId = senderRole === 'admin' ? project.client_id : 'admin-rs-001';

  const newMessage = {
    id: `msg-${Date.now()}`,
    project_id: project.id,
    sender_id: req.user.id,
    sender_name: req.user.full_name,
    sender_role: senderRole,
    recipient_id: recipientId,
    message: message.trim(),
    read: false,
    created_at: new Date().toISOString()
  };

  db.messages.push(newMessage);

  // Notify recipient
  if (recipientId) {
    db.notifications.push({
      id: `notif-${Date.now()}`,
      user_id: recipientId,
      title: `New Message on ${project.project_code}`,
      message: `${req.user.full_name}: "${message.trim().substring(0, 60)}..."`,
      type: 'message',
      link: senderRole === 'admin' ? `/dashboard#messages` : `/admin#messages`,
      read: false,
      created_at: new Date().toISOString()
    });
  }

  return res.status(201).json({ success: true, message: newMessage });
});

// -----------------------------------------------------------------------------
// Notifications Endpoints
// -----------------------------------------------------------------------------

// Get Notifications
app.get('/api/notifications', authenticate, (req, res) => {
  const list = db.notifications
    .filter(n => n.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const unreadCount = list.filter(n => !n.read).length;

  return res.json({ success: true, notifications: list, unreadCount });
});

// Mark Notification(s) Read
app.put('/api/notifications/read', authenticate, (req, res) => {
  const { id } = req.body;
  if (id) {
    const notif = db.notifications.find(n => n.id === id && n.user_id === req.user.id);
    if (notif) notif.read = true;
  } else {
    // Mark all read for this user
    db.notifications.forEach(n => {
      if (n.user_id === req.user.id) n.read = true;
    });
  }
  return res.json({ success: true });
});

// -----------------------------------------------------------------------------
// Pricing Rules & Payment Settings
// -----------------------------------------------------------------------------

// Get Public Pricing Rules (for Project Estimator)
app.get('/api/pricing', (req, res) => {
  return res.json({
    success: true,
    services: db.services,
    pricing_rules: db.pricing_rules
  });
});

// Update Pricing Rule (Admin Only)
app.put('/api/pricing/:id', authenticate, requireAdmin, (req, res) => {
  const rule = db.pricing_rules.find(r => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Pricing rule not found' });

  const { base_price, tier_description, estimated_days, features, addons } = req.body;
  if (base_price !== undefined) rule.base_price = Number(base_price);
  if (tier_description !== undefined) rule.tier_description = tier_description;
  if (estimated_days !== undefined) rule.estimated_days = Number(estimated_days);
  if (features && Array.isArray(features)) rule.features = features;
  if (addons && Array.isArray(addons)) rule.addons = addons;

  return res.json({ success: true, rule });
});

// Get Payment Settings (Approved Bank Instructions)
app.get('/api/settings/payment', (req, res) => {
  return res.json({
    success: true,
    settings: db.payment_settings
  });
});

// Update Payment Settings (Admin Only)
app.put('/api/settings/payment', authenticate, requireAdmin, (req, res) => {
  const { bank_name, account_name, account_number, routing_info, payment_notes } = req.body;
  if (bank_name) db.payment_settings.bank_name = bank_name;
  if (account_name) db.payment_settings.account_name = account_name;
  if (account_number) db.payment_settings.account_number = account_number;
  if (routing_info !== undefined) db.payment_settings.routing_info = routing_info;
  if (payment_notes !== undefined) db.payment_settings.payment_notes = payment_notes;
  db.payment_settings.updated_at = new Date().toISOString();

  return res.json({ success: true, settings: db.payment_settings });
});

// -----------------------------------------------------------------------------
// Admin Overview & Metrics (Computed Real-Time from Database)
// -----------------------------------------------------------------------------
app.get('/api/admin/metrics', authenticate, requireAdmin, (req, res) => {
  const totalCustomers = db.profiles.filter(p => p.role === 'customer').length;
  const totalProjects = db.projects.length;
  const activeProjects = db.projects.filter(p => ['REVIEWING', 'APPROVED', 'IN_PROGRESS', 'REVIEW'].includes(p.status)).length;
  const completedProjects = db.projects.filter(p => p.status === 'COMPLETED').length;
  const pendingEstimates = db.estimates.filter(e => e.status === 'SENT').length;
  const unpaidInvoices = db.invoices.filter(i => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status)).length;

  const totalVerifiedRevenue = db.payments
    .filter(p => p.status === 'VERIFIED')
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingPaymentsCount = db.payments.filter(p => p.status === 'PENDING').length;
  const unreadMessagesCount = db.messages.filter(m => !m.read && m.sender_role === 'customer').length;

  return res.json({
    success: true,
    metrics: {
      totalCustomers,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingEstimates,
      unpaidInvoices,
      totalVerifiedRevenue,
      pendingPaymentsCount,
      unreadMessagesCount
    }
  });
});

// Admin Customers List
app.get('/api/admin/customers', authenticate, requireAdmin, (req, res) => {
  const customers = db.profiles.filter(p => p.role === 'customer').map(c => {
    const userProjects = db.projects.filter(p => p.client_id === c.id || p.client_email === c.email);
    const userInvoices = db.invoices.filter(i => i.client_id === c.id);
    const totalSpent = db.payments
      .filter(p => p.client_id === c.id && p.status === 'VERIFIED')
      .reduce((acc, p) => acc + p.amount, 0);

    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      whatsapp_phone: c.whatsapp_phone,
      created_at: c.created_at,
      projectsCount: userProjects.length,
      invoicesCount: userInvoices.length,
      totalSpent
    };
  });

  return res.json({ success: true, customers });
});

// -----------------------------------------------------------------------------
// File Upload & Retrieval Endpoints
// -----------------------------------------------------------------------------
app.post('/api/files/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { project_id, file_category } = req.body;
  const fileRecord = {
    id: `file-${Date.now()}`,
    project_id: project_id || null,
    uploader_id: req.user.id,
    file_name: req.file.originalname,
    file_size: req.file.size,
    file_type: req.file.mimetype,
    file_path: `/uploads/${req.file.filename}`,
    file_category: file_category || 'document',
    created_at: new Date().toISOString()
  };

  db.project_files.push(fileRecord);

  if (project_id) {
    db.project_activity.push({
      id: `act-${Date.now()}`,
      project_id,
      activity_type: 'FILE_UPLOADED',
      title: 'File Uploaded',
      description: `${req.user.full_name} uploaded "${req.file.originalname}"`,
      created_at: new Date().toISOString()
    });
  }

  return res.status(201).json({
    success: true,
    file: fileRecord
  });
});

app.use('/uploads', express.static(uploadDir));

// -----------------------------------------------------------------------------
// RS AI Server-Side Chatbot Endpoint
// -----------------------------------------------------------------------------
const RS_KNOWLEDGE_BASE = {
  company: 'RS Digital Hub',
  founder: 'Royal Smalie 👑',
  tagline: 'Turning Ideas Into Digital Reality.',
  email: 'okegbadeismaheelsmalie@gmail.com',
  whatsapp: '+2349117035399',
  location: 'Nigeria (Serving clients globally)',
  services: [
    {
      name: 'Website Development',
      description: 'Modern, fast, SEO-optimized business websites, portfolio sites, and e-commerce stores.',
      startingPrice: '₦50,000'
    },
    {
      name: 'Graphic Design',
      description: 'Logos, branding packages, flyers, social media kits, and corporate identity.',
      startingPrice: '₦15,000'
    },
    {
      name: 'AI Solutions',
      description: 'Custom AI chatbots, automated customer lead capture, CRM integration, and AI assistants.',
      startingPrice: '₦80,000'
    },
    {
      name: 'Web Applications',
      description: 'Custom web apps, customer portals, interactive SaaS systems, and administrative dashboards.',
      startingPrice: '₦120,000'
    },
    {
      name: 'Computer Training',
      description: 'Practical one-on-one and group training in web development, graphic design, and digital tools.',
      startingPrice: '₦30,000'
    },
    {
      name: 'Technical Support',
      description: 'Website maintenance, security hardening, bug fixes, updates, and speed optimization.',
      startingPrice: '₦25,000'
    }
  ],
  workflow: [
    '1. Discuss & Plan: We listen to your vision and discuss requirements.',
    '2. Design & Estimate: We issue a transparent project estimate with line items.',
    '3. Develop: Fast, clean, mobile-responsive engineering.',
    '4. Deliver & Support: Thorough testing, live deployment, and ongoing assistance.'
  ],
  paymentPolicy: 'Approved payments are accepted via direct Bank Transfer to the official RS Digital Hub account. 50% commencement deposit is required, with the balance due upon final milestone review.'
};

app.post(['/api/ai-chat', '/.netlify/functions/ai-chat'], async (req, res) => {
  try {
    const result = await handleAiChatRequest(req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'AI processing temporarily unavailable.' });
  }
});

// -----------------------------------------------------------------------------
// Clean Routing & Page Fallbacks
// -----------------------------------------------------------------------------
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/thank-you', (req, res) => {
  res.sendFile(path.join(__dirname, 'thank-you.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RS Digital Hub',
    supabaseConnected: supabase !== null,
    time: new Date().toISOString()
  });
});

// Safe Public Configuration Endpoint (Supabase URL & Anon Key only)
app.get(['/api/config', '/.netlify/functions/config'], (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Fallback to index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[RS Digital Hub] Platform running at http://0.0.0.0:${PORT}`);
});
