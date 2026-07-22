export function openModal({ title, bodyHtml, onMount, size = 'md' }) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="${size === 'lg' ? 'max-width:640px;' : ''}">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="btn-icon" id="modal-close-btn" aria-label="Close">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div id="modal-body">${bodyHtml}</div>
        </div>
    `;
    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);

    const escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', escHandler);
    overlay._escHandler = escHandler;

    if (onMount) onMount(document.getElementById('modal-body'));
}

export function closeModal() {
    const overlay = document.getElementById('active-modal-overlay');
    if (overlay) {
        if (overlay._escHandler) document.removeEventListener('keydown', overlay._escHandler);
        overlay.remove();
    }
}
