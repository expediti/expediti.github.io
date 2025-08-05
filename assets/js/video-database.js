/* --------------------------------------------------------------
   Xshiver • VideoDatabase
   Loads videos.json once, exposes query helpers & Catbox tuning
---------------------------------------------------------------- */

class VideoDatabase {
    constructor(src = 'videos.json') {
        this.src         = src;
        this.videos      = [];
        this.initialized = false;
    }

    /* ---------- boot ---------- */
    async _init() {
        if (this.initialized) return;
        console.log('📊  Loading video catalog…');

        const res = await fetch(this.src, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`videos.json → HTTP ${res.status}`);

        this.videos      = await res.json();
        this.initialized = true;
        console.log(`✅  ${this.videos.length} videos loaded`);
    }

    /* ---------- single video ---------- */
    async getVideo(id) {
        await this._init();
        const v = this.videos.find(v => v.id == id);
        if (!v) throw new Error(`Video ${id} not found`);

        /* optimise Catbox URL (optional) */
        if (window.catboxIntegration && v.catbox_video_url) {
            const stream = await window.catboxIntegration.getStreamingUrls(
                v.catbox_video_url,
                'auto'
            );
            v.optimized_url  = stream.primary;
            v.available_qlty = stream.available_qualities;
        }
        return v;
    }

    /* ---------- collections ---------- */
    async getRelatedVideos(cat, tags = [], limit = 8, excludeId = null) {
        await this._init();
        return this.videos
            .filter(v =>
                v.id !== excludeId &&
                (v.category === cat || v.tags.some(t => tags.includes(t)))
            )
            .slice(0, limit);
    }

    async getCategoryVideos(cat, limit = 12, offset = 0) {
        await this._init();
        const list = this.videos.filter(v => v.category === cat);
        return {
            totalCount : list.length,
            videos     : list.slice(offset, offset + limit),
            hasMore    : offset + limit < list.length
        };
    }

    async getTrendingVideos(limit = 6) {
        await this._init();
        /* naïve trending = most views */
        return [...this.videos]
            .sort((a, b) => b.view_count - a.view_count)
            .slice(0, limit);
    }
}

/* global singleton */
window.videoDatabase = new VideoDatabase();
