import { api, setAuth } from '../api.js';
import { showToast } from '../components/toast.js';

export function renderAuthView(container) {
    let mode = 'login';

    container.innerHTML = `
        <div class="auth-card" id="auth-card">
            <div class="auth-logo">
                <div class="brand-mark"><i data-lucide="orbit"></i></div>
                <span style="font-family:var(--font-display);font-weight:800;font-size:1.3rem;">Nova</span>
            </div>
            <div class="auth-tabs">
                <div class="auth-tab active" data-mode="login">Sign in</div>
                <div class="auth-tab" data-mode="register">Create account</div>
            </div>
            <div id="auth-form-slot"></div>
            <div class="auth-foot" id="auth-foot"></div>
        </div>
    `;

    const card = document.getElementById('auth-card');
    card.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 768) return;
        const rect = card.getBoundingClientRect();
        const rotY = (((e.clientX - rect.left) / rect.width) - 0.5) * 6;
        const rotX = (((e.clientY - rect.top) / rect.height) - 0.5) * -6;
        card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = 'rotateX(0) rotateY(0)'; });

    container.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            mode = tab.dataset.mode;
            container.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderForm();
        });
    });

    function renderForm() {
        const slot = document.getElementById('auth-form-slot');
        const foot = document.getElementById('auth-foot');

        if (mode === 'login') {
            slot.innerHTML = `
                <form id="login-form">
                    <div class="field">
                        <label>Email</label>
                        <input class="input" type="email" name="email" placeholder="you@example.com" required>
                    </div>
                    <div class="field">
                        <label>Password</label>
                        <input class="input" type="password" name="password" placeholder="Enter your password" required>
                    </div>
                    <button class="btn btn-primary btn-block" type="submit"><i data-lucide="log-in"></i> Sign in</button>
                </form>
            `;
            foot.innerHTML = `New here? <a href="#" class="link-accent" id="switch-register">Create an account</a>`;
            if (window.lucide) window.lucide.createIcons();

            document.getElementById('switch-register').addEventListener('click', (e) => {
                e.preventDefault();
                mode = 'register';
                container.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'register'));
                renderForm();
            });

            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button');
                const fd = new FormData(e.target);
                btn.disabled = true;
                btn.innerHTML = 'Signing in&hellip;';
                try {
                    const res = await api.post('/auth/login', { email: fd.get('email'), password: fd.get('password') });
                    setAuth(res.data || res);
                    showToast('Welcome back', 'success');
                    window.location.href = '/';
                } catch (err) {
                    showToast(err.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="log-in"></i> Sign in';
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        } else {
            slot.innerHTML = `
                <form id="register-form">
                    <div class="field">
                        <label>Name</label>
                        <input class="input" name="name" placeholder="Kathiravan E" required minlength="2">
                    </div>
                    <div class="field">
                        <label>Email</label>
                        <input class="input" type="email" name="email" placeholder="you@example.com" required>
                    </div>
                    <div class="field">
                        <label>Password</label>
                        <input class="input" type="password" name="password" placeholder="At least 8 characters" required minlength="8">
                    </div>
                    <button class="btn btn-primary btn-block" type="submit"><i data-lucide="user-plus"></i> Create account</button>
                </form>
            `;
            foot.innerHTML = `Already have an account? <a href="#" class="link-accent" id="switch-login">Sign in</a>`;
            if (window.lucide) window.lucide.createIcons();

            document.getElementById('switch-login').addEventListener('click', (e) => {
                e.preventDefault();
                mode = 'login';
                container.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'login'));
                renderForm();
            });

            document.getElementById('register-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button');
                const fd = new FormData(e.target);
                btn.disabled = true;
                btn.innerHTML = 'Creating account&hellip;';
                try {
                    const res = await api.post('/auth/register', {
                        name: fd.get('name'),
                        email: fd.get('email'),
                        password: fd.get('password')
                    });
                    setAuth(res.data || res);
                    showToast('Account created', 'success');
                    window.location.href = '/';
                } catch (err) {
                    showToast(err.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="user-plus"></i> Create account';
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        }
    }

    renderForm();
    if (window.lucide) window.lucide.createIcons();
}
