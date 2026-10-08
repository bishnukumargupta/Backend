/**
 * home.js — Fetches and renders videos on the home page
 * Supports: search query, filter chips, pagination
 */

(function () {
    const grid         = document.getElementById('videoGrid');
    const emptyState   = document.getElementById('emptyState');
    const loadMoreWrap = document.getElementById('loadMoreWrapper');
    const loadMoreBtn  = document.getElementById('loadMoreBtn');
    const chips        = document.querySelectorAll('.chip');

    const params = new URLSearchParams(window.location.search);
    let currentPage = 1;
    let currentSort = 'createdAt';
    let currentSortType = 'desc';
    let currentQuery = params.get('q') || '';
    let isLoading = false;

    // ─── Render skeleton ─────────────────────────────
    function showSkeleton(count = 8) {
        grid.innerHTML = Array.from({ length: count }, () => `
            <div class="video-card skeleton-card">
                <div class="skeleton-thumb"></div>
                <div class="skeleton-body">
                    <div class="skeleton-line w80"></div>
                    <div class="skeleton-line w60"></div>
                </div>
            </div>`).join('');
    }

    // ─── Load videos ─────────────────────────────────
    async function loadVideos(append = false) {
        if (isLoading) return;
        isLoading = true;

        if (!append) {
            showSkeleton();
            emptyState.style.display = 'none';
            loadMoreWrap.style.display = 'none';
            currentPage = 1;
        }

        try {
            const queryParams = {
                page:     currentPage,
                limit:    12,
                sortBy:   currentSort,
                sortType: currentSortType,
            };
            if (currentQuery) queryParams.query = currentQuery;

            const res = await Videos.getAll(queryParams);
            const videos = res?.data?.docs || res?.data || [];

            if (!append) grid.innerHTML = '';

            if (!videos.length && !append) {
                emptyState.style.display = 'block';
                return;
            }

            videos.forEach((v, i) => {
                grid.insertAdjacentHTML('beforeend', buildVideoCard(v, i + (currentPage - 1) * 12));
            });

            // Show load more if there are more pages
            const totalPages = res?.data?.totalPages || 1;
            if (currentPage < totalPages) {
                loadMoreWrap.style.display = 'block';
            } else {
                loadMoreWrap.style.display = 'none';
            }

        } catch (err) {
            if (!append) {
                // Show mock demo data when backend is not running
                renderMockVideos();
            }
            console.warn('API not reachable, showing demo data:', err.message);
        } finally {
            isLoading = false;
        }
    }

    // ─── Mock demo data (offline fallback) ───────────
    function renderMockVideos() {
        const mockVideos = [
            { _id: '1', title: 'Build a Full Stack App with Node.js & React', views: 124000, duration: 3720, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), thumbnail: null, owner: { fullName: 'Bishnu Kumar', username: 'bishnukumar', avatar: null } },
            { _id: '2', title: 'MongoDB Aggregation Pipeline Deep Dive', views: 89000, duration: 2540, createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), thumbnail: null, owner: { fullName: 'Tech Mentor', username: 'techmentor', avatar: null } },
            { _id: '3', title: 'REST API Design Best Practices 2024', views: 62000, duration: 1980, createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'API Guru', username: 'apiguru', avatar: null } },
            { _id: '4', title: 'JWT Authentication Explained Simply', views: 45000, duration: 1440, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'Bishnu Kumar', username: 'bishnukumar', avatar: null } },
            { _id: '5', title: 'Cloudinary Integration with Node.js', views: 31000, duration: 2160, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'Cloud Dev', username: 'clouddev', avatar: null } },
            { _id: '6', title: 'Express.js Middleware Mastery', views: 78000, duration: 3120, createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'Node Master', username: 'nodemaster', avatar: null } },
            { _id: '7', title: 'Mongoose Schema & Validation Guide', views: 52000, duration: 2700, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'DB Expert', username: 'dbexpert', avatar: null } },
            { _id: '8', title: 'Building a YouTube Clone from Scratch', views: 210000, duration: 7200, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'Bishnu Kumar', username: 'bishnukumar', avatar: null } },
            { _id: '9', title: 'Docker for Node.js Developers', views: 34000, duration: 2880, createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'DevOps Pro', username: 'devopspro', avatar: null } },
            { _id: '10', title: 'Pagination with MongoDB Aggregate', views: 28000, duration: 1800, createdAt: new Date(Date.now() - 12 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'DB Expert', username: 'dbexpert', avatar: null } },
            { _id: '11', title: 'Bcrypt Password Hashing Tutorial', views: 41000, duration: 1260, createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'Security Dev', username: 'secdev', avatar: null } },
            { _id: '12', title: 'React + Node.js Full Stack Project', views: 156000, duration: 6480, createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), thumbnail: null, owner: { fullName: 'Full Stack Dev', username: 'fsd', avatar: null } },
        ];

        grid.innerHTML = '';
        mockVideos.forEach((v, i) => {
            grid.insertAdjacentHTML('beforeend', buildVideoCard(v, i));
        });
    }

    // ─── Filter chips ─────────────────────────────────
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const filter = chip.dataset.filter;
            if (filter === 'all')    { currentSort = 'createdAt'; currentSortType = 'desc'; }
            if (filter === 'latest') { currentSort = 'createdAt'; currentSortType = 'desc'; }
            if (filter === 'views')  { currentSort = 'views';     currentSortType = 'desc'; }
            if (filter === 'oldest') { currentSort = 'createdAt'; currentSortType = 'asc';  }

            loadVideos();
        });
    });

    // ─── Load More ────────────────────────────────────
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            loadVideos(true);
        });
    }

    // ─── Tab query support (?tab=trending) ───────────
    const tab = params.get('tab');
    if (tab === 'trending') {
        currentSort = 'views';
        currentSortType = 'desc';
        const viewChip = document.querySelector('[data-filter="views"]');
        if (viewChip) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            viewChip.classList.add('active');
        }
    }

    // ─── Initial load ────────────────────────────────
    loadVideos();
})();
