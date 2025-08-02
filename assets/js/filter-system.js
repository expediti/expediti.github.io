/**
 * Advanced Filter System for Xshiver Categories
 * Handles complex filtering, sorting, and search functionality
 */

class FilterSystem {
    constructor() {
        this.activeFilters = {
            duration: [],
            quality: [],
            uploadDate: 'all',
            rating: 1.0,
            tags: [],
            contentType: [],
            popularity: 'all'
        };
        
        this.sortOptions = {
            newest: { field: 'upload_date', order: 'desc' },
            oldest: { field: 'upload_date', order: 'asc' },
            mostViewed: { field: 'view_count', order: 'desc' },
            highestRated: { field: 'rating', order: 'desc' },
            longest: { field: 'duration', order: 'desc' },
            shortest: { field: 'duration', order: 'asc' }
        };
        
        this.currentSort = 'newest';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalResults = 0;
        
        this.init();
    }
    
    init() {
        console.log('🔧 Filter System initialized');
        
        this.bindFilterEvents();
        this.setupAdvancedFilters();
        this.loadSavedFilters();
        this.initializeRatingSlider();
    }
    
    bindFilterEvents() {
        // Duration filters
        const durationFilters = document.querySelectorAll('input[name="duration"]');
        durationFilters.forEach(filter => {
            filter.addEventListener('change', this.handleDurationFilter.bind(this));
        });
        
        // Quality filters
        const qualityFilters = document.querySelectorAll('input[name="quality"]');
        qualityFilters.forEach(filter => {
            filter.addEventListener('change', this.handleQualityFilter.bind(this));
        });
        
        // Upload date filters
        const uploadFilters = document.querySelectorAll('input[name="upload-date"]');
        uploadFilters.forEach(filter => {
            filter.addEventListener('change', this.handleUploadDateFilter.bind(this));
        });
        
        // Sort dropdown
        const sortSelect = document.getElementById('sort-videos');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        }
        
        // Per page dropdown
        const perPageSelect = document.getElementById('per-page');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', this.handlePerPageChange.bind(this));
        }
        
        // Advanced filters form
        const advancedForm = document.getElementById('advanced-filters-form');
        if (advancedForm) {
            advancedForm.addEventListener('change', this.handleAdvancedFilterChange.bind(this));
        }
    }
    
    setupAdvancedFilters() {
        // Setup rating slider
        const ratingRange = document.getElementById('rating-range');
        if (ratingRange) {
            ratingRange.addEventListener('input', this.handleRatingChange.bind(this));
        }
        
        // Setup video count range
        const videoCountRange = document.getElementById('video-count-range');
        if (videoCountRange) {
            videoCountRange.addEventListener('input', this.handleVideoCountChange.bind(this));
        }
    }
    
    initializeRatingSlider() {
        const ratingRange = document.getElementById('rating-range');
        const ratingValue = document.getElementById('rating-value');
        
        if (ratingRange && ratingValue) {
            ratingRange.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                ratingValue.textContent = value.toFixed(1);
                this.activeFilters.rating = value;
            });
        }
    }
    
    // Filter Handlers
    handleDurationFilter(e) {
        const value = e.target.value;
        const isChecked = e.target.checked;
        
        if (isChecked) {
            if (!this.activeFilters.duration.includes(value)) {
                this.activeFilters.duration.push(value);
            }
        } else {
            const index = this.activeFilters.duration.indexOf(value);
            if (index > -1) {
                this.activeFilters.duration.splice(index, 1);
            }
        }
        
        this.applyFilters();
    }
    
    handleQualityFilter(e) {
        const value = e.target.value;
        const isChecked = e.target.checked;
        
        if (isChecked) {
            if (!this.activeFilters.quality.includes(value)) {
                this.activeFilters.quality.push(value);
            }
        } else {
            const index = this.activeFilters.quality.indexOf(value);
            if (index > -1) {
                this.activeFilters.quality.splice(index, 1);
            }
        }
        
        this.applyFilters();
    }
    
    handleUploadDateFilter(e) {
        this.activeFilters.uploadDate = e.target.value;
        this.applyFilters();
    }
    
    handleRatingChange(e) {
        this.activeFilters.rating = parseFloat(e.target.value);
        this.applyFilters();
    }
    
    handleSortChange(e) {
        this.currentSort = e.target.value;
        this.currentPage = 1; // Reset to first page
        this.applyFilters();
    }
    
    handlePerPageChange(e) {
        this.itemsPerPage = parseInt(e.target.value);
        this.currentPage = 1; // Reset to first page
        this.applyFilters();
    }
    
    handleAdvancedFilterChange(e) {
        const name = e.target.name;
        const value = e.target.value;
        const isChecked = e.target.checked;
        
        switch (name) {
            case 'content-type':
                if (isChecked) {
                    if (!this.activeFilters.contentType.includes(value)) {
                        this.activeFilters.contentType.push(value);
                    }
                } else {
                    const index = this.activeFilters.contentType.indexOf(value);
                    if (index > -1) {
                        this.activeFilters.contentType.splice(index, 1);
                    }
                }
                break;
                
            case 'popularity':
                if (isChecked) {
                    this.activeFilters.popularity = value;
                }
                break;
                
            case 'age-range':
                if (isChecked) {
                    if (!this.activeFilters.tags.includes(value)) {
                        this.activeFilters.tags.push(value);
                    }
                } else {
                    const index = this.activeFilters.tags.indexOf(value);
                    if (index > -1) {
                        this.activeFilters.tags.splice(index, 1);
                    }
                }
                break;
        }
        
        this.applyFilters();
    }
    
    handleVideoCountChange(e) {
        const value = parseInt(e.target.value);
        const valueDisplay = document.getElementById('video-count-value');
        if (valueDisplay) {
            valueDisplay.textContent = `${value}+ videos`;
        }
        
        this.activeFilters.minVideoCount = value;
        this.applyFilters();
    }
    
    // Main Filter Application
    async applyFilters() {
        console.log('🔍 Applying filters:', this.activeFilters);
        
        this.showLoading();
        
        try {
            // Get current category from URL
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('cat');
            
            let videos;
            if (category) {
                // Filter videos in specific category
                videos = await this.getFilteredCategoryVideos(category);
            } else {
                // Filter all videos (for main categories page)
                videos = await this.getFilteredAllVideos();
            }
            
            // Apply sorting
            videos = this.sortVideos(videos);
            
            // Update total results
            this.totalResults = videos.length;
            
            // Apply pagination
            const paginatedVideos = this.paginateVideos(videos);
            
            // Update UI
            this.displayResults(paginatedVideos);
            this.updateResultsInfo();
            this.updatePagination();
            this.saveCurrentFilters();
            
        } catch (error) {
            console.error('Filter application error:', error);
            this.showError('Failed to apply filters');
        } finally {
            this.hideLoading();
        }
    }
    
    async getFilteredCategoryVideos(category) {
        // Get videos from specific category
        const categoryVideos = await window.videoDatabase.getCategoryVideos(category, 1000, 0);
        let videos = categoryVideos.videos || [];
        
        // Apply filters
        videos = this.filterByDuration(videos);
        videos = this.filterByQuality(videos);
        videos = this.filterByUploadDate(videos);
        videos = this.filterByRating(videos);
        videos = this.filterByTags(videos);
        videos = this.filterByContentType(videos);
        videos = this.filterByPopularity(videos);
        
        return videos;
    }
    
    async getFilteredAllVideos() {
        // Get all videos
        const allVideos = await window.videoDatabase.getVideos({ limit: 1000 });
        let videos = allVideos.videos || [];
        
        // Apply same filters
        videos = this.filterByDuration(videos);
        videos = this.filterByQuality(videos);
        videos = this.filterByUploadDate(videos);
        videos = this.filterByRating(videos);
        videos = this.filterByTags(videos);
        videos = this.filterByContentType(videos);
        videos = this.filterByPopularity(videos);
        
        return videos;
    }
    
    // Individual Filter Methods
    filterByDuration(videos) {
        if (this.activeFilters.duration.length === 0) return videos;
        
        return videos.filter(video => {
            const duration = video.duration;
            
            return this.activeFilters.duration.some(filter => {
                switch (filter) {
                    case 'short': return duration < 600; // Under 10 minutes
                    case 'medium': return duration >= 600 && duration <= 1800; // 10-30 minutes
                    case 'long': return duration > 1800; // Over 30 minutes
                    default: return true;
                }
            });
        });
    }
    
    filterByQuality(videos) {
        if (this.activeFilters.quality.length === 0) return videos;
        
        return videos.filter(video => {
            return this.activeFilters.quality.includes(video.quality);
        });
    }
    
    filterByUploadDate(videos) {
        if (this.activeFilters.uploadDate === 'all') return videos;
        
        const now = new Date();
        const filterDate = new Date();
        
        switch (this.activeFilters.uploadDate) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
            default:
                return videos;
        }
        
        return videos.filter(video => {
            const uploadDate = new Date(video.upload_date);
            return uploadDate >= filterDate;
        });
    }
    
    filterByRating(videos) {
        return videos.filter(video => {
            return video.rating >= this.activeFilters.rating;
        });
    }
    
    filterByTags(videos) {
        if (this.activeFilters.tags.length === 0) return videos;
        
        return videos.filter(video => {
            if (!video.tags) return false;
            
            return this.activeFilters.tags.some(tag => 
                video.tags.includes(tag)
            );
        });
    }
    
    filterByContentType(videos) {
        if (this.activeFilters.contentType.length === 0) return videos;
        
        return videos.filter(video => {
            return this.activeFilters.contentType.some(type => {
                switch (type) {
                    case 'amateur':
                        return video.category === 'amateur' || 
                               (video.tags && video.tags.includes('amateur'));
                    case 'professional':
                        return video.category === 'professional' || 
                               (video.tags && video.tags.includes('professional'));
                    case 'hd':
                        return ['720p', '1080p', '4k'].includes(video.quality);
                    case '4k':
                        return video.quality === '4k';
                    default:
                        return true;
                }
            });
        });
    }
    
    filterByPopularity(videos) {
        switch (this.activeFilters.popularity) {
            case 'trending':
                // Sort by recent view velocity
                return videos.filter(video => {
                    const daysSinceUpload = (Date.now() - new Date(video.upload_date)) / (1000 * 60 * 60 * 24);
                    const viewVelocity = video.view_count / Math.max(daysSinceUpload, 1);
                    return viewVelocity > 100; // Arbitrary threshold
                });
                
            case 'popular':
                // Top 50% by view count
                const sortedByViews = [...videos].sort((a, b) => b.view_count - a.view_count);
                const threshold = Math.floor(sortedByViews.length * 0.5);
                return sortedByViews.slice(0, threshold);
                
            default:
                return videos;
        }
    }
    
    // Sorting
    sortVideos(videos) {
        const sortConfig = this.sortOptions[this.currentSort];
        if (!sortConfig) return videos;
        
        return [...videos].sort((a, b) => {
            let aValue = a[sortConfig.field];
            let bValue = b[sortConfig.field];
            
            // Handle date sorting
            if (sortConfig.field === 'upload_date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            if (sortConfig.order === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });
    }
    
    // Pagination
    paginateVideos(videos) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return videos.slice(startIndex, endIndex);
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.applyFilters();
    }
    
    nextPage() {
        const maxPage = Math.ceil(this.totalResults / this.itemsPerPage);
        if (this.currentPage < maxPage) {
            this.currentPage++;
            this.applyFilters();
        }
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.applyFilters();
        }
    }
    
    // UI Updates
    displayResults(videos) {
        const videosGrid = document.getElementById('videos-grid');
        const noResults = document.getElementById('no-results');
        
        if (videos.length === 0) {
            if (videosGrid) videosGrid.innerHTML = '';
            if (noResults) noResults.classList.remove('hidden');
            return;
        }
        
        if (noResults) noResults.classList.add('hidden');
        
        if (videosGrid) {
            videosGrid.innerHTML = '';
            
            videos.forEach(video => {
                const videoCard = this.createVideoCard(video);
                videosGrid.appendChild(videoCard);
            });
        }
    }
    
    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => {
            window.location.href = `../watch/video.html?id=${video.id}`;
        };
        
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.catbox_thumbnail_url}" alt="${video.title}" loading="lazy" 
                     onerror="this.src='../../assets/images/placeholder-thumbnail.jpg'">
                <div class="video-overlay">
                    <button class="play-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>
                </div>
                <div class="video-duration">${this.formatDuration(video.duration)}</div>
                <div class="video-quality">${video.quality.toUpperCase()}</div>
            </div>
            
            <div class="video-info">
                <h3 class="video-title">${this.truncateText(video.title, 60)}</h3>
                
                <div class="video-meta">
                    <div class="video-stats">
                        <span class="views">${this.formatNumber(video.view_count)} views</span>
                        <span class="separator">•</span>
                        <span class="upload-date">${this.formatDate(video.upload_date)}</span>
                    </div>
                    
                    <div class="video-rating">
                        <div class="stars">
                            ${this.generateStars(video.rating)}
                        </div>
                        <span class="rating-text">${video.rating.toFixed(1)}</span>
                    </div>
                </div>
                
                <div class="video-tags">
                    ${video.tags ? video.tags.slice(0, 3).map(tag => 
                        `<span class="tag">${tag}</span>`
                    ).join('') : ''}
                </div>
                
                <div class="video-actions">
                    <button class="action-btn bookmark-btn" onclick="event.stopPropagation(); toggleBookmark(${video.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                    </button>
                    
                    <button class="action-btn share-btn" onclick="event.stopPropagation(); shareVideo(${video.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    updateResultsInfo() {
        const resultsCount = document.getElementById('results-count');
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalResults = document.getElementById('total-results');
        
        if (resultsCount) {
            resultsCount.textContent = this.formatNumber(this.totalResults);
        }
        
        if (showingStart && showingEnd && totalResults) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(this.currentPage * this.itemsPerPage, this.totalResults);
            
            showingStart.textContent = this.formatNumber(start);
            showingEnd.textContent = this.formatNumber(end);
            totalResults.textContent = this.formatNumber(this.totalResults);
        }
    }
    
    updatePagination() {
        const maxPage = Math.ceil(this.totalResults / this.itemsPerPage);
        const paginationNumbers = document.getElementById('pagination-numbers');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        // Update prev/next buttons
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
            prevBtn.onclick = () => this.previousPage();
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= maxPage;
            nextBtn.onclick = () => this.nextPage();
        }
        
        // Update page numbers
        if (paginationNumbers) {
            paginationNumbers.innerHTML = this.generatePaginationNumbers(maxPage);
        }
    }
    
    generatePaginationNumbers(maxPage) {
        let html = '';
        const current = this.currentPage;
        
        // Always show first page
        if (maxPage > 1) {
            html += `<button class="pagination-number ${current === 1 ? 'active' : ''}" onclick="filterSystem.goToPage(1)">1</button>`;
        }
        
        // Show ellipsis if needed
        if (current > 3) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
        
        // Show pages around current
        const start = Math.max(2, current - 1);
        const end = Math.min(maxPage - 1, current + 1);
        
        for (let i = start; i <= end; i++) {
            html += `<button class="pagination-number ${current === i ? 'active' : ''}" onclick="filterSystem.goToPage(${i})">${i}</button>`;
        }
        
        // Show ellipsis if needed
        if (current < maxPage - 2) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
        
        // Always show last page
        if (maxPage > 1) {
            html += `<button class="pagination-number ${current === maxPage ? 'active' : ''}" onclick="filterSystem.goToPage(${maxPage})">${maxPage}</button>`;
        }
        
        return html;
    }
    
    // Utility Methods
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
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
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays} days ago`;
        if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
    
    generateStars(rating) {
        let html = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            html += '<span class="star full">★</span>';
        }
        
        if (hasHalfStar) {
            html += '<span class="star half">★</span>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            html += '<span class="star empty">☆</span>';
        }
        
        return html;
    }
    
    // Filter Management
    clearAllFilters() {
        // Reset all filters to default
        this.activeFilters = {
            duration: [],
            quality: [],
            uploadDate: 'all',
            rating: 1.0,
            tags: [],
            contentType: [],
            popularity: 'all'
        };
        
        // Reset form elements
        this.resetFilterUI();
        
        // Reset pagination
        this.currentPage = 1;
        
        // Apply filters
        this.applyFilters();
    }
    
    resetFilterUI() {
        // Reset checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Reset radio buttons
        document.querySelector('input[name="upload-date"][value="all"]').checked = true;
        document.querySelector('input[name="popularity"][value="all"]').checked = true;
        
        // Reset sliders
        const ratingRange = document.getElementById('rating-range');
        if (ratingRange) {
            ratingRange.value = 1.0;
            document.getElementById('rating-value').textContent = '1.0';
        }
        
        const videoCountRange = document.getElementById('video-count-range');
        if (videoCountRange) {
            videoCountRange.value = 50;
            document.getElementById('video-count-value').textContent = '50+ videos';
        }
    }
    
    saveCurrentFilters() {
        const filterState = {
            filters: this.activeFilters,
            sort: this.currentSort,
            itemsPerPage: this.itemsPerPage,
            page: this.currentPage
        };
        
        localStorage.setItem('xshiver_filter_state', JSON.stringify(filterState));
    }
    
    loadSavedFilters() {
        try {
            const saved = localStorage.getItem('xshiver_filter_state');
            if (saved) {
                const filterState = JSON.parse(saved);
                
                this.activeFilters = { ...this.activeFilters, ...filterState.filters };
                this.currentSort = filterState.sort || 'newest';
                this.itemsPerPage = filterState.itemsPerPage || 20;
                this.currentPage = 1; // Always start on first page
                
                this.restoreFilterUI();
            }
        } catch (error) {
            console.error('Error loading saved filters:', error);
        }
    }
    
    restoreFilterUI() {
        // Restore checkboxes
        this.activeFilters.duration.forEach(value => {
            const checkbox = document.querySelector(`input[name="duration"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        this.activeFilters.quality.forEach(value => {
            const checkbox = document.querySelector(`input[name="quality"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Restore radio buttons
        const uploadRadio = document.querySelector(`input[name="upload-date"][value="${this.activeFilters.uploadDate}"]`);
        if (uploadRadio) uploadRadio.checked = true;
        
        // Restore sliders
        const ratingRange = document.getElementById('rating-range');
        if (ratingRange) {
            ratingRange.value = this.activeFilters.rating;
            document.getElementById('rating-value').textContent = this.activeFilters.rating.toFixed(1);
        }
        
        // Restore dropdowns
        const sortSelect = document.getElementById('sort-videos');
        if (sortSelect) sortSelect.value = this.currentSort;
        
        const perPageSelect = document.getElementById('per-page');
        if (perPageSelect) perPageSelect.value = this.itemsPerPage;
    }
    
    // Loading States
    showLoading() {
        const loadingState = document.getElementById('loading-state');
        const videosGrid = document.getElementById('videos-grid');
        
        if (loadingState) loadingState.classList.remove('hidden');
        if (videosGrid) videosGrid.innerHTML = '';
    }
    
    hideLoading() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) loadingState.classList.add('hidden');
    }
    
    showError(message) {
        console.error('Filter System Error:', message);
        
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Error Loading Content</h3>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="filterSystem.applyFilters()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Global filter system instance
window.filterSystem = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.videoDatabase) {
        window.filterSystem = new FilterSystem();
    } else {
        // Wait for video database to initialize
        const checkDatabase = () => {
            if (window.videoDatabase && window.videoDatabase.isInitialized) {
                window.filterSystem = new FilterSystem();
            } else {
                setTimeout(checkDatabase, 100);
            }
        };
        checkDatabase();
    }
});

// Global functions for HTML onclick handlers
function toggleSidebar() {
    const sidebar = document.getElementById('filters-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function clearAllFilters() {
    if (window.filterSystem) {
        window.filterSystem.clearAllFilters();
    }
}

function applyFilters() {
    if (window.filterSystem) {
        window.filterSystem.applyFilters();
    }
}

function searchInCategory() {
    const searchInput = document.getElementById('category-search');
    if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.trim();
        window.location.href = `../search/?q=${encodeURIComponent(query)}`;
    }
}

function performHeaderSearch() {
    const searchInput = document.getElementById('header-search');
    if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.trim();
        window.location.href = `../search/?q=${encodeURIComponent(query)}`;
    }
}

function toggleBookmark(videoId) {
    // Bookmark functionality
    console.log('Toggling bookmark for video:', videoId);
    
    const bookmarks = JSON.parse(localStorage.getItem('xshiver_bookmarks') || '{}');
    
    if (bookmarks[videoId]) {
        delete bookmarks[videoId];
        console.log('Bookmark removed');
    } else {
        bookmarks[videoId] = {
            id: videoId,
            bookmarkedAt: new Date().toISOString()
        };
        console.log('Bookmark added');
    }
    
    localStorage.setItem('xshiver_bookmarks', JSON.stringify(bookmarks));
}

function shareVideo(videoId) {
    // Share functionality
    const videoUrl = `${window.location.origin}/pages/watch/video.html?id=${videoId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Check out this video on Xshiver',
            url: videoUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(videoUrl).then(() => {
            console.log('Video URL copied to clipboard');
            // Show a toast notification here
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterSystem;
}
