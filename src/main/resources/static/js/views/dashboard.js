import { api } from '../api.js';
import { showToast } from '../components/toast.js';
import { applyTilt, animateCount } from '../components/tilt.js';

const RANGE_OPTIONS = [
    { key: 'this-month', label: 'This month' },
    { key: 'last-month', label: 'Last month' },
    { key: 'last-3', label: 'Last 3 months' },
    { key: 'all', label: 'All time' }
];

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#60a5fa', '#a78bfa'];

function rangeBounds(key) {
    const now = new Date();
    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    if (key === 'this-month') return { start: startOfMonth(now), end: endOfMonth(now) };
    if (key === 'last-month') {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    if (key === 'last-3') return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: endOfMonth(now) };
    return { start: new Date(2000, 0, 1), end: new Date(2100, 0, 1) };
}

function prevPeriod(b) {
    const span = b.end - b.start;
    return { start: new Date(b.start.getTime() - span - 1), end: new Date(b.start.getTime() - 1) };
}
function inRange(dateStr, b) { const d = new Date(dateStr); return d >= b.start && d <= b.end; }

function deltaHtml(current, previous) {
    if (previous === 0 && current === 0) return '';
    if (previous === 0) return `<span class="stat-delta up"><i data-lucide="trending-up" style="width:13px;height:13px;"></i> New</span>`;
    const pct = ((current - previous) / previous) * 100;
    const up = pct >= 0;
    return `<span class="stat-delta ${up ? 'up' : 'down'}"><i data-lucide="${up ? 'trending-up' : 'trending-down'}" style="width:13px;height:13px;"></i> ${Math.abs(pct).toFixed(0)}% vs prior</span>`;
}

export async function renderDashboardView(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between mb-6" style="flex-wrap:wrap;gap:.75rem;">
            <div class="range-pills" id="range-tabs">
                ${RANGE_OPTIONS.map((r, i) => `<button class="range-pill ${i === 0 ? 'active' : ''}" data-range="${r.key}">${r.label}</button>`).join('')}
            </div>
        </div>
        <div class="grid grid-4 mb-6" id="dashboard-stats"></div>
        <div class="dashboard-grid">
            <div class="card tilt">
                <div class="card-header"><h3 class="card-title">Income vs expenses</h3></div>
                <div class="card-body" style="min-height:280px;"><canvas id="trendChart" height="280"></canvas></div>
            </div>
            <div class="card tilt">
                <div class="card-header"><h3 class="card-title">Expenses by category</h3></div>
                <div class="card-body" style="display:flex;justify-content:center;align-items:center;min-height:280px;"><canvas id="categoryChart" height="250"></canvas></div>
            </div>
        </div>
        <div class="card tilt mt-6">
            <div class="card-header"><h3 class="card-title">Recent transactions</h3></div>
            <div class="table-responsive">
                <table class="table" id="recent-table">
                    <thead><tr><th>Date</th><th>Description</th><th>Category / source</th><th>Amount</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;

    let expenses = [], incomes = [];
    let charts = {};
    let currentRange = 'this-month';

    try {
        const [expensesRes, incomeRes] = await Promise.all([api.get('/expenses'), api.get('/incomes')]);
        expenses = expensesRes.data || [];
        incomes = incomeRes.data || [];
        renderForRange(currentRange);

        document.querySelectorAll('#range-tabs .range-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#range-tabs .range-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentRange = btn.dataset.range;
                renderForRange(currentRange);
            });
        });
    } catch (err) {
        showToast(err.message, 'error');
        renderStats(0, 0, [], []);
    }

    function renderForRange(rangeKey) {
        const bounds = rangeBounds(rangeKey);
        const prev = prevPeriod(bounds);
        const curExpenses = expenses.filter(e => inRange(e.expenseDate, bounds));
        const curIncomes = incomes.filter(i => inRange(i.incomeDate, bounds));
        const prevExpenses = expenses.filter(e => inRange(e.expenseDate, prev));
        const prevIncomes = incomes.filter(i => inRange(i.incomeDate, prev));

        const totalIncome = curIncomes.reduce((s, i) => s + Number(i.amount), 0);
        const totalExpense = curExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const prevIncome = prevIncomes.reduce((s, i) => s + Number(i.amount), 0);
        const prevExpense = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const netSavings = totalIncome - totalExpense;
        const prevNet = prevIncome - prevExpense;

        renderStats(totalIncome, totalExpense, curExpenses, curIncomes, prevIncome, prevExpense, netSavings, prevNet);
        renderTrendChart(curIncomes, curExpenses, bounds);
        renderCategoryChart(curExpenses);
        renderRecent(curExpenses, curIncomes);
    }

    function renderStats(totalIncome, totalExpense, curExpenses, curIncomes, prevIncome = 0, prevExpense = 0, netSavings = 0, prevNet = 0) {
        const wrap = document.getElementById('dashboard-stats');
        const stats = [
            { label: 'Total income', value: totalIncome, icon: 'arrow-up-circle', color: 'green', delta: deltaHtml(totalIncome, prevIncome) },
            { label: 'Total expenses', value: totalExpense, icon: 'arrow-down-circle', color: 'fuchsia', delta: deltaHtml(totalExpense, prevExpense) },
            { label: 'Net savings', value: netSavings, icon: 'piggy-bank', color: 'violet', delta: deltaHtml(netSavings, prevNet) },
            { label: 'Transactions', value: curExpenses.length + curIncomes.length, icon: 'layers', color: 'cyan', delta: '', isCount: true }
        ];
        wrap.innerHTML = stats.map((s, idx) => `
            <div class="stat-card tilt" style="animation: viewIn .4s ${idx * 0.06}s both;">
                <div class="stat-icon ${s.color}"><i data-lucide="${s.icon}"></i></div>
                <div class="stat-label">${s.label}</div>
                <div class="stat-value amount" id="stat-val-${idx}">${s.isCount ? '0' : '$0'}</div>
                ${s.delta}
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
        applyTilt(wrap);
        stats.forEach((s, idx) => {
            const el = document.getElementById(`stat-val-${idx}`);
            if (el) animateCount(el, s.value, { prefix: s.isCount ? '' : '$', decimals: s.isCount ? 0 : 2 });
        });
    }

    function renderTrendChart(curIncomes, curExpenses, bounds) {
        const ctx = document.getElementById('trendChart');
        if (!ctx || !window.Chart) return;
        const days = [];
        const cursor = new Date(Math.max(bounds.start, new Date(2000, 0, 1)));
        const end = bounds.end > new Date() ? new Date() : bounds.end;
        while (cursor <= end && days.length < 90) { days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
        const labels = days.map(d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const incomeSeries = days.map(d => curIncomes.filter(i => new Date(i.incomeDate).toDateString() === d.toDateString()).reduce((s, i) => s + Number(i.amount), 0));
        const expenseSeries = days.map(d => curExpenses.filter(e => new Date(e.expenseDate).toDateString() === d.toDateString()).reduce((s, e) => s + Number(e.amount), 0));

        if (charts.trend) charts.trend.destroy();
        charts.trend = new window.Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Income', data: incomeSeries, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.12)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
                    { label: 'Expenses', data: expenseSeries, borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.12)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } } },
                scales: {
                    x: { ticks: { color: '#6f6b8a', maxTicksLimit: 8 }, grid: { display: false } },
                    y: { ticks: { color: '#6f6b8a' }, grid: { color: 'rgba(255,255,255,0.06)' } }
                }
            }
        });
    }

    function renderCategoryChart(curExpenses) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx || !window.Chart) return;
        const byCategory = {};
        curExpenses.forEach(e => {
            const name = e.categoryName || 'Uncategorized';
            byCategory[name] = (byCategory[name] || 0) + Number(e.amount);
        });
        const labels = Object.keys(byCategory);
        const data = Object.values(byCategory);

        if (charts.category) charts.category.destroy();
        if (!labels.length) {
            ctx.parentElement.innerHTML = `<div class="empty-state" style="padding:2rem;"><div class="empty-icon"><i data-lucide="pie-chart"></i></div><p>No expenses yet in this range.</p></div>`;
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        charts.category = new window.Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: CHART_COLORS, borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '68%',
                plugins: { legend: { position: 'bottom', labels: { color: '#a8a4bf', boxWidth: 10, padding: 12, font: { size: 11 } } } }
            }
        });
    }

    function renderRecent(curExpenses, curIncomes) {
        const tbody = document.querySelector('#recent-table tbody');
        const merged = [
            ...curExpenses.map(e => ({ date: e.expenseDate, label: e.title, sub: e.categoryName, amount: -Number(e.amount) })),
            ...curIncomes.map(i => ({ date: i.incomeDate, label: i.source, sub: i.incomeType || 'Income', amount: Number(i.amount) }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

        if (!merged.length) {
            tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon"><i data-lucide="inbox"></i></div><h3>No transactions yet</h3><p>Add your first expense or income to see it here.</p></div></td></tr>`;
        } else {
            tbody.innerHTML = merged.map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                    <td>${t.label}</td>
                    <td><span class="badge badge-violet">${t.sub}</span></td>
                    <td class="amount ${t.amount >= 0 ? 'positive' : 'negative'}">${t.amount >= 0 ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}</td>
                </tr>
            `).join('');
        }
        if (window.lucide) window.lucide.createIcons();
    }
}
