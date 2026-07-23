import { isAuthenticated, clearAuth, getUser } from './api.js';
import { showToast } from './components/toast.js';
import { applyTilt } from './components/tilt.js';
import { renderAuthView } from './views/auth.js';
import { renderLandingView } from './views/landing.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderExpensesView } from './views/expenses.js';
import { renderIncomeView } from './views/income.js';
import { renderBudgetsView } from './views/budgets.js';
import { renderSavingsView } from './views/savings.js';
import { renderCategoriesView } from './views/categories.js';
import { renderProfileView } from './views/profile.js';

const appContainer = document.getElementById('app');

const routes = {
    '/': { render: renderDashboardView, title: 'Overview' },
    '/expenses': { render: renderExpensesView, title: 'Expenses' },
    '/income': { render: renderIncomeView, title: 'Income' },
    '/budgets': { render: renderBudgetsView, title: 'Budgets' },
    '/savings': { render: renderSavingsView, title: 'Savings goals' },
    '/categories': { render: renderCategoriesView, title: 'Categories' },
    '/profile': { render: renderProfileView, title: 'Profile' }
};

const fabTargets = {
    '/expenses': 'add-expense-btn',
    '/income': 'add-income-btn',
    '/budgets': 'add-budget-btn',
    '/savings': 'add-savings-btn',
    '/categories': 'add-category-btn'
};

function initTheme() {
    const stored = localStorage.getItem('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const isLight = stored === 'light' || (stored === null && prefersLight);
    document.documentElement.classList.toggle('light', isLight);
}

function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    if (window.lucide) window.lucide.createIcons();
}
window.toggleTheme = toggleTheme;

function initApp() {
    initTheme();

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
        }
    });
    window.addEventListener('popstate', handleRoute);

    if (isAuthenticated()) renderLayout();
    handleRoute();
}

export function navigateTo(url) {
    history.pushState(null, null, url);
    handleRoute();
}

export function logout() {
    clearAuth();
    showToast('Signed out', 'success');
    window.location.href = '/';
}

function handleRoute() {
    const path = window.location.pathname;

    if (!isAuthenticated()) {
        if (path === '/login') renderAuth();
        else renderLanding();
        return;
    }

    if (!document.querySelector('.dashboard-layout')) renderLayout();

    const match = routes[path] || routes['/'];
    updateActiveNav(path in routes ? path : '/');
    updateFab(path);
    setPageTitle(match.title);

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.remove('view-fade-in');
        mainContent.innerHTML = renderSkeleton();
        void mainContent.offsetWidth;
        match.render(mainContent);
        mainContent.classList.add('view-fade-in');
    }
}

function renderSkeleton() {
    return `<div class="grid grid-4 mb-6">${'<div class="skeleton-stat-card"><div class="skeleton skeleton-icon"></div><div style="flex:1"><div class="skeleton skeleton-text" style="width:60%"></div><div class="skeleton skeleton-text mt-4" style="width:40%;height:1.4rem"></div></div></div>'.repeat(4)}</div>`;
}

function updateActiveNav(path) {
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('href') === path);
    });
}

function updateFab(path) {
    const fab = document.getElementById('fab-quick-add');
    if (!fab) return;
    const targetId = fabTargets[path];
    fab.style.display = targetId ? 'flex' : 'none';
    fab.dataset.target = targetId || '';
}

function renderAuth() {
    appContainer.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'auth-layout';
    appContainer.appendChild(wrapper);
    renderAuthView(wrapper);
    if (window.lucide) window.lucide.createIcons();
}

function renderLanding() {
    appContainer.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'landing';
    appContainer.appendChild(wrapper);
    renderLandingView(wrapper);
    if (window.lucide) window.lucide.createIcons();
    applyTilt(wrapper);
}

function renderLayout() {
    const user = getUser();
    const isLight = document.documentElement.classList.contains('light');

    appContainer.innerHTML = `
        <div class="dashboard-layout">
            <div class="sidebar-overlay" id="sidebar-overlay"></div>
            <aside class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="brand-mark" style="width:30px;height:30px;"><i data-lucide="orbit" style="width:16px;height:16px;"></i></div>
                    <span style="font-family:var(--font-display);font-weight:800;font-size:1.1rem;">Nova</span>
                </div>
                <nav class="sidebar-nav">
                    <a href="/" class="nav-item active" data-link><i data-lucide="layout-dashboard"></i><span>Dashboard</span></a>
                    <a href="/expenses" class="nav-item" data-link><i data-lucide="arrow-down-circle"></i><span>Expenses</span></a>
                    <a href="/income" class="nav-item" data-link><i data-lucide="arrow-up-circle"></i><span>Income</span></a>
                    <a href="/budgets" class="nav-item" data-link><i data-lucide="target"></i><span>Budgets</span></a>
                    <a href="/savings" class="nav-item" data-link><i data-lucide="piggy-bank"></i><span>Savings goals</span></a>
                    <a href="/categories" class="nav-item" data-link><i data-lucide="tags"></i><span>Categories</span></a>
                </nav>
               <div class="sidebar-footer">
                    <a href="/profile" class="user-profile-btn" data-link>
                        <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <div class="user-name">${user.name || 'User'}</div>
                            <div class="user-email">${user.email || ''}</div>
                        </div>
                    </a>
                    <button class="btn btn-secondary btn-block mt-4" id="btn-logout"><i data-lucide="log-out"></i> Sign out</button>
                </div>
                    <button class="btn btn-secondary btn-block mt-4" id="btn-logout"><i data-lucide="log-out"></i> Sign out</button>
                </div>
            </aside>

            <div class="main-wrapper">
                <header class="topbar">
                    <button class="btn-icon mobile-menu-btn" id="mobile-menu-btn" aria-label="Menu"><i data-lucide="menu"></i></button>
                    <div class="page-title" id="topbar-title">Overview</div>
                    <div class="topbar-actions">
                        <button class="btn-icon" id="theme-toggle" aria-label="Toggle theme"><i id="theme-icon" data-lucide="${isLight ? 'moon' : 'sun'}"></i></button>
                    </div>
                </header>
                <main class="main-content" id="main-content"></main>
            </div>

            <button class="fab" id="fab-quick-add" aria-label="Quick add"><i data-lucide="plus"></i></button>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('btn-logout').addEventListener('click', logout);

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('mobile-menu-btn');
    const toggleSidebar = () => { sidebar.classList.toggle('open'); overlay.classList.toggle('active'); };
    menuBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.addEventListener('click', () => { if (window.innerWidth <= 768) toggleSidebar(); });
    });

    document.getElementById('fab-quick-add').addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.target;
        if (targetId) document.getElementById(targetId)?.click();
    });
}

export function setPageTitle(title) {
    const el = document.getElementById('topbar-title');
    if (el) el.textContent = title;
}

export function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', initApp);
