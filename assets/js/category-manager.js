/**
 * Xshiver Category Manager - Complete & Fixed Version
 * Handles category page functionality with proper video navigation
 */

class CategoryManager {
    constructor() {
        this.currentCategory = null;
        this.currentVideos = [];
        this.filteredVideos = [];
        this.currentPage = 1;
        this.videosPerPage = 20;
        this.isInitialized = false;
        this.sortOption = 'newest';
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        console.log('🏷️ Initializing Xshiver Category Manager...');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Wait for required dependencies
            await this.waitForDependencies();
            
            // Get category from URL parameter ?cat=amateur
            this.currentCategory = this.getCategoryFromURL();
            console.log('🎯 Current category:', this.currentCategory);
            
            if (this.currentCategory) {
                await this.loadCategoryData();
                this.setupEventListeners();
                this.isInitialized = true;
                console.log('✅ Category Manager initialized successfully');
            } else {
                this.showError('No category specified in URL. Please add ?cat=categoryname to the URL.');
            }
        } catch (error) {
            console.error('❌ Category Manager initialization failed:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    async waitForDependencies() {
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
        
        throw new Error('Video database failed to initialize within timeout');
    }

    getCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('cat');
        
        console.log('🔍 URL search params:', window.location.search);
        console.log('🎯 Extracted category:', category);
        
        return category ? category.toLowerCase().trim() : null;
    }

    async loadCategoryData() {
        console.log(`📂 Loading data for category: ${this.currentCategory}`);

        try {
            this.isLoading = true;
            
            // Get category information
            const categories = await window.videoDatabase.getCategories();
            console.log('📋 Available categories:', categories.map(c => c.id));
            
            const categoryInfo = categories.find(cat => 
                cat.id.toLowerCase() === this.currentCategory.toLowerCase()
            );

            if (!categoryInfo) {
                const availableCategories = categories.map(c => c.id).join(', ');
                throw new Error(`Category '${this.currentCategory}' not found. Available categories: ${availableCategories}`);
            }

            console.log('📋 Category info found:', categoryInfo);

            // Get videos for this category
            const videos = await window.videoDatabase.getVideosByCategory(
                this.currentCategory,
                500, // Load more videos
                0
            );

            console.log(`📺 Retrieved ${videos.length} videos for ${this.currentCategory}`);
            
            if (videos.length === 0) {
                console.warn(`⚠️ No videos found for category: ${this.currentCategory}`);
            }

            this.currentVideos = videos;
            this.filteredVideos = [...videos];

            // Get category statistics
            const stats = await window.videoDatabase.getCategoryStats();
            const categoryStats = stats[this.currentCategory];

            // Update the page UI
            this.updateCategoryHeader(categoryInfo, categoryStats);
            this.updateMetadata(categoryInfo);
            this.applySortingAndDisplay();
            this.hideLoadingState();

            console.log(`✅ Successfully loaded ${videos.length} videos for ${this.currentCategory}`);

        } catch (error) {
            console.error('❌ Error loading category data:', error);
            this.showError('Failed to load category data: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    updateCategoryHeader(categoryInfo, stats) {
        console.log('🎨 Updating category header...');

        // Update basic category info
        const updates = {
            'category-name': categoryInfo.name || this.capitalize(this.currentCategory),
            'category-desc': categoryInfo.description || `Premium ${this.capitalize(this.currentCategory)} videos`,
            'category-icon': categoryInfo.icon || '🎬'
        };

        Object.entries(updates).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                if (elementId === 'category-icon') {
                    element.textContent = value;
                } else {
                    element.textContent = value;
                }
                console.log(`✅ Updated ${elementId}: ${value}`);
            } else {
                console.warn(`⚠️ Element ${elementId} not found`);
            }
        });

        // Update statistics
        this.updateCategoryStats(stats);

        // Update breadcrumb
        const breadcrumbElement = document.getElementById('breadcrumb-category');
        if (breadcrumbElement) {
            breadcrumbElement.textContent = categoryInfo.name || this.capitalize(this.currentCategory);
        }
    }

    updateCategoryStats(stats) {
        const videoCount = this.currentVideos.length;
        
        // Calculate statistics from current videos
        const totalViews = this.currentVideos.reduce((sum, video) => sum + (video.view_count || 0), 0);
        const totalRating = this.currentVideos.reduce((sum, video) => sum + (video.rating || 0), 0);
        const avgRating = videoCount > 0 ? (totalRating / videoCount).toFixed(1) : '0.0';
        const totalDuration = this.currentVideos.reduce((sum, video) => sum + (video.duration || 0), 0);
        const avgDuration = videoCount > 0 ? Math.floor(totalDuration / videoCount) : 0;

        const statUpdates = {
            'category-video-count': this.formatNumber(videoCount),
            'category-views': this.formatNumber(totalViews),
            'category-rating': avgRating,
            'category-duration': this.formatDuration(avgDuration)
        };

        Object.entries(statUpdates).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                console.log(`📊 Updated ${elementId}: ${value}`);
            }
        });
    }

    updateMetadata(categoryInfo) {
        // Update page title
        const categoryName = categoryInfo.name || this.capitalize(this.currentCategory);
        document.title = `${categoryName} Videos – Xshiver`;
        
        // Update meta description
        const description = `Watch premium ${categoryName.toLowerCase()} videos on Xshiver. High-quality streaming with thousands of videos.`;
        const metaDesc = document.getElementById('category-description');
        if (metaDesc) {
            metaDesc.content = description;
        }

        // Update Open Graph tags
        const ogTitle = document.getElementById('og-category-title');
        const ogDesc = document.getElementById('og-category-description');
        const ogUrl = document.getElementById('og-category-url');
        
        if (ogTitle) ogTitle.content = `${categoryName} Videos – Xshiver`;
        if (ogDesc) ogDesc.content = description;
        if (ogUrl) ogUrl.content = window.location.href;

        console.log('📝 Updated page metadata');
    }

    applySortingAndDisplay() {
        // Apply current sorting
        this.sortVideos(this.sortOption);
        
        // Display videos with pagination
        this.displayCurrentPage();
        
        // Update results count
        this.updateResultsCount();
    }

    sortVideos(sortOption) {
        console.log(`🔄 Sorting videos by: ${sortOption}`);
        
        this.sortOption = sortOption;
        
        switch (sortOption) {
            case 'newest':
                this.filteredVideos.sort((a, b) => new Date(b.upload_date || 0) - new Date(a.upload_date || 0));
                break;
            case 'oldest':
                this.filteredVideos.sort((a, b) => new Date(a.upload_date || 0) - new Date(b.upload_date || 0));
                break;
            case 'most-viewed':
                this.filteredVideos.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
                break;
            case 'highest-rated':
                this.filteredVideos.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'longest':
                this.filteredVideos.sort((a, b) => (b.duration || 0) - (a.duration || 0));
                break;
            case 'shortest':
                this.filteredVideos.sort((a, b) => (a.duration || 0) - (b.duration || 0));
                break;
            default:
                console.warn(`Unknown sort option: ${sortOption}`);
        }
    }

    displayCurrentPage() {
        const startIndex = (this.currentPage - 1) * this.videosPerPage;
        const endIndex = startIndex + this.videosPerPage;
        const videosToShow = this.filteredVideos.slice(startIndex, endIndex);
        
        console.log(`🎬 Displaying page ${this.currentPage}: videos ${startIndex + 1}-${Math.min(endIndex, this.filteredVideos.length)} of ${this.filteredVideos.length}`);
        
        this.displayVideos(videosToShow);
        this.updatePagination();
    }

    displayVideos(videos) {
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
                console.error(`❌ Error creating card for video ${index}:`, error, video);
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

        // Safely get video properties with fallbacks
        const thumbnailUrl = video.catbox_thumbnail_url || '../../assets/images/placeholder-video.jpg';
        const title = this.escapeHtml(video.title || 'Untitled Video');
        const duration = this.formatDuration(video.duration || 0);
        const quality = video.quality || 'HD';
        const viewCount = this.formatNumber(video.view_count || 0);
        const rating = parseFloat(video.rating || 0).toFixed(1);
        const uploadDate = video.upload_date ? this.formatDate(video.upload_date) : '';
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
                    <div class="play-button">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title" title="${title}">${title}</h3>
                <div class="video-stats">
                    <span class="video-views">👁 ${viewCount} views</span>
                    <span class="video-rating">⭐ ${rating}</span>
                    ${uploadDate ? `<span class="video-date">📅 ${uploadDate}</span>` : ''}
                </div>
                ${tags.length > 0 ? `
                <div class="video-tags">
                    ${tags.map(tag => `<span class="video-tag">#${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                ` : ''}
            </div>
        `;

        // Add click handler with proper path - FIXED
        card.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`🎯 Clicked video: ${video.id} - ${title}`);
            
            // Fixed navigation path and parameter name
            this.navigateToVideo(video.id);
        });

        // Add hover effects
        card.addEventListener('mouseenter', () => {
            card.classList.add('hovered');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('hovered');
        });

        return card;
    }

    navigateToVideo(videoId) {
        // Determine the correct path based on current location
        const currentPath = window.location.pathname;
        let videoPath;
        
        if (currentPath.includes('/categories/')) {
            // From categories folder to video folder
            videoPath = `../video/video.html?id=${videoId}`;
        } else {
            // Fallback path
            videoPath = `../../video/video.html?id=${videoId}`;
        }
        
        console.log(`🔗 Navigating to: ${videoPath}`);
        window.location.href = videoPath;
    }

    updateResultsCount() {
        const resultsCountElement = document.getElementById('results-count');
        if (resultsCountElement) {
            resultsCountElement.textContent = this.filteredVideos.length;
        }
        
        // Update pagination info
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalResults = document.getElementById('total-results');
        
        if (showingStart && showingEnd && totalResults) {
            const start = (this.currentPage - 1) * this.videosPerPage + 1;
            const end = Math.min(this.currentPage * this.videosPerPage, this.filteredVideos.length);
            
            showingStart.textContent = this.filteredVideos.length > 0 ? start : 0;
            showingEnd.textContent = end;
            totalResults.textContent = this.filteredVideos.length;
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
        
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const numbersContainer = document.getElementById('pagination-numbers');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }
        
        if (numbersContainer && totalPages > 1) {
            numbersContainer.innerHTML = '';
            
            const startPage = Math.max(1, this.currentPage - 2);
            const endPage = Math.min(totalPages, this.currentPage + 2);
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-number ${i === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => this.goToPage(i));
                numbersContainer.appendChild(pageBtn);
            }
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
        
        if (page >= 1 && page <= totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.displayCurrentPage();
            
            // Scroll to top of videos section
            const videosSection = document.querySelector('.videos-section');
            if (videosSection) {
                videosSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    setupEventListeners() {
        // Sort dropdown
        const sortSelect = document.getElementById('sort-videos');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortVideos(e.target.value);
                this.currentPage = 1; // Reset to first page
                this.displayCurrentPage();
            });
        }

        // Pagination buttons
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }

        console.log('🎮 Event listeners setup complete');
    }

    // Utility Methods
    playRandomVideo() {
        if (this.filteredVideos && this.filteredVideos.length > 0) {
            const randomVideo = this.filteredVideos[Math.floor(Math.random() * this.filteredVideos.length)];
            console.log(`🎲 Playing random video: ${randomVideo.id}`);
            this.navigateToVideo(randomVideo.id);
        } else {
            console.warn('⚠️ No videos available for random play');
            this.showToast('No videos available', 'warning');
        }
    }

    showLoadingState() {
        const loadingElement = document.getElementById('loading-state');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.style.display = 'none';
        }
    }

    hideLoadingState() {
        const loadingElement = document.getElementById('loading-state');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showNoVideos() {
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="no-videos-message">
                    <div class="no-results-icon">📹</div>
                    <h3>No videos found</h3>
                    <p>No videos available in the "${this.capitalize(this.currentCategory)}" category.</p>
                    <p>Try browsing other categories or check back later.</p>
                    <a href="../index.html" class="btn-primary">Browse All Categories</a>
                </div>
            `;
            videosGrid.style.display = 'flex';
            videosGrid.style.justifyContent = 'center';
            videosGrid.style.alignItems = 'center';
        }
        
        this.updateResultsCount();
        this.hideLoadingState();
    }

    showError(message) {
        console.error('❌ Category Manager Error:', message);
        
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <h3>Error Loading Category</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <div class="error-actions">
                        <button onclick="window.location.reload()" class="btn-primary">Try Again</button>
                        <a href="../../index.html" class="btn-secondary">Go Home</a>
                    </div>
                </div>
            `;
            videosGrid.style.display = 'flex';
            videosGrid.style.justifyContent = 'center';
            videosGrid.style.alignItems = 'center';
        }
        
        this.updateResultsCount();
        this.hideLoadingState();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${this.escapeHtml(message)}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Formatting utilities
    formatNumber(num) {
        if (!num || num === 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
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

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
            if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
            
            return date.toLocaleDateString();
        } catch (error) {
            console.warn('Error formatting date:', error);
            return '';
        }
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Category Manager...');
    
    // Wait for age verification if needed
    const initializeManager = () => {
        if (window.ageVerification && !window.ageVerification.isVerified()) {
            setTimeout(initializeManager, 500);
            return;
        }
        
        window.categoryManager = new CategoryManager();
    };
    
    initializeManager();
});

// Global functions for HTML onclick handlers
window.playRandomVideo = function() {
    if (window.categoryManager && window.categoryManager.isInitialized) {
        window.categoryManager.playRandomVideo();
    } else {
        console.warn('⚠️ Category manager not ready');
    }
};

window.toggleCategoryBookmark = function() {
    // Implement category bookmarking
    const category = window.categoryManager?.currentCategory;
    if (category) {
        const bookmarks = JSON.parse(localStorage.getItem('xshiver_category_bookmarks') || '[]');
        const index = bookmarks.indexOf(category);
        
        if (index > -1) {
            bookmarks.splice(index, 1);
            console.log(`📌 Removed bookmark for category: ${category}`);
        } else {
            bookmarks.push(category);
            console.log(`📌 Added bookmark for category: ${category}`);
        }
        
        localStorage.setItem('xshiver_category_bookmarks', JSON.stringify(bookmarks));
        
        if (window.categoryManager && window.categoryManager.showToast) {
            window.categoryManager.showToast(
                index > -1 ? 'Category bookmark removed' : 'Category bookmarked!',
                'success'
            );
        }
    }
};

window.searchInCategory = function() {
    const searchInput = document.getElementById('category-search');
    if (searchInput && window.categoryManager) {
        const query = searchInput.value.toLowerCase().trim();
        
        if (query) {
            // Filter videos based on search query
            window.categoryManager.filteredVideos = window.categoryManager.currentVideos.filter(video => 
                video.title?.toLowerCase().includes(query) ||
                video.description?.toLowerCase().includes(query) ||
                (video.tags && video.tags.some(tag => tag.toLowerCase().includes(query)))
            );
            
            window.categoryManager.currentPage = 1;
            window.categoryManager.displayCurrentPage();
            
            console.log(`🔍 Search results: ${window.categoryManager.filteredVideos.length} videos found`);
        } else {
            // Reset filter
            window.categoryManager.filteredVideos = [...window.categoryManager.currentVideos];
            window.categoryManager.displayCurrentPage();
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
}
