import { api, getUser, setAuth } from '../api.js';
import { showToast } from '../components/toast.js';
import { applyTilt } from '../components/tilt.js';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

export async function renderProfileView(container) {
    const localUser = getUser();
    container.innerHTML = `
        <div class="grid" style="grid-template-columns:1fr;max-width:640px;">
            <div class="card tilt">
                <div class="card-header">
                    <div class="flex items-center gap-4">
                        <div class="user-avatar" style="width:56px;height:56px;font-size:1.3rem;">${(localUser.name || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                            <h3 style="margin-bottom:2px;">${localUser.name || ''}</h3>
                            <div style="font-size:.84rem;color:var(--text-muted);">${localUser.email || ''}</div>
                        </div>
                    </div>
                </div>
                <div id="profile-form-slot"><div class="skeleton skeleton-text" style="height:8rem;"></div></div>
            </div>
        </div>
    `;

    if (!localUser.id) {
        document.getElementById('profile-form-slot').innerHTML = `<p>Could not determine your account. Please sign in again.</p>`;
        return;
    }

    let user = {};
    try {
        const res = await api.get(`/users/${localUser.id}`);
        user = res.data || {};
    } catch (err) {
        showToast(err.message, 'error');
        user = { name: localUser.name, email: localUser.email, currency: 'USD' };
    }

    const slot = document.getElementById('profile-form-slot');
    slot.innerHTML = `
        <form id="profile-form">
            <div class="field">
                <label>Name</label>
                <input class="input" name="name" required minlength="2" placeholder="Kathiravan E" value="${user.name || ''}">
            </div>
            <div class="field"><label>Email</label><input class="input" type="email" name="email" required value="${user.email || ''}"></div>
            <div class="field-row">
                <div class="field"><label>Phone (optional)</label><input class="input" name="phoneNumber" value="${user.phoneNumber || ''}" placeholder="+1 555 000 0000"></div>
                <div class="field"><label>Monthly income (optional)</label><input class="input" type="number" step="0.01" min="0" name="monthlyIncome" value="${user.monthlyIncome ?? ''}" placeholder="0.00"></div>
            </div>
            <div class="field"><label>Currency</label>
                <select class="input" name="currency">${CURRENCIES.map(c => `<option ${user.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Save changes</button>
        </form>
    `;
    if (window.lucide) window.lucide.createIcons();
    applyTilt(container);

    document.getElementById('profile-form').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const payload = {
            name: fd.get('name'),
            email: fd.get('email'),
            phoneNumber: fd.get('phoneNumber') || null,
            monthlyIncome: fd.get('monthlyIncome') ? parseFloat(fd.get('monthlyIncome')) : null,
            currency: fd.get('currency'),
            profileImageUrl: user.profileImageUrl || null,
            emailVerified: user.emailVerified || false,
            isActive: true
        };
        const btn = ev.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            await api.put(`/users/${localUser.id}`, payload);
            setAuth({ name: payload.name, email: payload.email });
            showToast('Profile updated', 'success');
            setTimeout(() => window.location.reload(), 600);
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
        }
    });
}
