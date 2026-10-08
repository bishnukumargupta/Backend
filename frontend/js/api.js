/**
 * api.js — Centralised API client
 * All calls go to: http://localhost:8000/api/v1
 */

const BASE_URL = 'http://localhost:8000/api/v1';

// ─── Core fetch wrapper ───────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem('accessToken');

    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || `HTTP error ${res.status}`);
        }

        return data;
    } catch (err) {
        throw err;
    }
}

// ─── AUTH ────────────────────────────────────────────
const Auth = {
    register: (formData) => apiFetch('/users/register', { method: 'POST', body: formData }),
    login:    (body)     => apiFetch('/users/login',    { method: 'POST', body: JSON.stringify(body) }),
    logout:              () => apiFetch('/users/logout', { method: 'POST' }),
    currentUser:         () => apiFetch('/users/current-user'),
    refreshToken:        () => apiFetch('/users/refresh', { method: 'POST' }),
    changePassword: (body) => apiFetch('/users/change-password', { method: 'POST', body: JSON.stringify(body) }),
    updateDetails:  (body) => apiFetch('/users/update-account-details', { method: 'PATCH', body: JSON.stringify(body) }),
    updateAvatar:   (formData) => apiFetch('/users/update-avatar', { method: 'PATCH', body: formData }),
    updateCover:    (formData) => apiFetch('/users/update-cover-image', { method: 'PATCH', body: formData }),
    getChannel: (id) => apiFetch(`/users/user-channel/${id}`),
    watchHistory:   () => apiFetch('/users/watch-history'),
};

// ─── VIDEOS ──────────────────────────────────────────
const Videos = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(`/videos${qs ? '?' + qs : ''}`);
    },
    getById:  (id) => apiFetch(`/videos/${id}`),
    publish:  (formData) => apiFetch('/videos', { method: 'POST', body: formData }),
    update:   (id, formData) => apiFetch(`/videos/${id}`, { method: 'PATCH', body: formData }),
    delete:   (id) => apiFetch(`/videos/${id}`, { method: 'DELETE' }),
    togglePublish: (id) => apiFetch(`/videos/toggle/publish/${id}`, { method: 'PATCH' }),
};

// ─── COMMENTS ────────────────────────────────────────
const Comments = {
    getByVideo: (videoId, params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch(`/comments/${videoId}${qs ? '?' + qs : ''}`);
    },
    add:    (videoId, body) => apiFetch(`/comments/${videoId}`, { method: 'POST', body: JSON.stringify(body) }),
    update: (commentId, body) => apiFetch(`/comments/c/${commentId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (commentId) => apiFetch(`/comments/c/${commentId}`, { method: 'DELETE' }),
};

// ─── LIKES ───────────────────────────────────────────
const Likes = {
    toggleVideo:   (videoId)   => apiFetch(`/likes/toggle/v/${videoId}`,   { method: 'POST' }),
    toggleComment: (commentId) => apiFetch(`/likes/toggle/c/${commentId}`, { method: 'POST' }),
    toggleTweet:   (tweetId)   => apiFetch(`/likes/toggle/t/${tweetId}`,   { method: 'POST' }),
    getLikedVideos: () => apiFetch('/likes/videos'),
};

// ─── SUBSCRIPTIONS ───────────────────────────────────
const Subscriptions = {
    toggle:          (channelId) => apiFetch(`/subscriptions/c/${channelId}`, { method: 'POST' }),
    getSubscribers:  (channelId) => apiFetch(`/subscriptions/c/${channelId}`),
    getSubscribedTo: (userId)    => apiFetch(`/subscriptions/u/${userId}`),
};

// ─── TWEETS ──────────────────────────────────────────
const Tweets = {
    create:     (body)    => apiFetch('/tweets',        { method: 'POST',   body: JSON.stringify(body) }),
    getUserAll: (userId)  => apiFetch(`/tweets/user/${userId}`),
    update:     (id, body) => apiFetch(`/tweets/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete:     (id)      => apiFetch(`/tweets/${id}`,  { method: 'DELETE' }),
};

// ─── DASHBOARD ───────────────────────────────────────
const Dashboard = {
    getStats:  () => apiFetch('/dashboard/stats'),
    getVideos: () => apiFetch('/dashboard/videos'),
};

// ─── PLAYLIST ────────────────────────────────────────
const Playlists = {
    create:  (body) => apiFetch('/playlist', { method: 'POST', body: JSON.stringify(body) }),
    getById: (id)   => apiFetch(`/playlist/${id}`),
    getUserPlaylists: (userId) => apiFetch(`/playlist/user/${userId}`),
    addVideo:    (playlistId, videoId) => apiFetch(`/playlist/add/${videoId}/${playlistId}`,    { method: 'PATCH' }),
    removeVideo: (playlistId, videoId) => apiFetch(`/playlist/remove/${videoId}/${playlistId}`, { method: 'PATCH' }),
    delete:  (id) => apiFetch(`/playlist/${id}`, { method: 'DELETE' }),
    update:  (id, body) => apiFetch(`/playlist/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ─── Helpers ─────────────────────────────────────────

/** Format number: 1200 → "1.2K" */
function formatViews(n) {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

/** Format seconds to MM:SS */
function formatDuration(secs) {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format ISO date to "2 hours ago" */
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months= Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (mins < 1)    return 'just now';
    if (mins < 60)   return `${mins} min${mins > 1 ? 's' : ''} ago`;
    if (hours < 24)  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7)    return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 5)   return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

/** Show a toast notification */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = 'toast'; }, 3500);
}

/** Generate a placeholder thumbnail from video title */
function placeholderThumb(title = '', index = 0) {
    const colors = [
        ['7c3aed','ec4899'], ['0ea5e9','06b6d4'], ['f59e0b','ef4444'],
        ['10b981','059669'], ['8b5cf6','6366f1'], ['f97316','fb923c'],
    ];
    const pair = colors[index % colors.length];
    const text = encodeURIComponent(title.substring(0, 20));
    return `https://placehold.co/480x270/${pair[0]}/${pair[1]}?text=${text}`;
}

/** Build a video card HTML string */
function buildVideoCard(video, index = 0) {
    const thumb = video.thumbnail || placeholderThumb(video.title, index);
    const avatar = video.owner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.owner?.username || 'user'}`;
    const channel = video.owner?.fullName || video.owner?.username || 'Unknown';
    const views = formatViews(video.views);
    const dur = formatDuration(video.duration);
    const ago = timeAgo(video.createdAt);

    return `
    <a href="video.html?id=${video._id}" class="video-card" id="vc-${video._id}">
        <div class="card-thumb">
            <img src="${thumb}" alt="${video.title}" loading="lazy" onerror="this.src='${placeholderThumb(video.title, index)}'"/>
            <span class="card-duration">${dur}</span>
        </div>
        <div class="card-body">
            <img src="${avatar}" alt="${channel}" class="card-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${channel}'"/>
            <div class="card-info">
                <div class="card-title">${video.title}</div>
                <div class="card-channel">${channel}</div>
                <div class="card-meta">${views} views · ${ago}</div>
            </div>
        </div>
    </a>`;
}
