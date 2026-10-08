/**
 * auth.js — Authentication state management
 * Runs on every page: shows/hides guest vs user nav,
 * handles sidebar toggle, avatar dropdown, and logout.
 */

(function () {
    // ─── State ────────────────────────────────────────
    const token = localStorage.getItem('accessToken');
    const user  = JSON.parse(localStorage.getItem('currentUser') || 'null');

    // ─── Nav: guest vs user ───────────────────────────
    const guestNav = document.getElementById('guestNav');
    const userNav  = document.getElementById('userNav');
    const navAvatar = document.getElementById('navAvatar');

    if (token && user) {
        if (guestNav) guestNav.style.display = 'none';
        if (userNav)  userNav.style.display  = 'flex';
        if (navAvatar) {
            navAvatar.src = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            navAvatar.alt = user.fullName || user.username;
        }
    } else {
        if (guestNav) guestNav.style.display = 'flex';
        if (userNav)  userNav.style.display  = 'none';
    }

    // ─── Avatar dropdown ─────────────────────────────
    const avatarWrapper  = document.getElementById('avatarWrapper');
    const avatarDropdown = document.getElementById('avatarDropdown');

    if (avatarWrapper && avatarDropdown) {
        avatarWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarDropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => {
            avatarDropdown.classList.remove('open');
        });
    }

    // ─── Logout ──────────────────────────────────────
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await Auth.logout();
            } catch (_) { /* ignore */ }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('currentUser');
            showToast('Logged out successfully', 'success');
            setTimeout(() => (window.location.href = 'index.html'), 800);
        });
    }

    // ─── Sidebar toggle ──────────────────────────────
    const menuBtn   = document.getElementById('menuBtn');
    const sidebar   = document.getElementById('sidebar');
    const mainCont  = document.getElementById('mainContent') ||
                      document.querySelector('.dashboard-layout') ||
                      document.querySelector('.channel-layout') ||
                      document.querySelector('.tweet-layout') ||
                      document.querySelector('.upload-layout') ||
                      document.querySelector('.player-layout');

    let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    function applySidebar() {
        if (!sidebar) return;
        const isMobile = window.innerWidth <= 900;
        if (isMobile) {
            sidebar.classList.toggle('mobile-open', !sidebarCollapsed);
        } else {
            sidebar.classList.toggle('collapsed', sidebarCollapsed);
            if (mainCont) mainCont.classList.toggle('sidebar-collapsed', sidebarCollapsed);
        }
    }

    applySidebar();

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebarCollapsed = !sidebarCollapsed;
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
            applySidebar();
        });
    }

    window.addEventListener('resize', applySidebar);

    // ─── Search ──────────────────────────────────────
    const searchInput = document.getElementById('searchInput');
    const searchBtn   = document.getElementById('searchBtn');

    function doSearch() {
        const q = searchInput?.value?.trim();
        if (q) window.location.href = `index.html?q=${encodeURIComponent(q)}`;
    }

    if (searchBtn) searchBtn.addEventListener('click', doSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });
        // Pre-fill search box if on home page with ?q=
        const params = new URLSearchParams(window.location.search);
        if (params.get('q')) searchInput.value = params.get('q');
    }

    // ─── Guard: redirect to login if page requires auth ──
    window.requireAuth = function () {
        if (!token) {
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return false;
        }
        return true;
    };

    window.currentUser = user;
    window.isLoggedIn  = !!token;
})();
