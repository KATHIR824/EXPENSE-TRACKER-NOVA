import { api, getUser, clearAuth } from '../api.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { applyTilt } from '../components/tilt.js';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CNY'];

export async function renderProfileView(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between mb-6" style="flex-wrap:wrap;gap:.75rem;">
            <div></div>
        </div>
        <div class="dashboard-grid">
            <div class="card tilt">
                <div class="card-header"><h3 class="card-title">Account details</h3></div>
                <div class="card-body" id="profile-details">
                    <div class="skeleton-stat-card" style="height:220px;"></div>
                </div>
            </div>
            <div class="card tilt">
                <div class="card-header"><h3 class="card-title">Preferences</h3></div>
                <div class="card-body" id="profile-preferences">
                    <div class="skeleton-stat-card" style="height:120px;"></div>
                </div>
            </div>
        </div>
        <div class="card tilt mt-6">
            <div class="card-header"><h3 class="card-title">Danger zone</h3></div>
            <div class="card-body">
                <p style="color:var(--text-secondary);margin-bottom:1rem;">Deleting your account permanently removes your expenses, income, budgets and savings goals.</p>
                <button class="btn btn-danger" id="delete-account-btn"><i data-lucide="trash-2"></i> Delete account</button>
            </div>
        </div>
    `;

    let user = null;
    const localUser = getUser();

    try {
        const res = await api.get(`/users/${localUser.id}`);
        user = res.data;
        renderDetails();
        renderPreferences();
    } catch (err) {
        showToast(err.message, 'error');
        document.getElementById('profile-details').innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="user-x"></i></div><h3>Couldn't load profile</h3><p>${err.message}</p></div>`;
        if (window.lucide) window.lucide.createIcons();
    }

    document.getElementById('delete-account-btn').addEventListener('click', confirmDeleteAccount);

    function renderDetails() {
        const wrap = document.getElementById('profile-details');
        wrap.innerHTML = `
            <div class="flex items-center gap-4 mb-6">
                <div class="avatar" style="width:64px;height:64px;border-radius:50%;overflow:hidden;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:600;">
                    ${user.profileImageUrl
                        ? `<img src="${user.profileImageUrl}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;">`
                        : (user.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="font-weight:600;font-size:1.1rem;">${user.name || ''}</div>
                    <div style="color:var(--text-secondary);">${user.email || ''}</div>
                </div>
            </div>
            <button class="btn btn-primary" id="edit-profile-btn"><i data-lucide="pencil"></i> Edit details</button>
        `;
        if (window.lucide) window.lucide.createIcons();
        applyTilt(wrap);
        document.getElementById('edit-profile-btn').addEventListener('click', openEditModal);
    }

    function renderPreferences() {
        const wrap = document.getElementById('profile-preferences');
        wrap.innerHTML = `
            <div class="field">
                <label>Currency</label>
                <select class="input" id="currency-select">
                    ${CURRENCIES.map(c => `<option value="${c}" ${((user.currency || 'USD') === c) ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <button class="btn btn-secondary mt-2" id="save-currency-btn"><i data-lucide="save"></i> Save preference</button>
        `;
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('save-currency-btn').addEventListener('click', saveCurrency);
    }

    async function saveCurrency() {
        const currency = document.getElementById('currency-select').value;
        try {
            const res = await api.put(`/users/${localUser.id}`, { ...user, currency });
            user = res.data;
            window.dispatchEvent(new CustomEvent('currencyChanged', { detail: currency }));
            showToast('Currency preference saved', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function openEditModal() {
        openModal({
            title: 'Edit profile',
            bodyHtml: `
                <form id="profile-form">
                    <div class="field"><label>Name</label><input class="input" name="name" required minlength="2" maxlength="100" value="${user.name || ''}"></div>
                    <div class="field"><label>Email</label><input class="input" type="email" name="email" required value="${user.email || ''}"></div>
                    <div class="field-row">
                        <div class="field"><label>Phone number</label><input class="input" name="phoneNumber" value="${user.phoneNumber || ''}" placeholder="Optional"></div>
                        <div class="field"><label>Monthly income</label><input class="input" type="number" step="0.01" min="0" name="monthlyIncome" value="${user.monthlyIncome ?? ''}" placeholder="0.00"></div>
                    </div>
                    <div class="field"><label>Profile image URL</label><input class="input" name="profileImageUrl" value="${user.profileImageUrl || ''}" placeholder="Optional"></div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save changes</button>
                    </div>
                </form>
            `,
            onMount: () => {
                document.getElementById('cancel-btn').addEventListener('click', closeModal);
                document.getElementById('profile-form').addEventListener('submit', async (ev) => {
                    ev.preventDefault();
                    const fd = new FormData(ev.target);
                    const payload = {
                        ...user,
                        name: fd.get('name'),
                        email: fd.get('email'),
                        phoneNumber: fd.get('phoneNumber') || null,
                        monthlyIncome: fd.get('monthlyIncome') ? Number(fd.get('monthlyIncome')) : null,
                        profileImageUrl: fd.get('profileImageUrl') || null
                    };
                    try {
                        const res = await api.put(`/users/${localUser.id}`, payload);
                        user = res.data;
                        localStorage.setItem('name', user.name || '');
                        localStorage.setItem('email', user.email || '');
                        showToast('Profile updated', 'success');
                        closeModal();
                        renderDetails();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            }
        });
    }

    function confirmDeleteAccount() {
        openModal({
            title: 'Delete account',
            bodyHtml: `<p>This can't be undone. All of your data will be permanently removed. Delete your account?</p><div class="modal-actions"><button class="btn btn-ghost" id="cancel-del">Cancel</button><button class="btn btn-danger" id="confirm-del">Delete account</button></div>`,
            onMount: () => {
                document.getElementById('cancel-del').addEventListener('click', closeModal);
                document.getElementById('confirm-del').addEventListener('click', async () => {
                    try {
                        await api.delete(`/users/${localUser.id}`);
                        showToast('Account deleted', 'success');
                        closeModal();
                        clearAuth();
                        window.location.href = '/';
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            }
        });
    }
}
