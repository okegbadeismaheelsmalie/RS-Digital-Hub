/**
 * RS Digital Hub — Project Cost Estimator (js/estimator.js)
 * Interactive pricing configuration, transparent breakdowns, project conversion & WhatsApp integration.
 */

(function () {
  'use strict';

  const DEFAULT_SERVICES = [
    { id: 'srv-1', slug: 'website-development', name: 'Website Development', icon: '🌐', base_price: 50000 },
    { id: 'srv-2', slug: 'graphic-design', name: 'Graphic Design & Brand Identity', icon: '🎨', base_price: 15000 },
    { id: 'srv-3', slug: 'ai-solutions', name: 'AI Solutions & Chatbots', icon: '🤖', base_price: 80000 },
    { id: 'srv-4', slug: 'web-applications', name: 'Web Applications & Portals', icon: '📱', base_price: 120000 },
    { id: 'srv-5', slug: 'computer-training', name: 'Computer Training & Digital Skills', icon: '💻', base_price: 30000 },
    { id: 'srv-6', slug: 'technical-support', name: 'Technical Support & Maintenance', icon: '🛠', base_price: 25000 }
  ];

  const DEFAULT_PRICING_RULES = [
    {
      id: 'pr-web-1',
      service_slug: 'website-development',
      tier_name: 'Starter',
      tier_description: 'Ideal for individuals, landing pages, and small portfolios.',
      base_price: 50000,
      estimated_days: 7,
      features: ['1-3 Custom Responsive Pages', 'Modern Mobile UI/UX', 'Contact Form Integration', 'Basic Google SEO Setup', '1 Revision Round'],
      addons: [
        { id: 'speed', name: 'Speed Optimization & Global CDN', price: 15000 },
        { id: 'seo', name: 'Advanced Local & Search SEO', price: 20000 },
        { id: 'cms', name: 'Blog / Content Management System', price: 25000 }
      ]
    },
    {
      id: 'pr-web-2',
      service_slug: 'website-development',
      tier_name: 'Standard Business',
      tier_description: 'Full business presence with dynamic features and professional brand layout.',
      base_price: 150000,
      estimated_days: 14,
      features: ['Up to 7 Custom Pages', 'Interactive Modern Layout', 'Content Management System', 'Google Analytics & Tag Manager', 'WhatsApp Chat Integration', '3 Revision Rounds'],
      addons: [
        { id: 'ecommerce', name: 'Online Payment Gateway (Paystack/Flutterwave)', price: 40000 },
        { id: 'copy', name: 'Professional SEO Copywriting', price: 25000 },
        { id: 'newsletter', name: 'Automated Email Newsletter Capture', price: 20000 }
      ]
    },
    {
      id: 'pr-web-3',
      service_slug: 'website-development',
      tier_name: 'Enterprise / E-Commerce',
      tier_description: 'Full-scale storefront or corporate platform with custom workflows.',
      base_price: 350000,
      estimated_days: 25,
      features: ['Unlimited Scale & Architecture', 'Full Product Catalog & Checkout', 'Client Portal / Dashboard System', 'Custom Payment Integrations', 'Priority 24/7 Deployment Support'],
      addons: [
        { id: 'maintenance', name: '6-Month Dedicated Maintenance Care', price: 80000 }
      ]
    },
    {
      id: 'pr-gd-1',
      service_slug: 'graphic-design',
      tier_name: 'Logo & Basic Brand',
      tier_description: 'Modern identity for new business launches.',
      base_price: 25000,
      estimated_days: 5,
      features: ['3 Unique Logo Concepts', 'Vector Source Files (AI, SVG, PNG)', 'Color Palette & Typography Guide', 'Social Profile Display Assets'],
      addons: [
        { id: 'stationery', name: 'Matching Business Card & Letterhead', price: 15000 },
        { id: 'banner', name: 'Large Format Banner / Billboard Design', price: 20000 }
      ]
    },
    {
      id: 'pr-gd-2',
      service_slug: 'graphic-design',
      tier_name: 'Complete Brand Kit',
      tier_description: 'Exhaustive corporate brand book, marketing collateral, and digital kit.',
      base_price: 60000,
      estimated_days: 10,
      features: ['Full 20-Page Brand Style Guide', 'Marketing Flyers (3 sets)', 'Social Media Templates (5 editable sets)', 'High-Resolution Vector Formats'],
      addons: []
    },
    {
      id: 'pr-ai-1',
      service_slug: 'ai-solutions',
      tier_name: 'AI Chatbot & Automation',
      tier_description: 'Intelligent AI agent tailored with your company knowledge base.',
      base_price: 100000,
      estimated_days: 14,
      features: ['Custom Knowledge Base Embeddings', 'Website Widget Deployment', 'Lead Capture & WhatsApp Relay', 'Real-Time Gemini AI Reasoning'],
      addons: [
        { id: 'crm', name: 'CRM / Google Sheets Real-Time Sync', price: 30000 },
        { id: 'multilingual', name: 'Multilingual Support Pack', price: 25000 }
      ]
    },
    {
      id: 'pr-app-1',
      service_slug: 'web-applications',
      tier_name: 'Custom Web Application',
      tier_description: 'Full-stack software with authenticated user dashboards and workflows.',
      base_price: 250000,
      estimated_days: 30,
      features: ['User Auth & Role-Based Access', 'PostgreSQL / Supabase Database', 'Client & Admin Dashboards', 'Payment Integrations & Invoicing', 'Automated Email / SMS Notifications'],
      addons: [
        { id: 'pwa', name: 'Progressive Web App (Offline Support)', price: 50000 }
      ]
    },
    {
      id: 'pr-train-1',
      service_slug: 'computer-training',
      tier_name: 'Intensive Practical Program',
      tier_description: 'Hands-on practical training in high-demand digital skills.',
      base_price: 30000,
      estimated_days: 30,
      features: ['1-on-1 Mentorship Sessions', 'Real Client Capstone Project', 'Verified Certificate of Completion', 'Job & Freelance Portfolio Review'],
      addons: []
    },
    {
      id: 'pr-sup-1',
      service_slug: 'technical-support',
      tier_name: 'Monthly Maintenance & Security',
      tier_description: 'Ongoing technical stewardship, backups, speed optimization, and repairs.',
      base_price: 25000,
      estimated_days: 30,
      features: ['Weekly Database Backups', 'Security Patches & Malware Monitoring', 'Speed & CDN Optimization', 'Dedicated Priority Response'],
      addons: []
    }
  ];

  let pricingRules = DEFAULT_PRICING_RULES;
  let services = DEFAULT_SERVICES;
  let selectedService = 'website-development';
  let selectedTierId = 'pr-web-2';
  let selectedAddons = new Set();

  function ensureEstimatorDOM() {
    const root = document.getElementById('rs-estimator-root');
    if (!root) return;

    if (!document.getElementById('estimatorServiceChips')) {
      root.innerHTML = `
        <div class="estimator-container">
          <div class="estimator-card">
            <div class="estimator-step">
              <div class="estimator-step-title">
                <span class="estimator-step-number">1</span>
                <span>Select Service Area</span>
              </div>
              <div id="estimatorServiceChips" class="service-chips"></div>
            </div>

            <div class="estimator-step">
              <div class="estimator-step-title">
                <span class="estimator-step-number">2</span>
                <span>Choose Project Scope &amp; Tier</span>
              </div>
              <div id="estimatorTierCards" class="tier-cards"></div>
            </div>

            <div class="estimator-step" style="margin-bottom: 0;">
              <div class="estimator-step-title">
                <span class="estimator-step-number">3</span>
                <span>Custom Add-ons &amp; Accelerators (Optional)</span>
              </div>
              <div id="estimatorAddonsList" class="addon-list"></div>
            </div>
          </div>

          <div class="estimator-summary-card">
            <span class="summary-badge">⚡ Instant Calculation</span>
            <h3 class="summary-title">Estimate Summary</h3>
            <p class="summary-service-name" id="summaryServiceName">Loading configuration...</p>

            <div class="summary-price-box">
              <div class="summary-price-label">Estimated Investment</div>
              <div class="summary-price-val" id="summaryPriceVal">₦0</div>
              <div class="summary-timeline" id="summaryTimelineText">⏱ Estimated delivery: 7-14 business days</div>
            </div>

            <div class="summary-breakdown">
              <div class="breakdown-row">
                <span>Base Deliverable:</span>
                <strong id="summaryBasePrice">₦0</strong>
              </div>
              <div class="breakdown-row">
                <span>Selected Add-ons:</span>
                <strong id="summaryAddonsPrice">₦0</strong>
              </div>
              <div class="breakdown-row total">
                <span>Total Quotation:</span>
                <strong id="summaryTotalPrice" style="color:#2fd0ff;">₦0</strong>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button type="button" class="estimator-cta-btn" id="estimatorProceedBtn">
                <span>📋 Convert to Project Request</span>
              </button>
              <a href="https://wa.me/2349117035399" target="_blank" rel="noopener" class="estimator-cta-btn" id="estimatorWhatsAppBtn" style="background: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37, 211, 102, 0.4); color: #25d366;">
                <span>💬 Inquire on WhatsApp</span>
              </a>
            </div>
            <p class="estimator-note">Final price confirmed after detailed requirements review. No hidden costs.</p>
          </div>
        </div>
      `;
    }
  }

  async function loadPricingData() {
    ensureEstimatorDOM();
    try {
      const res = await fetch('/api/pricing');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.services && data.services.length > 0) services = data.services;
          if (data.pricing_rules && data.pricing_rules.length > 0) pricingRules = data.pricing_rules;
        }
      }
    } catch (err) {
      console.warn('Using built-in verified pricing data:', err);
    }
    renderServices();
    selectService(selectedService);
  }

  function renderServices() {
    const container = document.getElementById('estimatorServiceChips');
    if (!container) return;

    container.innerHTML = services.map(srv => `
      <button type="button" class="service-chip ${srv.slug === selectedService ? 'active' : ''}" data-slug="${srv.slug}">
        <span class="service-chip-icon">${srv.icon || '🚀'}</span>
        <span class="service-chip-name">${srv.name}</span>
      </button>
    `).join('');

    container.querySelectorAll('.service-chip').forEach(btn => {
      btn.onclick = () => selectService(btn.dataset.slug);
    });
  }

  function selectService(slug) {
    selectedService = slug;
    selectedAddons.clear();

    document.querySelectorAll('.service-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.slug === slug);
    });

    const tiers = pricingRules.filter(r => r.service_slug === slug);
    if (tiers.length > 0) {
      selectedTierId = tiers[0].id;
    } else {
      selectedTierId = null;
    }

    renderTiers(tiers);
    renderAddons();
    recalculate();
  }

  function renderTiers(tiers) {
    const container = document.getElementById('estimatorTierCards');
    if (!container) return;

    if (!tiers || tiers.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 13.5px;">Custom scope consulting available. Please submit your project details below or chat with Royal Smalie on WhatsApp.</p>`;
      return;
    }

    container.innerHTML = tiers.map(tier => `
      <div class="tier-card ${tier.id === selectedTierId ? 'active' : ''}" data-id="${tier.id}">
        <div class="tier-header">
          <div class="tier-title">${tier.tier_name}</div>
          <div class="tier-price">₦${Number(tier.base_price).toLocaleString()}</div>
        </div>
        <p class="tier-desc">${tier.tier_description || ''}</p>
        <ul class="tier-features-list">
          ${(tier.features || []).map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    container.querySelectorAll('.tier-card').forEach(card => {
      card.onclick = () => {
        selectedTierId = card.dataset.id;
        document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        renderAddons();
        recalculate();
      };
    });
  }

  function renderAddons() {
    const container = document.getElementById('estimatorAddonsList');
    if (!container) return;

    const currentTier = pricingRules.find(r => r.id === selectedTierId);
    const addons = currentTier && currentTier.addons ? currentTier.addons : [];

    if (addons.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 12.5px; font-style: italic;">All essential deliverables included in this package.</p>`;
      return;
    }

    container.innerHTML = addons.map(addon => {
      const isChecked = selectedAddons.has(addon.id);
      return `
        <label class="addon-item ${isChecked ? 'selected' : ''}">
          <div class="addon-left">
            <input type="checkbox" value="${addon.id}" data-price="${addon.price}" data-name="${addon.name}" ${isChecked ? 'checked' : ''}>
            <span class="addon-name">${addon.name}</span>
          </div>
          <span class="addon-price">+₦${Number(addon.price).toLocaleString()}</span>
        </label>
      `;
    }).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.onchange = () => {
        if (cb.checked) {
          selectedAddons.add(cb.value);
          cb.closest('.addon-item').classList.add('selected');
        } else {
          selectedAddons.delete(cb.value);
          cb.closest('.addon-item').classList.remove('selected');
        }
        recalculate();
      };
    });
  }

  function recalculate() {
    const currentTier = pricingRules.find(r => r.id === selectedTierId);
    const srv = services.find(s => s.slug === selectedService);
    const srvName = srv ? srv.name : 'Custom Service';

    const base = currentTier ? Number(currentTier.base_price) : 50000;
    const days = currentTier ? (currentTier.estimated_days || 7) : 7;
    let addonsTotal = 0;
    const selectedAddonNames = [];

    if (currentTier && currentTier.addons) {
      currentTier.addons.forEach(ad => {
        if (selectedAddons.has(ad.id)) {
          addonsTotal += Number(ad.price);
          selectedAddonNames.push(ad.name);
        }
      });
    }

    const total = base + addonsTotal;

    const summaryService = document.getElementById('summaryServiceName');
    const summaryPrice = document.getElementById('summaryPriceVal');
    const summaryTimeline = document.getElementById('summaryTimelineText');
    const summaryBasePrice = document.getElementById('summaryBasePrice');
    const summaryAddonsPrice = document.getElementById('summaryAddonsPrice');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');
    const ctaBtn = document.getElementById('estimatorProceedBtn');
    const waBtn = document.getElementById('estimatorWhatsAppBtn');

    const tierLabel = currentTier ? currentTier.tier_name : 'Custom';
    if (summaryService) summaryService.textContent = `${srvName} — ${tierLabel}`;
    if (summaryPrice) summaryPrice.textContent = `₦${total.toLocaleString()}`;
    if (summaryTimeline) summaryTimeline.textContent = `⏱ Estimated delivery: ${days} business days`;
    if (summaryBasePrice) summaryBasePrice.textContent = `₦${base.toLocaleString()}`;
    if (summaryAddonsPrice) summaryAddonsPrice.textContent = `₦${addonsTotal.toLocaleString()}`;
    if (summaryTotalPrice) summaryTotalPrice.textContent = `₦${total.toLocaleString()}`;

    // WhatsApp Action
    if (waBtn) {
      const waMsg = `Hello Royal Smalie! I configured a project estimate on RS Digital Hub:\n• Service: ${srvName} (${tierLabel})\n• Estimated Total: ₦${total.toLocaleString()}\n• Delivery: ${days} business days${selectedAddonNames.length ? `\n• Add-ons: ${selectedAddonNames.join(', ')}` : ''}\n\nI would like to proceed with this project.`;
      waBtn.href = `https://wa.me/2349117035399?text=${encodeURIComponent(waMsg)}`;
    }

    // Convert to project form action
    if (ctaBtn) {
      ctaBtn.onclick = (e) => {
        e.preventDefault();
        const formService = document.getElementById('projectService') || document.querySelector('select[name="service"]');
        const formBudget = document.getElementById('projectBudget') || document.querySelector('input[name="budget"]');
        const formDesc = document.getElementById('projectDescription') || document.querySelector('textarea[name="description"]');

        if (formService) formService.value = srvName;
        if (formBudget) formBudget.value = total;
        if (formDesc) {
          const addonText = selectedAddonNames.length > 0 ? `\nSelected Add-ons: ${selectedAddonNames.join(', ')}` : '';
          formDesc.value = `Selected Package: ${srvName} (${tierLabel})${addonText}\nEstimated Budget: ₦${total.toLocaleString()}\nEstimated Timeline: ${days} business days\n`;
        }

        const projectFormSec = document.getElementById('contact') || document.getElementById('start-project') || document.querySelector('.project-form');
        if (projectFormSec) {
          projectFormSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPricingData);
  } else {
    loadPricingData();
  }
})();
