/* ============================================================
   ParkSmart – Customer Dashboard Logic (customer.js)
   ============================================================ */

if (!requireAuth(['CUSTOMER', 'PARKING_MANAGER', 'ADMIN'])) { /* redirected */ }

let _allLots      = [];
let _myBookings   = [];
let _searchStart  = '';
let _searchEnd    = '';
let _selectedLotId = null;

document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    document.getElementById('username-display').textContent = user.username || 'Customer';
    document.getElementById('dash-username').textContent    = user.username || '';

    const avatar = document.getElementById('user-avatar');
    const profileAvatar = document.getElementById('profile-avatar');
    const initial = user.username ? user.username[0].toUpperCase() : 'C';
    if (avatar) avatar.textContent = initial;
    if (profileAvatar) profileAvatar.textContent = initial;

    // Profile section
    setText('profile-username', user.username || '–');
    setText('profile-email', user.email || '–');
    setText('profile-role', user.role || '–');

    // Set default datetime values (now + 1 hour, now + 2 hours)
    const now   = new Date();
    const plus1 = new Date(now.getTime() + 60 * 60 * 1000);
    const plus2 = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    document.getElementById('find-start').value = toDatetimeLocal(plus1);
    document.getElementById('find-end').value   = toDatetimeLocal(plus2);

    initSidebar('dashboard');

    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const s = item.dataset.section;
            if (s === 'dashboard')   loadDashboardStats();
            if (s === 'find')        loadLotsForFindParking();
            if (s === 'mybookings')  loadMyBookings();
            if (s === 'history')     loadBookingHistory();
            if (s === 'checkininfo') loadMyCheckins();
            if (s === 'profile')     renderProfile();
        });
    });

    loadDashboardStats();
    loadLotsForFindParking();
});

function gotoSection(name) {
    document.querySelector(`.nav-item[data-section="${name}"]`)?.click();
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/** Format a Date to datetime-local input value */
function toDatetimeLocal(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ============================================================
   DASHBOARD STATS
   ============================================================ */
async function loadDashboardStats() {
    try {
        const bookings = await api.get('/api/bookings/my');
        _myBookings = bookings || [];
        const now = new Date();
        const active    = _myBookings.filter(b => b.status === 'ACTIVE').length;
        const upcoming  = _myBookings.filter(b => b.status === 'RESERVED' && new Date(b.startTime) > now).length;
        const completed = _myBookings.filter(b => b.status === 'COMPLETED').length;
        const cancelled = _myBookings.filter(b => b.status === 'CANCELLED').length;
        setText('stat-active',    active);
        setText('stat-upcoming',  upcoming);
        setText('stat-completed', completed);
        setText('stat-cancelled', cancelled);
    } catch (e) {
        console.error('Stats error', e);
    }
}

/* ============================================================
   FIND PARKING
   ============================================================ */
async function loadLotsForFindParking() {
    try {
        if (_allLots.length === 0) _allLots = await api.get('/api/lots');
        populateSelect(document.getElementById('find-lot'), _allLots, 'id', l => l.lotName || l.name, 'Select a parking lot…');
    } catch (e) {
        showToast('Failed to load parking lots', 'error');
    }
}

async function searchAvailableSlots() {
    const lotId = document.getElementById('find-lot').value;
    const start = document.getElementById('find-start').value;
    const end   = document.getElementById('find-end').value;

    if (!lotId) { showToast('Please select a parking lot', 'warning'); return; }
    if (!start) { showToast('Please select a start time', 'warning'); return; }
    if (!end)   { showToast('Please select an end time', 'warning'); return; }
    if (new Date(end) <= new Date(start)) {
        showToast('End time must be after start time', 'error');
        return;
    }

    _searchStart = toLocalDateTime(start);
    _searchEnd   = toLocalDateTime(end);
    _selectedLotId = lotId;

    const resultsCard = document.getElementById('find-results-card');
    resultsCard.style.display = 'block';
    showTableLoading('available-slots-tbody', 5);

    try {
        const slots = await api.get(
            `/api/bookings/available/${lotId}?startTime=${encodeURIComponent(_searchStart)}&endTime=${encodeURIComponent(_searchEnd)}`
        );
        renderAvailableSlots(slots);
    } catch (e) {
        showTableError('available-slots-tbody', e.message, 5);
    }
}

function renderAvailableSlots(slots) {
    const tbody = document.getElementById('available-slots-tbody');
    if (!slots || slots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="no-data">No available slots found for the selected time.</td></tr>`;
        return;
    }
    tbody.innerHTML = slots.map(s => {
        const lotName = s.parkingLot?.lotName || s.parkingLot?.name || s.lot?.name || s.lotName || '–';
        const type = s.slotType || s.type || 'CAR';
        return `
        <tr>
            <td><strong>${escHtml(s.slotNumber || s.number || '')}</strong></td>
            <td>${type}</td>
            <td>${statusBadge(s.status || 'ACTIVE')}</td>
            <td>${escHtml(String(lotName))}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="openBookingModal(${s.id}, '${escHtml(s.slotNumber || '')}', '${escHtml(String(lotName))}')">
                    Book Now
                </button>
            </td>
        </tr>`;
    }).join('');
}

/* ============================================================
   BOOKING MODAL
   ============================================================ */
function openBookingModal(slotId, slotNumber, lotName) {
    document.getElementById('bk-slot-id').value    = slotId;
    document.getElementById('bk-slot-info').textContent = `${slotNumber} – ${lotName}`;
    document.getElementById('bk-start-time').value = _searchStart;
    document.getElementById('bk-end-time').value   = _searchEnd;
    document.getElementById('bk-start-display').value = formatDateTime(_searchStart);
    document.getElementById('bk-end-display').value   = formatDateTime(_searchEnd);
    document.getElementById('bk-customer-name').value = '';
    document.getElementById('bk-vehicle-number').value = '';

    // Pre-fill customer name from profile
    const user = getUser();
    if (user.username) document.getElementById('bk-customer-name').value = user.username;

    clearBookingErrors();
    openModal('booking-modal');
}

async function confirmBooking() {
    clearBookingErrors();
    const slotId       = document.getElementById('bk-slot-id').value;
    const customerName = document.getElementById('bk-customer-name').value.trim();
    const vehicleNumber = document.getElementById('bk-vehicle-number').value.trim();
    const startTime    = document.getElementById('bk-start-time').value;
    const endTime      = document.getElementById('bk-end-time').value;

    let valid = true;
    if (!customerName)  { document.getElementById('bk-customer-err').textContent = 'Customer name required'; valid = false; }
    if (!vehicleNumber) { document.getElementById('bk-vehicle-err').textContent = 'Vehicle number required'; valid = false; }
    if (!valid) return;

    const payload = {
        slot:         { id: parseInt(slotId) },
        customerName,
        vehicleNumber,
        startTime,
        endTime
    };

    try {
        const booking = await api.post('/api/bookings', payload);
        closeModal('booking-modal');
        showToast(`Booking confirmed! ID: ${booking.id}`, 'success');
        gotoSection('mybookings');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function clearBookingErrors() {
    document.getElementById('bk-customer-err').textContent = '';
    document.getElementById('bk-vehicle-err').textContent  = '';
}

/* ============================================================
   MY BOOKINGS (active/reserved)
   ============================================================ */
async function loadMyBookings() {
    showTableLoading('mybookings-tbody', 7);
    try {
        const bookings = await api.get('/api/bookings/my');
        _myBookings = bookings || [];
        const active = bookings.filter(b => b.status === 'RESERVED' || b.status === 'ACTIVE');
        renderMyBookings(active);
    } catch (e) {
        showTableError('mybookings-tbody', e.message, 7);
    }
}

function renderMyBookings(bookings) {
    const tbody = document.getElementById('mybookings-tbody');
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No active bookings</td></tr>`;
        return;
    }
    tbody.innerHTML = bookings.map(b => {
        const slotNum = b.slot?.slotNumber || b.slotNumber || '–';
        const lotName = b.slot?.parkingLot?.lotName || b.slot?.parkingLot?.name || b.slot?.lot?.name || '';
        const slotDisplay = lotName ? `${slotNum} (${lotName})` : slotNum;
        return `
        <tr>
            <td>${b.id}</td>
            <td><strong>${escHtml(String(slotDisplay))}</strong></td>
            <td>${escHtml(b.vehicleNumber || '–')}</td>
            <td>${formatDateTime(b.startTime)}</td>
            <td>${formatDateTime(b.endTime)}</td>
            <td>${statusBadge(b.status)}</td>
            <td>${b.status === 'RESERVED'
                ? `<button class="btn btn-xs btn-danger" onclick="cancelMyBooking(${b.id})">Cancel</button>`
                : '–'}</td>
        </tr>`;
    }).join('');
}

async function cancelMyBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
        await api.delete(`/api/bookings/${id}`);
        showToast('Booking cancelled', 'success');
        loadMyBookings();
        loadDashboardStats();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

/* ============================================================
   BOOKING HISTORY (completed / cancelled)
   ============================================================ */
async function loadBookingHistory() {
    showTableLoading('history-tbody', 6);
    try {
        const bookings = await api.get('/api/bookings/my');
        const history  = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED');
        const tbody = document.getElementById('history-tbody');
        if (!history || history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">No booking history</td></tr>`;
            return;
        }
        tbody.innerHTML = history.map(b => {
            const slotNum = b.slot?.slotNumber || b.slotNumber || '–';
            const lotName = b.slot?.parkingLot?.lotName || b.slot?.parkingLot?.name || b.slot?.lot?.name || '';
            const slotDisplay = lotName ? `${slotNum} (${lotName})` : slotNum;
            return `
            <tr>
                <td>${b.id}</td>
                <td><strong>${escHtml(String(slotDisplay))}</strong></td>
                <td>${escHtml(b.vehicleNumber || '–')}</td>
                <td>${formatDateTime(b.startTime)}</td>
                <td>${formatDateTime(b.endTime)}</td>
                <td>${statusBadge(b.status)}</td>
            </tr>`;
        }).join('');
    } catch (e) {
        showTableError('history-tbody', e.message, 6);
    }
}

/* ============================================================
   CHECK-INS & PENALTIES
   ============================================================ */
async function loadMyCheckins() {
    showTableLoading('mycheckins-tbody', 7);
    try {
        const records = await api.get('/api/checkinout/my');
        const tbody = document.getElementById('mycheckins-tbody');
        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="no-data">No check-in/out records found</td></tr>`;
            return;
        }
        tbody.innerHTML = records.map(r => {
            const b = r.booking || {};
            const slotNum = b.slot?.slotNumber || b.slotNumber || '–';
            const lotName = b.slot?.parkingLot?.lotName || b.slot?.parkingLot?.name || b.slot?.lot?.name || '';
            const slotLot = lotName ? `${slotNum} (${lotName})` : slotNum;
            const penalty = r.penaltyAmount != null ? '₹' + r.penaltyAmount : (r.penalty != null ? '₹' + r.penalty : '₹0.00');
            const overstay = r.overstayMinutes != null ? `${r.overstayMinutes} mins` : '0 mins';
            return `
            <tr>
                <td>${r.id}</td>
                <td>${b.id || r.bookingId || '–'}</td>
                <td>${escHtml(String(slotLot))}</td>
                <td>${formatDateTime(r.checkInTime)}</td>
                <td>${r.checkOutTime ? formatDateTime(r.checkOutTime) : '<span class="badge badge-warning">Ongoing</span>'}</td>
                <td>${overstay}</td>
                <td><strong>${penalty}</strong></td>
            </tr>`;
        }).join('');
    } catch (e) {
        showTableError('mycheckins-tbody', e.message, 7);
    }
}

async function lookupCheckin() {
    const bookingId = document.getElementById('lookup-booking-id').value;
    if (!bookingId) { showToast('Please enter a booking ID', 'warning'); return; }

    const detailDiv   = document.getElementById('checkin-detail');
    const notFoundDiv = document.getElementById('checkin-not-found');
    detailDiv.style.display   = 'none';
    notFoundDiv.style.display = 'none';

    try {
        const record = await api.get(`/api/checkinout/booking/${bookingId}`);
        if (!record) {
            notFoundDiv.style.display = 'block';
            return;
        }
        const data = Array.isArray(record) ? record[0] : record;
        const penalty = data.penaltyAmount != null ? '₹' + data.penaltyAmount : (data.penalty != null ? '₹' + data.penalty : '₹0.00');
        const overstay = data.overstayMinutes != null ? `${data.overstayMinutes} mins` : '0 mins';
        setText('ci-booking-id', data.booking?.id || bookingId);
        setText('ci-customer',  data.booking?.customerName || data.customerName || '–');
        setText('ci-checkin',   formatDateTime(data.checkInTime));
        setText('ci-checkout',  data.checkOutTime ? formatDateTime(data.checkOutTime) : 'Not checked out yet');
        setText('ci-overstay',  overstay);
        setText('ci-penalty',   penalty);
        detailDiv.style.display = 'block';
    } catch (e) {
        notFoundDiv.style.display = 'block';
    }
}

/* ============================================================
   PROFILE
   ============================================================ */
function renderProfile() {
    const user = getUser();
    setText('profile-username', user.username || '–');
    setText('profile-email',    user.email    || '–');
    setText('profile-role',     user.role     || '–');
    const pa = document.getElementById('profile-avatar');
    if (pa && user.username) pa.textContent = user.username[0].toUpperCase();
}

/* ============================================================
   Helpers
   ============================================================ */
function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
