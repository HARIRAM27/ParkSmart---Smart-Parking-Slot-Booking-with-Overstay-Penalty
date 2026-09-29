/* ============================================================
   ParkSmart – Register Page Logic (register.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect
    if (getToken() && getUser().role) {
        redirectByRole();
        return;
    }

    const form      = document.getElementById('register-form');
    const alertEl   = document.getElementById('register-alert');
    const alertMsg  = document.getElementById('register-alert-msg');
    const submitBtn = document.getElementById('register-submit');
    const pwToggle  = document.getElementById('pw-toggle');
    const pw2Toggle = document.getElementById('pw2-toggle');
    const pwInput   = document.getElementById('password');
    const pw2Input  = document.getElementById('confirm-password');

    // Toggle password visibility
    function addPwToggle(toggleBtn, inputEl) {
        if (!toggleBtn || !inputEl) return;
        toggleBtn.addEventListener('click', () => {
            const isText = inputEl.type === 'text';
            inputEl.type = isText ? 'password' : 'text';
            toggleBtn.textContent = isText ? '👁' : '🙈';
        });
    }
    addPwToggle(pwToggle, pwInput);
    addPwToggle(pw2Toggle, pw2Input);

    // Real-time password match check
    if (pw2Input) {
        pw2Input.addEventListener('input', () => {
            if (pwInput.value && pw2Input.value && pwInput.value !== pw2Input.value) {
                document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
                document.getElementById('confirm-password-error').classList.add('show');
            } else {
                document.getElementById('confirm-password-error').classList.remove('show');
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const username  = document.getElementById('username').value.trim();
        const email     = document.getElementById('email').value.trim();
        const password  = pwInput.value;
        const password2 = pw2Input.value;

        // Validation
        let valid = true;
        if (!username || username.length < 3) {
            showFieldError('username-error', 'Username must be at least 3 characters'); valid = false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError('email-error', 'Enter a valid email address'); valid = false;
        }
        if (!password || password.length < 6) {
            showFieldError('password-error', 'Password must be at least 6 characters'); valid = false;
        }
        if (password !== password2) {
            showFieldError('confirm-password-error', 'Passwords do not match'); valid = false;
        }
        if (!valid) return;

        setLoading(true);

        try {
            await api.post('/api/auth/register', { username, email, password });
            showAlert('Registration successful! Redirecting to login…', 'success');
            setTimeout(() => { window.location.href = '/login.html'; }, 1800);
        } catch (err) {
            showAlert(err.message || 'Registration failed. Please try again.', 'error');
            setLoading(false);
        }
    });

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtn.innerHTML = loading
            ? '<span class="spinner"></span> Creating account…'
            : 'Create Account';
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
