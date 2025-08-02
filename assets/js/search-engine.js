/**
 * Advanced Search Engine for Xshiver
 * Handles complex search functionality, autocomplete, and suggestions
 */

class SearchEngine {
    constructor() {
        this.currentQuery = '';
        this.searchResults = {
            videos: [],
            categories: [],
            tags: []
        };
        this.searchFilters = {
            duration: [],
            quality: [],
            categories: [],
            rating: 1.0,
            sort: 'relevance'
        };
        this.searchHistory = [];
        this.savedSearches = [];
        this.currentPage = 1;
        this.resultsPerPage = 20;
        this.totalResults = 0;
        this.searchStartTime = 0;
        
        this.init();
    }
    
    init() {
        console.log('🔍 Search Engine initialized');
        
        this.loadSearchHistory();
        this.loadSavedSearches();
        this.setupEventListeners();
        this.detectSearchFromURL();
        this.setupAutocomplete();
    }
    
    setupEventListeners() {
        // Main search input
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            
            searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        }
        
        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', this.handleTabChange.bind(this));
        });
        
        // Sort dropdown
        const sortSelect = document.getElementById('search-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        }
        
        // Advanced filter toggle
        const filterToggle = document.getElementById('advanced-filter-toggle');
        if (filterToggle) {
            filterToggle.addEventListener('click', this.toggleAdvancedFilters.bind(this));
        }
        
        // Save search button
        const saveSearchBtn = document.getElementById('save-search-btn');
        if (saveSearchBtn) {
            saveSearchBtn.addEventListener('click', this.saveCurrentSearch.bind(this));
        }
        
        // Rating slider
        const ratingSlider = document.getElementById('rating-slider');
        if (ratingSlider) {
            ratingSlider.addEventListener('input', this.handleRatingChange.bind(this));
        }
        
        // Filter checkboxes
        this.setupFilterEventListeners();
    }
    
    setupFilterEventListeners() {
        // Duration filters
        document.querySelectorAll('input[name="duration"]').forEach(checkbox => {
            checkbox.addEventListener('change', this.handleFilterChange.bind(this));
        });
        
        // Quality filters
        document.querySelectorAll('input[name="quality"]').forEach(checkbox => {
            checkbox.addEventListener('change', this.handleFilterChange.bind(this));
        });
        
        // Category filters (will be populated dynamically)
        document.addEventListener('change', (e) => {
            if (e.target.name === 'category') {
                this.handleFilterChange(e);
            }
        });
    }
    
    detectSearchFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (query) {
            this.currentQuery = decodeURIComponent(query);
            
            // Set search input value
            const searchInput = document.getElementById('main-search-input');
            if (searchInput) {
                searchInput.value = this.currentQuery;
            }
            
            // Perform search
            this.performSearch();
        }
    }
    
    async performSearch(query = null) {
        if (query) {
            this.currentQuery = query;
        } else {
            const searchInput = document.getElementById('main-search-input');
            if (searchInput) {
                this.currentQuery = searchInput.value.trim();
            }
        }
        
        if (!this.currentQuery) return;
        
        console.log('🔍 Performing search for:', this.currentQuery);
        
        this.searchStartTime = performance.now();
        this.showSearchLoading();
        this.addToSearchHistory(this.currentQuery);
        this.updateURL();
        
        try {
            // Perform searches in parallel
            const [videoResults, categoryResults, tagResults] = await Promise.all([
                this.searchVideos(this.currentQuery),
                this.searchCategories(this.currentQuery),
                this.searchTags(this.currentQuery)
            ]);
            
            this.searchResults = {
                videos: videoResults,
                categories: categoryResults,
                tags: tagResults
            };
            
            // Calculate search time
            const searchTime = ((performance.now() - this.searchStartTime) / 1000).toFixed(2);
            
            // Update UI
            this.updateSearchHeader(searchTime);
            this.updateTabCounts();
            this.displayResults();
            this.generateRelatedSearches();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError('Search failed. Please try again.');
        } finally {
            this.hideSearchLoading();
        }
    }
    
    async searchVideos(query) {
        try {
            const searchOptions = {
                search: query,
                limit: 100,
                offset: 0,
                sortBy: this.getVideoSortField(),
                sortOrder: this.getVideoSortOrder(),
                ...this.getVideoFilters()
            };
            
            const results = await window.videoDatabase.getVideos(searchOptions);
            return results.videos || [];
            
        } catch (error) {
            console.error('Video search error:', error);
            return [];
        }
    }
    
    async searchCategories(query) {
        try {
            const categories = await window.categoryManager.categories;
            
            return categories.filter(category => {
                const searchTerms = query.toLowerCase().split(' ');
                
                return searchTerms.some(term => 
                    category.name.toLowerCase().includes(term) ||
                    category.description.toLowerCase().includes(term) ||
                    category.tags.some(tag => tag.toLowerCase().includes(term))
                );
            });
            
        } catch (error) {
            console.error('Category search error:', error);
            return [];
        }
    }
    
    async searchTags(query) {
        try {
            const allTags = await window.videoDatabase.getTags();
            const queryLower = query.toLowerCase();
            
            return allTags.filter(tag => 
                tag.toLowerCase().includes(queryLower)
            ).map(tag => ({
                name: tag,
                count: this.getTagVideoCount(tag)
            }));
            
        } catch (error) {
            console.error('Tag search error:', error);
            return [];
        }
    }
    
    async getTagVideoCount(tag) {
        try {
            const results = await window.videoDatabase.getVideosByTag(tag, 1);
            return results.totalCount || 0;
        } catch (error) {
            return Math.floor(Math.random() * 100) + 10; // Fallback
        }
    }
    
    getVideoFilters() {
        const filters = {};
        
        if (this.searchFilters.duration.length > 0) {
            filters.duration = this.searchFilters.duration[0]; // Take first for simplicity
        }
        
        if (this.searchFilters.quality.length > 0) {
            filters.quality = this.searchFilters.quality[0];
        }
        
        if (this.searchFilters.categories.length > 0) {
            filters.category = this.searchFilters.categories[0];
        }
        
        if (this.searchFilters.rating > 1.0) {
            filters.minRating = this.searchFilters.rating;
        }
        
        return filters;
    }
    
    getVideoSortField() {
        const sortMap = {
            'relevance': 'relevance',
            'newest': 'upload_date',
            'oldest': 'upload_date',
            'most-viewed': 'view_count',
            'highest-rated': 'rating'
        };
        
        return sortMap[this.searchFilters.sort] || 'relevance';
    }
    
    getVideoSortOrder() {
        if (this.searchFilters.sort === 'oldest') {
            return 'asc';
        }
        return 'desc';
    }
    
    updateSearchHeader(searchTime) {
        // Update query display
        const queryDisplay = document.getElementById('search-query-display');
        if (queryDisplay) {
            queryDisplay.textContent = this.currentQuery;
        }
        
        // Update results count
        const totalResults = this.searchResults.videos.length + 
                           this.searchResults.categories.length + 
                           this.searchResults.tags.length;
        
        const resultsCount = document.getElementById('search-results-count');
        if (resultsCount) {
            resultsCount.textContent = this.formatNumber(totalResults);
        }
        
        // Update search time
        const searchTimeDisplay = document.getElementById('search-time');
        if (searchTimeDisplay) {
            searchTimeDisplay.textContent = searchTime;
        }
        
        // Update page title
        document.title = `"${this.currentQuery}" - Search Results | Xshiver`;
    }
    
    updateTabCounts() {
        const videoCount = document.getElementById('video-count');
        const categoryCount = document.getElementById('category-count');
        const tagCount = document.getElementById('tag-count');
        
        if (videoCount) videoCount.textContent = this.searchResults.videos.length;
        if (categoryCount) categoryCount.textContent = this.searchResults.categories.length;
        if (tagCount) tagCount.textContent = this.searchResults.tags.length;
    }
    
    displayResults() {
        const activeTab = document.querySelector('.filter-tab.active').dataset.type;
        
        switch (activeTab) {
            case 'videos':
                this.displayVideoResults();
                break;
            case 'categories':
                this.displayCategoryResults();
                break;
            case 'tags':
                this.displayTagResults();
                break;
        }
        
        // Show no results if everything is empty
        const hasResults = this.searchResults.videos.length > 0 ||
                          this.searchResults.categories.length > 0 ||
                          this.searchResults.tags.length > 0;
        
        const noResults = document.getElementById('no-search-results');
        if (noResults) {
            if (hasResults) {
                noResults.classList.add('hidden');
            } else {
                noResults.classList.remove('hidden');
                this.showSearchSuggestions();
            }
        }
    }
    
    displayVideoResults() {
        const grid = document.getElementById('video-results-grid');
        if (!grid) return;
        
        const videos = this.paginateResults(this.searchResults.videos);
        
        grid.innerHTML = videos.map(video => this.createVideoResultCard(video)).join('');
        
        // Update pagination
        this.updatePagination(this.searchResults.videos.length);
    }
    
    displayCategoryResults() {
        const grid = document.getElementById('category-results-grid');
        if (!grid) return;
        
        grid.innerHTML = this.searchResults.categories.map(category => 
            this.createCategoryResultCard(category)
        ).join('');
    }
    
    displayTagResults() {
        const grid = document.getElementById('tag-results-grid');
        if (!grid) return;
        
        grid.innerHTML = this.searchResults.tags.map(tag => 
            this.createTagResultCard(tag)
        ).join('');
    }
    
    createVideoResultCard(video) {
        return `
            <div class="video-result-card" onclick="navigateToVideo(${video.id})">
                <div class="video-thumbnail">
                    <img src="${video.catbox_thumbnail_url}" alt="${video.title}" loading="lazy">
                    <div class="video-duration">${this.formatDuration(video.duration)}</div>
                    <div class="video-quality">${video.quality}</div>
                </div>
                
                <div class="video-info">
                    <h3 class="video-title">${this.highlightSearchTerms(video.title)}</h3>
                    <div class="video-meta">
                        <span class="views">${this.formatNumber(video.view_count)} views</span>
                        <span class="rating">★ ${video.rating.toFixed(1)}</span>
                        <span class="upload-date">${this.formatDate(video.upload_date)}</span>
                    </div>
                    <p class="video-description">${this.highlightSearchTerms(this.truncateText(video.description, 100))}</p>
                </div>
            </div>
        `;
    }
    
    createCategoryResultCard(category) {
        return `
            <div class="category-result-card" onclick="navigateToCategory('${category.slug}')">
                <div class="category-icon">${category.icon}</div>
                <div class="category-info">
                    <h3 class="category-name">${this.highlightSearchTerms(category.name)}</h3>
                    <p class="category-description">${this.highlightSearchTerms(category.description)}</p>
                    <div class="category-stats">
                        <span class="video-count">${this.formatNumber(category.video_count)} videos</span>
                        <span class="rating">★ ${category.average_rating}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    createTagResultCard(tag) {
        return `
            <div class="tag-result-card" onclick="searchForTag('${tag.name}')">
                <div class="tag-icon">#</div>
                <div class="tag-info">
                    <h3 class="tag-name">${this.highlightSearchTerms(tag.name)}</h3>
                    <div class="tag-stats">
                        <span class="video-count">${this.formatNumber(tag.count)} videos</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    highlightSearchTerms(text) {
        if (!this.currentQuery) return text;
        
        const terms = this.currentQuery.toLowerCase().split(' ');
        let highlightedText = text;
        
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }
    
    paginateResults(results) {
        const start = (this.currentPage - 1) * this.resultsPerPage;
        const end = start + this.resultsPerPage;
        return results.slice(start, end);
    }
    
    updatePagination(totalResults) {
        this.totalResults = totalResults;
        const totalPages = Math.ceil(totalResults / this.resultsPerPage);
        
        const paginationContainer = document.getElementById('search-pagination');
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage <= 1 ? 'disabled' : ''}" 
                    onclick="searchEngine.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage <= 1 ? 'disabled' : ''}>
                Previous
            </button>
        `;
        
        // Page numbers
        paginationHTML += '<div class="pagination-numbers">';
        
        for (let i = 1; i <= Math.min(totalPages, 10); i++) {
            paginationHTML += `
                <button class="pagination-number ${this.currentPage === i ? 'active' : ''}"
                        onclick="searchEngine.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        paginationHTML += '</div>';
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage >= totalPages ? 'disabled' : ''}"
                    onclick="searchEngine.goToPage(${this.currentPage + 1})"
                    ${this.currentPage >= totalPages ? 'disabled' : ''}>
                Next
            </button>
        `;
        
        paginationHTML += '</div>';
        
        paginationContainer.innerHTML = paginationHTML;
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.displayResults();
        
        // Scroll to top of results
        const resultsSection = document.querySelector('.search-results');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Event Handlers
    handleSearchInput(e) {
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            this.showAutocomplete(query);
        } else {
            this.hideAutocomplete();
        }
    }
    
    handleTabChange(e) {
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Hide all result sections
        document.querySelectorAll('.results-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show selected results section
        const resultType = e.target.dataset.type;
        const targetSection = document.getElementById(`${resultType}-results`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Update results display
        this.displayResults();
    }
    
    handleSortChange(e) {
        this.searchFilters.sort = e.target.value;
        this.currentPage = 1; // Reset to first page
        this.performSearch();
    }
    
    handleFilterChange(e) {
        const filterName = e.target.name;
        const filterValue = e.target.value;
        const isChecked = e.target.checked;
        
        if (!this.searchFilters[filterName]) {
            this.searchFilters[filterName] = [];
        }
        
        if (isChecked) {
            if (!this.searchFilters[filterName].includes(filterValue)) {
                this.searchFilters[filterName].push(filterValue);
            }
        } else {
            const index = this.searchFilters[filterName].indexOf(filterValue);
            if (index > -1) {
                this.searchFilters[filterName].splice(index, 1);
            }
        }
        
        this.applyFilters();
    }
    
    handleRatingChange(e) {
        const value = parseFloat(e.target.value);
        this.searchFilters.rating = value;
        
        const displayValue = document.getElementById('rating-display-value');
        if (displayValue) {
            displayValue.textContent = value.toFixed(1);
        }
        
        this.applyFilters();
    }
    
    applyFilters() {
        this.currentPage = 1; // Reset to first page
        this.performSearch();
    }
    
    toggleAdvancedFilters() {
        const sidebar = document.getElementById('search-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('hidden');
        }
    }
    
    // Autocomplete functionality
    setupAutocomplete() {
        // Create autocomplete container
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return;
        
        const autocompleteDiv = document.createElement('div');
        autocompleteDiv.id = 'search-autocomplete';
        autocompleteDiv.className = 'search-autocomplete hidden';
        searchContainer.appendChild(autocompleteDiv);
        
        // Click outside to hide
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                this.hideAutocomplete();
            }
        });
    }
    
    async showAutocomplete(query) {
        const autocompleteDiv = document.getElementById('search-autocomplete');
        if (!autocompleteDiv) return;
        
        try {
            const suggestions = await this.getAutocompleteSuggestions(query);
            
            if (suggestions.length === 0) {
                this.hideAutocomplete();
                return;
            }
            
            autocompleteDiv.innerHTML = suggestions.map(suggestion => `
                <div class="autocomplete-item" onclick="searchEngine.selectSuggestion('${suggestion}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="21 21l-4.35-4.35"></path>
                    </svg>
                    ${this.highlightQuery(suggestion, query)}
                </div>
            `).join('');
            
            autocompleteDiv.classList.remove('hidden');
            
        } catch (error) {
            console.error('Autocomplete error:', error);
            this.hideAutocomplete();
        }
    }
    
    hideAutocomplete() {
        const autocompleteDiv = document.getElementById('search-autocomplete');
        if (autocompleteDiv) {
            autocompleteDiv.classList.add('hidden');
        }
    }
    
    async getAutocompleteSuggestions(query) {
        const suggestions = new Set();
        const queryLower = query.toLowerCase();
        
        // Add search history matches
        this.searchHistory.forEach(historyItem => {
            if (historyItem.toLowerCase().includes(queryLower)) {
                suggestions.add(historyItem);
            }
        });
        
        // Add category names
        if (window.categoryManager && window.categoryManager.categories) {
            window.categoryManager.categories.forEach(category => {
                if (category.name.toLowerCase().includes(queryLower)) {
                    suggestions.add(category.name);
                }
            });
        }
        
        // Add popular tags
        try {
            const tags = await window.videoDatabase.getTags();
            tags.forEach(tag => {
                if (tag.toLowerCase().includes(queryLower) && suggestions.size < 8) {
                    suggestions.add(tag);
                }
            });
        } catch (error) {
            // Ignore error, just won't show tag suggestions
        }
        
        return Array.from(suggestions).slice(0, 8);
    }
    
    selectSuggestion(suggestion) {
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) {
            searchInput.value = suggestion;
        }
        
        this.hideAutocomplete();
        this.performSearch(suggestion);
    }
    
    highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
    
    // Search suggestions for no results
    showSearchSuggestions() {
        const suggestions = this.generateSearchSuggestions();
        const suggestionsContainer = document.getElementById('suggestions-list');
        
        if (suggestionsContainer && suggestions.length > 0) {
            suggestionsContainer.innerHTML = suggestions.map(suggestion => `
                <button class="suggestion-btn" onclick="searchEngine.performSearch('${suggestion}')">
                    ${suggestion}
                </button>
            `).join('');
            
            const suggestionsSection = document.getElementById('search-suggestions');
            if (suggestionsSection) {
                suggestionsSection.classList.remove('hidden');
            }
        }
    }
    
    generateSearchSuggestions() {
        // Generate suggestions based on query similarity
        const suggestions = [];
        
        if (window.categoryManager && window.categoryManager.categories) {
            // Find similar category names
            window.categoryManager.categories.forEach(category => {
                const similarity = this.calculateStringSimilarity(this.currentQuery, category.name);
                if (similarity > 0.3) {
                    suggestions.push({
                        text: category.name,
                        similarity: similarity
                    });
                }
            });
        }
        
        // Sort by similarity and return top suggestions
        return suggestions
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5)
            .map(s => s.text);
    }
    
    calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    // Related searches
    generateRelatedSearches() {
        const relatedSearches = [];
        
        // Add variations of current query
        const queryWords = this.currentQuery.toLowerCase().split(' ');
        
        if (queryWords.length > 1) {
            // Single words from the query
            queryWords.forEach(word => {
                if (word.length > 2) {
                    relatedSearches.push(word);
                }
            });
        }
        
        // Add category-based suggestions
        if (window.categoryManager && window.categoryManager.categories) {
            window.categoryManager.categories.forEach(category => {
                if (category.tags.some(tag => queryWords.includes(tag.toLowerCase()))) {
                    relatedSearches.push(category.name);
                }
            });
        }
        
        // Display related searches
        const container = document.getElementById('related-searches-list');
        if (container) {
            const uniqueSearches = [...new Set(relatedSearches)].slice(0, 8);
            container.innerHTML = uniqueSearches.map(search => `
                <button class="related-search-btn" onclick="searchEngine.performSearch('${search}')">
                    ${search}
                </button>
            `).join('');
        }
    }
    
    // Search history management
    addToSearchHistory(query) {
        if (!query || this.searchHistory.includes(query)) return;
        
        this.searchHistory.unshift(query);
        
        // Keep only last 20 searches
        if (this.searchHistory.length > 20) {
            this.searchHistory = this.searchHistory.slice(0, 20);
        }
        
        this.saveSearchHistory();
    }
    
    saveSearchHistory() {
        localStorage.setItem('xshiver_search_history', JSON.stringify(this.searchHistory));
    }
    
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('xshiver_search_history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
            this.searchHistory = [];
        }
    }
    
    // Saved searches
    saveCurrentSearch() {
        if (!this.currentQuery) return;
        
        const search = {
            query: this.currentQuery,
            filters: { ...this.searchFilters },
            savedAt: new Date().toISOString(),
            resultsCount: this.totalResults
        };
        
        this.savedSearches.unshift(search);
        
        // Keep only last 10 saved searches
        if (this.savedSearches.length > 10) {
            this.savedSearches = this.savedSearches.slice(0, 10);
        }
        
        localStorage.setItem('xshiver_saved_searches', JSON.stringify(this.savedSearches));
        
        // Update button text
        const saveBtn = document.getElementById('save-search-btn');
        if (saveBtn) {
            saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved!';
            
            setTimeout(() => {
                saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save Search';
            }, 2000);
        }
        
        console.log('🔖 Search saved');
    }
    
    loadSavedSearches() {
        try {
            const saved = localStorage.getItem('xshiver_saved_searches');
            if (saved) {
                this.savedSearches = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading saved searches:', error);
            this.savedSearches = [];
        }
    }
    
    // UI State Management
    showSearchLoading() {
        const loading = document.getElementById('search-loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
        
        // Hide other sections
        document.querySelectorAll('.results-section').forEach(section => {
            section.classList.add('hidden');
        });
    }
    
    hideSearchLoading() {
        const loading = document.getElementById('search-loading');
        if (loading) {
            loading.classList.add('hidden');
        }
        
        // Show active results section
        const activeTab = document.querySelector('.filter-tab.active');
        if (activeTab) {
            const resultType = activeTab.dataset.type;
            const targetSection = document.getElementById(`${resultType}-results`);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        }
    }
    
    showSearchError(message) {
        console.error('Search error:', message);
        // Could show error state in UI
    }
    
    updateURL() {
        const url = new URL(window.location);
        url.searchParams.set('q', encodeURIComponent(this.currentQuery));
        window.history.pushState({}, '', url);
    }
    
    // Utility Methods
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays <= 7) return `${diffDays} days ago`;
        if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
}

// Global search engine instance
window.searchEngine = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.videoDatabase) {
        window.searchEngine = new SearchEngine();
    } else {
        // Wait for video database to initialize
        const checkDatabase = () => {
            if (window.videoDatabase && window.videoDatabase.isInitialized) {
                window.searchEngine = new SearchEngine();
            } else {
                setTimeout(checkDatabase, 100);
            }
        };
        checkDatabase();
    }
});

// Global functions for HTML onclick handlers
function performSearch() {
    if (window.searchEngine) {
        window.searchEngine.performSearch();
    }
}

function searchFor(query) {
    if (window.searchEngine) {
        window.searchEngine.performSearch(query);
    }
}

function searchForTag(tag) {
    if (window.searchEngine) {
        window.searchEngine.performSearch(tag);
    }
}

function navigateToVideo(videoId) {
    window.location.href = `../watch/video.html?id=${videoId}`;
}

function navigateToCategory(categorySlug) {
    window.location.href = `../categories/category.html?cat=${categorySlug}`;
}

function clearSearch() {
    const searchInput = document.getElementById('main-search-input');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
}

function clearSearchFilters() {
    if (window.searchEngine) {
        window.searchEngine.searchFilters = {
            duration: [],
            quality: [],
            categories: [],
            rating: 1.0,
            sort: 'relevance'
        };
        
        // Reset UI elements
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        const ratingSlider = document.getElementById('rating-slider');
        if (ratingSlider) {
            ratingSlider.value = 1.0;
        }
        
        const ratingDisplay = document.getElementById('rating-display-value');
        if (ratingDisplay) {
            ratingDisplay.textContent = '1.0';
        }
        
        window.searchEngine.performSearch();
    }
}

function applySearchFilters() {
    if (window.searchEngine) {
        window.searchEngine.applyFilters();
    }
}

function toggleSearchSidebar() {
    if (window.searchEngine) {
        window.searchEngine.toggleAdvancedFilters();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchEngine;
}
