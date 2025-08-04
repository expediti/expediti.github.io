/**
 * Category Page Manager - Fixed URL Parsing
 */

class CategoryManager {
    constructor() {
        this.currentCategory = null;
        this.currentVideos = [];
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('🏷️ Initializing Category Manager...');
        
        try {
            await this.waitForDatabase();
            
            // Get category from URL parameter ?cat=amateur
            this.currentCategory = this.getCategoryFromURL();
            console.log('🎯 Current category:', this.currentCategory);
            
            if (this.currentCategory) {
                await this.loadCategoryVideos();
                this.isInitialized = true;
            } else {
                this.showError('No category specified in URL. Please add ?cat=amateur to the URL.');
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
        
        throw new Error('Video database failed to initialize');
    }

    getCategoryFromURL() {
        // Extract category from URL parameter ?cat=amateur
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('cat');
        
        console.log('🔍 URL search params:', window.location.search);
        console.log('🎯 Extracted category:', category);
        
        return category ? category.toLowerCase() : null;
    }

    async loadCategoryVideos() {
        console.log(`📂 Loading videos for category: ${this.currentCategory}`);

        try {
            // Get category information
            const categories = await window.videoDatabase.getCategories();
            console.log('📋 Available categories:', categories.map(c => c.id));
            
            const categoryInfo = categories.find(cat => cat.id === this.currentCategory);

            if (!categoryInfo) {
                throw new Error(`Category '${this.currentCategory}' not found. Available categories: ${categories.map(c => c.id).join(', ')}`);
            }

            console.log('📋 Category info found:', categoryInfo);

            // Get videos for this category
            const videos = await window.videoDatabase.getVideosByCategory(
                this.currentCategory,
                200,
                0
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
            'category-name': categoryInfo.name || this.currentCategory,
            'category-desc': categoryInfo.description || `Videos in ${this.currentCategory} category`,
            'category-icon': categoryInfo.icon || '🎬'
        };

        Object.entries(updates).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                console.log(`Updated ${elementId}: ${value}`);
            } else {
                console.log(`Element ${elementId} not found`);
            }
        });

        // Update statistics
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

            // Calculate average duration
            const durationElement = document.getElementById('category-duration');
            if (durationElement && this.currentVideos.length > 0) {
                const totalDuration = this.currentVideos.reduce((sum, video) => sum + (video.duration || 0), 0);
                const avgDuration = Math.floor(totalDuration / this.currentVideos.length);
                durationElement.textContent = this.formatDuration(avgDuration);
            }
        }

        // Update page title and breadcrumb
        document.title = `${categoryInfo.name || this.currentCategory} – Xshiver`;
        
        const breadcrumbElement = document.getElementById('breadcrumb-category');
        if (breadcrumbElement) {
            breadcrumbElement.textContent = categoryInfo.name || this.currentCategory;
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
                console.error(`Error creating card for video ${index}:`, error, video);
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
            </div>
            <div class="video-info">
                <h3 class="video-title">${title}</h3>
                <div class="video-stats">
                    <span class="video-views">${viewCount} views</span>
                    <span class="video-rating">⭐ ${rating}</span>
                </div>
                <div class="video-tags">
                    ${tags.map(tag => `<span class="video-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;

        // Add click handler
        card.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`🎯 Clicked video: ${video.id} - ${title}`);
            window.location.href = `../video/watch.html?v=${video.id}`;
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
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="no-videos-message">
                    <h3>No videos found in this category</h3>
                    <p>Category: ${this.currentCategory}</p>
                    <p>Try browsing other categories.</p>
                </div>
            `;
        }
        this.hideLoadingState();
    }

    showError(message) {
        console.error('❌ Category Manager Error:', message);
        
        this.updateResultsCount(0);
        
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Videos</h3>
                    <p>${message}</p>
                    <button onclick="window.location.reload()">Try Again</button>
                </div>
            `;
        }
        
        this.hideLoadingState();
    }

    formatNumber(num) {
        if (!num || num === 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    playRandomVideo() {
        if (this.currentVideos && this.currentVideos.length > 0) {
            const randomVideo = this.currentVideos[Math.floor(Math.random() * this.currentVideos.length)];
            window.location.href = `../video/watch.html?v=${randomVideo.id}`;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Category Manager...');
    window.categoryManager = new CategoryManager();
});

// Global functions
window.playRandomVideo = function() {
    if (window.categoryManager) {
        window.categoryManager.playRandomVideo();
    }
};

window.toggleCategoryBookmark = function() {
    console.log('Bookmark toggled');
};
