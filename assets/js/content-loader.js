/* --------------------------------------------------------------
   Xshiver • ContentLoader
   Lazy images + infinite scroll + dynamic blocks
---------------------------------------------------------------- */

class ContentLoader {
    constructor() {
        this.imgObserver   = null;
        this.scrollObserver= null;
        this.init();
    }

    /* ---------- boot ---------- */
    init() {
        console.log('📥  ContentLoader ready');
        this._lazyImages();
        this._infiniteScroll();
    }

    /* ==========================================================
       Lazy-loading images
    ========================================================== */
    _lazyImages() {
        this.imgObserver = new IntersectionObserver(
            ents => ents.forEach(ent => {
                if (ent.isIntersecting) {
                    const img = ent.target;
                    img.src   = img.dataset.src;
                    img.onload = () => img.classList.add('loaded');
                    this.imgObserver.unobserve(img);
                }
            }),
            { rootMargin: '200px' }
        );

        document.querySelectorAll('img[data-src]')
            .forEach(img => this.imgObserver.observe(img));
    }

    /* ==========================================================
       Infinite scroll categories (demo)
    ========================================================== */
    _infiniteScroll() {
        const btn = document.getElementById('load-more-categories');
        if (!btn) return;

        this.scrollObserver = new IntersectionObserver(
            ents => ents.forEach(async ent => {
                if (ent.isIntersecting) {
                    await this._loadMore(btn);
                }
            }),
            { rootMargin: '300px' }
        );

        this.scrollObserver.observe(btn);
    }

    async _loadMore(btn) {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = 'Loading…';

        /* demo delay – replace with real API */
        await new Promise(r => setTimeout(r, 1000));

        /* nothing more to load in this demo */
        btn.textContent = 'No more categories';
    }
}

/* global */
window.contentLoader = null;
document.addEventListener('DOMContentLoaded', () => {
    window.contentLoader = new ContentLoader();
});
