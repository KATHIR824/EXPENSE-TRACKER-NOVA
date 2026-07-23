import { api } from '../api.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { exportToCsv } from '../components/export.js';
import { applyTilt } from '../components/tilt.js';

export async function renderExpensesView(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between mb-6" style="flex-wrap:wrap;gap:.75rem;">
            <div></div>
            <div class="flex gap-3">
                <button class="btn btn-secondary" id="import-pdf-btn"><i data-lucide="file-up"></i> Import PDF</button>
                <button class="btn btn-secondary" id="export-btn"><i data-lucide="download"></i> Export</button>
                <button class="btn btn-primary" id="add-expense-btn"><i data-lucide="plus"></i> Add expense</button>
            </div>
        </div>
        <input type="file" id="pdf-input" accept="application/pdf" style="display:none;">
        <div class="card tilt">
            <div class="table-responsive">
                <table class="table" id="expenses-table">
                    <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Payment</th><th>Amount</th><th></th></tr></thead>
                    <tbody><tr><td colspan="6"><div class="skeleton skeleton-text" style="height:2rem;"></div></td></tr></tbody>
                </table>
            </div>
        </div>
    `;

    let expenses = [];
    let categories = [];

    async function load() {
        try {
            const [expRes, catRes] = await Promise.all([api.get('/expenses'), api.get('/categories')]);
            if (!container.isConnected) return; // view was navigated away from before this resolved
            expenses = (expRes.data || []).sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
            categories = catRes.data || [];
            renderTable();
        } catch (err) {
            if (!container.isConnected) return;
            showToast(err.message, 'error');
        }
    }

    function renderTable() {
        const tbody = document.querySelector('#expenses-table tbody');
        if (!tbody) return; // view was torn down mid-render
        if (!expenses.length) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon"><i data-lucide="receipt"></i></div><h3>No expenses yet</h3><p>Log your first expense to start tracking where money goes.</p><button class="btn btn-primary" id="empty-add-expense"><i data-lucide="plus"></i> Add expense</button></div></td></tr>`;
            if (window.lucide) window.lucide.createIcons();
            document.getElementById('empty-add-expense')?.addEventListener('click', openCreateModal);
            return;
        }
        tbody.innerHTML = expenses.map(e => `
            <tr>
                <td>${new Date(e.expenseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td><strong>${e.title}</strong>${e.isRecurring ? '<span class="badge badge-violet" style="margin-left:6px;">recurring</span>' : ''}</td>
                <td><span class="badge badge-violet">${e.categoryName || '—'}</span></td>
                <td>${e.paymentMethod || '—'}</td>
                <td class="amount negative">-$${Number(e.amount).toFixed(2)}</td>
                <td>
                    <div class="flex gap-2">
                        <button class="btn-icon btn-sm edit-btn" data-id="${e.id}" aria-label="Edit"><i data-lucide="pencil" style="width:15px;height:15px;"></i></button>
                        <button class="btn-icon btn-sm delete-btn" data-id="${e.id}" aria-label="Delete"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
        applyTilt(document.querySelector('#expenses-table').closest('.card'));

        tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
        tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => confirmDelete(btn.dataset.id)));
    }

    function categoryOptions(selectedId) {
        if (!categories.length) return `<option value="">No categories yet</option>`;
        return categories.map(c => `<option value="${c.id}" ${String(c.id) === String(selectedId) ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    function formHtml(e = {}) {
        return `
            <form id="expense-form">
                <div class="field"><label>Title</label><input class="input" name="title" required minlength="2" maxlength="100" value="${e.title || ''}" placeholder="Grocery run"></div>
                <div class="field-row">
                    <div class="field"><label>Amount</label><input class="input" type="number" step="0.01" min="0.01" name="amount" required value="${e.amount || ''}" placeholder="0.00"></div>
                    <div class="field"><label>Date</label><input class="input" type="date" name="expenseDate" required value="${e.expenseDate || new Date().toISOString().slice(0, 10)}"></div>
                </div>
                <div class="field-row">
                    <div class="field"><label>Category</label><select class="input" name="categoryId" required>${categoryOptions(e.categoryId)}</select></div>
                    <div class="field"><label>Payment method</label>
                        <select class="input" name="paymentMethod">
                            ${['Card', 'Cash', 'Bank Transfer', 'UPI', 'Other'].map(p => `<option ${e.paymentMethod === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="field"><label>Description (optional)</label><textarea class="input" name="description" maxlength="500" placeholder="Details">${e.description || ''}</textarea></div>
                <div class="checkbox-row field"><input type="checkbox" name="isRecurring" id="recurring-check" ${e.isRecurring ? 'checked' : ''}><label for="recurring-check" style="margin:0;">This is a recurring expense</label></div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${e.id ? 'Save changes' : 'Add expense'}</button>
                </div>
            </form>
        `;
    }

    function bindForm(existing) {
        document.getElementById('cancel-btn').addEventListener('click', closeModal);
        document.getElementById('expense-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const payload = {
                title: fd.get('title'),
                description: fd.get('description') || null,
                amount: parseFloat(fd.get('amount')),
                expenseDate: fd.get('expenseDate'),
                categoryId: Number(fd.get('categoryId')),
                paymentMethod: fd.get('paymentMethod'),
                isRecurring: fd.get('isRecurring') === 'on'
            };
            const btn = ev.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                if (existing?.id) {
                    await api.put(`/expenses/${existing.id}`, payload);
                    showToast('Expense updated', 'success');
                } else {
                    await api.post('/expenses', payload);
                    showToast('Expense added', 'success');
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
        openModal({ title: 'Add expense', bodyHtml: formHtml(), onMount: () => bindForm(null) });
    }

    function openEditModal(id) {
        const e = expenses.find(x => String(x.id) === String(id));
        if (!e) return;
        openModal({ title: 'Edit expense', bodyHtml: formHtml(e), onMount: () => bindForm(e) });
    }

    async function confirmDelete(id) {
        openModal({
            title: 'Delete expense',
            bodyHtml: `<p>This can't be undone. Delete this expense?</p><div class="modal-actions"><button class="btn btn-ghost" id="cancel-del">Cancel</button><button class="btn btn-danger" id="confirm-del">Delete</button></div>`,
            onMount: () => {
                document.getElementById('cancel-del').addEventListener('click', closeModal);
                document.getElementById('confirm-del').addEventListener('click', async () => {
                    try {
                        await api.delete(`/expenses/${id}`);
                        showToast('Expense deleted', 'success');
                        closeModal();
                        load();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            }
        });
    }

    document.getElementById('add-expense-btn').addEventListener('click', openCreateModal);
    document.getElementById('export-btn').addEventListener('click', () => {
        if (!expenses.length) { showToast('Nothing to export yet', 'info'); return; }
        exportToCsv('expenses.csv', expenses, [
            { label: 'Date', value: 'expenseDate' }, { label: 'Title', value: 'title' },
            { label: 'Category', value: 'categoryName' }, { label: 'Amount', value: 'amount' },
            { label: 'Payment method', value: 'paymentMethod' }
        ]);
    });

    const pdfInput = document.getElementById('pdf-input');
    document.getElementById('import-pdf-btn').addEventListener('click', () => pdfInput.click());
    pdfInput.addEventListener('change', async () => {
        const file = pdfInput.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            showToast('Importing statement…', 'info');
            const res = await api.post('/expenses/import/pdf', fd);
            const result = res.data || {};
            showToast(`Imported ${result.success ?? 0} of ${result.total ?? 0} expenses`, 'success');
            load();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            pdfInput.value = '';
        }
    });

    load();
}
