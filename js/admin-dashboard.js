/**
 * RS Digital Hub — Admin Portal Controller (js/admin-dashboard.js)
 * High-authority business management operations for Royal Smalie 👑
 */

(function () {
  'use strict';

  let currentUser = null;
  let metrics = null;
  let allCustomers = [];
  let allProjects = [];
  let allEstimates = [];
  let allInvoices = [];
  let allPayments = [];
  let pricingRules = [];
  let paymentSettings = null;
  let activeChatProjectId = null;

  async function initAdmin() {
    currentUser = await window.RSAuth.verifySession();

    if (!currentUser || currentUser.role !== 'admin') {
      showAdminGateModal();
      return;
    }

    setupAdminUI();
    updateDatastoreBadge();
    await loadAllAdminData();
    renderOverview();

    const hash = window.location.hash.replace('#', '') || 'overview';
    switchAdminSection(hash);

    setupAdminListeners();
  }

  function getAuthHeader() {
    const token = window.RSAuth.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  function showAdminGateModal() {
    const gate = document.getElementById('adminLoginGate');
    if (gate) gate.style.display = 'flex';
  }

  function setupAdminUI() {
    const gate = document.getElementById('adminLoginGate');
    if (gate) gate.style.display = 'none';

    document.querySelectorAll('.admin-user-name').forEach(el => el.textContent = currentUser.full_name);
    document.querySelectorAll('.admin-user-avatar').forEach(el => el.textContent = '👑');

    // Navigation setup
    document.querySelectorAll('.nav-item[data-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('data-target');
        switchAdminSection(target);
      });
    });

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => window.RSAuth.logout();
    }
  }

  function switchAdminSection(secId) {
    window.location.hash = secId;

    document.querySelectorAll('.nav-item[data-target]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-target') === secId);
    });

    document.querySelectorAll('.dashboard-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`adm-${secId}`);
    if (targetSec) {
      targetSec.classList.add('active');
    } else {
      const def = document.getElementById('adm-overview');
      if (def) def.classList.add('active');
    }

    const titleEl = document.getElementById('adminHeaderTitle');
    if (titleEl) {
      const titles = {
        overview: 'Operations Control Center',
        projects: 'Projects Pipeline',
        estimates: 'Estimates & Proposals',
        invoices: 'Invoices & Billing',
        approvals: 'Payment Proof Approvals',
        pricing: 'Dynamic Pricing Rules',
        settings: 'Payment & Bank Settings',
        customers: 'Customer Directory',
        messages: 'Client Communications'
      };
      titleEl.textContent = titles[secId] || 'Admin Portal';
    }

    if (secId === 'messages') {
      loadAdminChat();
    }
  }

  // ---------------------------------------------------------------------------
  // Load All Admin Data
  // ---------------------------------------------------------------------------
  async function loadAllAdminData() {
    try {
      const [mRes, cRes, pRes, eRes, iRes, payRes, prRes, sRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: getAuthHeader() }).then(r => r.json()),
        fetch('/api/admin/customers', { headers: getAuthHeader() }).then(r => r.json()),
        fetch('/api/projects', { headers: getAuthHeader() }).then(r => r.json()),
        fetch('/api/estimates', { headers: getAuthHeader() }).then(r => r.json()),
        fetch('/api/invoices', { headers: getAuthHeader() }).then(r => r.json()),
        fetch('/api/payments', { headers: getAuthHeader() }).then(r => r.json()),
        fetch('/api/pricing').then(r => r.json()),
        fetch('/api/settings/payment').then(r => r.json())
      ]);

      if (mRes.success) metrics = mRes.metrics;
      if (cRes.success) allCustomers = cRes.customers || [];
      if (pRes.success) allProjects = pRes.projects || [];
      if (eRes.success) allEstimates = eRes.estimates || [];
      if (iRes.success) allInvoices = iRes.invoices || [];
      if (payRes.success) allPayments = payRes.payments || [];
      if (prRes.success) pricingRules = prRes.pricing_rules || [];
      if (sRes.success) paymentSettings = sRes.settings;

      renderAllSections();
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Section Renderers
  // ---------------------------------------------------------------------------
  function renderAllSections() {
    renderOverview();
    renderProjects();
    renderEstimates();
    renderInvoices();
    renderApprovals();
    renderPricing();
    renderPaymentSettings();
    renderCustomers();
  }

  function renderOverview() {
    if (!metrics) return;

    document.getElementById('mTotalRevenue').textContent = `₦${metrics.totalVerifiedRevenue.toLocaleString()}`;
    document.getElementById('mActiveProjects').textContent = metrics.activeProjects;
    document.getElementById('mPendingApprovals').textContent = metrics.pendingPaymentsCount;
    document.getElementById('mTotalCustomers').textContent = metrics.totalCustomers;

    // Overview quick tables
    const pendingPays = allPayments.filter(p => p.status === 'PENDING');
    const payTbody = document.getElementById('overviewPendingPaymentsTbody');
    if (payTbody) {
      if (pendingPays.length === 0) {
        payTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">No pending payments. All caught up!</td></tr>`;
      } else {
        payTbody.innerHTML = pendingPays.map(p => `
          <tr>
            <td><strong>${p.payment_reference}</strong></td>
            <td>${escapeHtml(p.client_name || 'Client')}</td>
            <td>₦${p.amount.toLocaleString()}</td>
            <td><span class="status-pill PENDING">Awaiting Verification</span></td>
            <td>
              <button type="button" class="header-btn primary" style="padding:4px 10px; font-size:12px;" onclick="window.AdminVerifyPayment('${p.id}')">
                Approve ✓
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  function renderProjects() {
    const tbody = document.getElementById('adminProjectsTableBody');
    if (!tbody) return;

    tbody.innerHTML = allProjects.map(p => `
      <tr>
        <td><strong>${p.project_code}</strong></td>
        <td>
          <div style="font-weight:600;">${escapeHtml(p.title || p.service_type)}</div>
          <small style="color:var(--text-muted); font-size:11px;">Client: ${escapeHtml(p.client_name || p.client_email)}</small>
        </td>
        <td>${p.budget ? '₦' + Number(p.budget).toLocaleString() : 'N/A'}</td>
        <td>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
          </div>
          <small style="font-size:11px; color:var(--text-muted);">${p.progress}%</small>
        </td>
        <td><span class="status-pill ${p.status || ''}">${(p.status || '').replace('_', ' ')}</span></td>
        <td>
          <button type="button" class="header-btn" style="padding:5px 10px; font-size:12px;" onclick="window.AdminManageProject('${p.id}')">
            Manage
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderEstimates() {
    const tbody = document.getElementById('adminEstimatesTableBody');
    if (!tbody) return;

    tbody.innerHTML = allEstimates.map(e => `
      <tr>
        <td><strong>${e.estimate_number}</strong></td>
        <td>${e.project_code || 'Project'}</td>
        <td>₦${Number(e.total).toLocaleString()}</td>
        <td>${e.valid_until || 'N/A'}</td>
        <td><span class="status-pill ${e.status}">${e.status}</span></td>
        <td>
          <button type="button" class="header-btn primary" style="padding:4px 10px; font-size:12px;" onclick="window.AdminConvertEstimateToInvoice('${e.id}')">
            Create Invoice
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderInvoices() {
    const tbody = document.getElementById('adminInvoicesTableBody');
    if (!tbody) return;

    tbody.innerHTML = allInvoices.map(inv => `
      <tr>
        <td><strong>${inv.invoice_number}</strong></td>
        <td>${inv.project_code || 'Project'}</td>
        <td>₦${Number(inv.amount).toLocaleString()}</td>
        <td>₦${Number(inv.paid_amount || 0).toLocaleString()}</td>
        <td>${inv.due_date}</td>
        <td><span class="status-pill ${inv.status || ''}">${(inv.status || '').replace('_', ' ')}</span></td>
      </tr>
    `).join('');
  }

  function renderApprovals() {
    const tbody = document.getElementById('adminApprovalsTableBody');
    if (!tbody) return;

    tbody.innerHTML = allPayments.map(p => `
      <tr>
        <td><strong>${p.payment_reference}</strong></td>
        <td>${escapeHtml(p.client_name || 'Client')}</td>
        <td>₦${Number(p.amount).toLocaleString()}</td>
        <td>${p.payment_method}</td>
        <td>${new Date(p.created_at).toLocaleDateString()}</td>
        <td><span class="status-pill ${p.status}">${p.status}</span></td>
        <td>
          ${p.status === 'PENDING' ? `
            <div style="display:flex; gap:6px;">
              <button type="button" class="header-btn primary" style="padding:4px 10px; font-size:11.5px;" onclick="window.AdminVerifyPayment('${p.id}')">
                Approve ✓
              </button>
              <button type="button" class="header-btn" style="padding:4px 10px; font-size:11.5px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#fca5a5;" onclick="window.AdminRejectPayment('${p.id}')">
                Reject ✕
              </button>
            </div>
          ` : `<small style="color:var(--text-muted); font-size:11px;">Processed</small>`}
        </td>
      </tr>
    `).join('');
  }

  function renderPricing() {
    const container = document.getElementById('adminPricingRulesContainer');
    if (!container) return;

    container.innerHTML = pricingRules.map(rule => `
      <div class="rule-editor-card">
        <div class="rule-editor-header">
          <div>
            <div class="rule-editor-title">${rule.service_slug.toUpperCase()} — ${rule.tier_name}</div>
            <div style="font-size:12px; color:var(--text-muted);">${escapeHtml(rule.tier_description || '')}</div>
          </div>
          <button type="button" class="header-btn primary" style="padding:5px 12px; font-size:12px;" onclick="window.AdminSavePricingRule('${rule.id}')">
            Save Rule
          </button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px;">
          <div class="form-group">
            <label>Base Price (₦)</label>
            <input type="number" id="price_base_${rule.id}" value="${rule.base_price}">
          </div>
          <div class="form-group">
            <label>Turnaround (Days)</label>
            <input type="number" id="price_days_${rule.id}" value="${rule.estimated_days || 7}">
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderPaymentSettings() {
    if (!paymentSettings) return;
    document.getElementById('settingBankName').value = paymentSettings.bank_name || '';
    document.getElementById('settingAccountName').value = paymentSettings.account_name || '';
    document.getElementById('settingAccountNumber').value = paymentSettings.account_number || '';
    document.getElementById('settingPaymentNotes').value = paymentSettings.payment_notes || '';
  }

  function renderCustomers() {
    const tbody = document.getElementById('adminCustomersTableBody');
    if (!tbody) return;

    tbody.innerHTML = allCustomers.map(c => `
      <tr>
        <td><strong>${escapeHtml(c.full_name)}</strong></td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.whatsapp_phone || 'N/A')}</td>
        <td>${c.projectsCount}</td>
        <td>₦${Number(c.totalSpent || 0).toLocaleString()}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');
  }

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  window.AdminVerifyPayment = async function (paymentId) {
    if (!confirm('Verify and approve this bank transfer payment? This will update the invoice to paid/partially paid.')) return;

    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ notes: 'Verified via bank credit alert by Royal Smalie 👑' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment verified! Client has been notified.');
        await loadAllAdminData();
      } else {
        alert(data.error || 'Failed to verify payment.');
      }
    } catch (e) {
      alert('Error verifying payment.');
    }
  };

  window.AdminRejectPayment = async function (paymentId) {
    const reason = prompt('Specify rejection reason:');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/payments/${paymentId}/reject`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment marked rejected.');
        await loadAllAdminData();
      }
    } catch (e) {
      alert('Error rejecting payment.');
    }
  };

  window.AdminManageProject = function (projectId) {
    const p = allProjects.find(item => item.id === projectId);
    if (!p) return;

    document.getElementById('manageProjId').value = p.id;
    document.getElementById('manageProjCode').textContent = `${p.project_code} — ${p.title || p.service_type}`;
    document.getElementById('manageProjStatus').value = p.status;
    document.getElementById('manageProjProgress').value = p.progress;
    document.getElementById('manageProjNotes').value = '';

    document.getElementById('manageProjectModal').classList.add('active');
  };

  window.AdminSavePricingRule = async function (ruleId) {
    const basePrice = document.getElementById(`price_base_${ruleId}`).value;
    const days = document.getElementById(`price_days_${ruleId}`).value;

    try {
      const res = await fetch(`/api/pricing/${ruleId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({
          base_price: basePrice,
          estimated_days: days
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pricing rule updated successfully!');
      } else {
        alert(data.error || 'Failed to update rule.');
      }
    } catch (e) {
      alert('Error saving rule.');
    }
  };

  window.AdminConvertEstimateToInvoice = function (estimateId) {
    const est = allEstimates.find(e => e.id === estimateId);
    if (!est) return;

    document.getElementById('invEstimateId').value = est.id;
    document.getElementById('invProjectId').value = est.project_id;
    document.getElementById('invAmount').value = est.total;
    document.getElementById('invDueDate').value = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    document.getElementById('invNotes').value = `Invoice generated for Estimate ${est.estimate_number}`;

    document.getElementById('createInvoiceModal').classList.add('active');
  };

  // ---------------------------------------------------------------------------
  // Admin Chat
  // ---------------------------------------------------------------------------
  async function loadAdminChat() {
    const select = document.getElementById('adminChatProjectSelect');
    if (select && select.children.length === 0) {
      select.innerHTML = allProjects.map(p => `
        <option value="${p.id}">${p.project_code} — ${p.client_name || 'Client'}</option>
      `).join('');

      select.onchange = () => {
        activeChatProjectId = select.value;
        refreshAdminChat();
      };

      if (allProjects.length > 0) activeChatProjectId = allProjects[0].id;
    }
    refreshAdminChat();
  }

  async function refreshAdminChat() {
    if (!activeChatProjectId) return;
    try {
      const res = await fetch(`/api/messages?project_id=${activeChatProjectId}`, { headers: getAuthHeader() });
      const data = await res.json();
      const container = document.getElementById('adminChatMessages');
      if (data.success && container) {
        container.innerHTML = (data.messages || []).map(m => `
          <div class="chat-bubble ${m.sender_role === 'admin' ? 'mine' : 'theirs'}">
            <div style="font-weight:600; font-size:11px; margin-bottom:2px;">${escapeHtml(m.sender_name)}</div>
            <div>${escapeHtml(m.message)}</div>
            <div class="chat-bubble-meta">
              <span>${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        `).join('') || '<p style="text-align:center; color:var(--text-muted); padding:30px;">No messages on this project yet.</p>';

        container.scrollTop = container.scrollHeight;
      }
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // Listeners & Form Submissions
  // ---------------------------------------------------------------------------
  function setupAdminListeners() {
    // Project update form
    const projForm = document.getElementById('manageProjectForm');
    if (projForm) {
      projForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('manageProjId').value;
        const status = document.getElementById('manageProjStatus').value;
        const progress = document.getElementById('manageProjProgress').value;
        const notes = document.getElementById('manageProjNotes').value;

        try {
          const res = await fetch(`/api/projects/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ status, progress, notes })
          });
          const data = await res.json();
          if (data.success) {
            alert('Project updated successfully!');
            document.getElementById('manageProjectModal').classList.remove('active');
            await loadAllAdminData();
          } else {
            alert(data.error || 'Failed to update project.');
          }
        } catch (err) {
          alert('Error updating project.');
        }
      };
    }

    // New Estimate trigger
    const newEstBtn = document.getElementById('adminNewEstimateBtn');
    if (newEstBtn) {
      newEstBtn.onclick = () => {
        const sel = document.getElementById('estProjectSelect');
        sel.innerHTML = allProjects.map(p => `<option value="${p.id}">${p.project_code} — ${p.title || p.service_type}</option>`).join('');
        document.getElementById('createEstimateModal').classList.add('active');
      };
    }

    // Estimate submission
    const estForm = document.getElementById('createEstimateForm');
    if (estForm) {
      estForm.onsubmit = async (e) => {
        e.preventDefault();
        const projectId = document.getElementById('estProjectSelect').value;
        const itemDesc = document.getElementById('estItemDesc').value;
        const itemPrice = document.getElementById('estItemPrice').value;
        const discount = document.getElementById('estDiscount').value;
        const notes = document.getElementById('estNotes').value;

        try {
          const res = await fetch('/api/estimates', {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({
              project_id: projectId,
              items: [{ description: itemDesc, quantity: 1, unit_price: itemPrice }],
              discount,
              notes
            })
          });
          const data = await res.json();
          if (data.success) {
            alert('Estimate created and sent to customer!');
            document.getElementById('createEstimateModal').classList.remove('active');
            estForm.reset();
            await loadAllAdminData();
          } else {
            alert(data.error || 'Failed to create estimate.');
          }
        } catch (err) {
          alert('Error creating estimate.');
        }
      };
    }

    // Invoice submission
    const invForm = document.getElementById('createInvoiceForm');
    if (invForm) {
      invForm.onsubmit = async (e) => {
        e.preventDefault();
        const projectId = document.getElementById('invProjectId').value;
        const estimateId = document.getElementById('invEstimateId').value;
        const amount = document.getElementById('invAmount').value;
        const dueDate = document.getElementById('invDueDate').value;
        const notes = document.getElementById('invNotes').value;

        try {
          const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({
              project_id: projectId,
              estimate_id: estimateId || null,
              amount,
              due_date: dueDate,
              notes
            })
          });
          const data = await res.json();
          if (data.success) {
            alert('Invoice issued to client!');
            document.getElementById('createInvoiceModal').classList.remove('active');
            await loadAllAdminData();
          } else {
            alert(data.error || 'Failed to issue invoice.');
          }
        } catch (err) {
          alert('Error issuing invoice.');
        }
      };
    }

    // Payment settings form
    const settingsForm = document.getElementById('adminPaymentSettingsForm');
    if (settingsForm) {
      settingsForm.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
          bank_name: document.getElementById('settingBankName').value,
          account_name: document.getElementById('settingAccountName').value,
          account_number: document.getElementById('settingAccountNumber').value,
          payment_notes: document.getElementById('settingPaymentNotes').value
        };

        try {
          const res = await fetch('/api/settings/payment', {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            alert('Bank payment instructions saved successfully!');
          }
        } catch (err) {
          alert('Failed to save payment settings.');
        }
      };
    }

    // Admin chat message
    const chatForm = document.getElementById('adminChatForm');
    if (chatForm) {
      chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('adminChatInput');
        const text = input.value.trim();
        if (!text || !activeChatProjectId) return;
        input.value = '';

        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({
              project_id: activeChatProjectId,
              message: text
            })
          });
          refreshAdminChat();
        } catch (err) {}
      };
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.portal-modal-overlay').forEach(m => m.classList.remove('active'));
      };
    });
  }

  async function updateDatastoreBadge() {
    const textEl = document.getElementById('datastoreStatusText');
    const dotEl = document.getElementById('datastoreStatusDot');
    const badgeEl = document.getElementById('datastoreStatusBadge');
    if (!textEl || !dotEl) return;

    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.supabaseConnected || data.mode === 'production') {
        dotEl.style.background = '#10b981';
        textEl.textContent = 'Supabase Connected ☁️';
        if (badgeEl) badgeEl.title = 'Production Cloud Datastore Active (Supabase)';
      } else {
        dotEl.style.background = '#f59e0b';
        textEl.textContent = 'Preview Datastore (Memory)';
        if (badgeEl) badgeEl.title = 'Preview Mode: In-memory datastore active. To persist permanently across restarts, configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.';
      }
    } catch (e) {
      dotEl.style.background = '#6b7280';
      textEl.textContent = 'Offline Mode';
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Admin Quick Login Gate Form
  document.addEventListener('DOMContentLoaded', () => {
    const gateForm = document.getElementById('adminGateLoginForm');
    if (gateForm) {
      gateForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('gateEmail').value.trim();
        const password = document.getElementById('gatePassword').value;
        const errBox = document.getElementById('gateError');

        try {
          const user = await window.RSAuth.login(email, password, true);
          if (user.role === 'admin') {
            initAdmin();
          } else {
            errBox.textContent = 'Access denied. Administrator privileges required.';
            errBox.style.display = 'block';
          }
        } catch (err) {
          errBox.textContent = err.message || 'Login failed.';
          errBox.style.display = 'block';
        }
      };
    }

    initAdmin();
  });
})();
