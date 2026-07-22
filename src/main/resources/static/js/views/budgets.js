import { api } from '../api.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { applyTilt } from '../components/tilt.js';

export async function renderBudgetsView(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between mb-6" style="flex-wrap:wrap;gap:.75rem;">
            <div></div>
            <button class="btn btn-primary" id="add-budget-btn"><i data-lucide="plus"></i> New budget</button>
        </div>
        <div class="grid grid-3" id="budgets-grid"></div>
    `;

    let budgets = [];
    let categories = [];
    let expenses = [];

    async function load() {
        document.getElementById('budgets-grid').innerHTML = ['1', '2', '3'].map(() => `<div class="skeleton-stat-card" style="height:150px;"></div>`).join('');
        try {
            const [bRes, cRes, eRes] = await Promise.all([api.get('/budgets'), api.get('/categories'), api.get('/expenses')]);
            budgets = bRes.data || [];
            categories = cRes.data || [];
            expenses = eRes.data || [];
            renderGrid();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function spentFor(budget) {
        return expenses
            .filter(e => e.categoryId === budget.categoryId && e.expenseDate >= budget.startDate && e.expenseDate <= budget.endDate)
            .reduce((s, e) => s + Number(e.amount), 0);
    }

    function renderGrid() {
        const grid = document.getElementById('budgets-grid');
        if (!budgets.length) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon"><i data-lucide="target"></i></div><h3>No budgets set</h3><p>Create a budget per category so you know exactly when to ease off.</p><button class="btn btn-primary" id="empty-add-budget"><i data-lucide="plus"></i> New budget</button></div>`;
            if (window.lucide) window.lucide.createIcons();
            document.getElementById('empty-add-budget')?.addEventListener('click', openCreateModal);
            return;
        }
        grid.innerHTML = budgets.map(b => {
            const spent = spentFor(b);
            const pct = Math.min((spent / Number(b.amount)) * 100, 100);
            const over = spent > Number(b.amount);
            const cls = over ? 'over' : pct > 80 ? 'warn' : '';
            return `
                <div class="card tilt goal-card">
                    <div class="goal-top">
                        <div>
                            <div class="goal-name">${b.categoryName || 'Uncategorized'}</div>
                            <div class="goal-meta">${new Date(b.startDate).toLocaleDateString(undefined,{month:'short',day:'numeric'})} &ndash; ${new Date(b.endDate).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn-icon btn-sm edit-btn" data-id="${b.id}" aria-label="Edit"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                            <button class="btn-icon btn-sm delete-btn" data-id="${b.id}" aria-label="Delete"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                        </div>
                    </div>
                    <div class="progress-track"><div class="progress-fill ${cls}" style="width:${pct}%;"></div></div>
                    <div class="goal-figures">
                        <span class="amount">$${spent.toFixed(2)} spent</span>
                        <span>${over ? '<span class="badge badge-red">Over budget</span>' : `of $${Number(b.amount).toFixed(2)}`}</span>
                    </div>
                </div>
            `;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
        applyTilt(grid);
        grid.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
        grid.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => confirmDelete(btn.dataset.id)));
    }

    function categoryOptions(selectedId) {
        if (!categories.length) return `<option value="">No categories yet</option>`;
        return categories.map(c => `<option value="${c.id}" ${String(c.id) === String(selectedId) ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    function formHtml(b = {}) {
        const today = new Date().toISOString().slice(0, 10);
        const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
        return `
            <form id="budget-form">
                <div class="field"><label>Category</label><select class="input" name="categoryId" required>${categoryOptions(b.categoryId)}</select></div>
                <div class="field"><label>Budget amount</label><input class="input" type="number" step="0.01" min="0.01" name="amount" required value="${b.amount || ''}" placeholder="500.00"></div>
                <div class="field-row">
                    <div class="field"><label>Start date</label><input class="input" type="date" name="startDate" required value="${b.startDate || today}"></div>
                    <div class="field"><label>End date</label><input class="input" type="date" name="endDate" required value="${b.endDate || monthEnd}"></div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${b.id ? 'Save changes' : 'Create budget'}</button>
                </div>
            </form>
        `;
    }

    function bindForm(existing) {
        document.getElementById('cancel-btn').addEventListener('click', closeModal);
        document.getElementById('budget-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const payload = {
                categoryId: Number(fd.get('categoryId')),
                amount: parseFloat(fd.get('amount')),
                startDate: fd.get('startDate'),
                endDate: fd.get('endDate'),
                isActive: true
            };
            if (new Date(payload.endDate) < new Date(payload.startDate)) {
                showToast('End date must be after start date', 'error');
                return;
            }
            const btn = ev.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                if (existing?.id) {
                    await api.put(`/budgets/${existing.id}`, payload);
                    showToast('Budget updated', 'success');
                } else {
                    await api.post('/budgets', payload);
                    showToast('Budget created', 'success');
                }
                closeModal();
                load();
            } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
            }
        });
    }

    function openCreateModal() {
        if (!categories.length) { showToast('Add a category first', 'info'); return; }
        openModal({ title: 'New budget', bodyHtml: formHtml(), onMount: () => bindForm(null) });
    }
    function openEditModal(id) {
        const b = budgets.find(x => String(x.id) === String(id));
        if (!b) return;
        openModal({ title: 'Edit budget', bodyHtml: formHtml(b), onMount: () => bindForm(b) });
    }
    async function confirmDelete(id) {
        openModal({
            title: 'Delete budget',
            bodyHtml: `<p>This can't be undone. Delete this budget?</p><div class="modal-actions"><button class="btn btn-ghost" id="cancel-del">Cancel</button><button class="btn btn-danger" id="confirm-del">Delete</button></div>`,
            onMount: () => {
                document.getElementById('cancel-del').addEventListener('click', closeModal);
                document.getElementById('confirm-del').addEventListener('click', async () => {
                    try {
                        await api.delete(`/budgets/${id}`);
                        showToast('Budget deleted', 'success');
                        closeModal();
                        load();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            }
        });
    }

    document.getElementById('add-budget-btn').addEventListener('click', openCreateModal);
    load();
}
