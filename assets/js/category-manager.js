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
        
        // Enhance categories with statistics
        await this.enhanceCategoriesWithStats();
    }
    
    generateExtendedCategories() {
        return [
            {
                id: 1,
                name: 'Amateur',
                slug: 'amateur',
                description: 'Real people sharing authentic intimate moments with genuine passion and chemistry.',
                icon: '👥',
                background_image: 'amateur-bg.jpg',
                thumbnail: 'amateur-thumb.jpg',
                featured: true,
                trending: false,
                new: false,
                tags: ['amateur', 'real', 'homemade', 'authentic'],
                subcategories: ['Couple', 'Solo', 'Webcam', 'Homemade'],
                seo_title: 'Amateur Adult Videos - Real People, Real Passion | Xshiver',
                seo_description: 'Watch authentic amateur adult videos featuring real couples and individuals sharing intimate moments.',
                color_theme: '#FF6B6B'
            },
            {
                id: 2,
                name: 'Professional',
                slug: 'professional',
                description: 'High-quality studio productions featuring professional performers and cinematic quality.',
                icon: '🎬',
                background_image: 'professional-bg.jpg',
                thumbnail: 'professional-thumb.jpg',
                featured: true,
                trending: true,
                new: false,
                tags: ['professional', 'studio', 'hd', '4k', 'pornstar'],
                subcategories: ['Studio', 'Pornstar', '4K Production', 'Cinematic'],
                seo_title: 'Professional Adult Videos - HD Studio Productions | Xshiver',
                seo_description: 'Premium professional adult content with top performers and studio-quality production.',
                color_theme: '#4A90E2'
            },
            {
                id: 3,
                name: 'MILF',
                slug: 'milf',
                description: 'Experienced and mature women showcasing sophistication and sensuality.',
                icon: '👩',
                background_image: 'milf-bg.jpg',
                thumbnail: 'milf-thumb.jpg',
                featured: true,
                trending: false,
                new: false,
                tags: ['milf', 'mature', 'experienced', 'cougar', 'older'],
                subcategories: ['Mature', 'Cougar', 'Experienced', 'Sophisticated'],
                seo_title: 'MILF Adult Videos - Mature Women Content | Xshiver',
                seo_description: 'Sophisticated mature women in premium adult content. Experience and sensuality combined.',
                color_theme: '#E74C3C'
            },
            {
                id: 4,
                name: 'Teen (18+)',
                slug: 'teen',
                description: 'Young adult performers (18+) with youthful energy and playful scenarios.',
                icon: '👧',
                background_image: 'teen-bg.jpg',
                thumbnail: 'teen-thumb.jpg',
                featured: true,
                trending: true,
                new: true,
                tags: ['teen', '18+', 'young', 'college', 'fresh'],
                subcategories: ['College', 'Young Adult', 'Fresh Faces', 'Barely Legal'],
                seo_title: 'Teen 18+ Adult Videos - Young Adult Content | Xshiver',
                seo_description: 'Young adult performers (18+) in energetic and playful adult scenarios.',
                color_theme: '#9B59B6'
            },
            {
                id: 5,
                name: 'Hardcore',
                slug: 'hardcore',
                description: 'Intense and passionate adult performances with high energy and excitement.',
                icon: '🔥',
                background_image: 'hardcore-bg.jpg',
                thumbnail: 'hardcore-thumb.jpg',
                featured: false,
                trending: true,
                new: false,
                tags: ['hardcore', 'intense', 'rough', 'passionate', 'extreme'],
                subcategories: ['Intense', 'Rough', 'Passionate', 'High Energy'],
                seo_title: 'Hardcore Adult Videos - Intense Content | Xshiver',
                seo_description: 'High-intensity adult performances with passionate and energetic scenes.',
                color_theme: '#FF4500'
            },
            {
                id: 6,
                name: 'Lesbian',
                slug: 'lesbian',
                description: 'Women-loving-women content featuring intimate connections and chemistry.',
                icon: '👩‍❤️‍👩',
                background_image: 'lesbian-bg.jpg',
                thumbnail: 'lesbian-thumb.jpg',
                featured: false,
                trending: false,
                new: false,
                tags: ['lesbian', 'girl-on-girl', 'women', 'sapphic', 'female'],
                subcategories: ['Girl on Girl', 'Romantic', 'Passionate', 'Intimate'],
                seo_title: 'Lesbian Adult Videos - Women Loving Women | Xshiver',
                seo_description: 'Beautiful women exploring intimate connections in passionate lesbian content.',
                color_theme: '#E91E63'
            },
            {
                id: 7,
                name: 'Anal',
                slug: 'anal',
                description: 'Specialized adult content focusing on anal performances and techniques.',
                icon: '🍑',
                background_image: 'anal-bg.jpg',
                thumbnail: 'anal-thumb.jpg',
                featured: false,
                trending: false,
                new: false,
                tags: ['anal', 'backdoor', 'tight', 'technique', 'specialized'],
                subcategories: ['First Time', 'Experienced', 'Technique', 'Intense'],
                seo_title: 'Anal Adult Videos - Specialized Content | Xshiver',
                seo_description: 'Premium anal adult content featuring skilled performers and techniques.',
                color_theme: '#795548'
            },
            {
                id: 8,
                name: 'Blowjob',
                slug: 'blowjob',
                description: 'Oral performance content featuring skilled and passionate displays.',
                icon: '👄',
                background_image: 'blowjob-bg.jpg',
                thumbnail: 'blowjob-thumb.jpg',
                featured: false,
                trending: true,
                new: false,
                tags: ['blowjob', 'oral', 'skilled', 'deep-throat', 'passionate'],
                subcategories: ['Deep Throat', 'Skilled', 'Passionate', 'Technique'],
                seo_title: 'Blowjob Adult Videos - Oral Content | Xshiver',
                seo_description: 'Skilled oral performances featuring passionate and talented displays.',
                color_theme: '#FF69B4'
            },
            {
                id: 9,
                name: 'Threesome',
                slug: 'threesome',
                description: 'Group encounter content featuring multiple participants and shared experiences.',
                icon: '👥',
                background_image: 'threesome-bg.jpg',
                thumbnail: 'threesome-thumb.jpg',
                featured: false,
                trending: false,
                new: true,
                tags: ['threesome', 'group', 'multiple', 'sharing', 'fantasy'],
                subcategories: ['MMF', 'FFM', 'Group', 'Multiple Partners'],
                seo_title: 'Threesome Adult Videos - Group Content | Xshiver',
                seo_description: 'Exciting group encounters with multiple participants in premium adult scenarios.',
                color_theme: '#607D8B'
            },
            {
                id: 10,
                name: 'Solo',
                slug: 'solo',
                description: 'Individual performances showcasing personal expression and self-exploration.',
                icon: '👤',
                background_image: 'solo-bg.jpg',
                thumbnail: 'solo-thumb.jpg',
                featured: false,
                trending: false,
                new: false,
                tags: ['solo', 'masturbation', 'self-exploration', 'individual', 'personal'],
                subcategories: ['Masturbation', 'Toys', 'Self Exploration', 'Intimate'],
                seo_title: 'Solo Adult Videos - Individual Performances | Xshiver',
                seo_description: 'Intimate solo performances featuring personal expression and self-exploration.',
                color_theme: '#009688'
            },
            {
                id: 11,
                name: 'BDSM',
                slug: 'bdsm',
                description: 'Bondage and discipline content for those seeking alternative experiences.',
                icon: '⛓️',
                background_image: 'bdsm-bg.jpg',
                thumbnail: 'bdsm-thumb.jpg',
                featured: false,
                trending: false,
                new: false,
                tags: ['bdsm', 'bondage', 'discipline', 'domination', 'submission'],
                subcategories: ['Bondage', 'Discipline', 'Domination', 'Submission'],
                seo_title: 'BDSM Adult Videos - Alternative Content | Xshiver',
                seo_description: 'Explore BDSM and alternative adult content with bondage and discipline themes.',
                color_theme: '#424242'
            },
            {
                id: 12,
                name: 'Fetish',
                slug: 'fetish',
                description: 'Specialized fetish content catering to unique interests and preferences.',
                icon: '👠',
                background_image: 'fetish-bg.jpg',
                thumbnail: 'fetish-thumb.jpg',
                featured: false,
                trending: false,
                new: false,
                tags: ['fetish', 'specialized', 'unique', 'alternative', 'niche'],
                subcategories: ['Foot', 'Latex', 'Roleplay', 'Specialized'],
                seo_title: 'Fetish Adult Videos - Specialized Content | Xshiver',
                seo_description: 'Unique fetish content catering to specialized interests and preferences.',
                color_theme: '#8E24AA'
            }
        ];
    }
    
    async enhanceCategoriesWithStats() {
        // Add video counts and statistics to each category
        for (const category of this.categories) {
            try {
                const categoryData = await window.videoDatabase.getCategoryVideos(category.slug, 1, 0);
                
                category.video_count = categoryData.totalCount || 0;
                category.total_views = await this.calculateCategoryViews(category.slug);
                category.average_rating = await this.calculateCategoryRating(category.slug);
                category.latest_upload = await this.getLatestUpload(category.slug);
                
            } catch (error) {
                console.error(`Error enhancing category ${category.slug}:`, error);
                category.video_count = Math.floor(Math.random() * 500) + 50;
                category.total_views = Math.floor(Math.random() * 1000000) + 10000;
                category.average_rating = (Math.random() * 2 + 3).toFixed(1);
                category.latest_upload = new Date().toISOString();
            }
        }
    }
    
    async calculateCategoryViews(categorySlug) {
        const videos = await window.videoDatabase.getCategoryVideos(categorySlug, 100, 0);
        return videos.videos.reduce((total, video) => total + video.view_count, 0);
    }
    
    async calculateCategoryRating(categorySlug) {
        const videos = await window.videoDatabase.getCategoryVideos(categorySlug, 100, 0);
        if (videos.videos.length === 0) return 0;
        
        const avgRating = videos.videos.reduce((total, video) => total + video.rating, 0) / videos.videos.length;
        return avgRating.toFixed(1);
    }
    
    async getLatestUpload(categorySlug) {
        const videos = await window.videoDatabase.getCategoryVideos(categorySlug, 1, 0);
        if (videos.videos.length === 0) return new Date().toISOString();
        
        return videos.videos[0].upload_date;
    }
    
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
        
        // Update page title and meta tags
        document.title = this.currentCategory.seo_title || `${this.currentCategory.name} - Xshiver`;
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = this.currentCategory.seo_description || this.currentCategory.description;
        }
        
        // Update Open Graph tags
        document.getElementById('og-category-title').content = this.currentCategory.name;
        document.getElementById('og-category-description').content = this.currentCategory.description;
        document.getElementById('og-category-url').content = window.location.href;
        
        // Update category header
        this.updateCategoryHeader();
        
        // Update breadcrumb
        const breadcrumbCategory = document.getElementById('breadcrumb-category');
        if (breadcrumbCategory) {
            breadcrumbCategory.textContent = this.currentCategory.name;
        }
        
        // Update schema markup
        this.updateSchemaMarkup();
    }
    
    updateCategoryHeader() {
        if (!this.currentCategory) return;
        
        // Update category background
        const categoryBackground = document.getElementById('category-background');
        if (categoryBackground && this.currentCategory.background_image) {
            categoryBackground.style.backgroundImage = `url('../../assets/images/categories/${this.currentCategory.background_image}')`;
        }
        
        // Update category info
        document.getElementById('category-icon').textContent = this.currentCategory.icon;
        document.getElementById('category-name').textContent = this.currentCategory.name;
        document.getElementById('category-desc').textContent = this.currentCategory.description;
        
        // Update statistics
        document.getElementById('category-video-count').textContent = this.formatNumber(this.currentCategory.video_count);
        document.getElementById('category-views').textContent = this.formatNumber(this.currentCategory.total_views);
        document.getElementById('category-rating').textContent = this.currentCategory.average_rating;
        document.getElementById('category-duration').textContent = '15min'; // Calculate average later
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
    
    setupEventListeners() {
        // View toggle buttons
        const viewToggle = document.getElementById('view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', this.handleViewToggle.bind(this));
        }
        
        // Sort dropdown
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        }
        
        // Advanced filters button
        const advancedFiltersBtn = document.getElementById('advanced-filters-btn');
        if (advancedFiltersBtn) {
            advancedFiltersBtn.addEventListener('click', this.showAdvancedFilters.bind(this));
        }
    }
    
    handleViewToggle(e) {
        if (e.target.classList.contains('view-btn')) {
            const newView = e.target.dataset.view;
            
            // Update active button
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Switch view mode
            this.viewMode = newView;
            this.renderCategories();
        }
    }
    
    handleSortChange(e) {
        this.sortBy = e.target.value;
        this.renderCategories();
    }
    
    showAdvancedFilters() {
        const modal = document.getElementById('advanced-filters-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    renderCategories() {
        if (this.viewMode === 'grid') {
            this.renderGridView();
        } else {
            this.renderListView();
        }
    }
    
    renderGridView() {
        const featuredGrid = document.getElementById('featured-categories');
        const allCategoriesGrid = document.getElementById('all-categories');
        
        // Show featured categories
        if (featuredGrid) {
            const featuredCategories = this.categories.filter(cat => cat.featured);
            featuredGrid.innerHTML = featuredCategories.map(category => 
                this.createCategoryCard(category, true)
            ).join('');
        }
        
        // Show all categories
        if (allCategoriesGrid) {
            allCategoriesGrid.classList.remove('hidden');
            const sortedCategories = this.sortCategories(this.categories);
            allCategoriesGrid.innerHTML = sortedCategories.map(category => 
                this.createCategoryCard(category, false)
            ).join('');
        }
        
        // Hide list view
        const categoriesList = document.getElementById('categories-list');
        if (categoriesList) {
            categoriesList.classList.add('hidden');
        }
    }
    
    renderListView() {
        const categoriesList = document.getElementById('categories-list');
        const allCategoriesGrid = document.getElementById('all-categories');
        
        // Show list view
        if (categoriesList) {
            categoriesList.classList.remove('hidden');
            const sortedCategories = this.sortCategories(this.categories);
            categoriesList.innerHTML = sortedCategories.map(category => 
                this.createCategoryListItem(category)
            ).join('');
        }
        
        // Hide grid view
        if (allCategoriesGrid) {
            allCategoriesGrid.classList.add('hidden');
        }
    }
    
    createCategoryCard(category, isFeatured = false) {
        const badges = this.getCategoryBadges(category);
        const cardSize = isFeatured ? 'featured' : 'regular';
        
        return `
            <div class="category-card ${cardSize}" onclick="navigateToCategory('${category.slug}')">
                <div class="category-background" style="background-image: url('../../assets/images/categories/${category.thumbnail || 'default-category.jpg'}')">
                    <div class="category-overlay"></div>
                </div>
                
                <div class="category-content">
                    <div class="category-header">
                        <div class="category-icon">${category.icon}</div>
                        <div class="category-badges">
                            ${badges}
                        </div>
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
                        
                        <button class="category-action">
                            Browse →
                        </button>
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
    
    getCategoryBadges(category) {
        let badges = '';
        
        if (category.trending) {
            badges += '<span class="category-badge trending">🔥 Trending</span>';
        }
        
        if (category.new) {
            badges += '<span class="category-badge new">🆕 New</span>';
        }
        
        if (category.featured) {
            badges += '<span class="category-badge featured">⭐ Featured</span>';
        }
        
        return badges;
    }
    
    sortCategories(categories) {
        const sorted = [...categories];
        
        switch (this.sortBy) {
            case 'alphabetical':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
                
            case 'newest':
                return sorted.sort((a, b) => new Date(b.latest_upload) - new Date(a.latest_upload));
                
            case 'most-videos':
                return sorted.sort((a, b) => b.video_count - a.video_count);
                
            case 'popular':
            default:
                // Sort by combination of views and video count
                return sorted.sort((a, b) => {
                    const aScore = (a.total_views * 0.7) + (a.video_count * 1000);
                    const bScore = (b.total_views * 0.7) + (b.video_count * 1000);
                    return bScore - aScore;
                });
        }
    }
    
    // Related categories for individual category pages
    async loadRelatedCategories(currentCategorySlug) {
        const relatedContainer = document.getElementById('related-categories');
        if (!relatedContainer) return;
        
        const currentCategory = this.categories.find(cat => cat.slug === currentCategorySlug);
        if (!currentCategory) return;
        
        // Find related categories based on tags
        const relatedCategories = this.categories
            .filter(cat => cat.slug !== currentCategorySlug)
            .map(cat => ({
                ...cat,
                similarity: this.calculateSimilarity(currentCategory, cat)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 6);
        
        relatedContainer.innerHTML = relatedCategories.map(category => `
            <div class="related-category-card" onclick="navigateToCategory('${category.slug}')">
                <div class="related-category-icon">${category.icon}</div>
                <div class="related-category-name">${category.name}</div>
                <div class="related-category-count">${this.formatNumber(category.video_count)} videos</div>
            </div>
        `).join('');
    }
    
    calculateSimilarity(category1, category2) {
        let similarity = 0;
        
        // Tag similarity
        const commonTags = category1.tags.filter(tag => category2.tags.includes(tag));
        similarity += commonTags.length * 2;
        
        // Feature similarity (trending, new, etc.)
        if (category1.trending === category2.trending) similarity += 1;
        if (category1.featured === category2.featured) similarity += 1;
        
        return similarity;
    }
    
    // Popular tags for sidebar
    async loadPopularTags() {
        const tagsContainer = document.getElementById('popular-tags');
        if (!tagsContainer) return;
        
        try {
            // Get popular tags from database
            const stats = await window.videoDatabase.getStatistics();
            const topTags = stats.topTags || [];
            
            tagsContainer.innerHTML = topTags.slice(0, 15).map(tagData => `
                <button class="tag-filter" data-tag="${tagData.tag}" onclick="filterByTag('${tagData.tag}')">
                    #${tagData.tag} (${tagData.count})
                </button>
            `).join('');
            
        } catch (error) {
            console.error('Error loading popular tags:', error);
            // Fallback tags
            const fallbackTags = ['hd', '4k', 'amateur', 'professional', 'milf', 'teen', 'hardcore', 'lesbian'];
            tagsContainer.innerHTML = fallbackTags.map(tag => `
                <button class="tag-filter" data-tag="${tag}" onclick="filterByTag('${tag}')">
                    #${tag}
                </button>
            `).join('');
        }
    }
    
    // Statistics updates
    updateCategoryStatistics() {
        // Update total categories
        const totalCategoriesEl = document.getElementById('total-categories');
        if (totalCategoriesEl) {
            totalCategoriesEl.textContent = this.categories.length.toString();
        }
        
        // Update total videos
        const totalVideosEl = document.getElementById('total-videos');
        if (totalVideosEl) {
            const totalVideos = this.categories.reduce((sum, cat) => sum + cat.video_count, 0);
            totalVideosEl.textContent = this.formatNumber(totalVideos);
        }
        
        // Update trending count
        const trendingCountEl = document.getElementById('trending-count');
        if (trendingCountEl) {
            const trendingCount = this.categories.filter(cat => cat.trending).length;
            trendingCountEl.textContent = trendingCount.toString();
        }
        
        // Update new categories
        const newCategoriesEl = document.getElementById('new-categories');
        if (newCategoriesEl) {
            const newCount = this.categories.filter(cat => cat.new).length;
            newCategoriesEl.textContent = newCount.toString();
        }
        
        // Update top rated count
        const topRatedEl = document.getElementById('top-rated-categories');
        if (topRatedEl) {
            const topRatedCount = this.categories.filter(cat => parseFloat(cat.average_rating) >= 4.5).length;
            topRatedEl.textContent = topRatedCount.toString();
        }
        
        // Update professional count
        const professionalCountEl = document.getElementById('professional-count');
        if (professionalCountEl) {
            const professionalCat = this.categories.find(cat => cat.slug === 'professional');
            if (professionalCat) {
                professionalCountEl.textContent = this.formatNumber(professionalCat.video_count);
            }
        }
    }
    
    // Utility methods
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'today';
        if (diffDays <= 7) return `${diffDays} days ago`;
        if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
    
    // Category navigation
    getCategoryBySlug(slug) {
        return this.categories.find(cat => cat.slug === slug);
    }
    
    getCategoriesByTag(tag) {
        return this.categories.filter(cat => 
            cat.tags && cat.tags.includes(tag)
        );
    }
    
    getFeaturedCategories() {
        return this.categories.filter(cat => cat.featured);
    }
    
    getTrendingCategories() {
        return this.categories.filter(cat => cat.trending);
    }
    
    getNewCategories() {
        return this.categories.filter(cat => cat.new);
    }
}

// Global category manager instance
window.categoryManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.videoDatabase) {
        window.categoryManager = new CategoryManager();
    } else {
        // Wait for video database to initialize
        const checkDatabase = () => {
            if (window.videoDatabase && window.videoDatabase.isInitialized) {
                window.categoryManager = new CategoryManager();
            } else {
                setTimeout(checkDatabase, 100);
            }
        };
        checkDatabase();
    }
});

// Global functions for HTML onclick handlers
function navigateToCategory(categorySlug) {
    window.location.href = `category.html?cat=${categorySlug}`;
}

function playRandomVideo() {
    if (window.categoryManager && window.categoryManager.currentCategory) {
        // Get random video from current category
        const categorySlug = window.categoryManager.currentCategory.slug;
        
        window.videoDatabase.getCategoryVideos(categorySlug, 50, 0).then(result => {
            if (result.videos.length > 0) {
                const randomVideo = result.videos[Math.floor(Math.random() * result.videos.length)];
                window.location.href = `../watch/video.html?id=${randomVideo.id}`;
            }
        });
    }
}

function toggleCategoryBookmark() {
    if (!window.categoryManager || !window.categoryManager.currentCategory) return;
    
    const categorySlug = window.categoryManager.currentCategory.slug;
    const bookmarks = JSON.parse(localStorage.getItem('xshiver_category_bookmarks') || '{}');
    
    if (bookmarks[categorySlug]) {
        delete bookmarks[categorySlug];
        console.log('Category bookmark removed');
    } else {
        bookmarks[categorySlug] = {
            slug: categorySlug,
            name: window.categoryManager.currentCategory.name,
            bookmarkedAt: new Date().toISOString()
        };
        console.log('Category bookmarked');
    }
    
    localStorage.setItem('xshiver_category_bookmarks', JSON.stringify(bookmarks));
    
    // Update button text
    const btn = event.target.closest('.btn-secondary');
    if (btn) {
        btn.textContent = bookmarks[categorySlug] ? 'Bookmarked ✓' : 'Bookmark Category';
    }
}

function filterByTag(tag) {
    if (window.filterSystem) {
        window.filterSystem.activeFilters.tags = [tag];
        window.filterSystem.applyFilters();
    }
}

function closeAdvancedFilters() {
    const modal = document.getElementById('advanced-filters-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function resetAdvancedFilters() {
    const form = document.getElementById('advanced-filters-form');
    if (form) {
        form.reset();
    }
    
    if (window.filterSystem) {
        window.filterSystem.clearAllFilters();
    }
}

function applyAdvancedFilters() {
    if (window.filterSystem) {
        window.filterSystem.applyFilters();
    }
    
    closeAdvancedFilters();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
}
