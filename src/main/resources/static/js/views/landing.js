export function renderLandingView(container) {
    container.innerHTML = `
        <nav class="nav-bar">
            <div class="brand"><div class="brand-mark"><i data-lucide="orbit"></i></div>Nova</div>
            <div class="nav-links">
                <a href="#features">Features</a>
                <a href="#how">How it works</a>
                <a href="/login" data-link>Sign in</a>
                <a href="/login" data-link class="btn btn-primary btn-sm">Get started</a>
            </div>
        </nav>

        <section class="hero">
            <div class="hero-badge"><i data-lucide="sparkles" style="width:14px;height:14px;"></i> Now with automatic PDF statement import</div>
            <h1>Money, finally in <span class="text-gradient">motion.</span></h1>
            <p class="hero-sub">Nova turns scattered expenses, income, budgets, and savings goals into one living dashboard &mdash; built to feel as good as it looks.</p>
            <div class="hero-cta">
                <a href="/login" data-link class="btn btn-primary">Start free <i data-lucide="arrow-right"></i></a>
                <a href="#features" class="btn btn-secondary">See how it works</a>
            </div>

            <div class="hero-scene">
                <div class="hero-mock card">
                    <div class="hero-mock-grid">
                        ${['Income', 'Expenses', 'Saved', 'Budget'].map((l, i) => `
                            <div>
                                <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:6px;">${l}</div>
                                <div style="font-family:var(--font-mono);font-weight:700;font-size:1.1rem;margin-bottom:8px;">${['$6,420','$3,180','$3,240','62%'][i]}</div>
                                <div class="hero-mock-bar"><span style="width:${[78, 45, 65, 62][i]}%;"></span></div>
                            </div>
                        `).join('')}
                    </div>
                    <svg viewBox="0 0 600 140" style="width:100%;height:120px;">
                        <polyline points="0,100 60,80 120,90 180,55 240,65 300,35 360,50 420,25 480,40 540,15 600,30" fill="none" stroke="url(#g1)" stroke-width="3" stroke-linecap="round"/>
                        <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#22d3ee"/></linearGradient></defs>
                    </svg>
                </div>
            </div>
        </section>

        <section class="features" id="features">
            <div class="section-head">
                <h2>Everything your finances need, nothing they don't.</h2>
                <p>Four focused tools that work together instead of fighting for your attention.</p>
            </div>
            <div class="feature-grid">
                <div class="card tilt feature-card">
                    <div class="feature-icon"><i data-lucide="pie-chart"></i></div>
                    <h3>Real-time dashboard</h3>
                    <p>Income, spending, and savings trends update the moment you log a transaction &mdash; no refresh, no lag.</p>
                </div>
                <div class="card tilt feature-card">
                    <div class="feature-icon"><i data-lucide="target"></i></div>
                    <h3>Budgets that push back</h3>
                    <p>Set a limit per category and watch a live progress bar warn you before you overspend, not after.</p>
                </div>
                <div class="card tilt feature-card">
                    <div class="feature-icon"><i data-lucide="file-up"></i></div>
                    <h3>Import from PDF</h3>
                    <p>Drop in a bank statement and Nova extracts transactions automatically &mdash; no manual entry marathon.</p>
                </div>
            </div>
        </section>

        <section class="features" id="how">
            <div class="section-head">
                <h2>Set up in three steps.</h2>
            </div>
            <div class="feature-grid">
                ${[
                    { icon: 'user-plus', t: 'Create your account', d: 'Sign up in seconds &mdash; no credit card required.' },
                    { icon: 'layers', t: 'Add your categories', d: 'Use the defaults or build your own from scratch.' },
                    { icon: 'trending-up', t: 'Watch it come together', d: 'Every expense and paycheck sharpens your picture.' }
                ].map(s => `
                    <div class="card tilt feature-card">
                        <div class="feature-icon"><i data-lucide="${s.icon}"></i></div>
                        <h3>${s.t}</h3>
                        <p>${s.d}</p>
                    </div>
                `).join('')}
            </div>
        </section>

        <div class="cta-band">
            <h2>Ready to see where your money actually goes?</h2>
            <p>Free forever for personal use. Set up your dashboard in under two minutes.</p>
            <a href="/login" data-link class="btn btn-secondary">Create your account</a>
        </div>

        <footer class="footer-bar">
            <div>&copy; ${new Date().getFullYear()} Nova Finance</div>
           <div>Built by Kathiravan E</div>
        </footer>
    `;
}
