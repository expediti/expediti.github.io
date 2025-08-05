/**
 * Content Loader for Xshiver
 * Handles dynamic content loading and lazy loading
 */

class ContentLoader {
    constructor() {
        this.loadedContent = new Map();
        this.loadingQueue = new Set();
        this.intersectionObserver = null;
        this.imageObserver = null;
        
        this.init();
    }
    
    init() {
        console.log('📥 Content Loader initialized');
        
        this.setupIntersectionObserver();
        this.setupImageLazyLoading();
        this.setupInfiniteScroll();
    }
    
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            }
        );
    }
    
    setupImageLazyLoading() {
        this.imageObserver = new IntersectionObserver(
            this.handleImageIntersection.bind(this),
            {
                root: null,
                rootMargin: '100px',
                threshold: 0.1
            }
        );
        
        // Observe all lazy images
        this.observeLazyImages();
    }
    
    setupInfiniteScroll() {
        // Add infinite scroll for category pages
        this.scrollObserver = new IntersectionObserver(
            this.handleScrollIntersection.bind(this),
            {
                root: null,
                rootMargin: '200px',
                threshold: 0.1
            }
        );
        
        // Observe load more triggers
        this.observeLoadMoreTriggers();
    }
    
    observeLazyImages() {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => {
            this.imageObserver.observe(img);
        });
    }
    
    observeLoadMoreTriggers() {
        const loadMoreBtn = document.getElementById('load-more-categories');
        if (loadMoreBtn) {
            this.scrollObserver.observe(loadMoreBtn);
        }
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const contentType = element.dataset.contentType;
                const contentId = element.dataset.contentId;
                
                if (contentType && contentId) {
                    this.loadContent(contentType, contentId, element);
                }
            }
        });
    }
    
    handleImageIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.imageObserver.unobserve(img);
            }
        });
    }
    
    handleScrollIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const trigger = entry.target;
                
                if (trigger.id === 'load-more-categories') {
                    this.loadMoreCategories();
                }
            }
        });
    }
    
    async loadContent(contentType, contentId, element) {
        const cacheKey = `${contentType}_${contentId}`;
        
        // Check if already loaded or loading
        if (this.loadedContent.has(cacheKey) || this.loadingQueue.has(cacheKey)) {
            return;
        }
        
        this.loadingQueue.add(cacheKey);
        
        try {
            let content;
            
            switch (contentType) {
                case 'category':
                    content = await this.loadCategoryContent(contentId);
                    break;
                case 'video':
                    content = await this.loadVideoContent(contentId);
                    break;
                case 'related':
                    content = await this.loadRelatedContent(contentId);
                    break;
                default:
                    console.warn('Unknown content type:', contentType);
                    return;
            }
            
            if (content) {
                this.renderContent(element, content);
                this.loadedContent.set(cacheKey, content);
            }
            
        } catch (error) {
            console.error(`Error loading ${contentType} content:`, error);
            this.renderError(element, `Failed to load ${contentType}`);
        } finally {
            this.loadingQueue.delete(cacheKey);
        }
    }
    
    async loadCategoryContent(categoryId) {
        if (!window.categoryManager) return null;
        
        const category = window.categoryManager.getCategoryBySlug(categoryId);
        if (!category) return null;
        
        // Load category videos
        const videos = await window.videoDatabase.getCategoryVideos(categoryId, 12, 0);
        
        return {
            category: category,
            videos: videos.videos || [],
            totalCount: videos.totalCount || 0
        };
    }
    
    async loadVideoContent(videoId) {
        if (!window.videoDatabase) return null;
        
        const video = await window.videoDatabase.getVideo(videoId);
        if (!video) return null;
        
        // Load related videos
        const related = await window.videoDatabase.getRelatedVideos(
            video.category, 
            video.tags, 
            6, 
            video.id
        );
        
        return {
            video: video,
            related: related || []
        };
    }
    
    async loadRelatedContent(category) {
        if (!window.videoDatabase) return null;
        
        const videos = await window.videoDatabase.getCategoryVideos(category, 8, 0);
        
        return {
            videos: videos.videos || [],
            category: category
        };
    }
    
    loadImage(img) {
        const src = img.dataset.src || img.src;
        
        if (!src) return;
        
        // Create a new image to preload
        const imageLoader = new Image();
        
        imageLoader.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            
            // Remove loading placeholder
            const placeholder = img.parentNode.querySelector('.image-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
        };
        
        imageLoader.onerror = () => {
            img.src = '../../assets/images/placeholder-thumbnail.jpg';
            img.classList.add('error');
        };
        
        imageLoader.src = src;
    }
    
    renderContent(element, content) {
        // Remove loading state
        element.classList.remove('loading');
        
        const contentType = element.dataset.contentType;
        
        switch (contentType) {
            case 'category':
                this.renderCategoryContent(element, content);
                break;
            case 'video':
                this.renderVideoContent(element, content);
                break;
            case 'related':
                this.renderRelatedContent(element, content);
                break;
        }
        
        // Re-observe any new lazy images
        this.observeLazyImages();
    }
    
    renderCategoryContent(element, content) {
        const { category, videos, totalCount } = content;
        
        element.innerHTML = `
            <div class="category-content-header">
                <h3>${category.name}</h3>
                <p>${totalCount} videos</p>
            </div>
            
            <div class="category-videos-grid">
                ${videos.map(video => this.createVideoCard(video)).join('')}
            </div>
            
            ${videos.length < totalCount ? `
                <div class="category-view-all">
                    <a href="../categories/category.html?cat=${category.slug}" class="btn-view-all">
                        View All ${totalCount} Videos
                    </a>
                </div>
            ` : ''}
        `;
    }
    
    renderVideoContent(element, content) {
        const { video, related } = content;
        
        element.innerHTML = `
            <div class="video-content">
                <div class="video-details">
                    <h3>${video.title}</h3>
                    <p>${video.description}</p>
                    <div class="video-stats">
                        <span>${this.formatViews(video.view_count)} views</span>
                        <span>★ ${video.rating.toFixed(1)}</span>
                        <span>${this.formatDuration(video.duration)}</span>
                    </div>
                </div>
                
                ${related.length > 0 ? `
                    <div class="related-videos">
                        <h4>Related Videos</h4>
                        <div class="related-videos-grid">
                            ${related.map(relatedVideo => this.createVideoCard(relatedVideo)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderRelatedContent(element, content) {
        const { videos, category } = content;
        
        element.innerHTML = `
            <div class="related-content">
                <h4>More from ${category}</h4>
                <div class="related-videos-grid">
                    ${videos.map(video => this.createVideoCard(video)).join('')}
                </div>
            </div>
        `;
    }
    
    renderError(element, message) {
        element.classList.remove('loading');
        element.classList.add('error');
        
        element.innerHTML = `
            <div class="content-error">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button class="btn-retry" onclick="contentLoader.retryLoad('${element.dataset.contentType}', '${element.dataset.contentId}', this.closest('[data-content-type]'))">
                    Try Again
                </button>
            </div>
        `;
    }
    
    createVideoCard(video) {
        return `
            <div class="video-card" onclick="navigateToVideo(${video.id})">
                <div class="video-thumbnail">
                    <img src="${video.catbox_thumbnail_url}" alt="${video.title}" loading="lazy"
                         onerror="this.src='../../assets/images/placeholder-thumbnail.jpg'">
                    <div class="video-overlay">
                        <button class="play-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <polygon points="5,3 19,12 5,21"></polygon>
                            </svg>
                        </button>
                    </div>
                    <div class="video-duration">${this.formatDuration(video.duration)}</div>
                    <div class="video-quality">${video.quality}</div>
                </div>
                
                <div class="video-info">
                    <h4 class="video-title">${this.truncateText(video.title, 50)}</h4>
                    <div class="video-meta">
                        <span class="views">${this.formatViews(video.view_count)} views</span>
                        <span class="rating">★ ${video.rating.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Infinite scrolling for categories
    async loadMoreCategories() {
        const loadMoreBtn = document.getElementById('load-more-categories');
        if (!loadMoreBtn || loadMoreBtn.disabled) return;
        
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = `
            <div class="loading-spinner"></div>
            Loading...
        `;
        
        try {
            // Simulate loading more categories
            await this.delay(1000);
            
            const categoriesGrid = document.getElementById('all-categories');
            if (categoriesGrid) {
                // Add more category cards
                const newCategories = await this.getMoreCategories();
                
                newCategories.forEach(category => {
                    const categoryCard = this.createCategoryCard(category);
                    categoriesGrid.appendChild(categoryCard);
                });
                
                // Check if there are more to load
                if (newCategories.length < 6) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.innerHTML = 'Load More Categories';
                }
            }
            
        } catch (error) {
            console.error('Error loading more categories:', error);
            loadMoreBtn.innerHTML = 'Error - Try Again';
            loadMoreBtn.disabled = false;
        }
    }
    
    async getMoreCategories() {
        // This would normally fetch from an API
        // For now, return empty array as all categories are already loaded
        return [];
    }
    
    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => navigateToCategory(category.slug);
        
        card.innerHTML = `
            <div class="category-background" style="background-image: url('../../assets/images/categories/${category.thumbnail || 'default-category.jpg'}')">
                <div class="category-overlay"></div>
            </div>
            
            <div class="category-content">
                <div class="category-header">
                    <div class="category-icon">${category.icon}</div>
                    ${category.trending ? '<div class="category-badge trending">🔥 Trending</div>' : ''}
                </div>
                
                <div class="category-body">
                    <h3 class="category-title">${category.name}</h3>
                    <p class="category-description">${this.truncateText(category.description, 100)}</p>
                </div>
                
                <div class="category-footer">
                    <div class="category-stats">
                        <div class="category-stat">
                            <span class="category-stat-number">${this.formatViews(category.video_count)}</span>
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
        `;
        
        return card;
    }
    
    // Utility methods
    formatViews(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }
    
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public methods
    retryLoad(contentType, contentId, element) {
        element.classList.add('loading');
        element.classList.remove('error');
        
        const cacheKey = `${contentType}_${contentId}`;
        this.loadedContent.delete(cacheKey);
        this.loadingQueue.delete(cacheKey);
        
        this.loadContent(contentType, contentId, element);
    }
    
    preloadContent(contentType, contentId) {
        const cacheKey = `${contentType}_${contentId}`;
        
        if (!this.loadedContent.has(cacheKey) && !this.loadingQueue.has(cacheKey)) {
            this.loadContent(contentType, contentId, document.createElement('div'));
        }
    }
    
    clearCache() {
        this.loadedContent.clear();
        console.log('📥 Content cache cleared');
    }
    
    // Prefetch critical content
    async prefetchCriticalContent() {
        console.log('📥 Prefetching critical content...');
        
        try {
            // Prefetch featured categories
            if (window.categoryManager) {
                const featuredCategories = window.categoryManager.getFeaturedCategories();
                
                featuredCategories.slice(0, 3).forEach(category => {
                    this.preloadContent('category', category.slug);
                });
            }
            
            // Prefetch trending videos
            if (window.videoDatabase) {
                window.videoDatabase.getTrendingVideos(6);
            }
            
        } catch (error) {
            console.error('Prefetch error:', error);
        }
    }
    
    // Performance monitoring
    getPerformanceMetrics() {
        return {
            loadedContentCount: this.loadedContent.size,
            loadingQueueSize: this.loadingQueue.size,
            cacheHitRatio: this.calculateCacheHitRatio()
        };
    }
    
    calculateCacheHitRatio() {
        // This would track hits vs misses in a real implementation
        return 0.75; // Placeholder
    }
}

// Global content loader instance
window.contentLoader = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.contentLoader = new ContentLoader();
    
    // Prefetch critical content after a short delay
    setTimeout(() => {
        if (window.contentLoader) {
            window.contentLoader.prefetchCriticalContent();
        }
    }, 2000);
});

// Global functions
function navigateToVideo(videoId) {
    window.location.href = `../watch/video.html?id=${videoId}`;
}

function navigateToCategory(categorySlug) {
    window.location.href = `category.html?cat=${categorySlug}`;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentLoader;
}
