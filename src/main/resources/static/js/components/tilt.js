export function applyTilt(root = document) {
    const els = root.querySelectorAll('.card.tilt, .stat-card, .feature-card');
    els.forEach(el => {
        if (el.dataset.tiltBound) return;
        el.dataset.tiltBound = '1';

        let raf = null;

        el.addEventListener('mousemove', (e) => {
            if (window.innerWidth <= 768) return;
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotY = ((x / rect.width) - 0.5) * 10;
            const rotX = ((y / rect.height) - 0.5) * -10;

            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
            });
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

export function animateCount(el, target, { prefix = '', suffix = '', decimals = 0, duration = 900 } = {}) {
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = start + (target - start) * eased;
        el.textContent = `${prefix}${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
