/* ============================================================
   ParkSmart – Auth Utilities (auth.js)
   Handles login state, redirects, and role-based guarding.
   ============================================================ */

/**
 * Persist auth data returned by the login endpoint.
 * @param {{ token, username, email, role }} authResponse
 */
function saveAuth(authResponse) {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify({
        username: authResponse.username,
        email:    authResponse.email,
        role:     authResponse.role
    }));
}

/** Clear session and redirect to login page. */
function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

/**
 * Guard a page – redirect to login if unauthenticated or wrong role.
 * @param {string[]} [allowedRoles]  - If omitted, any authenticated user is allowed.
 * @returns {boolean} true if access is granted
 */
function requireAuth(allowedRoles) {
    const token = getToken();
    const user  = getUser();

    if (!token || !user.role) {
        window.location.href = '/login.html';
        return false;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        window.location.href = '/login.html';
        return false;
    }

    return true;
}

/**
 * After login, redirect user to the correct dashboard based on role.
 */
function redirectByRole() {
    const user = getUser();
    if (!user.role) {
        window.location.href = '/login.html';
        return;
    }
    if (user.role === 'ADMIN') {
        window.location.href = '/admin.html';
    } else if (user.role === 'PARKING_MANAGER') {
        window.location.href = '/manager.html';
    } else {
        window.location.href = '/customer.html';
    }
}

/* ============================================================
   Toast Notification System
   ============================================================ */

/**
 * Show a floating toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type]
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* ============================================================
   Modal Helpers
   ============================================================ */

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

/* Close modal when clicking the overlay background */
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

/* Close modal on Escape key */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
});

/* ============================================================
   Utility Helpers
   ============================================================ */

/**
 * Convert a datetime-local input value to LocalDateTime string for the backend.
 * Input:  "2026-10-01T10:00"
 * Output: "2026-10-01T10:00:00"
 */
function toLocalDateTime(datetimeLocalValue) {
    if (!datetimeLocalValue) return '';
    // Already has seconds
    if (/T\d{2}:\d{2}:\d{2}$/.test(datetimeLocalValue)) return datetimeLocalValue;
    return datetimeLocalValue + ':00';
}

/**
 * Format an ISO datetime string for display.
 * @param {string} dt
 */
function formatDateTime(dt) {
    if (!dt) return '–';
    try {
        return new Date(dt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch {
        return dt;
    }
}

/** Format a date only (no time) */
function formatDate(dt) {
    if (!dt) return '–';
    try {
        return new Date(dt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch {
        return dt;
    }
}

/**
 * Generate a status badge HTML string.
 * @param {string} status
 */
function statusBadge(status) {
    if (!status) return '–';
    const map = {
        RESERVED:   'badge-primary',
        ACTIVE:     'badge-success',
        COMPLETED:  'badge-secondary',
        CANCELLED:  'badge-danger',
        AVAILABLE:  'badge-success',
        OCCUPIED:   'badge-danger',
        MAINTENANCE:'badge-warning',
        ENABLED:    'badge-success',
        DISABLED:   'badge-danger',
        true:       'badge-success',
        false:      'badge-danger',
    };
    const cls = map[status] || 'badge-secondary';
    return `<span class="badge ${cls}">${status}</span>`;
}

/** Populate a <select> with option elements */
function populateSelect(selectEl, items, valueKey, labelKey, placeholder = 'Select…') {
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item[valueKey];
        opt.textContent = typeof labelKey === 'function' ? labelKey(item) : item[labelKey];
        selectEl.appendChild(opt);
    });
}

/** Show loading row inside a <tbody> */
function showTableLoading(tbodyId, colSpan = 5) {
    const tbody = document.getElementById(tbodyId);
    if (tbody) tbody.innerHTML = `<tr class="loading-row"><td colspan="${colSpan}"><div class="spinner spinner-dark" style="margin:0 auto"></div></td></tr>`;
}

/** Show an error row inside a <tbody> */
function showTableError(tbodyId, msg, colSpan = 5) {
    const tbody = document.getElementById(tbodyId);
    if (tbody) tbody.innerHTML = `<tr><td colspan="${colSpan}" class="no-data">⚠ ${msg}</td></tr>`;
}

/** Sidebar section switching */
function initSidebar(defaultSection) {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.section');

    function showSection(name) {
        sections.forEach(s => s.classList.toggle('active', s.dataset.section === name));
        navItems.forEach(n => n.classList.toggle('active', n.dataset.section === name));
        const titleEl = document.getElementById('page-title');
        const activeNav = document.querySelector(`.nav-item[data-section="${name}"]`);
        if (titleEl && activeNav) {
            titleEl.textContent = activeNav.querySelector('.nav-label')?.textContent ||
                                  activeNav.textContent.trim().replace(/^[^\w]/, '').trim();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(item.dataset.section);
        });
    });

    showSection(defaultSection || navItems[0]?.dataset.section || '');
}
