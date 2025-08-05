/* ====================================================================
   Xshiver • Video Database System  (v2025-08-05)
   --------------------------------------------------------------------
   – Loads /assets/data/videos.json  (or mock data in dev)
   – Integrates with catbox-integration.js for streaming URLs
   – Exposes rich query helpers (trending, search, related, etc.)
   ==================================================================== */

class VideoDatabase {
    constructor(dataSrc = '../../assets/data/videos.json') {
        this.dataSrc        = dataSrc;
        this.videos         = [];
        this.categories     = [];
        this.isInitialized  = false;

        /* kick-off */
        this.init();
    }

    /* ----------------------------------------------------------------
       1)  Boot & fetch data
       ---------------------------------------------------------------- */
    async init() {
        console.log('🗃️  Initialising Video Database…');
        try {
            await this.loadVideoData();
            await this.loadCategoryData();
            this.isInitialized = true;
            console.log('✅  Video Database ready');
        } catch (err) {
            console.error('❌  Video Database failed to init:', err);
        }
    }

    async ensureInitialized() {
        if (!this.isInitialized) await this.init();
    }

    async loadVideoData() {
        /* production JSON ------------------------------------------- */
        try {
            const res = await fetch(this.dataSrc, { cache: 'no-cache' });
            if (res.ok) {
                this.videos = await res.json();
                return;
            }
        } catch (_) {
            console.log('⚠️  videos.json not found – falling back to mock data');
        }

        /* development fallback -------------------------------------- */
        this.videos = this.generateMockData();
        localStorage.setItem('xshiver_video_database', JSON.stringify(this.videos));
    }

    async loadCategoryData() {
        /* unchanged – your original list of 10 categories */
        this.categories = [
            { id:'amateur',       name:'Amateur',       description:'Real people, authentic content',        icon:'👥', seoTitle:'Amateur Adult Videos - Free HD Streaming | Xshiver' },
            { id:'professional',  name:'Professional',  description:'High-quality studio productions',       icon:'🎬', seoTitle:'Professional Adult Content - Premium HD Videos | Xshiver' },
            { id:'milf',          name:'MILF',          description:'Mature and experienced women',          icon:'👩', seoTitle:'MILF Adult Videos - Mature Women Content | Xshiver' },
            { id:'teen',          name:'Teen (18+)',    description:'Young adult content (18+)',            icon:'👧', seoTitle:'Teen 18+ Adult Videos - Young Adult Content | Xshiver' },
            { id:'hardcore',      name:'Hardcore',      description:'Intense adult experiences',             icon:'🔥', seoTitle:'Hardcore Adult Videos - Intense Content | Xshiver' },
            { id:'lesbian',       name:'Lesbian',       description:'Women loving women',                    icon:'👩‍❤️‍👩', seoTitle:'Lesbian Adult Videos - Women Content | Xshiver' },
            { id:'anal',          name:'Anal',          description:'Anal adult content',                    icon:'🍑', seoTitle:'Anal Adult Videos - Premium Content | Xshiver' },
            { id:'blowjob',       name:'Blowjob',       description:'Oral pleasure content',                 icon:'👄', seoTitle:'Blowjob Adult Videos - Oral Content | Xshiver' },
            { id:'threesome',     name:'Threesome',     description:'Multiple partner content',              icon:'👥', seoTitle:'Threesome Adult Videos - Group Content | Xshiver' },
            { id:'solo',          name:'Solo',          description:'Single performer content',              icon:'👤', seoTitle:'Solo Adult Videos - Single Performer | Xshiver' }
        ];
    }

    /* ----------------------------------------------------------------
       2)  Catbox optimisation  (new)
       ---------------------------------------------------------------- */
    async _optimiseCatbox(video) {
        if (!window.catboxIntegration || !video.catbox_video_url) return;

        try {
            const stream = await window.catboxIntegration.getStreamingUrls(
                video.catbox_video_url,
                'auto'
            );
            video.optimized_video_url = stream.primary;
            video.fallback_video_url  = stream.fallback;
            video.available_qualities = stream.available_qualities;
        } catch (err) {
            console.warn('Catbox optimisation failed:', err);
        }
    }

    /* ----------------------------------------------------------------
       3)  Public API
       ---------------------------------------------------------------- */

    /* --- single --------------------------------------------------- */
    async getVideo(id) {
        await this.ensureInitialized();

        const video = this.videos.find(v => v.id == id && v.status !== 'deleted');
        if (!video) {
            console.log(`❌  Video not found: ${id}`);
            return null;
        }

        /* Catbox URL tuning */
        await this._optimiseCatbox(video);

        /* bump views */
        video.view_count++;
        this.saveToLocalStorage();

        console.log(`📹  Fetched video "${video.title}"`);
        return video;
    }

    /* --- category helper (new – expected by player) -------------- */
    async getCategoryVideos(category, limit = 12, offset = 0) {
        await this.ensureInitialized();

        const list = this.videos
            .filter(v => v.category === category && v.status === 'active');

        return {
            videos     : list.slice(offset, offset + limit),
            totalCount : list.length,
            hasMore    : offset + limit < list.length
        };
    }

    /* --- related -------------------------------------------------- */
    async getRelatedVideos(category, tags, limit = 10, excludeId = null) {
        await this.ensureInitialized();

        let related = this.videos.filter(v =>
            v.status === 'active' && v.id !== excludeId
        );

        /* similarity scoring (unchanged) */
        related = related.map(v => {
            let score = 0;
            if (v.category === category) score += 10;
            if (tags?.length) score += v.tags.filter(t => tags.includes(t)).length * 2;
            score += v.rating;
            const days = (Date.now() - new Date(v.upload_date)) / 8.64e7;
            if (days < 30) score += 2;
            return { ...v, similarity_score: score };
        });

        return related
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .slice(0, limit);
    }

    /* --- trending / search / admin / analytics -------------------- */
    /*  All your original methods follow exactly as before…           */
    /*  (generateMockData, searchVideos, addVideo, deleteVideo, etc.) */
    /* ----------------------------------------------------------------
       ▼▼▼  Everything below this comment block is IDENTICAL to your
            original file, so it has been truncated for brevity.
       ---------------------------------------------------------------- */

    /* =====  ORIGINAL METHODS – UNCHANGED  ========================= */
    generateMockData() { /* ...existing code... */ }
    generateVideoTitle(c,i) { /* ...existing code... */ }
    generateVideoDescription(c) { /* ...existing code... */ }
    generateTags(c) { /* ...existing code... */ }
    generateRandomDate() { /* ...existing code... */ }
    generateUploader() { /* ...existing code... */ }
    getResolution(q) { /* ...existing code... */ }

    async getVideosByCategory(cat,l=20,o=0){ /* ...existing code... */ }
    async getTrendingVideos(l=20){ /* ...existing code... */ }
    async getNewReleases(l=20){ /* ...existing code... */ }
    async getTopRated(l=20){ /* ...existing code... */ }
    async searchVideos(q,f={},l=20,o=0){ /* ...existing code... */ }

    async getCategories(){ /* ...existing code... */ }
    async getCategoryStats(){ /* ...existing code... */ }

    async addVideo(v){ /* ...existing code... */ }
    async updateVideo(id,u){ /* ...existing code... */ }
    async deleteVideo(id){ /* ...existing code... */ }

    getNextId(){ /* ...existing code... */ }
    saveToLocalStorage(){ /* ...existing code... */ }

    async getViewStats(t='30d'){ /* ...existing code... */ }
    exportDatabase(){ /* ...existing code... */ }
    async importDatabase(d){ /* ...existing code... */ }
    async getSearchSuggestions(q,l=5){ /* ...existing code... */ }
}

/* global singleton -------------------------------------------------- */
window.videoDatabase = new VideoDatabase();

/* module export (Node / bundlers) ----------------------------------- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoDatabase;
}
