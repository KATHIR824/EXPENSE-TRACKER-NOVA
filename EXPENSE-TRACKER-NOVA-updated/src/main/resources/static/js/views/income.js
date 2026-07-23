import { api } from '../api.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { exportToCsv } from '../components/export.js';
import { applyTilt } from '../components/tilt.js';

const INCOME_TYPES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];

export async function renderIncomeView(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between mb-6" style="flex-wrap:wrap;gap:.75rem;">
            <div></div>
            <div class="flex gap-3">
                <button class="btn btn-secondary" id="import-pdf-btn"><i data-lucide="file-up"></i> Import PDF</button>
                <button class="btn btn-secondary" id="export-btn"><i data-lucide="download"></i> Export</button>
                <button class="btn btn-primary" id="add-income-btn"><i data-lucide="plus"></i> Add income</button>
            </div>
        </div>
        <input type="file" id="pdf-input" accept="application/pdf" style="display:none;">
        <div class="card tilt">
            <div class="table-responsive">
                <table class="table" id="income-table">
                    <thead><tr><th>Date</th><th>Source</th><th>Type</th><th>Amount</th><th></th></tr></thead>
                    <tbody><tr><td colspan="5"><div class="skeleton skeleton-text" style="height:2rem;"></div></td></tr></tbody>
                </table>
            </div>
        </div>
    `;

    let incomes = [];

    async function load() {
        try {
            const res = await api.get('/incomes');
            if (!container.isConnected) return; // view was navigated away from before this resolved
            incomes = (res.data || []).sort((a, b) => new Date(b.incomeDate) - new Date(a.incomeDate));
            renderTable();
        } catch (err) {
            if (!container.isConnected) return;
            showToast(err.message, 'error');
        }
    }

    function renderTable() {
        const tbody = document.querySelector('#income-table tbody');
        if (!tbody) return; // view was torn down mid-render
        if (!incomes.length) {
            tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon"><i data-lucide="wallet"></i></div><h3>No income logged yet</h3><p>Add your first paycheck or payment to see your inflow.</p><button class="btn btn-primary" id="empty-add-income"><i data-lucide="plus"></i> Add income</button></div></td></tr>`;
            if (window.lucide) window.lucide.createIcons();
            document.getElementById('empty-add-income')?.addEventListener('click', openCreateModal);
            return;
        }
        tbody.innerHTML = incomes.map(i => `
            <tr>
                <td>${new Date(i.incomeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td><strong>${i.source}</strong>${i.isRecurring ? '<span class="badge badge-green" style="margin-left:6px;">recurring</span>' : ''}</td>
                <td><span class="badge badge-green">${i.incomeType || '—'}</span></td>
                <td class="amount positive">+$${Number(i.amount).toFixed(2)}</td>
                <td>
                    <div class="flex gap-2">
                        <button class="btn-icon btn-sm edit-btn" data-id="${i.id}" aria-label="Edit"><i data-lucide="pencil" style="width:15px;height:15px;"></i></button>
                        <button class="btn-icon btn-sm delete-btn" data-id="${i.id}" aria-label="Delete"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
        applyTilt(document.querySelector('#income-table').closest('.card'));
        tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
        tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => confirmDelete(btn.dataset.id)));
    }

    function formHtml(i = {}) {
        return `
            <form id="income-form">
                <div class="field"><label>Source</label><input class="input" name="source" required minlength="2" maxlength="100" value="${i.source || ''}" placeholder="Acme Inc payroll"></div>
                <div class="field-row">
                    <div class="field"><label>Amount</label><input class="input" type="number" step="0.01" min="0.01" name="amount" required value="${i.amount || ''}" placeholder="0.00"></div>
                    <div class="field"><label>Date</label><input class="input" type="date" name="incomeDate" required value="${i.incomeDate || new Date().toISOString().slice(0, 10)}"></div>
                </div>
                <div class="field"><label>Type</label>
                    <select class="input" name="incomeType">${INCOME_TYPES.map(t => `<option ${i.incomeType === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
                </div>
                <div class="field"><label>Description (optional)</label><textarea class="input" name="description" maxlength="500" placeholder="Details">${i.description || ''}</textarea></div>
                <div class="checkbox-row field"><input type="checkbox" name="isRecurring" id="recurring-check" ${i.isRecurring ? 'checked' : ''}><label for="recurring-check" style="margin:0;">This is recurring</label></div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${i.id ? 'Save changes' : 'Add income'}</button>
                </div>
            </form>
        `;
    }

    function bindForm(existing) {
        document.getElementById('cancel-btn').addEventListener('click', closeModal);
        document.getElementById('income-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const payload = {
                source: fd.get('source'),
                description: fd.get('description') || null,
                amount: parseFloat(fd.get('amount')),
                incomeDate: fd.get('incomeDate'),
                incomeType: fd.get('incomeType'),
                isRecurring: fd.get('isRecurring') === 'on'
            };
            const btn = ev.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                if (existing?.id) {
                    await api.put(`/incomes/${existing.id}`, payload);
                    showToast('Income updated', 'success');
                } else {
                    await api.post('/incomes', payload);
                    showToast('Income added', 'success');
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
        openModal({ title: 'Add income', bodyHtml: formHtml(), onMount: () => bindForm(null) });
    }
    function openEditModal(id) {
        const i = incomes.find(x => String(x.id) === String(id));
        if (!i) return;
        openModal({ title: 'Edit income', bodyHtml: formHtml(i), onMount: () => bindForm(i) });
    }
    async function confirmDelete(id) {
        openModal({
            title: 'Delete income',
            bodyHtml: `<p>This can't be undone. Delete this income entry?</p><div class="modal-actions"><button class="btn btn-ghost" id="cancel-del">Cancel</button><button class="btn btn-danger" id="confirm-del">Delete</button></div>`,
            onMount: () => {
                document.getElementById('cancel-del').addEventListener('click', closeModal);
                document.getElementById('confirm-del').addEventListener('click', async () => {
                    try {
                        await api.delete(`/incomes/${id}`);
                        showToast('Income deleted', 'success');
                        closeModal();
                        load();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            }
        });
    }

    document.getElementById('add-income-btn').addEventListener('click', openCreateModal);
    document.getElementById('export-btn').addEventListener('click', () => {
        if (!incomes.length) { showToast('Nothing to export yet', 'info'); return; }
        exportToCsv('income.csv', incomes, [
            { label: 'Date', value: 'incomeDate' }, { label: 'Source', value: 'source' },
            { label: 'Type', value: 'incomeType' }, { label: 'Amount', value: 'amount' }
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
            const res = await api.post('/incomes/import/pdf', fd);
            const result = res.data || {};
            showToast(`Imported ${result.success ?? 0} of ${result.total ?? 0} income entries`, 'success');
            load();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            pdfInput.value = '';
        }
    });

    load();
}
