/* ============================================================
   ParkSmart – Manager Dashboard Logic (manager.js)
   ============================================================ */

if (!requireAuth(['PARKING_MANAGER', 'ADMIN'])) { /* redirected */ }

let _allLots  = [];
let _allSlots = [];

document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    document.getElementById('username-display').textContent = user.username || 'Manager';
    document.getElementById('dash-username').textContent    = user.username || 'Manager';
    const avatar = document.getElementById('user-avatar');
    if (avatar && user.username) avatar.textContent = user.username[0].toUpperCase();

    initSidebar('dashboard');

    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const s = item.dataset.section;
            if (s === 'dashboard')  loadDashboardStats();
            if (s === 'lots')       loadLots();
            if (s === 'slots')      loadLotsForSelects().then(loadSlots);
            if (s === 'bookings')   loadBookings();
            if (s === 'checkinout') loadCheckinRecords();
            if (s === 'occupancy')  loadLotsForOccupancy();
        });
    });

    loadDashboardStats();
});

function gotoSection(name) {
    document.querySelector(`.nav-item[data-section="${name}"]`)?.click();
}

/* ============================================================
   STATS
   ============================================================ */
async function loadDashboardStats() {
    try {
        const [lots, slots, bookings, checkins] = await Promise.allSettled([
            api.get('/api/lots'),
            api.get('/api/slots'),
            api.get('/api/bookings'),
            api.get('/api/checkinout'),
        ]);
        setText('stat-lots',     lots.value?.length ?? '–');
        setText('stat-slots',    slots.value?.length ?? '–');
        const activeBookings = bookings.value?.filter(b => b.status === 'RESERVED' || b.status === 'ACTIVE');
        setText('stat-bookings', activeBookings?.length ?? bookings.value?.length ?? '–');
        setText('stat-checkins', checkins.value?.length ?? '–');
    } catch (e) { console.error(e); }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ============================================================
   LOTS (full CRUD)
   ============================================================ */
async function loadLots() {
    showTableLoading('lots-tbody', 7);
    try {
        _allLots = await api.get('/api/lots');
        renderLots(_allLots);
    } catch (e) {
        showTableError('lots-tbody', e.message, 7);
    }
}

function renderLots(lots) {
    const tbody = document.getElementById('lots-tbody');
    if (!lots || lots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No parking lots found</td></tr>`;
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
            <td>
                <div class="btn-group">
                    <button class="btn btn-xs btn-primary" onclick="editLot(${l.id})">Edit</button>
                    <button class="btn btn-xs btn-danger" onclick="deleteLot(${l.id},'${escHtml(l.lotName || l.name || '')}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function resetLotForm() {
    document.getElementById('lot-modal-title').textContent = 'Add Parking Lot';
    ['lot-id','lot-name','lot-location','lot-total-slots','lot-penalty-rate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const unitEl = document.getElementById('lot-penalty-unit-minutes');
    if (unitEl) unitEl.value = '30';
}

function editLot(id) {
    const lot = _allLots.find(l => l.id === id);
    if (!lot) return;
    document.getElementById('lot-modal-title').textContent = 'Edit Parking Lot';
    document.getElementById('lot-id').value = lot.id;
    document.getElementById('lot-name').value = lot.lotName || lot.name || '';
    document.getElementById('lot-location').value = lot.location || '';
    document.getElementById('lot-total-slots').value = lot.totalSlots ?? '';
    document.getElementById('lot-penalty-rate').value = lot.penaltyRate ?? '';
    document.getElementById('lot-penalty-unit-minutes').value = lot.penaltyUnitMinutes ?? 30;
    openModal('lot-modal');
}

async function saveLot() {
    const id       = document.getElementById('lot-id').value;
    const lotName  = document.getElementById('lot-name').value.trim();
    const location = document.getElementById('lot-location').value.trim();
    const totalSlots = parseInt(document.getElementById('lot-total-slots').value) || null;
    const penaltyRate = parseFloat(document.getElementById('lot-penalty-rate').value) || 0;
    const penaltyUnitMinutes = parseInt(document.getElementById('lot-penalty-unit-minutes').value) || 30;

    if (!lotName)  { showToast('Lot name is required', 'error'); return; }
    if (!location) { showToast('Location is required', 'error'); return; }
    if (!totalSlots || totalSlots <= 0) { showToast('Total slots must be greater than 0', 'error'); return; }

    const payload = {
        lotName,
        name: lotName,
        location,
        totalSlots,
        penaltyRate,
        penaltyUnitMinutes
    };
    try {
        if (id) {
            await api.put(`/api/lots/${id}`, payload);
            showToast('Parking lot updated', 'success');
        } else {
            await api.post('/api/lots', payload);
            showToast('Parking lot created', 'success');
        }
        closeModal('lot-modal');
        loadLots();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function deleteLot(id, name) {
    if (!confirm(`Delete lot "${name}"? This cannot be undone.`)) return;
    try {
        await api.delete(`/api/lots/${id}`);
        showToast('Parking lot deleted', 'success');
        loadLots();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

/* ============================================================
   SLOTS (full CRUD)
   ============================================================ */
async function loadLotsForSelects() {
    try {
        if (_allLots.length === 0) _allLots = await api.get('/api/lots');
        populateSelect(document.getElementById('slot-lot-id'), _allLots, 'id', l => l.lotName || l.name, 'Select Lot…');
        const filterSel = document.getElementById('slots-lot-filter');
        if (filterSel) {
            filterSel.innerHTML = '<option value="">All Lots</option>';
            _allLots.forEach(l => {
                const o = document.createElement('option');
                o.value = l.id; o.textContent = l.lotName || l.name;
                filterSel.appendChild(o);
            });
        }
    } catch { /* ignore */ }
}

async function loadSlots() {
    showTableLoading('slots-tbody', 6);
    try {
        const lotId = document.getElementById('slots-lot-filter')?.value;
        _allSlots = lotId
            ? await api.get(`/api/slots/lot/${lotId}`)
            : await api.get('/api/slots');
        renderSlots(_allSlots);
    } catch (e) {
        showTableError('slots-tbody', e.message, 6);
    }
}

function renderSlots(slots) {
    const tbody = document.getElementById('slots-tbody');
    if (!slots || slots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-data">No slots found</td></tr>`;
        return;
    }
    tbody.innerHTML = slots.map(s => {
        const lotName = s.parkingLot?.lotName || s.parkingLot?.name || s.lot?.name || s.lotName || '–';
        const type = s.slotType || s.type || '–';
        return `
        <tr>
            <td>${s.id}</td>
            <td><strong>${escHtml(s.slotNumber || s.number || '')}</strong></td>
            <td>${type}</td>
            <td>${statusBadge(s.status)}</td>
            <td>${escHtml(String(lotName))}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-xs btn-primary" onclick="editSlot(${s.id})">Edit</button>
                    <button class="btn btn-xs btn-danger" onclick="deleteSlot(${s.id})">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function resetSlotForm() {
    document.getElementById('slot-modal-title').textContent = 'Add Slot';
    document.getElementById('slot-id').value = '';
    document.getElementById('slot-number').value = '';
    document.getElementById('slot-type').value = 'CAR';
    document.getElementById('slot-status').value = 'ACTIVE';
    if (_allLots.length > 0) {
        populateSelect(document.getElementById('slot-lot-id'), _allLots, 'id', l => l.lotName || l.name, 'Select Lot…');
    }
}

function editSlot(id) {
    const slot = _allSlots.find(s => s.id === id);
    if (!slot) return;
    document.getElementById('slot-modal-title').textContent = 'Edit Slot';
    document.getElementById('slot-id').value = slot.id;
    document.getElementById('slot-number').value = slot.slotNumber || slot.number || '';
    document.getElementById('slot-type').value = slot.slotType || slot.type || 'CAR';
    document.getElementById('slot-status').value = slot.status || 'ACTIVE';
    const lotId = slot.parkingLot?.id || slot.lot?.id || slot.lotId;
    if (lotId) document.getElementById('slot-lot-id').value = lotId;
    openModal('slot-modal');
}

async function saveSlot() {
    const id         = document.getElementById('slot-id').value;
    const lotId      = document.getElementById('slot-lot-id').value;
    const slotNumber = document.getElementById('slot-number').value.trim();
    const type       = document.getElementById('slot-type').value;
    const status     = document.getElementById('slot-status').value;

    if (!lotId)      { showToast('Please select a lot', 'error'); return; }
    if (!slotNumber) { showToast('Slot number is required', 'error'); return; }

    const parsedLotId = parseInt(lotId);
    const payload = {
        slotNumber,
        slotType: type,
        type,
        status,
        parkingLot: { id: parsedLotId },
        lot: { id: parsedLotId }
    };
    try {
        if (id) {
            await api.put(`/api/slots/${id}`, payload);
            showToast('Slot updated', 'success');
        } else {
            await api.post('/api/slots', payload);
            showToast('Slot created', 'success');
        }
        closeModal('slot-modal');
        loadSlots();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function deleteSlot(id) {
    if (!confirm('Delete this slot?')) return;
    try {
        await api.delete(`/api/slots/${id}`);
        showToast('Slot deleted', 'success');
        loadSlots();
    } catch (e) {
        showToast(e.message, 'error');
    }
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
            <td>${escHtml(b.customerName || '–')}</td>
            <td>${escHtml(b.vehicleNumber || '–')}</td>
            <td>${escHtml(String(slotNum))}</td>
            <td>${formatDateTime(b.startTime)}</td>
            <td>${formatDateTime(b.endTime)}</td>
            <td>${statusBadge(b.status)}</td>
            <td>${b.status === 'RESERVED' || b.status === 'ACTIVE'
                ? `<button class="btn btn-xs btn-danger" onclick="cancelBooking(${b.id})">Cancel</button>`
                : '–'}</td>
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
   CHECK-IN / OUT
   ============================================================ */
async function doCheckin() {
    const bookingId = document.getElementById('checkin-booking-id').value;
    if (!bookingId) { showToast('Enter a booking ID', 'warning'); return; }
    try {
        await api.post(`/api/checkinout/checkin/${bookingId}`);
        showToast(`Checked in booking #${bookingId}`, 'success');
        document.getElementById('checkin-booking-id').value = '';
        loadCheckinRecords();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function doCheckout() {
    const bookingId = document.getElementById('checkout-booking-id').value;
    if (!bookingId) { showToast('Enter a booking ID', 'warning'); return; }
    try {
        await api.put(`/api/checkinout/checkout/${bookingId}`);
        showToast(`Checked out booking #${bookingId}`, 'success');
        document.getElementById('checkout-booking-id').value = '';
        loadCheckinRecords();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function loadCheckinRecords() {
    showTableLoading('checkinout-tbody', 6);
    try {
        const records = await api.get('/api/checkinout');
        if (!records || records.length === 0) {
            document.getElementById('checkinout-tbody').innerHTML =
                `<tr><td colspan="6" class="no-data">No records found</td></tr>`;
            return;
        }
        document.getElementById('checkinout-tbody').innerHTML = records.map(r => {
            const customer  = r.booking?.customerName || r.customerName || '–';
            const bookingId = r.booking?.id || r.bookingId || '–';
            const penalty = r.penaltyAmount != null ? '₹' + r.penaltyAmount : (r.penalty != null ? '₹' + r.penalty : '–');
            return `
            <tr>
                <td>${r.id}</td>
                <td>${bookingId}</td>
                <td>${escHtml(String(customer))}</td>
                <td>${formatDateTime(r.checkInTime)}</td>
                <td>${r.checkOutTime ? formatDateTime(r.checkOutTime) : '<span class="badge badge-warning">Ongoing</span>'}</td>
                <td>${penalty}</td>
            </tr>`;
        }).join('');
    } catch (e) {
        showTableError('checkinout-tbody', e.message, 6);
    }
}

/* ============================================================
   OCCUPANCY
   ============================================================ */
async function loadLotsForOccupancy() {
    try {
        if (_allLots.length === 0) _allLots = await api.get('/api/lots');
        populateSelect(document.getElementById('occupancy-lot-select'), _allLots, 'id', l => l.lotName || l.name, 'Select a lot…');
    } catch { /* ignore */ }
}

async function checkOccupancy() {
    const lotId = document.getElementById('occupancy-lot-select').value;
    if (!lotId) { showToast('Please select a lot', 'warning'); return; }
    try {
        const result = await api.get(`/api/checkinout/occupancy/${lotId}`);
        const resultDiv = document.getElementById('occupancy-result');
        const textEl    = document.getElementById('occupancy-text');
        resultDiv.style.display = 'block';
        if (typeof result === 'object' && result !== null) {
            const occ = result.occupiedSlots ?? result.occupied ?? 0;
            const tot = result.totalSlots ?? result.total ?? 0;
            const pct = result.occupancyPercentage != null ? `${result.occupancyPercentage}%` : '';
            textEl.innerHTML = `Occupied Slots: <strong>${occ}</strong> / <strong>${tot}</strong> ${pct ? `(${pct})` : ''}`;
        } else {
            textEl.textContent = ` ${result}`;
        }
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
