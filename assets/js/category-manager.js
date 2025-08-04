/**
 * Category Page Manager
 * Loads videos for ?cat={slug} pages and links to video.html?id={id}
 */

class CategoryManager {
    constructor() {
        this.currentCategory = null;
        this.currentVideos   = [];
        this.isReady         = false;

        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    /* ---------- boot ---------- */

    async init() {
        try {
            await this.waitForVideoDB();

            this.currentCategory = this.getCategoryFromURL();
            if (!this.currentCategory) {
                this.showError('No category specified in URL (?cat=…)');
                return;
            }

            await this.loadCategory();
            this.isReady = true;
        } catch (err) {
            console.error(err);
            this.showError(err.message);
        }
    }

    waitForVideoDB() {
        return new Promise((res, rej) => {
            let tries = 0;
            const t   = setInterval(() => {
                if (window.videoDatabase && window.videoDatabase.isInitialized) {
                    clearInterval(t);
                    res();
                } else if (++tries > 100) {
                    clearInterval(t);
                    rej(new Error('Video database failed to initialise'));
                }
            }, 100);
        });
    }

    getCategoryFromURL() {
        const p = new URLSearchParams(window.location.search);
        return (p.get('cat') || '').toLowerCase().trim();
    }

    /* ---------- data ---------- */

    async loadCategory() {
        const cats = await window.videoDatabase.getCategories();
        const info = cats.find(c => c.id === this.currentCategory);
        if (!info) throw new Error(`Category "${this.currentCategory}" not found`);

        const vids = await window.videoDatabase.getVideosByCategory(
            this.currentCategory, 500, 0
        );
        this.currentVideos = vids;

        const stats = await window.videoDatabase.getCategoryStats();
        this.updateHeader(info, stats[this.currentCategory]);
        this.drawVideos();
    }

    /* ---------- UI ---------- */

    qs(id) { return document.getElementById(id); }

    updateHeader(c, s = {}) {
        this.qs('category-name').textContent        = c.name;
        this.qs('category-desc').textContent        = c.description;
        this.qs('category-icon').textContent        = c.icon || '🎬';
        this.qs('category-video-count').textContent = s.video_count ?? this.currentVideos.length;
        this.qs('category-views').textContent       = this.n(s.total_views ?? 0);
        this.qs('category-rating').textContent      = s.average_rating ?? '0.0';

        if (this.currentVideos.length) {
            const avg = Math.floor(
                this.currentVideos.reduce((a,v)=>a+v.duration,0)/this.currentVideos.length
            );
            this.qs('category-duration').textContent = this.time(avg);
        }
    }

    drawVideos() {
        const grid  = this.qs('videos-grid');
        const count = this.qs('results-count');
        grid.innerHTML = '';
        count.textContent = this.currentVideos.length;

        if (!this.currentVideos.length) {
            this.showError('No videos in this category');
            return;
        }

        this.currentVideos.forEach(v => grid.appendChild(this.card(v)));
        grid.style.display = 'grid';
        this.qs('loading-state').style.display = 'none';
    }

    card(v) {
        const d = document.createElement('div');
        d.className = 'video-card';
        d.innerHTML = `
            <div class="video-thumbnail">
                <img src="${v.catbox_thumbnail_url}" alt="${v.title}"
                     onerror="this.src='../../assets/images/placeholder.jpg'" loading="lazy">
                <div class="video-duration">${this.time(v.duration)}</div>
                <div class="video-quality">${v.quality}</div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${v.title}</h3>
                <div class="video-stats">
                    <span>${this.n(v.view_count)} views</span>
                    <span>⭐ ${v.rating}</span>
                </div>
            </div>`;
        d.onclick = () => {
            // one level up from /pages/categories/ → /pages/video.html
            window.location.href = `../video.html?id=${v.id}`;
        };
        return d;
    }

    showError(msg) {
        const g = this.qs('videos-grid');
        if (g) g.innerHTML =
            `<div class="error-message"><h3>Error</h3><p>${msg}</p></div>`;
        this.qs('results-count').textContent = '0';
        this.qs('loading-state').style.display = 'none';
    }

    /* ---------- utils ---------- */

    n(x)  { return x>=1e6 ? (x/1e6).toFixed(1)+'M' : x>=1e3 ? (x/1e3).toFixed(1)+'K' : x; }
    time(s){const m=Math.floor(s/60),sec=Math.floor(s%60);return `${m}:${sec.toString().padStart(2,'0')}`;}
}

new CategoryManager();     // auto-start
