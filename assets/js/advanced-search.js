/**
 * Advanced Search & Filter System for Xshiver
 * Provides intelligent search with multiple filters and auto-suggestions
 */

class AdvancedSearchEngine {
    constructor() {
        this.searchIndex = new Map();
        this.searchHistory = [];
        this.suggestions = [];
        this.filters = {
            category: null,
            duration: { min: null, max: null },
            quality: null,
            rating: { min: null, max: null },
            uploadDate: { start: null, end: null },
            tags: [],
            verified: null,
            premium: null
        };
        
        // Search algorithms
        this.algorithms = {
            FUZZY: 'fuzzy',
            EXACT: 'exact',
            SEMANTIC: 'semantic',
            WEIGHTED: 'weighted'
        };
        
        // Search modes
        this.searchMode = 'intelligent'; // 'simple', 'advanced', 'intelligent'
        
        this.currentQuery = '';
        this.currentResults = [];
        this.isSearching = false;
        
        this.init();
    }
    
    init() {
        console.log('🔍 Advanced Search Engine initializing...');
        
        // Build search index
        this.buildSearchIndex();
        
        // Setup search UI
        this.setupSearchInterface();
        
        // Load search history
        this.loadSearchHistory();
        
        // Setup auto-suggestions
        this.setupAutoSuggestions();
        
        console.log('✅ Advanced Search Engine initialized');
    }
    
    async buildSearchIndex() {
        try {
            // Get all videos for indexing
            const videos = await this.fetchAllVideos();
            
            videos.forEach(video => {
                this.indexVideo(video);
            });
            
            console.log(`🔍 Indexed ${videos.length} videos`);
            
        } catch (error) {
            console.error('Error building search index:', error);
        }
    }
    
    indexVideo(video) {
        const searchableText = [
            video.title,
            video.description,
            video.category,
            ...(video.tags || []),
            video.uploader?.name || ''
        ].join(' ').toLowerCase();
        
        const searchData = {
            id: video.id,
            title: video.title,
            description: video.description,
            category: video.category,
            tags: video.tags || [],
            duration: video.duration,
            rating: video.rating,
            uploadDate: video.upload_date,
            quality: video.quality || '1080p',
            verified: video.uploader?.verified || false,
            premium: video.is_premium || false,
            searchableText: searchableText,
            keywords: this.extractKeywords(searchableText),
            popularity: video.view_count || 0
        };
        
        this.searchIndex.set(video.id, searchData);
    }
    
    extractKeywords(text) {
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        
        return text
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word))
            .map(word => word.replace(/[^\w]/g, ''))
            .filter(word => word.length > 0);
    }
    
    setupSearchInterface() {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const advancedToggle = document.getElementById('advanced-search-toggle');
        
        if (searchInput) {
            // Real-time search suggestions
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            // Search on Enter key
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(e.target.value);
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                const query = searchInput?.value || '';
                this.performSearch(query);
            });
        }
        
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                this.toggleAdvancedSearch();
            });
        }
        
        // Filter controls
        this.setupFilterControls();
        
        // Voice search (if supported)
        this.setupVoiceSearch();
    }
    
    setupFilterControls() {
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value || null;
                this.applyFilters();
            });
        }
        
        // Duration filter
        const durationMin = document.getElementById('duration-min');
        const durationMax = document.getElementById('duration-max');
        
        if (durationMin) {
            durationMin.addEventListener('change', (e) => {
                this.filters.duration.min = e.target.value ? parseInt(e.target.value) : null;
                this.applyFilters();
            });
        }
        
        if (durationMax) {
            durationMax.addEventListener('change', (e) => {
                this.filters.duration.max = e.target.value ? parseInt(e.target.value) : null;
                this.applyFilters();
            });
        }
        
        // Quality filter
        const qualityFilter = document.getElementById('quality-filter');
        if (qualityFilter) {
            qualityFilter.addEventListener('change', (e) => {
                this.filters.quality = e.target.value || null;
                this.applyFilters();
            });
        }
        
        // Rating filter
        const ratingFilter = document.getElementById('rating-filter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.filters.rating.min = e.target.value ? parseFloat(e.target.value) : null;
                this.applyFilters();
            });
        }
        
        // Date range filter
        const dateStart = document.getElementById('date-start');
        const dateEnd = document.getElementById('date-end');
        
        if (dateStart) {
            dateStart.addEventListener('change', (e) => {
                this.filters.uploadDate.start = e.target.value || null;
                this.applyFilters();
            });
        }
        
        if (dateEnd) {
            dateEnd.addEventListener('change', (e) => {
                this.filters.uploadDate.end = e.target.value || null;
                this.applyFilters();
            });
        }
        
        // Verified only filter
        const verifiedFilter = document.getElementById('verified-only');
        if (verifiedFilter) {
            verifiedFilter.addEventListener('change', (e) => {
                this.filters.verified = e.target.checked ? true : null;
                this.applyFilters();
            });
        }
        
        // Premium only filter
        const premiumFilter = document.getElementById('premium-only');
        if (premiumFilter) {
            premiumFilter.addEventListener('change', (e) => {
                this.filters.premium = e.target.checked ? true : null;
                this.applyFilters();
            });
        }
        
        // Clear filters button
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }
    
    setupVoiceSearch() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return; // Voice search not supported
        }
        
        const voiceButton = document.getElementById('voice-search-btn');
        if (!voiceButton) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            voiceButton.classList.add('listening');
            this.showVoiceSearchIndicator();
        };
        
        this.recognition.onresult = (event) => {
            const query = event.results[0][0].transcript;
            document.getElementById('search-input').value = query;
            this.performSearch(query);
        };
        
        this.recognition.onend = () => {
            voiceButton.classList.remove('listening');
            this.hideVoiceSearchIndicator();
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceButton.classList.remove('listening');
            this.hideVoiceSearchIndicator();
        };
        
        voiceButton.addEventListener('click', () => {
            if (voiceButton.classList.contains('listening')) {
                this.recognition.stop();
            } else {
                this.recognition.start();
            }
        });
        
        voiceButton.style.display = 'block'; // Show voice search button
    }
    
    setupAutoSuggestions() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;
        
        // Create suggestions dropdown
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions';
        suggestionsContainer.id = 'search-suggestions';
        searchInput.parentNode.appendChild(suggestionsContainer);
        
        // Hide suggestions when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSuggestions();
            }
        });
    }
    
    handleSearchInput(query) {
        this.currentQuery = query;
        
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }
        
        // Debounce suggestions
        clearTimeout(this.suggestionTimeout);
        this.suggestionTimeout = setTimeout(() => {
            this.generateSuggestions(query);
        }, 300);
    }
    
    generateSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();
        
        // Get suggestions from search index
        for (const [id, video] of this.searchIndex) {
            if (video.title.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    type: 'video',
                    text: video.title,
                    category: video.category
                });
            }
            
            // Check tags
            video.tags.forEach(tag => {
                if (tag.toLowerCase().includes(queryLower) && 
                    !suggestions.some(s => s.text === tag)) {
                    suggestions.push({
                        type: 'tag',
                        text: tag,
                        category: 'Tag'
                    });
                }
            });
            
            if (suggestions.length >= 8) break;
        }
        
        // Add search history suggestions
        this.searchHistory.forEach(historyItem => {
            if (historyItem.query.toLowerCase().includes(queryLower) &&
                !suggestions.some(s => s.text === historyItem.query)) {
                suggestions.push({
                    type: 'history',
                    text: historyItem.query,
                    category: 'Recent Search'
                });
            }
        });
        
        this.showSuggestions(suggestions.slice(0, 8));
    }
    
    showSuggestions(suggestions) {
        const container = document.getElementById('search-suggestions');
        if (!container) return;
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        const suggestionsHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-query="${suggestion.text}">
                <div class="suggestion-icon">
                    ${this.getSuggestionIcon(suggestion.type)}
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-text">${suggestion.text}</div>
                    <div class="suggestion-category">${suggestion.category}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = suggestionsHTML;
        container.style.display = 'block';
        
        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                document.getElementById('search-input').value = query;
                this.performSearch(query);
                this.hideSuggestions();
            });
        });
    }
    
    hideSuggestions() {
        const container = document.getElementById('search-suggestions');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    getSuggestionIcon(type) {
        const icons = {
            video: '🎥',
            tag: '🏷️',
            history: '🕒',
            category: '📂'
        };
        return icons[type] || '🔍';
    }
    
    // Main search functionality
    
    async performSearch(query, options = {}) {
        if (!query.trim()) return;
        
        this.isSearching = true;
        this.showSearchLoading();
        
        try {
            // Add to search history
            this.addToSearchHistory(query);
            
            // Perform search with current filters
            const results = await this.search(query, {
                ...options,
                filters: this.filters,
                algorithm: this.getSearchAlgorithm(query)
            });
            
            this.currentResults = results;
            
            // Display results
            this.displaySearchResults(results, query);
            
            // Track search
            this.trackSearch(query, results.length);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError(error.message);
        } finally {
            this.isSearching = false;
            this.hideSearchLoading();
        }
    }
    
    async search(query, options = {}) {
        const {
            limit = 50,
            offset = 0,
            sortBy = 'relevance',
            sortOrder = 'desc',
            filters = {},
            algorithm = this.algorithms.INTELLIGENT
        } = options;
        
        let results = Array.from(this.searchIndex.values());
        
        // Apply text search
        if (query.trim()) {
            results = this.applyTextSearch(results, query, algorithm);
        }
        
        // Apply filters
        results = this.applyFiltersToResults(results, filters);
        
        // Sort results
        results = this.sortResults(results, sortBy, sortOrder, query);
        
        // Paginate
        results = results.slice(offset, offset + limit);
        
        // Add search metadata
        results.forEach(result => {
            result.searchScore = this.calculateSearchScore(result, query);
            result.matchReasons = this.getMatchReasons(result, query, filters);
        });
        
        return results;
    }
    
    applyTextSearch(results, query, algorithm) {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
        
        return results.filter(video => {
            switch (algorithm) {
                case this.algorithms.EXACT:
                    return video.searchableText.includes(queryLower);
                    
                case this.algorithms.FUZZY:
                    return this.fuzzyMatch(video.searchableText, queryLower);
                    
                case this.algorithms.SEMANTIC:
                    return this.semanticMatch(video, queryWords);
                    
                case this.algorithms.WEIGHTED:
                default:
                    return this.weightedMatch(video, queryWords);
            }
        });
    }
    
    fuzzyMatch(text, query) {
        // Simple fuzzy matching implementation
        const threshold = 0.7;
        return this.similarity(text, query) >= threshold;
    }
    
    similarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    levenshteinDistance(s1, s2) {
        const matrix = [];
        
        for (let i = 0; i <= s2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= s1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= s2.length; i++) {
            for (let j = 1; j <= s1.length; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        return matrix[s2.length][s1.length];
    }
    
    semanticMatch(video, queryWords) {
        // Simple semantic matching based on related terms
        const semanticMap = {
            'adult': ['mature', 'nsfw', '18+', 'explicit'],
            'amateur': ['homemade', 'real', 'authentic'],
            'professional': ['studio', 'hd', 'quality'],
            'vintage': ['retro', 'classic', 'old']
        };
        
        for (const word of queryWords) {
            if (video.searchableText.includes(word)) return true;
            
            const related = semanticMap[word] || [];
            if (related.some(term => video.searchableText.includes(term))) return true;
        }
        
        return false;
    }
    
    weightedMatch(video, queryWords) {
        let score = 0;
        const titleWeight = 3;
        const descriptionWeight = 1;
        const tagWeight = 2;
        const categoryWeight = 2;
        
        for (const word of queryWords) {
            if (video.title.toLowerCase().includes(word)) {
                score += titleWeight;
            }
            if (video.description.toLowerCase().includes(word)) {
                score += descriptionWeight;
            }
            if (video.tags.some(tag => tag.toLowerCase().includes(word))) {
                score += tagWeight;
            }
            if (video.category.toLowerCase().includes(word)) {
                score += categoryWeight;
            }
        }
        
        return score > 0;
    }
    
    applyFiltersToResults(results, filters) {
        return results.filter(video => {
            // Category filter
            if (filters.category && video.category !== filters.category) {
                return false;
            }
            
            // Duration filter
            if (filters.duration.min && video.duration < filters.duration.min) {
                return false;
            }
            if (filters.duration.max && video.duration > filters.duration.max) {
                return false;
            }
            
            // Quality filter
            if (filters.quality && video.quality !== filters.quality) {
                return false;
            }
            
            // Rating filter
            if (filters.rating.min && video.rating < filters.rating.min) {
                return false;
            }
            if (filters.rating.max && video.rating > filters.rating.max) {
                return false;
            }
            
            // Upload date filter
            if (filters.uploadDate.start || filters.uploadDate.end) {
                const uploadDate = new Date(video.uploadDate);
                if (filters.uploadDate.start && uploadDate < new Date(filters.uploadDate.start)) {
                    return false;
                }
                if (filters.uploadDate.end && uploadDate > new Date(filters.uploadDate.end)) {
                    return false;
                }
            }
            
            // Verified filter
            if (filters.verified && !video.verified) {
                return false;
            }
            
            // Premium filter
            if (filters.premium && !video.premium) {
                return false;
            }
            
            // Tags filter
            if (filters.tags.length > 0) {
                const hasAllTags = filters.tags.every(tag => 
                    video.tags.some(videoTag => 
                        videoTag.toLowerCase().includes(tag.toLowerCase())
                    )
                );
                if (!hasAllTags) return false;
            }
            
            return true;
        });
    }
    
    sortResults(results, sortBy, sortOrder, query) {
        return results.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'relevance':
                    comparison = this.calculateRelevanceScore(b, query) - this.calculateRelevanceScore(a, query);
                    break;
                case 'date':
                    comparison = new Date(b.uploadDate) - new Date(a.uploadDate);
                    break;
                case 'rating':
                    comparison = b.rating - a.rating;
                    break;
                case 'duration':
                    comparison = b.duration - a.duration;
                    break;
                case 'popularity':
                    comparison = b.popularity - a.popularity;
                    break;
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                default:
                    comparison = 0;
            }
            
            return sortOrder === 'desc' ? comparison : -comparison;
        });
    }
    
    calculateRelevanceScore(video, query) {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);
        let score = 0;
        
        // Exact title match gets highest score
        if (video.title.toLowerCase() === queryLower) {
            score += 100;
        } else if (video.title.toLowerCase().includes(queryLower)) {
            score += 50;
        }
        
        // Word matches in title
        queryWords.forEach(word => {
            if (video.title.toLowerCase().includes(word)) {
                score += 10;
            }
        });
        
        // Category match
        if (video.category.toLowerCase().includes(queryLower)) {
            score += 20;
        }
        
        // Tag matches
        video.tags.forEach(tag => {
            if (tag.toLowerCase().includes(queryLower)) {
                score += 15;
            }
            queryWords.forEach(word => {
                if (tag.toLowerCase().includes(word)) {
                    score += 5;
                }
            });
        });
        
        // Description matches
        queryWords.forEach(word => {
            if (video.description.toLowerCase().includes(word)) {
                score += 3;
            }
        });
        
        // Boost popular videos slightly
        score += Math.log(video.popularity + 1) * 0.1;
        
        return score;
    }
    
    calculateSearchScore(video, query) {
        return this.calculateRelevanceScore(video, query);
    }
    
    getMatchReasons(video, query, filters) {
        const reasons = [];
        const queryLower = query.toLowerCase();
        
        if (video.title.toLowerCase().includes(queryLower)) {
            reasons.push('Title match');
        }
        
        if (video.category.toLowerCase().includes(queryLower)) {
            reasons.push('Category match');
        }
        
        const matchingTags = video.tags.filter(tag => 
            tag.toLowerCase().includes(queryLower)
        );
        if (matchingTags.length > 0) {
            reasons.push(`Tag match: ${matchingTags.join(', ')}`);
        }
        
        if (video.description.toLowerCase().includes(queryLower)) {
            reasons.push('Description match');
        }
        
        return reasons;
    }
    
    getSearchAlgorithm(query) {
        // Intelligent algorithm selection based on query
        if (query.includes('"') && query.includes('"')) {
            return this.algorithms.EXACT; // Quoted search
        }
        
        if (query.includes('~') || query.includes('*')) {
            return this.algorithms.FUZZY; // Fuzzy search operators
        }
        
        if (query.split(' ').length > 3) {
            return this.algorithms.SEMANTIC; // Long queries benefit from semantic search
        }
        
        return this.algorithms.WEIGHTED; // Default weighted search
    }
    
    // Filter management
    
    applyFilters() {
        if (this.currentQuery) {
            this.performSearch(this.currentQuery);
        }
    }
    
    clearAllFilters() {
        this.filters = {
            category: null,
            duration: { min: null, max: null },
            quality: null,
            rating: { min: null, max: null },
            uploadDate: { start: null, end: null },
            tags: [],
            verified: null,
            premium: null
        };
        
        // Reset UI
        this.resetFilterUI();
        
        // Reapply search
        if (this.currentQuery) {
            this.performSearch(this.currentQuery);
        }
    }
    
    resetFilterUI() {
        const filterElements = {
            'category-filter': '',
            'duration-min': '',
            'duration-max': '',
            'quality-filter': '',
            'rating-filter': '',
            'date-start': '',
            'date-end': '',
            'verified-only': false,
            'premium-only': false
        };
        
        Object.entries(filterElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
    }
    
    // UI Management
    
    displaySearchResults(results, query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        // Update results count
        this.updateResultsCount(results.length, query);
        
        if (results.length === 0) {
            this.showNoResults(query);
            return;
        }
        
        // Generate results HTML
        const resultsHTML = results.map(video => this.createResultHTML(video)).join('');
        resultsContainer.innerHTML = resultsHTML;
        
        // Setup result interactions
        this.setupResultInteractions();
    }
    
    createResultHTML(video) {
        return `
            <div class="search-result-item" data-video-id="${video.id}">
                <div class="result-thumbnail">
                    <img src="${video.thumbnail || '/assets/images/default-thumbnail.jpg'}" 
                         alt="${video.title}" loading="lazy">
                    <div class="result-duration">${this.formatDuration(video.duration)}</div>
                    ${video.premium ? '<div class="premium-badge">Premium</div>' : ''}
                    ${video.verified ? '<div class="verified-badge">✓</div>' : ''}
                </div>
                
                <div class="result-content">
                    <h3 class="result-title">${this.highlightSearchTerms(video.title, this.currentQuery)}</h3>
                    <p class="result-description">${this.truncateText(video.description, 150)}</p>
                    
                    <div class="result-metadata">
                        <span class="result-category">${video.category}</span>
                        <span class="result-rating">⭐ ${video.rating.toFixed(1)}</span>
                        <span class="result-date">${this.formatDate(video.uploadDate)}</span>
                        ${video.quality ? `<span class="result-quality">${video.quality}</span>` : ''}
                    </div>
                    
                    <div class="result-tags">
                        ${video.tags.slice(0, 3).map(tag => 
                            `<span class="tag">${tag}</span>`
                        ).join('')}
                    </div>
                    
                    ${video.matchReasons ? `
                        <div class="match-reasons">
                            <small>Matches: ${video.matchReasons.join(', ')}</small>
                        </div>
                    ` : ''}
                </div>
                
                <div class="result-actions">
                    <button class="btn-primary play-btn" data-video-id="${video.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                        Play
                    </button>
                    <button class="btn-secondary add-to-playlist-btn" data-video-id="${video.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    highlightSearchTerms(text, query) {
        if (!query) return text;
        
        const queryWords = query.toLowerCase().split(/\s+/);
        let highlightedText = text;
        
        queryWords.forEach(word => {
            if (word.length > 2) {
                const regex = new RegExp(`(${word})`, 'gi');
                highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
            }
        });
        
        return highlightedText;
    }
    
    updateResultsCount(count, query) {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `${count} results for "${query}"`;
        }
    }
    
    showNoResults(query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No results found for "${query}"</h3>
                <p>Try adjusting your search terms or filters</p>
                <div class="search-suggestions">
                    <h4>Search suggestions:</h4>
                    <ul>
                        <li>Check your spelling</li>
                        <li>Use different keywords</li>
                        <li>Remove some filters</li>
                        <li>Try broader search terms</li>
                    </ul>
                </div>
                ${this.getRelatedSearches(query)}
            </div>
        `;
    }
    
    getRelatedSearches(query) {
        // Generate related search suggestions
        const related = this.generateRelatedSearches(query);
        
        if (related.length === 0) return '';
        
        return `
            <div class="related-searches">
                <h4>Related searches:</h4>
                <div class="related-list">
                    ${related.map(term => 
                        `<button class="related-search-btn" onclick="advancedSearch.performSearch('${term}')">${term}</button>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    generateRelatedSearches(query) {
        // Simple related search generation
        const commonTerms = ['amateur', 'professional', 'vintage', 'new', 'popular'];
        const related = [];
        
        commonTerms.forEach(term => {
            if (!query.toLowerCase().includes(term)) {
                related.push(`${query} ${term}`);
            }
        });
        
        return related.slice(0, 5);
    }
    
    setupResultInteractions() {
        // Play button clicks
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const videoId = e.target.closest('.play-btn').dataset.videoId;
                this.playVideo(videoId);
            });
        });
        
        // Add to playlist clicks
        document.querySelectorAll('.add-to-playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const videoId = e.target.closest('.add-to-playlist-btn').dataset.videoId;
                this.showAddToPlaylistModal(videoId);
            });
        });
        
        // Result item clicks
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const videoId = item.dataset.videoId;
                    this.playVideo(videoId);
                }
            });
        });
    }
    
    playVideo(videoId) {
        window.location.href = `/pages/watch/video.html?id=${videoId}&ref=search`;
    }
    
    // Search history management
    
    addToSearchHistory(query) {
        const historyEntry = {
            query: query,
            timestamp: new Date().toISOString(),
            filters: { ...this.filters }
        };
        
        // Remove existing entry for this query
        this.searchHistory = this.searchHistory.filter(entry => entry.query !== query);
        
        // Add to beginning
        this.searchHistory.unshift(historyEntry);
        
        // Limit history size
        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }
        
        this.saveSearchHistory();
    }
    
    loadSearchHistory() {
        try {
            const stored = localStorage.getItem('search_history');
            if (stored) {
                this.searchHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
            this.searchHistory = [];
        }
    }
    
    saveSearchHistory() {
        try {
            localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }
    
    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('search_history');
        
        // Update UI if history is displayed
        this.updateSearchHistoryUI();
    }
    
    updateSearchHistoryUI() {
        const historyContainer = document.getElementById('search-history');
        if (!historyContainer) return;
        
        if (this.searchHistory.length === 0) {
            historyContainer.innerHTML = '<p class="no-history">No search history</p>';
            return;
        }
        
        const historyHTML = this.searchHistory.slice(0, 10).map(entry => `
            <div class="history-item" data-query="${entry.query}">
                <div class="history-query">${entry.query}</div>
                <div class="history-date">${this.formatDate(entry.timestamp)}</div>
                <button class="history-remove" onclick="advancedSearch.removeFromHistory('${entry.query}')">×</button>
            </div>
        `).join('');
        
        historyContainer.innerHTML = historyHTML;
        
        // Add click handlers
        historyContainer.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-remove')) {
                    const query = item.dataset.query;
                    document.getElementById('search-input').value = query;
                    this.performSearch(query);
                }
            });
        });
    }
    
    removeFromHistory(query) {
        this.searchHistory = this.searchHistory.filter(entry => entry.query !== query);
        this.saveSearchHistory();
        this.updateSearchHistoryUI();
    }
    
    // Advanced search features
    
    toggleAdvancedSearch() {
        const advancedPanel = document.getElementById('advanced-search-panel');
        const toggle = document.getElementById('advanced-search-toggle');
        
        if (advancedPanel && toggle) {
            const isVisible = !advancedPanel.classList.contains('hidden');
            
            if (isVisible) {
                advancedPanel.classList.add('hidden');
                toggle.textContent = 'Show Advanced';
            } else {
                advancedPanel.classList.remove('hidden');
                toggle.textContent = 'Hide Advanced';
            }
        }
    }
    
    showVoiceSearchIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'voice-search-indicator';
        indicator.innerHTML = `
            <div class="voice-animation">
                <div class="voice-wave"></div>
                <div class="voice-wave"></div>
                <div class="voice-wave"></div>
            </div>
            <p>Listening...</p>
        `;
        
        document.body.appendChild(indicator);
    }
    
    hideVoiceSearchIndicator() {
        const indicator = document.querySelector('.voice-search-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showSearchLoading() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-loading">
                    <div class="loading-spinner"></div>
                    <p>Searching...</p>
                </div>
            `;
        }
    }
    
    hideSearchLoading() {
        // Loading will be replaced by results
    }
    
    showSearchError(message) {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-error">
                    <div class="error-icon">⚠️</div>
                    <h3>Search Error</h3>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="location.reload()">Try Again</button>
                </div>
            `;
        }
    }
    
    showAddToPlaylistModal(videoId) {
        if (window.playlistManager) {
            window.playlistManager.showAddToPlaylistModal(videoId);
        }
    }
    
    // Utility methods
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        
        return `${Math.ceil(diffDays / 365)} years ago`;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
    
    // API methods
    
    async fetchAllVideos() {
        try {
            // Mock API call - replace with actual implementation
            const response = await fetch('/api/videos/all');
            if (response.ok) {
                return await response.json();
            }
            
            // Fallback to sample data
            return this.getSampleVideos();
            
        } catch (error) {
            console.error('Error fetching videos:', error);
            return this.getSampleVideos();
        }
    }
    
    getSampleVideos() {
        // Sample data for testing
        return [
            {
                id: '1',
                title: 'Sample Video 1',
                description: 'This is a sample video description',
                category: 'Amateur',
                tags: ['sample', 'test', 'demo'],
                duration: 1200,
                rating: 4.5,
                upload_date: '2024-01-15',
                quality: '1080p',
                view_count: 1000,
                uploader: { name: 'Test User', verified: true },
                is_premium: false
            }
            // Add more sample videos as needed
        ];
    }
    
    trackSearch(query, resultCount) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackAction('search_performed', {
                query: query,
                resultCount: resultCount,
                filters: this.filters,
                searchMode: this.searchMode
            });
        }
    }
    
    // Public API
    
    getCurrentQuery() {
        return this.currentQuery;
    }
    
    getCurrentResults() {
        return this.currentResults;
    }
    
    getSearchHistory() {
        return [...this.searchHistory];
    }
    
    setSearchMode(mode) {
        this.searchMode = mode;
    }
    
    // Cleanup
    
    destroy() {
        this.saveSearchHistory();
        this.searchIndex.clear();
        this.currentResults = [];
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        console.log('🔍 Advanced Search Engine destroyed');
    }
}

// Global search engine instance
window.advancedSearch = new AdvancedSearchEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedSearchEngine;
}
