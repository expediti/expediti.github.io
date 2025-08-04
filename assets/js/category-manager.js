/**
 * Category Page Manager - Video Display Version
 * Handles displaying videos for a specific category page
 */

class CategoryManager {
    constructor() {
        this.currentCategory = null;
        this.currentVideos = [];
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('🏷️ Initializing Category Manager for video display...');
        
        try {
            // Wait for video database to be ready
            await this.waitForDatabase();
            
            // Get category from URL path
            this.currentCategory = this.getCategoryFromURL();
            console.log('🎯 Current category:', this.currentCategory);
            
            if (this.currentCategory) {
                await this.loadCategoryVideos();
                this.isInitialized = true;
            } else {
                this.showError('Invalid category in URL');
            }
        } catch (error) {
            console.error('❌ Category Manager initialization failed:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    async waitForDatabase() {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            if (window.videoDatabase && window.videoDatabase.isInitialized) {
                console.log('✅ Video database is ready');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Video database failed to initialize after ' + maxAttempts + ' attempts');
    }

    getCategoryFromURL() {
        // Extract category from URL like /categories/amateur
        const path = window.location.pathname;
        console.log('🔍 Current URL path:', path);
        
        const matches = path.match(/\/categories\/([^\/?\s]+)/);
        return matches ? matches[1].toLowerCase() : null;
    }

    async loadCategoryVideos() {
        console.log(`📂 Loading videos for category: ${this.currentCategory}`);

        try {
            // Get category information first
            const categories = await window.videoDatabase.getCategories();
            const categoryInfo = categories.find(cat => cat.id === this.currentCategory);

            if (!categoryInfo) {
                throw new Error(`Category '${this.currentCategory}' not found in database`);
            }

            console.log('📋 Category info found:', categoryInfo);

            // Get videos for this category
            const videos = await window.videoDatabase.getVideosByCategory(
                this.currentCategory,
                200,  // Get up to 200 videos
                0     // Start from beginning
            );

            console.log(`📺 Retrieved ${videos.length} videos for ${this.currentCategory}`);
            this.currentVideos = videos;

            // Get category statistics
            const stats = await window.videoDatabase.getCategoryStats();
            const categoryStats = stats[this.currentCategory];

            // Update the page UI
            this.updateCategoryHeader(categoryInfo, categoryStats);
            this.displayVideos(videos);
            this.updateResultsCount(videos.length);
            this.hideLoadingState();

            console.log(`✅ Successfully loaded ${videos.length} videos for ${this.currentCategory}`);

        } catch (error) {
            console.error('❌ Error loading category videos:', error);
            this.showError('Failed to load videos: ' + error.message);
        }
    }

    updateCategoryHeader(categoryInfo, stats) {
        console.log('🎨 Updating category header...');

        // Update basic category info
        const updates = {
            'category-name': categoryInfo.name,
            'category-desc': categoryInfo.description,
            'category-icon': categoryInfo.icon || '🎬'
        };

        Object.entries(updates).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                console.log(`Updated ${elementId}: ${value}`);
            }
        });

        // Update statistics if available
        if (stats) {
            const statUpdates = {
                'category-video-count': stats.video_count || this.currentVideos.length,
                'category-views': this.formatNumber(stats.total_views || 0),
                'category-rating': stats.average_rating || '0.0'
            };

            Object.entries(statUpdates).forEach(([elementId, value]) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = value;
                }
            });

            // Calculate and update average duration
            const durationElement = document.getElementById('category-duration');
            if (durationElement && this.currentVideos.length > 0) {
                const totalDuration = this.currentVideos.reduce((sum, video) => sum + (video.duration || 0), 0);
                const avgDuration = Math.floor(totalDuration / this.currentVideos.length);
                durationElement.textContent = this.formatDuration(avgDuration);
            }
        }

        // Update page title and breadcrumb
        document.title = `${categoryInfo.name} – Xshiver`;
        
        const breadcrumbElement = document.getElementById('breadcrumb-category');
        if (breadcrumbElement) {
            breadcrumbElement.textContent = categoryInfo.name;
        }
    }

    displayVideos(videos) {
        console.log(`🎬 Displaying ${videos.length} videos...`);

        const videosGrid = document.getElementById('videos-grid');
        if (!videosGrid) {
            console.error('❌ Videos grid element not found');
            return;
        }

        // Clear existing content
        videosGrid.innerHTML = '';

        if (videos.length === 0) {
            this.showNoVideos();
            return;
        }

        // Create video cards
        videos.forEach((video, index) => {
            try {
                const videoCard = this.createVideoCard(video);
                videosGrid.appendChild(videoCard);
            } catch (error) {
                console.error(`Error creating card for video ${index}:`, error);
            }
        });

        // Show the grid
        videosGrid.style.display = 'grid';
        console.log(`✅ Successfully displayed ${videos.length} video cards`);
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.setAttribute('data-video-id', video.id);

        const thumbnailUrl = video.catbox_thumbnail_url || '../../assets/images/placeholder-video.jpg';
        const title = video.title || 'Untitled Video';
        const duration = this.formatDuration(video.duration || 0);
        const quality = video.quality || 'HD';
        const viewCount = this.formatNumber(video.view_count || 0);
        const rating = video.rating || '0.0';
        const tags = (video.tags || []).slice(0, 3);

        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnailUrl}" 
                     alt="${title}" 
                     loading="lazy" 
                     onerror="this.src='../../assets/images/placeholder-video.jpg'">
                <div class="video-duration">${duration}</div>
                <div class="video-quality">${quality}</div>
                <div class="video-overlay">
                    <div class="play-button">▶</div>
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title" title="${title}">${title}</h3>
                <div class="video-stats">
                    <span class="video-views">${viewCount} views</span>
                    <span class="video-rating">⭐ ${rating}</span>
                </div>
                <div class="video-tags">
                    ${tags.map(tag => `<span class="video-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;

        // Add click handler to navigate to video page
        card.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`🎯 Clicked video: ${video.id} - ${title}`);
            
            // You can customize this URL structure as needed
            const videoUrl = `../video/watch.html?v=${video.id}`;
            window.location.href = videoUrl;
        });

        // Add hover effects
        card.addEventListener('mouseenter', () => {
            card.classList.add('video-card-hover');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('video-card-hover');
        });

        return card;
    }

    updateResultsCount(count) {
        const resultsCountElement = document.getElementById('results-count');
        if (resultsCountElement) {
            resultsCountElement.textContent = count;
            console.log(`📊 Updated results count: ${count}`);
        }
    }

    hideLoadingState() {
        const loadingElement = document.getElementById('loading-state');
        if (loadingElement) {
            loadingElement.style.display = 'none';
            console.log('✅ Hidden loading state');
        }
    }

    showNoVideos() {
        const noResultsElement = document.getElementById('no-results');
        if (noResultsElement) {
            noResultsElement.classList.remove('hidden');
        }
        
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="no-videos-message">
                    <div class="no-videos-icon">📹</div>
                    <h3>No videos found in this category</h3>
                    <p>Try browsing other categories or check back later.</p>
                </div>
            `;
        }
        
        this.hideLoadingState();
    }

    showError(message) {
        console.error('❌ Category Manager Error:', message);
        
        // Update results count
        this.updateResultsCount(0);
        
        // Show error in videos grid
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <h3>Error Loading Videos</h3>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" class="retry-button">
                        Try Again
                    </button>
                </div>
            `;
        }
        
        this.hideLoadingState();
    }

    // Utility methods
    formatNumber(num) {
        if (!num || num === 0) return '0';
        
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }

    // Public methods for HTML button interactions
    playRandomVideo() {
        if (this.currentVideos && this.currentVideos.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.currentVideos.length);
            const randomVideo = this.currentVideos[randomIndex];
            
            console.log(`🎲 Playing random video: ${randomVideo.title}`);
            window.location.href = `../video/watch.html?v=${randomVideo.id}`;
        } else {
            console.log('❌ No videos available for random play');
        }
    }

    toggleBookmark() {
        if (!this.currentCategory) return;
        
        const bookmarks = JSON.parse(localStorage.getItem('xshiver_category_bookmarks') || '{}');
        
        if (bookmarks[this.currentCategory]) {
            delete bookmarks[this.currentCategory];
            console.log(`📌 Removed bookmark for ${this.currentCategory}`);
        } else {
            bookmarks[this.currentCategory] = {
                category: this.currentCategory,
                bookmarkedAt: new Date().toISOString()
            };
            console.log(`📌 Added bookmark for ${this.currentCategory}`);
        }
        
        localStorage.setItem('xshiver_category_bookmarks', JSON.stringify(bookmarks));
        
        // Update button text if needed
        const bookmarkButton = document.querySelector('.btn-secondary');
        if (bookmarkButton) {
            bookmarkButton.textContent = bookmarks[this.currentCategory] ? 'Bookmarked ✓' : 'Bookmark';
        }
    }

    // Get current category info
    getCurrentCategory() {
        return this.currentCategory;
    }

    getCurrentVideos() {
        return this.currentVideos;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Category Manager...');
    window.categoryManager = new CategoryManager();
});

// Global functions for HTML onclick handlers
window.playRandomVideo = function() {
    if (window.categoryManager) {
        window.categoryManager.playRandomVideo();
    }
};

window.toggleCategoryBookmark = function() {
    if (window.categoryManager) {
        window.categoryManager.toggleBookmark();
    }
};

// Also handle immediate initialization if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded
    console.log('🚀 DOM already loaded, initializing Category Manager immediately...');
    window.categoryManager = new CategoryManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
}
