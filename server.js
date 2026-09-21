import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { handleAiChatRequest } from './netlify/functions/ai-chat.js';
import {
  IS_PRODUCTION,
  IS_SUPABASE_CONFIGURED,
  supabaseAdmin,
  initializeDatastore,
  INITIAL_ADMIN_EMAIL,
  INITIAL_ADMIN_PHONE,
  INITIAL_ADMIN_PASS,
  hashPassword,
  memoryDb,
  getProfileById,
  getProfileByEmail,
  updateProfile,
  listCustomers,
  listProjects,
  getProjectById,
  createProject,
  updateProjectStatus,
  listEstimates,
  createEstimate,
  respondToEstimate,
  listInvoices,
  createInvoice,
  updateInvoiceStatus,
  listPayments,
  submitPayment,
  verifyPayment,
  rejectPayment,
  listMessages,
  sendMessage,
  listNotifications,
  markNotificationsRead,
  getPricingData,
  updatePricingRule,
  getPaymentSettings,
  updatePaymentSettings,
  getAdminMetrics,
  uploadFileRecord
} from './supabase-db.js';

dotenv.config();

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

const app = express();
const PORT = 3000;

// Ensure upload directory exists for local disk fallback
const uploadDir = path.join(currentDirPath, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer memory storage allows direct upload to Supabase Storage and/or disk fallback
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    // Validate MIME types
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|txt|doc|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload an image, PDF, document, or ZIP archive.'));
    }
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------------------------
// Session Manager
// -----------------------------------------------------------------------------
const activeSessions = new Map();

// Authentication middleware
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.substring(7);

  // 1. Check in-memory session cache
  const session = activeSessions.get(token);
  if (session && session.expiresAt > Date.now()) {
    req.user = session.user;
    return next();
  }

  // 2. If Supabase configured, verify token via Supabase Auth
  if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
      if (!authErr && authData?.user) {
        const supaUser = authData.user;
        const profile = await getProfileById(supaUser.id);

        const isAdmin = (profile && profile.role === 'admin') ||
          (supaUser.email && supaUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase());

        const userObj = {
          id: supaUser.id,
          email: supaUser.email,
          full_name: profile?.full_name || supaUser.user_metadata?.full_name || 'Customer',
          whatsapp_phone: profile?.whatsapp_phone || supaUser.user_metadata?.whatsapp_phone || '',
          role: isAdmin ? 'admin' : 'customer'
        };

        activeSessions.set(token, { user: userObj, expiresAt: Date.now() + 86400000 }); // 24hr cache
        req.user = userObj;
        return next();
      }
    } catch (err) {
      console.warn('[RS Hub] Supabase token auth check notice:', err.message);
    }
  }

  return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
}

// Optional authentication middleware (for public endpoints that can be enhanced with user context)
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = activeSessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      req.user = session.user;
      return next();
    }

    if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
      try {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          const supaUser = authData.user;
          const profile = await getProfileById(supaUser.id);
          const isAdmin = (profile && profile.role === 'admin') ||
            (supaUser.email && supaUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase());

          req.user = {
            id: supaUser.id,
            email: supaUser.email,
            full_name: profile?.full_name || supaUser.user_metadata?.full_name || 'Customer',
            whatsapp_phone: profile?.whatsapp_phone || '',
            role: isAdmin ? 'admin' : 'customer'
          };
          return next();
        }
      } catch (e) {
        // ignore
      }
    }
  }

  req.user = null;
  next();
}

// Admin RBAC middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------

// Sign Up (Always strictly creates 'customer' role; cannot self-elevate to admin)
app.post(['/api/auth/signup', '/api/auth/register'], async (req, res) => {
  try {
    const { full_name, email, password, whatsapp_phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();
    const cleanPhone = whatsapp_phone ? whatsapp_phone.trim() : '';

    // Check if account already exists
    const existing = await getProfileByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Role assignment: Only designated admin email gets 'admin', everyone else is strictly 'customer'
    const role = cleanEmail === INITIAL_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer';

    if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
      // Create user in Supabase Auth
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          whatsapp_phone: cleanPhone
        }
      });

      if (authErr) {
        return res.status(400).json({ error: authErr.message });
      }

      const userId = authData.user.id;

      // Upsert profile in Supabase profiles table
      const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        whatsapp_phone: cleanPhone,
        phone: cleanPhone,
        role,
        updated_at: new Date().toISOString()
      });

      if (profErr) {
        console.warn('Profiles upsert warning:', profErr.message);
      }

      // Sign in user to obtain valid JWT token
      let token = null;
      try {
        const { data: signData } = await supabaseAdmin.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        token = signData?.session?.access_token;
      } catch (se) {
        // fallback to signed session token
      }

      if (!token) {
        token = crypto.randomBytes(32).toString('hex');
      }

      const sessionUser = {
        id: userId,
        full_name: cleanName,
        email: cleanEmail,
        whatsapp_phone: cleanPhone,
        role
      };

      activeSessions.set(token, { user: sessionUser, expiresAt: Date.now() + 86400000 });

      return res.status(201).json({
        success: true,
        token,
        user: sessionUser
      });
    }

    // In-Memory Fallback (Preview Mode)
    const newUser = {
      id: `cust-${Date.now()}`,
      full_name: cleanName,
      email: cleanEmail,
      whatsapp_phone: cleanPhone,
      role,
      password_hash: hashPassword(password),
      avatar_url: '',
      created_at: new Date().toISOString()
    };

    memoryDb.profiles.push(newUser);

    const token = crypto.randomBytes(32).toString('hex');
    const sessionUser = {
      id: newUser.id,
      full_name: newUser.full_name,
      email: newUser.email,
      whatsapp_phone: newUser.whatsapp_phone,
      role: newUser.role
    };

    activeSessions.set(token, { user: sessionUser, expiresAt: Date.now() + 86400000 });

    return res.status(201).json({
      success: true,
      token,
      user: sessionUser
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. If Supabase configured, attempt Supabase Auth first
    if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
      try {
        const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!signInErr && signInData?.user && signInData?.session) {
          const profile = await getProfileById(signInData.user.id);
          const isAdmin = (profile && profile.role === 'admin') ||
            cleanEmail === INITIAL_ADMIN_EMAIL.toLowerCase();

          const sessionUser = {
            id: signInData.user.id,
            full_name: profile?.full_name || signInData.user.user_metadata?.full_name || 'Customer',
            email: cleanEmail,
            whatsapp_phone: profile?.whatsapp_phone || signInData.user.user_metadata?.whatsapp_phone || '',
            role: isAdmin ? 'admin' : 'customer'
          };

          const token = signInData.session.access_token;
          activeSessions.set(token, { user: sessionUser, expiresAt: Date.now() + 86400000 });

          return res.json({
            success: true,
            token,
            user: sessionUser
          });
        }
      } catch (supaAuthErr) {
        console.warn('Supabase signInWithPassword error:', supaAuthErr.message);
      }
    }

    // 2. Fallback check in memoryDb (or preview admin / demo customer)
    const user = memoryDb.profiles.find(p => p.email.toLowerCase() === cleanEmail);
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

    activeSessions.set(token, { user: sessionUser, expiresAt: Date.now() + 86400000 });

    return res.json({
      success: true,
      token,
      user: sessionUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login processing failed.' });
  }
});

// Get Current Session
app.get('/api/auth/session', authenticate, (req, res) => {
  return res.json({
    authenticated: true,
    user: req.user
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
app.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { full_name, whatsapp_phone } = req.body;
    const updated = await updateProfile(req.user.id, { full_name, whatsapp_phone });

    req.user.full_name = updated.full_name;
    req.user.whatsapp_phone = updated.whatsapp_phone;

    return res.json({ success: true, user: req.user });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update profile.' });
  }
});

// Change Password
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    if (IS_SUPABASE_CONFIGURED && supabaseAdmin) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        password: new_password
      });
      if (error) throw new Error(error.message);
      return res.json({ success: true, message: 'Password updated successfully.' });
    }

    const user = memoryDb.profiles.find(p => p.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.password_hash !== hashPassword(current_password)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    user.password_hash = hashPassword(new_password);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to change password.' });
  }
});

// -----------------------------------------------------------------------------
// Projects Endpoints
// -----------------------------------------------------------------------------

// List Projects (IDOR Protected: Customers see only their own projects; Admin sees all)
app.get('/api/projects', authenticate, async (req, res) => {
  try {
    const projects = await listProjects(req.user.id, req.user.role, req.user.email);
    return res.json({ success: true, projects });
  } catch (err) {
    console.error('List projects error:', err);
    return res.status(500).json({ error: 'Failed to retrieve projects.' });
  }
});

// Get Project Details (IDOR Protected: Enforces project membership or admin authority)
app.get('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const projectDetails = await getProjectById(req.params.id, req.user.id, req.user.role, req.user.email);
    if (!projectDetails) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    return res.json({ success: true, ...projectDetails });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to retrieve project details.' });
  }
});

// Create Project Handler (Used by Web UI, Estimator, and Netlify function compatibility)
const handleCreateProject = async (req, res) => {
  try {
    const { name, email, phone, service, budget, deadline, description } = req.body;

    if (!name || !email || !phone || !service || !description) {
      return res.status(400).json({ error: 'Please complete all required project information.' });
    }

    // Security: If client is authenticated, bind their verified account ID
    const clientId = req.user ? req.user.id : null;
    const clientName = req.user ? req.user.full_name : name;
    const clientEmail = req.user ? req.user.email : email;

    const project = await createProject({
      name: clientName,
      email: clientEmail,
      phone,
      service,
      budget,
      deadline,
      description,
      clientId
    });

    return res.status(201).json({
      success: true,
      project
    });
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create project.' });
  }
};

app.post('/api/projects', optionalAuthenticate, handleCreateProject);
app.post('/api/create-project', optionalAuthenticate, handleCreateProject);
app.post('/.netlify/functions/create-project', optionalAuthenticate, handleCreateProject);

// Update Project Status & Progress (Admin Only)
app.put('/api/projects/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, progress, notes } = req.body;
    const updated = await updateProjectStatus(req.params.id, {
      status,
      progress,
      notes,
      actorId: req.user.id
    });
    return res.json({ success: true, project: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update project status.' });
  }
});

// -----------------------------------------------------------------------------
// Estimates Endpoints
// -----------------------------------------------------------------------------

// List Estimates (IDOR Protected: Client sees only their estimates; Admin sees all)
app.get('/api/estimates', authenticate, async (req, res) => {
  try {
    const estimates = await listEstimates(req.user.id, req.user.role);
    return res.json({ success: true, estimates });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve estimates.' });
  }
});

// Create Estimate (Admin Only)
app.post('/api/estimates', authenticate, requireAdmin, async (req, res) => {
  try {
    const { project_id, client_id, items, discount, notes, valid_until } = req.body;

    if (!project_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please specify project and at least one item.' });
    }

    const estimate = await createEstimate({
      project_id,
      client_id,
      items,
      discount,
      notes,
      valid_until
    });

    return res.status(201).json({ success: true, estimate });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to create estimate.' });
  }
});

// Accept Estimate (Customer or Admin)
app.put('/api/estimates/:id/accept', authenticate, async (req, res) => {
  try {
    const estimate = await respondToEstimate(req.params.id, 'accept', req.user.id, req.user.role);
    return res.json({ success: true, estimate });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || 'Failed to accept estimate.' });
  }
});

// Decline Estimate (Customer or Admin)
app.put('/api/estimates/:id/decline', authenticate, async (req, res) => {
  try {
    const estimate = await respondToEstimate(req.params.id, 'decline', req.user.id, req.user.role);
    return res.json({ success: true, estimate });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || 'Failed to decline estimate.' });
  }
});

// -----------------------------------------------------------------------------
// Invoices Endpoints
// -----------------------------------------------------------------------------

// List Invoices (IDOR Protected: Client sees only their invoices; Admin sees all)
app.get('/api/invoices', authenticate, async (req, res) => {
  try {
    const invoices = await listInvoices(req.user.id, req.user.role);
    return res.json({ success: true, invoices });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve invoices.' });
  }
});

// Create Invoice (Admin Only)
app.post('/api/invoices', authenticate, requireAdmin, async (req, res) => {
  try {
    const { project_id, client_id, estimate_id, amount, due_date, notes, items } = req.body;

    if (!project_id || !amount || !due_date) {
      return res.status(400).json({ error: 'Please specify project, amount, and due date.' });
    }

    const invoice = await createInvoice({
      project_id,
      client_id,
      estimate_id,
      amount,
      due_date,
      notes,
      items
    });

    return res.status(201).json({ success: true, invoice });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to create invoice.' });
  }
});

// Update Invoice Status (Admin Only)
app.put('/api/invoices/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, paid_amount } = req.body;
    const invoice = await updateInvoiceStatus(req.params.id, { status, paid_amount });
    return res.json({ success: true, invoice });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update invoice.' });
  }
});

// -----------------------------------------------------------------------------
// Payments Endpoints
// -----------------------------------------------------------------------------

// List Payments (IDOR Protected: Client sees only their payments; Admin sees all)
app.get('/api/payments', authenticate, async (req, res) => {
  try {
    const payments = await listPayments(req.user.id, req.user.role);
    return res.json({ success: true, payments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve payments.' });
  }
});

// Submit Payment Reference & Proof (Customer: IDOR Protected, status is forced to PENDING)
app.post('/api/payments', authenticate, async (req, res) => {
  try {
    const { invoice_id, amount, payment_method, reference, proof_file_url } = req.body;

    if (!invoice_id || !amount || !reference) {
      return res.status(400).json({ error: 'Invoice, payment amount, and transaction reference are required.' });
    }

    const payment = await submitPayment({
      invoice_id,
      amount,
      payment_method,
      reference,
      proof_file_url,
      userId: req.user.id,
      userRole: req.user.role,
      userName: req.user.full_name
    });

    return res.status(201).json({ success: true, payment });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || 'Failed to submit payment.' });
  }
});

// Verify Payment (Admin Only)
app.put('/api/payments/:id/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { notes } = req.body;
    const payment = await verifyPayment(req.params.id, req.user.id, notes);
    return res.json({ success: true, payment });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to verify payment.' });
  }
});

// Reject Payment (Admin Only)
app.put('/api/payments/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await rejectPayment(req.params.id, req.user.id, reason);
    return res.json({ success: true, payment });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to reject payment.' });
  }
});

// -----------------------------------------------------------------------------
// Messages Endpoints
// -----------------------------------------------------------------------------

// List Messages (IDOR Protected: Enforces project ownership or sender/recipient identity)
app.get('/api/messages', authenticate, async (req, res) => {
  try {
    const { project_id } = req.query;
    const messages = await listMessages(project_id, req.user.id, req.user.role);
    return res.json({ success: true, messages });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to retrieve messages.' });
  }
});

// Send Message (IDOR Protected: Enforces project ownership or admin authority)
app.post('/api/messages', authenticate, async (req, res) => {
  try {
    const { project_id, message } = req.body;

    if (!project_id || !message || !message.trim()) {
      return res.status(400).json({ error: 'Project ID and message content are required.' });
    }

    const newMessage = await sendMessage({
      projectId: project_id,
      message,
      userId: req.user.id,
      userRole: req.user.role,
      userName: req.user.full_name
    });

    return res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || 'Failed to send message.' });
  }
});

// -----------------------------------------------------------------------------
// Notifications Endpoints
// -----------------------------------------------------------------------------

// Get Current User Notifications
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const { notifications, unreadCount } = await listNotifications(req.user.id);
    return res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// Mark Notification(s) Read
app.put('/api/notifications/read', authenticate, async (req, res) => {
  try {
    const { id } = req.body;
    await markNotificationsRead(req.user.id, id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification state.' });
  }
});

// -----------------------------------------------------------------------------
// Pricing Rules & Payment Settings
// -----------------------------------------------------------------------------

// Public Pricing Data (for Estimator and Service Catalog)
app.get('/api/pricing', async (req, res) => {
  try {
    const data = await getPricingData();
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load pricing data.' });
  }
});

// Update Pricing Rule (Admin Only)
app.put('/api/pricing/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const updated = await updatePricingRule(req.params.id, req.body);
    return res.json({ success: true, rule: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update pricing rule.' });
  }
});

// Get Payment Settings (Approved Bank Instructions)
app.get('/api/settings/payment', async (req, res) => {
  try {
    const settings = await getPaymentSettings();
    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load payment settings.' });
  }
});

// Update Payment Settings (Admin Only)
app.put('/api/settings/payment', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await updatePaymentSettings(req.body);
    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update payment settings.' });
  }
});

// -----------------------------------------------------------------------------
// Admin Overview & Metrics (Computed in Real-Time from Supabase or Memory)
// -----------------------------------------------------------------------------
app.get('/api/admin/metrics', authenticate, requireAdmin, async (req, res) => {
  try {
    const metrics = await getAdminMetrics();
    return res.json({ success: true, metrics });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute metrics.' });
  }
});

// Admin Customers Directory
app.get('/api/admin/customers', authenticate, requireAdmin, async (req, res) => {
  try {
    const rawCustomers = await listCustomers();
    const [projects, invoices, payments] = await Promise.all([
      listProjects(null, 'admin', null),
      listInvoices(null, 'admin'),
      listPayments(null, 'admin')
    ]);

    const customers = rawCustomers.map(c => {
      const userProjects = projects.filter(p => p.client_id === c.id || p.customer_id === c.id || p.client_email === c.email);
      const userInvoices = invoices.filter(i => i.client_id === c.id || i.customer_id === c.id);
      const totalSpent = payments
        .filter(p => (p.client_id === c.id || p.customer_id === c.id) && (p.status === 'VERIFIED' || p.status === 'verified'))
        .reduce((acc, p) => acc + Number(p.amount || 0), 0);

      return {
        id: c.id,
        full_name: c.full_name,
        email: c.email,
        whatsapp_phone: c.whatsapp_phone || c.phone,
        created_at: c.created_at,
        projectsCount: userProjects.length,
        invoicesCount: userInvoices.length,
        totalSpent
      };
    });

    return res.json({ success: true, customers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load customer directory.' });
  }
});

// -----------------------------------------------------------------------------
// File Upload & Retrieval Endpoints
// -----------------------------------------------------------------------------
app.post('/api/files/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file rejected.' });
    }

    const { project_id, file_category } = req.body;

    const fileRecord = await uploadFileRecord({
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      projectId: project_id || null,
      uploaderId: req.user.id,
      category: file_category || 'document',
      uploadDir
    });

    return res.status(201).json({
      success: true,
      file: fileRecord
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

// Local file serving with path sanitization
app.get('/uploads/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found.' });
  }

  res.sendFile(filePath);
});

// -----------------------------------------------------------------------------
// RS AI Server-Side Chatbot Endpoint
// -----------------------------------------------------------------------------
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
// Health Check & Public Configuration
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RS Digital Hub Platform',
    mode: IS_SUPABASE_CONFIGURED ? 'production' : 'preview',
    database: IS_SUPABASE_CONFIGURED ? 'supabase' : 'in-memory',
    storage: IS_SUPABASE_CONFIGURED ? 'supabase-storage' : 'local-disk',
    supabaseConnected: IS_SUPABASE_CONFIGURED && supabaseAdmin !== null,
    time: new Date().toISOString()
  });
});

// Safe Public Configuration Endpoint (Supabase URL & Anon Key only)
app.get(['/api/config', '/.netlify/functions/config'], (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    mode: IS_SUPABASE_CONFIGURED ? 'production' : 'preview'
  });
});

// -----------------------------------------------------------------------------
// Clean Routing & Page Fallbacks
// -----------------------------------------------------------------------------
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(currentDirPath, 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(currentDirPath, 'admin', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(currentDirPath, 'auth.html'));
});

app.get('/auth', (req, res) => {
  res.sendFile(path.join(currentDirPath, 'auth.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(currentDirPath, 'auth.html'));
});

app.get('/thank-you', (req, res) => {
  res.sendFile(path.join(currentDirPath, 'thank-you.html'));
});

// Serve static assets from project root
app.use(express.static(currentDirPath));

// Fallback to index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(currentDirPath, 'index.html'));
});

// Export app and initializeDatastore for Netlify Serverless adapter
export { app, initializeDatastore };

// Standalone execution guard (Only run app.listen when not in a serverless environment)
const isServerless = Boolean(
  process.env.NETLIFY === 'true' ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NETLIFY_DEV
);

if (!isServerless && process.argv[1] && process.argv[1].endsWith('server.js')) {
  initializeDatastore().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[RS Digital Hub] Platform active at http://0.0.0.0:${PORT} [${IS_SUPABASE_CONFIGURED ? 'SUPABASE PERSISTENCE' : 'PREVIEW IN-MEMORY MODE'}]`);
    });
  }).catch(err => {
    console.error('[RS Hub] Fatal startup error:', err);
    if (IS_PRODUCTION) process.exit(1);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[RS Digital Hub] Running with fallback store at http://0.0.0.0:${PORT}`);
    });
  });
}
