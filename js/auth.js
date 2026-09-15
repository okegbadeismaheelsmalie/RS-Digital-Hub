/**
 * RS Digital Hub — Authentication & Session Manager (js/auth.js)
 * Production-ready client-side auth module with Supabase & Server API compatibility
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'rs_hub_token';
  const USER_KEY = 'rs_hub_user';

  const Auth = {
    // Get stored session token
    getToken() {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
    },

    // Get stored user profile
    getUser() {
      try {
        const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    // Check if user is authenticated
    isAuthenticated() {
      return Boolean(this.getToken() && this.getUser());
    },

    // Check if current user is an administrator
    isAdmin() {
      const user = this.getUser();
      return Boolean(user && user.role === 'admin');
    },

    // Check if current user is a customer
    isCustomer() {
      const user = this.getUser();
      return Boolean(user && user.role === 'customer');
    },

    // Save session
    saveSession(token, user, remember = true) {
      const storage = remember ? localStorage : sessionStorage;
      // Clear both first to avoid stale tokens
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);

      storage.setItem(TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(user));
      this.updateUI();
    },

    // Clear session
    clearSession() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      this.updateUI();
    },

    // Login
    async login(email, password, remember = true) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      this.saveSession(data.token, data.user, remember);
      return data.user;
    },

    // Signup (always assigns role: 'customer')
    async signup(fullName, email, password, whatsappPhone, remember = true) {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          whatsapp_phone: whatsappPhone
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Signup failed. Please try again.');
      }

      this.saveSession(data.token, data.user, remember);
      return data.user;
    },

    // Logout
    async logout() {
      const token = this.getToken();
      if (token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          // ignore network failure on logout
        }
      }
      this.clearSession();
      window.location.href = '/';
    },

    // Verify session with server
    async verifySession() {
      const token = this.getToken();
      if (!token) {
        this.clearSession();
        return null;
      }

      try {
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.authenticated && data.user) {
          const remember = Boolean(localStorage.getItem(TOKEN_KEY));
          this.saveSession(token, data.user, remember);
          return data.user;
        } else {
          this.clearSession();
          return null;
        }
      } catch (e) {
        // If offline or network error, return local user cache
        return this.getUser();
      }
    },

    // Update Profile
    async updateProfile(fullName, whatsappPhone) {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: fullName, whatsapp_phone: whatsappPhone })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      const remember = Boolean(localStorage.getItem(TOKEN_KEY));
      this.saveSession(token, data.user, remember);
      return data.user;
    },

    // Change Password
    async changePassword(currentPassword, newPassword) {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password.');
      }
      return data;
    },

    // Intercept protected action
    protectAction(targetUrl = '/dashboard') {
      if (this.isAuthenticated()) {
        window.location.href = targetUrl;
        return true;
      }
      // Redirect to login preserving destination
      window.location.href = `/login?redirect=${encodeURIComponent(targetUrl)}`;
      return false;
    },

    // Update navigation bar in HTML if present
    updateUI() {
      const navMenu = document.getElementById('navMenu');
      const user = this.getUser();

      // Find or create auth button in nav
      let authNavContainer = document.getElementById('authNavContainer');
      if (!authNavContainer && navMenu) {
        authNavContainer = document.createElement('div');
        authNavContainer.id = 'authNavContainer';
        authNavContainer.className = 'auth-nav-container';
        navMenu.appendChild(authNavContainer);
      }

      if (authNavContainer) {
        if (user) {
          const isAdm = user.role === 'admin';
          const dashboardUrl = isAdm ? '/admin' : '/dashboard';
          const label = isAdm ? 'Admin Portal 👑' : 'Dashboard';
          const initials = (user.full_name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          authNavContainer.innerHTML = `
            <a href="${dashboardUrl}" class="nav-portal-btn" id="navDashboardBtn" title="${escapeHtml(user.full_name)}">
              <span class="nav-user-avatar">${initials}</span>
              <span>${label}</span>
            </a>
            <button type="button" class="nav-logout-btn" id="navLogoutBtn" title="Sign Out">
              Sign Out
            </button>
          `;

          const logoutBtn = document.getElementById('navLogoutBtn');
          if (logoutBtn) {
            logoutBtn.onclick = () => Auth.logout();
          }
        } else {
          authNavContainer.innerHTML = `
            <a href="/login" class="nav-portal-btn secondary" id="navLoginBtn">
              <span>Client Portal</span>
            </a>
          `;
        }
      }

      // Dispatch custom event for page listeners
      window.dispatchEvent(new CustomEvent('rs:auth_change', { detail: { user } }));
    }
  };

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Auto-init on page load
  document.addEventListener('DOMContentLoaded', () => {
    Auth.updateUI();
    Auth.verifySession().then(() => Auth.updateUI());

    // Intercept buttons with .require-auth or special hero CTA buttons
    document.querySelectorAll('[data-require-auth]').forEach(el => {
      el.addEventListener('click', (e) => {
        const destination = el.getAttribute('data-target') || el.getAttribute('href') || '/dashboard';
        if (!Auth.isAuthenticated()) {
          e.preventDefault();
          Auth.protectAction(destination);
        }
      });
    });
  });

  window.RSAuth = Auth;
})();
