/* --------------------------------------------------------------
   Xshiver • Custom Video Player   (v2025-08-05)
   Depends on: video-database.js  &  catbox-integration.js
---------------------------------------------------------------- */

class XshiverVideoPlayer {

    /* ---------- ctor ---------- */
    constructor(containerId = 'xshiver-player', opts = {}) {
        this.wrap   = document.getElementById(containerId);
        this.video  = this.wrap.querySelector('#main-video');
        this.source = this.wrap.querySelector('#video-source');

        this.opts   = Object.assign({
            autoplay      : false,
            defaultVolume : 0.8
        }, opts);

        /* state */
        this.videoData = null;
        this.controlsTimeout = null;

        /* boot */
        this._bindUI();
        this._listeners();
        this._loadFromURL();
    }

    /* ==========================================================
       UI refs
    ========================================================== */
    _bindUI() {
        this.bigPlay      = this.wrap.querySelector('#big-play-btn');
        this.playBtn      = this.wrap.querySelector('#play-pause-btn');
        this.loadOverlay  = this.wrap.querySelector('#video-loading');
        this.progressFill = this.wrap.querySelector('#progress-filled');
        this.progressBar  = this.wrap.querySelector('#progress-bar');
    }

    /* ==========================================================
       Event listeners
    ========================================================== */
    _listeners() {
        /* video element */
        this.video.addEventListener('loadstart', () => this._showLoad());
        this.video.addEventListener('canplay',    () => this._hideLoad());
        this.video.addEventListener('error',      e  => this._onVideoError(e));

        /* basic play/pause */
        this.bigPlay .addEventListener('click', () => this.togglePlay());
        this.playBtn.addEventListener('click', () => this.togglePlay());

        /* progress click-seek */
        this.progressBar?.addEventListener('click', e => this._seekFrom(e));
    }

    /* ==========================================================
       Loading logic
    ========================================================== */
    async _loadFromURL() {
        try {
            const id = new URLSearchParams(location.search).get('id');
            if (!id) throw new Error('No ?id= in URL');

            this._showLoad('Fetching video…');
            const data = await window.videoDatabase.getVideo(id);
            this.videoData = data;

            /* pick URL */
            const url = data.optimized_url || data.catbox_video_url;
            console.log('🎬  Using source:', url);

            /* quick HEAD check */
            if (window.catboxIntegration &&
                !(await window.catboxIntegration.verifyUrlAccessibility(url))
            ) {
                throw new Error('Video file not reachable');
            }

            this.source.src = url;
            this.video.load();
            this.video.volume = this.opts.defaultVolume;

            if (this.opts.autoplay) {
                this.video.play().catch(() => {/* autoplay blocked */});
            }

            /* related */
            this._loadRelated(data);

        } catch (err) {
            console.error(err);
            this._error(`Load failed – ${err.message}`);
        }
    }

    /* ==========================================================
       Basic controls
    ========================================================== */
    togglePlay() {
        this.video.paused ? this.video.play() : this.video.pause();
    }

    _seekFrom(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const pct  = (e.clientX - rect.left) / rect.width;
        this.video.currentTime = pct * this.video.duration;
    }

    /* ==========================================================
       Overlays
    ========================================================== */
    _showLoad(txt = 'Loading…') {
        this.loadOverlay.querySelector('p').textContent = txt;
        this.loadOverlay.classList.remove('hidden');
    }
    _hideLoad() {
        this.loadOverlay.classList.add('hidden');
    }
    _error(msg) {
        this._hideLoad();
        alert(msg); /* simple fallback – replace with custom UI if desired */
    }

    _onVideoError(e) {
        console.error('💥 Video error', e);
        this._error('Cannot play this file');
    }

    /* ==========================================================
       Related vids
    ========================================================== */
    async _loadRelated(data) {
        try {
            const list = await window.videoDatabase.getRelatedVideos(
                data.category, data.tags, 6, data.id
            );
            /* you already have UI helpers elsewhere – plug list here */
            console.log('🧭 Related:', list);
        } catch (err) {
            console.warn('Related fetch failed', err);
        }
    }
}

/* --------------------------------------------------------------
   Boot once DOM ready
---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    /* simple age-gate stub */
    (window.ageVerification = window.ageVerification || {
        isVerified : () => true
    });

    const wait = () => {
        if (window.ageVerification.isVerified()) {
            window.xshiverPlayer = new XshiverVideoPlayer();
        } else {
            setTimeout(wait, 500);
        }
    };
    wait();
});
