/* ============================================================
   ParkSmart – Login Page Logic (login.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to appropriate dashboard
    if (getToken() && getUser().role) {
        redirectByRole();
        return;
    }

    const form      = document.getElementById('login-form');
    const alertEl   = document.getElementById('login-alert');
    const alertMsg  = document.getElementById('login-alert-msg');
    const submitBtn = document.getElementById('login-submit');
    const pwToggle  = document.getElementById('pw-toggle');
    const pwInput   = document.getElementById('password');

    // Toggle password visibility
    if (pwToggle && pwInput) {
        pwToggle.addEventListener('click', () => {
            const isText = pwInput.type === 'text';
            pwInput.type = isText ? 'password' : 'text';
            pwToggle.textContent = isText ? '👁' : '🙈';
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const username = document.getElementById('username').value.trim();
        const password = pwInput.value;

        // Client-side validation
        let valid = true;
        if (!username) { showFieldError('username-error', 'Username is required'); valid = false; }
        if (!password) { showFieldError('password-error', 'Password is required'); valid = false; }
        if (!valid) return;

        setLoading(true);

        try {
            const data = await api.post('/api/auth/login', { username, password });
            saveAuth(data);
            showAlert('Login successful! Redirecting…', 'success');
            setTimeout(() => redirectByRole(), 700);
        } catch (err) {
            showAlert(err.message || 'Invalid username or password', 'error');
            setLoading(false);
        }
    });

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtn.innerHTML = loading
            ? '<span class="spinner"></span> Signing in…'
            : 'Sign In';
    }

    function showAlert(msg, type) {
        alertEl.className = `auth-alert auth-alert-${type === 'error' ? 'error' : 'success'} show`;
        alertMsg.textContent = msg;
    }

    function showFieldError(id, msg) {
        const el = document.getElementById(id);
        if (el) { el.textContent = msg; el.classList.add('show'); }
    }

    function clearErrors() {
        document.querySelectorAll('.field-error').forEach(el => {
            el.textContent = ''; el.classList.remove('show');
        });
        alertEl.classList.remove('show');
    }
});
