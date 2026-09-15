/**
 * RS Digital Hub — Customer Portal Controller (js/dashboard.js)
 * Production-ready dashboard logic with full project tracking, payments, and messaging.
 */

(function () {
  'use strict';

  let currentUser = null;
  let allProjects = [];
  let allEstimates = [];
  let allInvoices = [];
  let allPayments = [];
  let allNotifications = [];
  let paymentSettings = null;
  let activeProjectIdForChat = null;

  async function initDashboard() {
    // Verify session
    currentUser = await window.RSAuth.verifySession();
    if (!currentUser) {
      window.location.href = '/login?redirect=/dashboard';
      return;
    }

    // Populate user profile info in sidebar
    const nameEls = document.querySelectorAll('.dashboard-user-name');
    nameEls.forEach(el => el.textContent = currentUser.full_name);
    const roleEls = document.querySelectorAll('.dashboard-user-role');
    roleEls.forEach(el => el.textContent = currentUser.role === 'admin' ? 'Administrator 👑' : 'Customer Account');
    const initials = (currentUser.full_name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarEls = document.querySelectorAll('.dashboard-user-avatar');
    avatarEls.forEach(el => el.textContent = initials);

    // Profile form prefill
    const profName = document.getElementById('profileFullName');
    const profEmail = document.getElementById('profileEmail');
    const profPhone = document.getElementById('profilePhone');
    if (profName) profName.value = currentUser.full_name || '';
    if (profEmail) profEmail.value = currentUser.email || '';
    if (profPhone) profPhone.value = currentUser.whatsapp_phone || '';

    // Setup navigation router
    setupNavigation();

    // Fetch initial datasets in parallel
    await Promise.all([
      fetchPaymentSettings(),
      loadProjects(),
      loadEstimates(),
      loadInvoices(),
      loadPayments(),
      loadNotifications()
    ]);

    // Render Overview
    renderOverview();

    // Handle hash route if present
    const hash = window.location.hash.replace('#', '') || 'overview';
    switchSection(hash);

    // Setup Modals and Event Listeners
    setupModals();
    setupForms();

    // Periodic notifications poll
    setInterval(loadNotifications, 25000);
  }

  function getAuthHeader() {
    const token = window.RSAuth.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // ---------------------------------------------------------------------------
  // Data Loaders
  // ---------------------------------------------------------------------------
  async function fetchPaymentSettings() {
    try {
      const res = await fetch('/api/settings/payment');
      const data = await res.json();
      if (data.success) {
        paymentSettings = data.settings;
        renderPaymentSettings();
      }
    } catch (e) {
      console.warn('Failed to load payment settings:', e);
    }
  }

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects', { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        allProjects = data.projects || [];
        renderProjectsList();
      }
    } catch (e) {
      console.error('Error loading projects:', e);
    }
  }

  async function loadEstimates() {
    try {
      const res = await fetch('/api/estimates', { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        allEstimates = data.estimates || [];
        renderEstimatesList();
      }
    } catch (e) {
      console.error('Error loading estimates:', e);
    }
  }

  async function loadInvoices() {
    try {
      const res = await fetch('/api/invoices', { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        allInvoices = data.invoices || [];
        renderInvoicesList();
      }
    } catch (e) {
      console.error('Error loading invoices:', e);
    }
  }

  async function loadPayments() {
    try {
      const res = await fetch('/api/payments', { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        allPayments = data.payments || [];
        renderPaymentsList();
      }
    } catch (e) {
      console.error('Error loading payments:', e);
    }
  }

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications', { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        allNotifications = data.notifications || [];
        renderNotifications(data.unreadCount);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation & Section Switching
  // ---------------------------------------------------------------------------
  function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-item[data-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('data-target');
        switchSection(target);
        closeMobileSidebar();
      });
    });

    const mobileToggle = document.getElementById('mobileNavToggle');
    const sidebarClose = document.getElementById('sidebarCloseBtn');
    const sidebar = document.getElementById('portalSidebar');

    if (mobileToggle && sidebar) {
      mobileToggle.onclick = () => sidebar.classList.add('open');
    }
    if (sidebarClose && sidebar) {
      sidebarClose.onclick = () => sidebar.classList.remove('open');
    }

    const logoutBtn = document.getElementById('sidebarLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => window.RSAuth.logout();
    }
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('portalSidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  function switchSection(sectionId) {
    window.location.hash = sectionId;

    // Update active state in sidebar
    document.querySelectorAll('.nav-item[data-target]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-target') === sectionId);
    });

    // Update visible section container
    document.querySelectorAll('.dashboard-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`sec-${sectionId}`);
    if (activeSec) {
      activeSec.classList.add('active');
    } else {
      const overviewSec = document.getElementById('sec-overview');
      if (overviewSec) overviewSec.classList.add('active');
    }

    // Update header title
    const headerTitle = document.getElementById('currentSectionTitle');
    if (headerTitle) {
      const titles = {
        overview: 'Dashboard Overview',
        projects: 'My Projects',
        estimates: 'Estimates & Quotations',
        invoices: 'Billing & Invoices',
        payments: 'Payment History',
        messages: 'Project Discussions',
        notifications: 'Notification Center',
        profile: 'Account Settings'
      };
      headerTitle.textContent = titles[sectionId] || 'Customer Portal';
    }

    if (sectionId === 'messages') {
      loadMessagesForChat();
    }
  }

  // ---------------------------------------------------------------------------
  // Renderers
  // ---------------------------------------------------------------------------
  function renderOverview() {
    // Compute metrics
    const activeProjects = allProjects.filter(p => ['REVIEWING', 'APPROVED', 'IN_PROGRESS', 'REVIEW'].includes(p.status)).length;
    const pendingEsts = allEstimates.filter(e => e.status === 'SENT').length;
    const unpaidInvs = allInvoices.filter(i => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status)).length;

    const metricActive = document.getElementById('metricActiveProjects');
    const metricEst = document.getElementById('metricPendingEstimates');
    const metricInv = document.getElementById('metricUnpaidInvoices');

    if (metricActive) metricActive.textContent = activeProjects;
    if (metricEst) metricEst.textContent = pendingEsts;
    if (metricInv) metricInv.textContent = unpaidInvs;

    // Render Recent Projects in overview table
    const recentTbody = document.getElementById('overviewProjectsTbody');
    if (recentTbody) {
      if (allProjects.length === 0) {
        recentTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:24px;">No projects started yet. Click "Start New Project" above!</td></tr>`;
      } else {
        recentTbody.innerHTML = allProjects.slice(0, 4).map(p => `
          <tr>
            <td><strong>${p.project_code}</strong></td>
            <td>${escapeHtml(p.title || p.service_type)}</td>
            <td>
              <div class="progress-bar-wrap" title="${p.progress}%">
                <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
              </div>
              <small style="color:var(--text-muted); font-size:11px;">${p.progress}% completed</small>
            </td>
            <td><span class="status-pill ${p.status || ''}">${(p.status || '').replace('_', ' ')}</span></td>
            <td>
              <button type="button" class="header-btn" style="padding:6px 12px; font-size:12px;" onclick="window.RSViewProject('${p.id}')">
                View
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    // Render Invoices Due in overview
    const invoiceTbody = document.getElementById('overviewInvoicesTbody');
    if (invoiceTbody) {
      const dueInvs = allInvoices.filter(i => ['ISSUED', 'PARTIALLY_PAID'].includes(i.status));
      if (dueInvs.length === 0) {
        invoiceTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:24px;">No outstanding invoices. All caught up!</td></tr>`;
      } else {
        invoiceTbody.innerHTML = dueInvs.map(inv => `
          <tr>
            <td><strong>${inv.invoice_number}</strong></td>
            <td>₦${inv.amount.toLocaleString()}</td>
            <td>₦${(inv.paid_amount || 0).toLocaleString()}</td>
            <td><span class="status-pill ${inv.status || ''}">${(inv.status || '').replace('_', ' ')}</span></td>
            <td>
              <button type="button" class="header-btn primary" style="padding:6px 12px; font-size:12px;" onclick="window.RSPayInvoice('${inv.id}')">
                Pay Now
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  function renderProjectsList() {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    if (allProjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">You do not have any active project requests yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allProjects.map(p => `
      <tr>
        <td><strong>${p.project_code}</strong></td>
        <td>${escapeHtml(p.title || p.service_type)}</td>
        <td>${p.budget ? '₦' + Number(p.budget).toLocaleString() : 'Pending'}</td>
        <td>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
          </div>
          <small style="color:var(--text-muted); font-size:11px;">${p.progress}%</small>
        </td>
        <td><span class="status-pill ${p.status || ''}">${(p.status || '').replace('_', ' ')}</span></td>
        <td>
          <button type="button" class="header-btn" style="padding:6px 12px; font-size:12px;" onclick="window.RSViewProject('${p.id}')">
            Details & Files
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderEstimatesList() {
    const container = document.getElementById('estimatesContainer');
    if (!container) return;

    if (allEstimates.length === 0) {
      container.innerHTML = `<div class="data-card" style="padding:32px; text-align:center; color:var(--text-muted);">No estimates currently issued for your account.</div>`;
      return;
    }

    container.innerHTML = allEstimates.map(est => `
      <div class="data-card" style="padding: 24px; margin-bottom: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:17px;">Estimate ${est.estimate_number}</h3>
            <p style="margin:0; font-size:13px; color:var(--text-muted);">For Project: <strong>${est.project_code || 'RS Digital Project'}</strong></p>
          </div>
          <span class="status-pill ${est.status}">${est.status}</span>
        </div>

        <div class="table-responsive" style="margin-bottom:16px;">
          <table class="portal-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="width:80px; text-align:center;">Qty</th>
                <th style="width:140px; text-align:right;">Unit Price</th>
                <th style="width:140px; text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(est.items || []).map(i => `
                <tr>
                  <td>${escapeHtml(i.description)}</td>
                  <td style="text-align:center;">${i.quantity}</td>
                  <td style="text-align:right;">₦${Number(i.unit_price).toLocaleString()}</td>
                  <td style="text-align:right;"><strong>₦${Number(i.amount).toLocaleString()}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid rgba(255,255,255,0.08); padding-top:16px;">
          <div style="font-size:12.5px; color:var(--text-muted); max-width:400px;">
            ${est.notes ? `<p style="margin:0 0 4px;"><strong>Notes:</strong> ${escapeHtml(est.notes)}</p>` : ''}
            <p style="margin:0;">Valid Until: <strong>${est.valid_until || 'N/A'}</strong></p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px; color:var(--text-muted);">Total Cost</div>
            <div style="font-size:24px; font-weight:800; color:#38bdf8; font-family:var(--font-mono, monospace);">
              ₦${Number(est.total).toLocaleString()}
            </div>
            ${est.status === 'SENT' ? `
              <div style="display:flex; gap:10px; margin-top:12px;">
                <button type="button" class="header-btn" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#fca5a5;" onclick="window.RSDeclineEstimate('${est.id}')">
                  Decline
                </button>
                <button type="button" class="header-btn primary" onclick="window.RSAcceptEstimate('${est.id}')">
                  Accept Estimate ✓
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderInvoicesList() {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;

    if (allInvoices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">No invoices generated yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allInvoices.map(inv => `
      <tr>
        <td><strong>${inv.invoice_number}</strong></td>
        <td>${escapeHtml(inv.project_title || inv.project_code || 'Project')}</td>
        <td>₦${Number(inv.amount).toLocaleString()}</td>
        <td>₦${Number(inv.paid_amount || 0).toLocaleString()}</td>
        <td><span class="status-pill ${inv.status || ''}">${(inv.status || '').replace('_', ' ')}</span></td>
        <td>
          ${inv.status !== 'PAID' ? `
            <button type="button" class="header-btn primary" style="padding:6px 14px; font-size:12px;" onclick="window.RSPayInvoice('${inv.id}')">
              Pay Bank Transfer
            </button>
          ` : `<span style="color:#34d399; font-weight:600; font-size:12px;">Paid in Full ✓</span>`}
        </td>
      </tr>
    `).join('');
  }

  function renderPaymentsList() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (allPayments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">No payments recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allPayments.map(p => `
      <tr>
        <td><strong>${p.payment_reference}</strong></td>
        <td>₦${Number(p.amount).toLocaleString()}</td>
        <td>${escapeHtml(p.payment_method || 'Bank Transfer')}</td>
        <td>${new Date(p.created_at).toLocaleDateString()}</td>
        <td><span class="status-pill ${p.status}">${p.status}</span></td>
        <td style="font-size:12px; color:var(--text-muted);">
          ${escapeHtml(p.admin_notes || (p.status === 'PENDING' ? 'Awaiting bank clearance' : 'Verified'))}
        </td>
      </tr>
    `).join('');
  }

  function renderNotifications(unreadCount) {
    const badge = document.getElementById('notifBadgeCount');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    const list = document.getElementById('notificationsList');
    if (list) {
      if (allNotifications.length === 0) {
        list.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:32px;">No notifications at this time.</div>`;
      } else {
        list.innerHTML = allNotifications.map(n => `
          <div class="data-card" style="padding:16px 20px; margin-bottom:12px; border-left: 3px solid ${n.read ? 'transparent' : '#3b82f6'};">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong style="font-size:14px;">${escapeHtml(n.title)}</strong>
              <small style="color:var(--text-muted); font-size:11.5px;">${new Date(n.created_at).toLocaleString()}</small>
            </div>
            <p style="margin:0; font-size:13px; color:var(--text-muted);">${escapeHtml(n.message)}</p>
          </div>
        `).join('');
      }
    }
  }

  function renderPaymentSettings() {
    if (!paymentSettings) return;
    const bankEl = document.getElementById('modalBankName');
    const accNameEl = document.getElementById('modalAccountName');
    const accNumEl = document.getElementById('modalAccountNumber');
    const notesEl = document.getElementById('modalPaymentNotes');

    if (bankEl) bankEl.textContent = paymentSettings.bank_name;
    if (accNameEl) accNameEl.textContent = paymentSettings.account_name;
    if (accNumEl) accNumEl.textContent = paymentSettings.account_number;
    if (notesEl) notesEl.textContent = paymentSettings.payment_notes;
  }

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  window.RSAcceptEstimate = async function (estimateId) {
    if (!confirm('Are you sure you want to accept this estimate? This will approve the project scope and trigger initial invoice generation.')) return;

    try {
      const res = await fetch(`/api/estimates/${estimateId}/accept`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        alert('Estimate accepted successfully! Royal Smalie has been notified.');
        await Promise.all([loadEstimates(), loadProjects(), loadInvoices()]);
        renderOverview();
      } else {
        alert(data.error || 'Failed to accept estimate.');
      }
    } catch (e) {
      alert('Error communicating with server.');
    }
  };

  window.RSDeclineEstimate = async function (estimateId) {
    const reason = prompt('Please specify the reason or changes you would like to request:');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/estimates/${estimateId}/decline`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        alert('Estimate declined. Royal Smalie will review your feedback.');
        await loadEstimates();
      }
    } catch (e) {
      alert('Error declining estimate.');
    }
  };

  window.RSPayInvoice = function (invoiceId) {
    const inv = allInvoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const modal = document.getElementById('payInvoiceModal');
    const invInput = document.getElementById('payInvoiceIdInput');
    const invLabel = document.getElementById('payInvoiceLabel');
    const amountInput = document.getElementById('payAmountInput');

    if (invInput) invInput.value = inv.id;
    if (invLabel) invLabel.textContent = `${inv.invoice_number} (Outstanding: ₦${(inv.amount - (inv.paid_amount || 0)).toLocaleString()})`;
    if (amountInput) amountInput.value = inv.amount - (inv.paid_amount || 0);

    if (modal) modal.classList.add('active');
  };

  window.RSViewProject = async function (projectId) {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (!data.success) return alert(data.error || 'Failed to load project details.');

      const p = data.project;
      const modal = document.getElementById('projectDetailsModal');

      document.getElementById('pdProjectCode').textContent = p.project_code;
      document.getElementById('pdProjectTitle').textContent = p.title || p.service_type;
      document.getElementById('pdService').textContent = p.service_type;
      document.getElementById('pdStatus').textContent = p.status;
      document.getElementById('pdStatus').className = `status-pill ${p.status}`;
      document.getElementById('pdBudget').textContent = p.budget ? `₦${Number(p.budget).toLocaleString()}` : 'Custom';
      document.getElementById('pdDeadline').textContent = p.deadline || 'Flexible';
      document.getElementById('pdDescription').textContent = p.description;

      // Render timeline
      const timelineBox = document.getElementById('pdTimeline');
      if (timelineBox) {
        timelineBox.innerHTML = (data.activity || []).map(act => `
          <div style="border-left:2px solid #3b82f6; padding-left:14px; margin-bottom:14px; position:relative;">
            <div style="font-size:13px; font-weight:600;">${escapeHtml(act.title)}</div>
            <div style="font-size:12px; color:var(--text-muted);">${escapeHtml(act.description || '')}</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">${new Date(act.created_at).toLocaleString()}</div>
          </div>
        `).join('') || '<p style="color:var(--text-muted); font-size:13px;">No timeline entries recorded yet.</p>';
      }

      // Render files
      const filesBox = document.getElementById('pdFiles');
      if (filesBox) {
        filesBox.innerHTML = (data.files || []).map(f => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; margin-bottom:8px; font-size:13px;">
            <span>📎 ${escapeHtml(f.file_name)}</span>
            <a href="${f.file_path}" target="_blank" class="header-btn" style="padding:4px 10px; font-size:11.5px;">Download</a>
          </div>
        `).join('') || '<p style="color:var(--text-muted); font-size:12px;">No attachments uploaded.</p>';
      }

      // Store active project for upload
      document.getElementById('fileUploadProjectId').value = p.id;

      modal.classList.add('active');
    } catch (e) {
      alert('Error fetching project details.');
    }
  };

  // ---------------------------------------------------------------------------
  // Messaging Section Logic
  // ---------------------------------------------------------------------------
  async function loadMessagesForChat() {
    const projectSelect = document.getElementById('chatProjectSelect');
    if (projectSelect && projectSelect.children.length === 0) {
      projectSelect.innerHTML = allProjects.map(p => `
        <option value="${p.id}">${p.project_code} — ${p.title || p.service_type}</option>
      `).join('');

      projectSelect.onchange = () => {
        activeProjectIdForChat = projectSelect.value;
        refreshChatMessages();
      };

      if (allProjects.length > 0) {
        activeProjectIdForChat = allProjects[0].id;
      }
    }

    refreshChatMessages();
  }

  async function refreshChatMessages() {
    if (!activeProjectIdForChat) return;

    try {
      const res = await fetch(`/api/messages?project_id=${activeProjectIdForChat}`, { headers: getAuthHeader() });
      const data = await res.json();
      const container = document.getElementById('chatMessagesContainer');

      if (data.success && container) {
        const msgs = data.messages || [];
        if (msgs.length === 0) {
          container.innerHTML = `
            <div style="text-align:center; color:var(--text-muted); padding:40px;">
              No messages on this project yet. Send a message to Royal Smalie below!
            </div>
          `;
        } else {
          container.innerHTML = msgs.map(m => {
            const isMine = m.sender_id === currentUser.id;
            return `
              <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}">
                <div style="font-weight:600; font-size:11px; margin-bottom:2px;">${escapeHtml(m.sender_name)}</div>
                <div>${escapeHtml(m.message)}</div>
                <div class="chat-bubble-meta">
                  <span>${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  ${isMine ? `<span>✓✓</span>` : ''}
                </div>
              </div>
            `;
          }).join('');

          // Scroll to bottom
          container.scrollTop = container.scrollHeight;
        }
      }
    } catch (e) {
      console.warn('Error loading chat messages:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Modals & Form Setups
  // ---------------------------------------------------------------------------
  function setupModals() {
    // Close modal triggers
    document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.portal-modal-overlay').forEach(m => m.classList.remove('active'));
      };
    });

    // Start New Project CTA
    const startNewBtn = document.getElementById('startNewProjectBtn');
    const newProjectModal = document.getElementById('newProjectModal');
    if (startNewBtn && newProjectModal) {
      startNewBtn.onclick = () => newProjectModal.classList.add('active');
    }

    // Copy Account Number button
    const copyBtn = document.getElementById('copyAccNumBtn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const num = document.getElementById('modalAccountNumber').textContent;
        navigator.clipboard.writeText(num).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        });
      };
    }
  }

  function setupForms() {
    // New Project Request Form
    const newProjForm = document.getElementById('newProjectForm');
    if (newProjForm) {
      newProjForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('newProjSubmitBtn');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        const payload = {
          name: currentUser.full_name,
          email: currentUser.email,
          phone: currentUser.whatsapp_phone || '+234',
          service: document.getElementById('npService').value,
          budget: document.getElementById('npBudget').value,
          deadline: document.getElementById('npDeadline').value,
          description: document.getElementById('npDescription').value
        };

        try {
          const res = await fetch('/api/projects', {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            alert('Project submitted successfully! Royal Smalie will review it promptly.');
            document.getElementById('newProjectModal').classList.remove('active');
            newProjForm.reset();
            await loadProjects();
            renderOverview();
          } else {
            alert(data.error || 'Failed to submit project.');
          }
        } catch (err) {
          alert('Network error submitting project.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Submit Project Request';
        }
      };
    }

    // Submit Payment Proof Form
    const payForm = document.getElementById('payInvoiceForm');
    if (payForm) {
      payForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitPaymentBtn');
        btn.disabled = true;
        btn.textContent = 'Submitting Proof...';

        const payload = {
          invoice_id: document.getElementById('payInvoiceIdInput').value,
          amount: document.getElementById('payAmountInput').value,
          payment_method: document.getElementById('payMethodSelect').value,
          reference: document.getElementById('payReferenceInput').value,
          proof_file_url: ''
        };

        try {
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            alert('Payment submitted! Royal Smalie will verify the bank alert and mark your invoice paid.');
            document.getElementById('payInvoiceModal').classList.remove('active');
            payForm.reset();
            await Promise.all([loadPayments(), loadInvoices()]);
            renderOverview();
          } else {
            alert(data.error || 'Failed to record payment.');
          }
        } catch (err) {
          alert('Network error submitting payment.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Submit Payment for Verification';
        }
      };
    }

    // Send Chat Message
    const chatForm = document.getElementById('chatInputForm');
    if (chatForm) {
      chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('chatMessageInput');
        const text = input.value.trim();
        if (!text || !activeProjectIdForChat) return;

        input.value = '';

        try {
          const res = await fetch('/api/messages', {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({
              project_id: activeProjectIdForChat,
              message: text
            })
          });
          const data = await res.json();
          if (data.success) {
            refreshChatMessages();
          }
        } catch (e) {
          console.error('Failed to send message:', e);
        }
      };
    }

    // Profile Settings Form
    const profForm = document.getElementById('profileForm');
    if (profForm) {
      profForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('profileFullName').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();

        try {
          await window.RSAuth.updateProfile(name, phone);
          alert('Profile updated successfully!');
        } catch (err) {
          alert(err.message || 'Failed to update profile.');
        }
      };
    }

    // Password Change Form
    const passForm = document.getElementById('passwordChangeForm');
    if (passForm) {
      passForm.onsubmit = async (e) => {
        e.preventDefault();
        const currentPass = document.getElementById('currentPasswordInput').value;
        const newPass = document.getElementById('newPasswordInput').value;

        try {
          await window.RSAuth.changePassword(currentPass, newPass);
          alert('Password changed successfully!');
          passForm.reset();
        } catch (err) {
          alert(err.message || 'Failed to change password.');
        }
      };
    }

    // File Upload Form inside Project Details
    const fileUploadInput = document.getElementById('projectFileInput');
    if (fileUploadInput) {
      fileUploadInput.onchange = async () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        const projectId = document.getElementById('fileUploadProjectId').value;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', projectId);

        const token = window.RSAuth.getToken();
        try {
          const res = await fetch('/api/files/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            alert('File uploaded successfully!');
            window.RSViewProject(projectId);
          } else {
            alert(data.error || 'File upload failed.');
          }
        } catch (e) {
          alert('Upload failed.');
        }
      };
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  document.addEventListener('DOMContentLoaded', initDashboard);
})();
