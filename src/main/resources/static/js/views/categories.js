import { api } from '../api.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { applyTilt } from '../components/tilt.js';

const SWATCHES = ['#8b5cf6', '#ec4899', '#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#60a5fa', '#a78bfa'];
const ICONS = ['tag', 'shopping-cart', 'home', 'car', 'utensils', 'film', 'heart-pulse', 'plane', 'gift', 'briefcase', 'book', 'zap'];

export async function renderCategoriesView(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between mb-6" style="flex-wrap:wrap;gap:.75rem;">
            <div></div>
            <button class="btn btn-primary" id="add-category-btn"><i data-lucide="plus"></i> New category</button>
        </div>
        <div class="grid grid-4" id="categories-grid"></div>
    `;

    let categories = [];

    async function load() {
        document.getElementById('categories-grid').innerHTML = ['1', '2', '3', '4'].map(() => `<div class="skeleton-stat-card"></div>`).join('');
        try {
            const res = await api.get('/categories');
            categories = res.data || [];
            renderGrid();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function renderGrid() {
        const grid = document.getElementById('categories-grid');
        if (!categories.length) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon"><i data-lucide="tags"></i></div><h3>No categories yet</h3><p>Create categories to organize expenses and budgets.</p><button class="btn btn-primary" id="empty-add-category"><i data-lucide="plus"></i> New category</button></div>`;
            if (window.lucide) window.lucide.createIcons();
            document.getElementById('empty-add-category')?.addEventListener('click', openCreateModal);
            return;
        }
        grid.innerHTML = categories.map(c => `
            <div class="card tilt" style="padding:1.1rem;">
                <div class="flex items-center justify-between mb-6" style="margin-bottom:.9rem;">
                    <div class="stat-icon violet" style="background:${c.color || '#8b5cf6'}22;color:${c.color || '#8b5cf6'};margin-bottom:0;">
                        <i data-lucide="${c.icon || 'tag'}"></i>
                    </div>
                    ${c.isDefault ? '<span class="badge badge-violet">Default</span>' : `
                        <div class="flex gap-2">
                            <button class="btn-icon btn-sm edit-btn" data-id="${c.id}" aria-label="Edit"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                            <button class="btn-icon btn-sm delete-btn" data-id="${c.id}" aria-label="Delete"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                        </div>
                    `}
                </div>
                <div style="font-weight:600;">${c.name}</div>
                <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px;">${c.description || 'No description'}</div>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
        applyTilt(grid);
        grid.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.id)));
        grid.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => confirmDelete(btn.dataset.id)));
    }

    function formHtml(c = {}) {
        const color = c.color || SWATCHES[0];
        const icon = c.icon || ICONS[0];
        return `
            <form id="category-form">
                <div class="field"><label>Name</label><input class="input" name="name" required minlength="2" maxlength="50" value="${c.name || ''}" placeholder="Groceries"></div>
                <div class="field"><label>Description (optional)</label><textarea class="input" name="description" maxlength="200" placeholder="What falls under this?">${c.description || ''}</textarea></div>
                <div class="field"><label>Color</label>
                    <div class="flex gap-2" id="color-swatches">
                        ${SWATCHES.map(s => `<div data-color="${s}" style="width:26px;height:26px;border-radius:50%;background:${s};cursor:pointer;border:2px solid ${s === color ? '#fff' : 'transparent'};box-shadow:0 0 0 2px ${s === color ? s : 'transparent'};"></div>`).join('')}
                    </div>
                    <input type="hidden" name="color" value="${color}">
                </div>
                <div class="field"><label>Icon</label>
                    <div class="flex gap-2" id="icon-swatches" style="flex-wrap:wrap;">
                        ${ICONS.map(i => `<div data-icon="${i}" class="btn-icon ${i === icon ? '' : 'btn-ghost'}" style="cursor:pointer;${i === icon ? 'background:var(--violet-soft);color:var(--violet);' : ''}"><i data-lucide="${i}" style="width:16px;height:16px;"></i></div>`).join('')}
                    </div>
                    <input type="hidden" name="icon" value="${icon}">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${c.id ? 'Save changes' : 'Create category'}</button>
                </div>
            </form>
        `;
    }

    function bindForm(existing) {
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('cancel-btn').addEventListener('click', closeModal);

        document.querySelectorAll('#color-swatches [data-color]').forEach(sw => {
            sw.addEventListener('click', () => {
                document.querySelector('input[name="color"]').value = sw.dataset.color;
                document.querySelectorAll('#color-swatches [data-color]').forEach(s => { s.style.border = '2px solid transparent'; s.style.boxShadow = 'none'; });
                sw.style.border = '2px solid #fff';
                sw.style.boxShadow = `0 0 0 2px ${sw.dataset.color}`;
            });
        });
        document.querySelectorAll('#icon-swatches [data-icon]').forEach(sw => {
            sw.addEventListener('click', () => {
                document.querySelector('input[name="icon"]').value = sw.dataset.icon;
                document.querySelectorAll('#icon-swatches [data-icon]').forEach(s => { s.style.background = ''; s.style.color = ''; });
                sw.style.background = 'var(--violet-soft)';
                sw.style.color = 'var(--violet)';
            });
        });

        document.getElementById('category-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const payload = {
                name: fd.get('name'),
                description: fd.get('description') || null,
                color: fd.get('color'),
                icon: fd.get('icon'),
                isActive: true
            };
            const btn = ev.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            try {
                if (existing?.id) {
                    await api.put(`/categories/${existing.id}`, payload);
                    showToast('Category updated', 'success');
                } else {
                    await api.post('/categories', payload);
                    showToast('Category created', 'success');
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
        openModal({ title: 'New category', bodyHtml: formHtml(), onMount: () => bindForm(null) });
    }
    function openEditModal(id) {
        const c = categories.find(x => String(x.id) === String(id));
        if (!c) return;
        openModal({ title: 'Edit category', bodyHtml: formHtml(c), onMount: () => bindForm(c) });
    }
    async function confirmDelete(id) {
        openModal({
            title: 'Delete category',
            bodyHtml: `<p>Expenses and budgets using this category will be affected. Delete it anyway?</p><div class="modal-actions"><button class="btn btn-ghost" id="cancel-del">Cancel</button><button class="btn btn-danger" id="confirm-del">Delete</button></div>`,
            onMount: () => {
                document.getElementById('cancel-del').addEventListener('click', closeModal);
                document.getElementById('confirm-del').addEventListener('click', async () => {
                    try {
                        await api.delete(`/categories/${id}`);
                        showToast('Category deleted', 'success');
                        closeModal();
                        load();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            }
        });
    }

    document.getElementById('add-category-btn').addEventListener('click', openCreateModal);
    load();
}
