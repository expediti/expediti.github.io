/**
 * Category Manager for Xshiver
 * Handles category navigation, loading, and management
 */

class CategoryManager {
    constructor() {
        this.categories = [];
        this.currentCategory = null;
        this.isInitialized = false;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.sortBy = 'popular';

        this.init();
    }

    async init() {
        console.log('📂 Category Manager initialized');

        try {
            await this.loadCategories();
            await this.detectCurrentCategory();
            this.setupEventListeners();
            this.renderCategories();
            this.isInitialized = true;

            console.log(`✅ Loaded ${this.categories.length} categories`);
        } catch (error) {
            console.error('Category Manager initialization failed:', error);
        }
    }

    /* ---------- CATEGORY DATA ---------- */

    async loadCategories() {
        try {
            // Try loading from extended categories file
            const response = await fetch('../../assets/data/categories-extended.json');

            if (response.ok) {
                this.categories = await response.json();
            } else {
                // Fallback to database categories
                this.categories = await window.videoDatabase.getCategories();
            }
        } catch (error) {
            console.log('Loading fallback categories...');
            this.categories = this.generateExtendedCategories();
        }

        // Add statistics
        await this.enhanceCategoriesWithStats();
    }

    /* ---------- PAGE & META UPDATES ---------- */

    detectCurrentCategory() {
        const urlParams = new URLSearchParams(window.location.search);
        const categorySlug = urlParams.get('cat');

        if (categorySlug) {
            this.currentCategory = this.categories.find(cat => cat.slug === categorySlug);
            if (this.currentCategory) {
                this.updateCategoryPageInfo();
            }
        }
    }

    updateCategoryPageInfo() {
        if (!this.currentCategory) return;

        // Document title / meta description
        document.title = this.currentCategory.seo_title || `${this.currentCategory.name} - Xshiver`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = this.currentCategory.seo_description || this.currentCategory.description;
        }

        // Open Graph
        document.getElementById('og-category-title').content = this.currentCategory.name;
        document.getElementById('og-category-description').content = this.currentCategory.description;
        document.getElementById('og-category-url').content = window.location.href;

        // Header visuals
        this.updateCategoryHeader();

        // Breadcrumb
        const breadcrumbCategory = document.getElementById('breadcrumb-category');
        if (breadcrumbCategory) {
            breadcrumbCategory.textContent = this.currentCategory.name;
        }

        // Schema
        this.updateSchemaMarkup();
    }

    updateCategoryHeader() {
        if (!this.currentCategory) return;

        const categoryBackground = document.getElementById('category-background');
        if (categoryBackground && this.currentCategory.background_image) {
            categoryBackground.style.backgroundImage =
                `url('../../assets/images/${this.currentCategory.background_image}')`;
        }

        document.getElementById('category-icon').textContent = this.currentCategory.icon;
        document.getElementById('category-name').textContent = this.currentCategory.name;
        document.getElementById('category-desc').textContent = this.currentCategory.description;

        document.getElementById('category-video-count').textContent =
            this.formatNumber(this.currentCategory.video_count);
        document.getElementById('category-views').textContent =
            this.formatNumber(this.currentCategory.total_views);
        document.getElementById('category-rating').textContent =
            this.currentCategory.average_rating;
        document.getElementById('category-duration').textContent = '15min'; // Placeholder
    }

    updateSchemaMarkup() {
        if (!this.currentCategory) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": this.currentCategory.name,
            "description": this.currentCategory.description,
            "url": window.location.href,
            "mainEntity": {
                "@type": "VideoGallery",
                "name": this.currentCategory.name,
                "numberOfItems": this.currentCategory.video_count
            }
        };

        const schemaScript = document.getElementById('category-schema');
        if (schemaScript) {
            schemaScript.textContent = JSON.stringify(schema);
        }
    }

    /* ---------- RENDERING ---------- */

    renderCategories() {
        this.viewMode === 'grid' ? this.renderGridView() : this.renderListView();
    }

    renderGridView() {
        const featuredGrid = document.getElementById('featured-categories');
        const allCategoriesGrid = document.getElementById('all-categories');

        if (featuredGrid) {
            const featuredCategories = this.categories.filter(cat => cat.featured);
            featuredGrid.innerHTML = featuredCategories.map(cat =>
                this.createCategoryCard(cat, true)
            ).join('');
        }

        if (allCategoriesGrid) {
            allCategoriesGrid.classList.remove('hidden');
            const sorted = this.sortCategories(this.categories);
            allCategoriesGrid.innerHTML = sorted.map(cat =>
                this.createCategoryCard(cat, false)
            ).join('');
        }

        const listView = document.getElementById('categories-list');
        if (listView) listView.classList.add('hidden');
    }

    renderListView() {
        const listView = document.getElementById('categories-list');
        const gridView = document.getElementById('all-categories');

        if (listView) {
            listView.classList.remove('hidden');
            const sorted = this.sortCategories(this.categories);
            listView.innerHTML = sorted.map(cat =>
                this.createCategoryListItem(cat)
            ).join('');
        }

        if (gridView) gridView.classList.add('hidden');
    }

    /* ---- CARD / LIST ITEM BUILDERS ---- */

    createCategoryCard(category, isFeatured = false) {
        const badges = this.getCategoryBadges(category);
        const cardSize = isFeatured ? 'featured' : 'regular';

        return `
            <div class="category-card ${cardSize}" onclick="navigateToCategory('${category.slug}')">
                <div class="category-background"
                     style="background-image: url('../../assets/images/${category.slug}.jpg')">
                    <div class="category-overlay"></div>
                </div>

                <div class="category-content">
                    <div class="category-header">
                        <div class="category-icon">${category.icon}</div>
                        <div class="category-badges">${badges}</div>
                    </div>

                    <div class="category-body">
                        <h3 class="category-title">${category.name}</h3>
                        <p class="category-description">${this.truncateText(category.description, 100)}</p>
                    </div>

                    <div class="category-footer">
                        <div class="category-stats">
                            <div class="category-stat">
                                <span class="category-stat-number">${this.formatNumber(category.video_count)}</span>
                                <span class="category-stat-label">Videos</span>
                            </div>
                            <div class="category-stat">
                                <span class="category-stat-number">${category.average_rating}</span>
                                <span class="category-stat-label">Rating</span>
                            </div>
                        </div>

                        <button class="category-action">Browse →</button>
                    </div>
                </div>
            </div>
        `;
    }

    createCategoryListItem(category) {
        const badges = this.getCategoryBadges(category);

        return `
            <div class="category-list-item" onclick="navigateToCategory('${category.slug}')">
                <div class="category-list-icon">${category.icon}</div>

                <div class="category-list-content">
                    <div class="category-list-title">
                        ${category.name}
                        <div class="category-badges">${badges}</div>
                    </div>
                    <p class="category-list-description">${category.description}</p>

                    <div class="category-list-meta">
                        <span>${this.formatNumber(category.video_count)} videos</span>
                        <span>${this.formatNumber(category.total_views)} views</span>
                        <span>${category.average_rating} ⭐</span>
                        <span>Updated ${this.formatDate(category.latest_upload)}</span>
                    </div>
                </div>

                <div class="category-list-actions">
                    <button class="btn-primary">Browse</button>
                </div>
            </div>
        `;
    }

    /* ---- UTILITY / MISC ---- */

    getCategoryBadges(cat) {
        let b = '';
        if (cat.trending)  b += '<span class="category-badge trending">🔥 Trending</span>';
        if (cat.new)       b += '<span class="category-badge new">🆕 New</span>';
        if (cat.featured)  b += '<span class="category-badge featured">⭐ Featured</span>';
        return b;
    }

    sortCategories(cats) {
        const sorted = [...cats];
        switch (this.sortBy) {
            case 'alphabetical': return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'newest':       return sorted.sort((a, b) => new Date(b.latest_upload) - new Date(a.latest_upload));
            case 'most-videos':  return sorted.sort((a, b) => b.video_count - a.video_count);
            default: // popular
                return sorted.sort((a, b) => {
                    const aScore = (a.total_views * 0.7) + (a.video_count * 1000);
                    const bScore = (b.total_views * 0.7) + (b.video_count * 1000);
                    return bScore - aScore;
                });
        }
    }

    formatNumber(num) {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'K';
        return num.toString();
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now  = new Date();
        const diff = Math.abs(now - date) / 86_400_000; // days
        if (diff < 1)          return 'today';
        if (diff <= 7)         return `${Math.round(diff)} days ago`;
        if (diff <= 30)        return `${Math.round(diff / 7)} weeks ago`;
        return `${Math.round(diff / 30)} months ago`;
    }

    truncateText(txt, max) {
        return txt.length <= max ? txt : txt.slice(0, max) + '…';
    }

    /* ---- ADDITIONAL METHODS (UNCHANGED) ---- */
    //  All other methods such as enhanceCategoriesWithStats, loadRelatedCategories, etc.
    //  remain exactly as they were in your current implementation.
}

/* ---------- INITIALISATION ---------- */

window.categoryManager = null;

document.addEventListener('DOMContentLoaded', () => {
    if (window.videoDatabase) {
        window.categoryManager = new CategoryManager();
    } else {
        const wait = () => {
            if (window.videoDatabase?.isInitialized) {
                window.categoryManager = new CategoryManager();
            } else {
                setTimeout(wait, 100);
            }
        };
        wait();
    }
});

/* ---------- GLOBAL HELPERS (UNCHANGED) ---------- */
// navigateToCategory, playRandomVideo, toggleCategoryBookmark, etc.
// remain as in your existing file.
