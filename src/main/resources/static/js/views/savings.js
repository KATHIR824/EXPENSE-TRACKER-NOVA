import { api } from '../api.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { applyTilt } from '../components/tilt.js';

export async function renderSavingsView(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between mb-6" style="flex-wrap:wrap;gap:.75rem;">
            <div></div>
            <button class="btn btn-primary" id="add-savings-btn"><i data-lucide="plus"></i> New goal</button>
        </div>
        <div class="grid grid-3" id="savings-grid"></div>
    `;

    let goals = [];

    async function load() {
        document.getElementById('savings-grid').innerHTML = ['1', '2', '3'].map(() => `<div class="skeleton-stat-card" style="height:170px;"></div>`).join('');
        try {
            const res = await api.get('/savings');
            goals = res.data || [];
            renderGrid();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function renderGrid() {
        const grid = document.getElementById('savings-grid');
        if (!goals.length) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon"><i data-lucide="piggy-bank"></i></div><h3>No savings goals yet</h3><p>Set a target and watch your progress fill in as you contribute.</p><button class="btn btn-primary" id="empty-add-savings"><i data-lucide="plus"></i> New goal</button></div>`;
            if (window.lucide) window.lucide.createIcons();
            document.getElementById('empty-add-savings')?.addEventListener('click', openCreateModal);
            return;
        }
        grid.innerHTML = goals.map(g => {
            const pct = Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100);
            return `
                <div class="card tilt goal-card">
                    <div class="goal-top">
                        <div>
                            <div class="goal-name">${g.goalName}</div>
                            <div class="goal-meta">${g.targetDate ? 'Target ' + new Date(g.targetDate).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : 'No deadline'}</div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn-icon btn-sm edit-btn" data-id="${g.id}" aria-label="Edit"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                            <button class="btn-icon btn-sm delete-btn" data-id="${g.id}" aria-label="Delete"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                        </div>
                    </div>
                    <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
                    <div class="goal-figures">
                        <span class="amount">$${Number(g.currentAmount).toFixed(2)}</span>
                        <span>${pct.toFixed(0)}% of $${Number(g.targetAmount).toFixed(2)}</span>
                    </div>
                    ${g.isCompleted ? '<span class="badge badge-green"><i data-lucide="check" style="width:12px;height:12px;"></i> Completed</span>' : ''}
                </div>
            `;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
        applyTilt(grid);
        grid.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
        grid.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => confirmDelete(btn.dataset.id)));
    }

    function formHtml(g = {}) {
        const today = new Date().toISOString().slice(0, 10);
        return `
            <form id="savings-form">
                <div class="field"><label>Goal name</label><input class="input" name="goalName" required minlength="2" maxlength="100" value="${g.goalName || ''}" placeholder="Emergency fund"></div>
                <div class="field-row">
                    <div class="field"><label>Target amount</label><input class="input" type="number" step="0.01" min="0.01" name="targetAmount" required value="${g.targetAmount || ''}" placeholder="5000.00"></div>
                    <div class="field"><label>Current amount</label><input class="input" type="number" step="0.01" min="0" name="currentAmount" value="${g.currentAmount ?? 0}" placeholder="0.00"></div>
                </div>
                <div class="field-row">
                    <div class="field"><label>Start date</label><input class="input" type="date" name="startDate" required value="${g.startDate || today}"></div>
                    <div class="field"><label>Target date (optional)</label><input class="input" type="date" name="targetDate" value="${g.targetDate || ''}"></div>
                </div>
                <div class="field"><label>Description (optional)</label><textarea class="input" name="description" maxlength="500" placeholder="What's this for?">${g.description || ''}</textarea></div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${g.id ? 'Save changes' : 'Create goal'}</button>
                </div>
            </form>
        `;
    }

    function bindForm(existing) {
        document.getElementById('cancel-btn').addEventListener('click', closeModal);
        document.getElementById('savings-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const payload = {
                goalName: fd.get('goalName'),
                description: fd.get('description') || null,
                targetAmount: parseFloat(fd.get('targetAmount')),
                currentAmount: parseFloat(fd.get('currentAmount') || 0),
                startDate: fd.get('startDate'),
                targetDate: fd.get('targetDate') || null,
                isActive: true,
                isCompleted: existing?.isCompleted || false
            };
            const btn = ev.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                if (existing?.id) {
                    await api.put(`/savings/${existing.id}`, payload);
                    showToast('Goal updated', 'success');
                } else {
                    await api.post('/savings', payload);
                    showToast('Goal created', 'success');
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
        openModal({ title: 'New savings goal', bodyHtml: formHtml(), onMount: () => bindForm(null) });
    }
    function openEditModal(id) {
        const g = goals.find(x => String(x.id) === String(id));
        if (!g) return;
        openModal({ title: 'Edit goal', bodyHtml: formHtml(g), onMount: () => bindForm(g) });
    }
    async function confirmDelete(id) {
        openModal({
            title: 'Delete goal',
            bodyHtml: `<p>This can't be undone. Delete this savings goal?</p><div class="modal-actions"><button class="btn btn-ghost" id="cancel-del">Cancel</button><button class="btn btn-danger" id="confirm-del">Delete</button></div>`,
            onMount: () => {
                document.getElementById('cancel-del').addEventListener('click', closeModal);
                document.getElementById('confirm-del').addEventListener('click', async () => {
                    try {
                        await api.delete(`/savings/${id}`);
                        showToast('Goal deleted', 'success');
                        closeModal();
                        load();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            }
        });
    }

    document.getElementById('add-savings-btn').addEventListener('click', openCreateModal);
    load();
}
