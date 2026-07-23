export function applyTilt(root = document) {
    // Flat design: no 3D rotation. Kept as a no-op (rather than removed) so
    // every view that imports/calls applyTilt() continues to work unchanged.
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
