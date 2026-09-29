/* ============================================================
   ParkSmart – Admin Dashboard Logic (admin.js)
   ============================================================ */

/* -------- Auth Guard -------- */
if (!requireAuth(['ADMIN'])) { /* redirected */ }

/* -------- Init -------- */
document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    document.getElementById('username-display').textContent = user.username || 'Admin';
    document.getElementById('dash-username').textContent = user.username || 'Admin';
    const avatar = document.getElementById('user-avatar');
    if (avatar && user.username) avatar.textContent = user.username[0].toUpperCase();

    initSidebar('dashboard');

    // Load data when sections are opened
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const s = item.dataset.section;
            if (s === 'dashboard')   loadDashboardStats();
            if (s === 'users')       loadUsers();
            if (s === 'lots')        loadLots();
            if (s === 'slots')       loadLotsForSelects().then(loadSlots);
            if (s === 'bookings')    loadBookings();
            if (s === 'checkinout')  loadCheckinRecords();
            if (s === 'occupancy')   loadLotsForOccupancy();
        });
    });

    loadDashboardStats();
});

function gotoSection(name) {
    document.querySelector(`.nav-item[data-section="${name}"]`)?.click();
}

/* ============================================================
   DASHBOARD STATS
   ============================================================ */
async function loadDashboardStats() {
    try {
        const [users, lots, bookings, slots] = await Promise.allSettled([
            api.get('/api/auth/admin/users'),
            api.get('/api/lots'),
            api.get('/api/bookings'),
            api.get('/api/slots'),
        ]);

        setText('stat-users',    users.value?.length    ?? '–');
        setText('stat-lots',     lots.value?.length     ?? '–');
        setText('stat-bookings', bookings.value?.length ?? '–');
        setText('stat-slots',    slots.value?.length    ?? '–');
    } catch (e) {
        console.error('Stats load error', e);
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ============================================================
   USERS
   ============================================================ */
let _allUsers = [];
let _editingUserId = null;

async function loadUsers() {
    showTableLoading('users-tbody', 6);
    try {
        const users = await api.get('/api/auth/admin/users');
        _allUsers = users || [];
        renderUsers(_allUsers);
    } catch (e) {
        showTableError('users-tbody', e.message, 6);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('users-tbody');
    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-data">No users found</td></tr>`;
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td><strong>${escHtml(u.username)}</strong></td>
            <td>${escHtml(u.email)}</td>
            <td>${roleBadge(u.role)}</td>
            <td>${u.enabled !== false ? statusBadge('ENABLED') : statusBadge('DISABLED')}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-xs btn-primary" onclick="editUser(${u.id})">Edit</button>
                    <button class="btn btn-xs btn-warning" onclick="openRoleModal(${u.id},'${u.role}')">Role</button>
                    <button class="btn btn-xs ${u.enabled !== false ? 'btn-secondary' : 'btn-success'}"
                        onclick="toggleUser(${u.id})">${u.enabled !== false ? 'Disable' : 'Enable'}</button>
                    <button class="btn btn-xs btn-danger" onclick="deleteUser(${u.id},'${escHtml(u.username)}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function resetUserForm() {
    _editingUserId = null;
    document.getElementById('user-modal-title').textContent = 'Add User';
    document.getElementById('user-id').value = '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = 'CUSTOMER';
    document.getElementById('user-password-group').style.display = '';
    clearModalErrors('user');
}

function editUser(id) {
    const user = _allUsers.find(u => u.id === id);
    if (!user) return;
    _editingUserId = user.id;
    document.getElementById('user-modal-title').textContent = 'Edit User';
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-password-group').style.display = 'none';
    clearModalErrors('user');
    openModal('user-modal');
}

async function saveUser() {
    clearModalErrors('user');
    const username = document.getElementById('user-username').value.trim();
    const email    = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value;
    const role     = document.getElementById('user-role').value;

    if (!username) { showModalError('user-username-err', 'Username required'); return; }
    if (!email)    { showModalError('user-email-err', 'Email required'); return; }
    if (!_editingUserId && !password) { showModalError('user-password-err', 'Password required'); return; }

    try {
        if (_editingUserId) {
            await api.put(`/api/auth/admin/users/${_editingUserId}`, {
                username,
                email,
                role,
                enabled: true
            });
            showToast('User updated successfully', 'success');
        } else {
            await api.post('/api/auth/admin/users', { username, email, password, role });
            showToast('User created successfully', 'success');
        }
        closeModal('user-modal');
        loadUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function openRoleModal(userId, currentRole) {
    document.getElementById('role-user-id').value = userId;
    document.getElementById('role-select').value = currentRole;
    openModal('role-modal');
}

async function saveRole() {
    const userId = document.getElementById('role-user-id').value;
    const role   = document.getElementById('role-select').value;
    try {
        await api.put(`/api/auth/admin/users/${userId}/role?role=${role}`);
        closeModal('role-modal');
        showToast('Role updated', 'success');
        loadUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function toggleUser(userId) {
    try {
        await api.put(`/api/auth/admin/users/${userId}/toggle`);
        showToast('User status updated', 'success');
        loadUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
        await api.delete(`/api/auth/admin/users/${userId}`);
        showToast('User deleted', 'success');
        loadUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

/* ============================================================
   PARKING LOTS (View Only)
   ============================================================ */
let _allLots = [];

async function loadLots() {
    showTableLoading('lots-tbody', 6);
    try {
        _allLots = await api.get('/api/lots');
        renderLots(_allLots);
    } catch (e) {
        showTableError('lots-tbody', e.message, 6);
    }
}

function renderLots(lots) {
    const tbody = document.getElementById('lots-tbody');
    if (!lots || lots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-data">No parking lots found</td></tr>`;
        return;
    }
    tbody.innerHTML = lots.map(l => `
        <tr>
            <td>${l.id}</td>
            <td><strong>${escHtml(l.lotName || l.name || '')}</strong></td>
            <td>${escHtml(l.location || '')}</td>
            <td>${l.totalSlots ?? '–'}</td>
            <td>₹${l.penaltyRate != null ? l.penaltyRate : '–'}</td>
            <td>${l.penaltyUnitMinutes != null ? l.penaltyUnitMinutes + ' min' : (l.penaltyUnit ?? '–')}</td>
        </tr>
    `).join('');
}

/* ============================================================
   SLOTS (View Only)
   ============================================================ */
let _allSlots = [];

async function loadLotsForSelects() {
    try {
        if (_allLots.length === 0) _allLots = await api.get('/api/lots');
        // Populate filter
        const filterSel = document.getElementById('slots-lot-filter');
        if (filterSel) {
            filterSel.innerHTML = '<option value="">All Lots</option>';
            _allLots.forEach(l => {
                const o = document.createElement('option');
                o.value = l.id;
                o.textContent = l.lotName || l.name;
                filterSel.appendChild(o);
            });
        }
    } catch { /* ignore */ }
}

async function loadSlots() {
    showTableLoading('slots-tbody', 5);
    try {
        const lotId = document.getElementById('slots-lot-filter')?.value;
        let slots;
        if (lotId) {
            slots = await api.get(`/api/slots/lot/${lotId}`);
        } else {
            slots = await api.get('/api/slots');
        }
        _allSlots = slots || [];
        renderSlots(_allSlots);
    } catch (e) {
        showTableError('slots-tbody', e.message, 5);
    }
}

function renderSlots(slots) {
    const tbody = document.getElementById('slots-tbody');
    if (!slots || slots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="no-data">No slots found</td></tr>`;
        return;
    }
    tbody.innerHTML = slots.map(s => {
        const lotName = s.parkingLot?.lotName || s.parkingLot?.name || s.lot?.name || s.lotName || '–';
        return `
        <tr>
            <td>${s.id}</td>
            <td><strong>${escHtml(s.slotNumber || s.number || '')}</strong></td>
            <td>${s.slotType || s.type || '–'}</td>
            <td>${statusBadge(s.status)}</td>
            <td>${escHtml(String(lotName))}</td>
        </tr>`;
    }).join('');
}

/* ============================================================
   BOOKINGS
   ============================================================ */
async function loadBookings() {
    showTableLoading('bookings-tbody', 8);
    try {
        const bookings = await api.get('/api/bookings');
        renderBookings(bookings);
    } catch (e) {
        showTableError('bookings-tbody', e.message, 8);
    }
}

function renderBookings(bookings) {
    const tbody = document.getElementById('bookings-tbody');
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="no-data">No bookings found</td></tr>`;
        return;
    }
    tbody.innerHTML = bookings.map(b => {
        const slotNum = b.slot?.slotNumber || b.slotNumber || '–';
        return `
        <tr>
            <td>${b.id}</td>
            <td>${escHtml(b.customerName || b.customer || '–')}</td>
            <td>${escHtml(b.vehicleNumber || '–')}</td>
            <td>${escHtml(String(slotNum))}</td>
            <td>${formatDateTime(b.startTime)}</td>
            <td>${formatDateTime(b.endTime)}</td>
            <td>${statusBadge(b.status)}</td>
            <td>
                ${b.status === 'RESERVED' || b.status === 'ACTIVE'
                    ? `<button class="btn btn-xs btn-danger" onclick="cancelBooking(${b.id})">Cancel</button>`
                    : '–'}
            </td>
        </tr>`;
    }).join('');
}

async function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return;
    try {
        await api.delete(`/api/bookings/${id}`);
        showToast('Booking cancelled', 'success');
        loadBookings();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

/* ============================================================
   CHECK-IN / OUT (View Records Only)
   ============================================================ */

async function loadCheckinRecords() {
    showTableLoading('checkinout-tbody', 6);
    try {
        const records = await api.get('/api/checkinout');
        renderCheckinRecords(records);
    } catch (e) {
        showTableError('checkinout-tbody', e.message, 6);
    }
}

function renderCheckinRecords(records) {
    const tbody = document.getElementById('checkinout-tbody');
    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-data">No check-in/out records</td></tr>`;
        return;
    }
    tbody.innerHTML = records.map(r => {
        const customer = r.booking?.customerName || r.customerName || '–';
        const bookingId = r.booking?.id || r.bookingId || '–';
        return `
        <tr>
            <td>${r.id}</td>
            <td>${bookingId}</td>
            <td>${escHtml(String(customer))}</td>
            <td>${formatDateTime(r.checkInTime)}</td>
            <td>${r.checkOutTime ? formatDateTime(r.checkOutTime) : '<span class="badge badge-warning">Ongoing</span>'}</td>
            <td>${(r.penaltyAmount != null || r.penalty != null) ? '₹' + (r.penaltyAmount ?? r.penalty) : '₹0.00'}</td>
        </tr>`;
    }).join('');
}

/* ============================================================
   OCCUPANCY
   ============================================================ */
async function loadLotsForOccupancy() {
    try {
        if (_allLots.length === 0) _allLots = await api.get('/api/lots');
        const sel = document.getElementById('occupancy-lot-select');
        populateSelect(sel, _allLots, 'id', l => (l.lotName || l.name), 'Select a lot…');
    } catch { /* ignore */ }
}

async function checkOccupancy() {
    const lotId = document.getElementById('occupancy-lot-select').value;
    if (!lotId) { showToast('Please select a lot', 'warning'); return; }
    try {
        const result = await api.get(`/api/checkinout/occupancy/${lotId}`);
        const lot = _allLots.find(l => l.id == lotId);
        const resultDiv = document.getElementById('occupancy-result');
        const textEl    = document.getElementById('occupancy-text');
        resultDiv.style.display = 'block';
        const occupied = result.occupiedSlots ?? result.occupied ?? 0;
        const total = lot?.totalSlots ? ` / ${lot.totalSlots} total slots` : '';
        const pct = lot?.totalSlots ? ` (${Math.round((occupied / lot.totalSlots) * 100)}% full)` : '';
        textEl.textContent = ` Occupied: ${occupied}${total}${pct}`;
    } catch (e) {
        showToast(e.message, 'error');
    }
}

/* ============================================================
   Helpers
   ============================================================ */
function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function roleBadge(role) {
    const map = {
        ADMIN: 'badge-danger',
        PARKING_MANAGER: 'badge-warning',
        CUSTOMER: 'badge-primary',
    };
    return `<span class="badge ${map[role] || 'badge-secondary'}">${role || '–'}</span>`;
}

function showModalError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearModalErrors(prefix) {
    document.querySelectorAll(`[id^="${prefix}-"][id$="-err"]`).forEach(el => {
        el.textContent = ''; el.style.display = 'none';
    });
}
