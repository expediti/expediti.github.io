/**
 * Enhanced JavaScript functionality for Xshiver Video Platform
 * Handles navigation, search, and all interactive features
 */

class XshiverApp {
    constructor() {
        this.currentSection = 'home';
        this.mobileMenuOpen = false;
        this.searchHistory = JSON.parse(localStorage.getItem('xshiver_search_history') || '[]');
        this.searchResults = [];
        this.isSearching = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeComponents();
        this.setupSearchDatabase();
        
        // Listen for age verification completion
        document.addEventListener('xshiverAgeVerified', () => {
            this.onAgeVerified();
        });
    }

    setupSearchDatabase() {
        // Enhanced mock database for realistic search results
        this.videoDatabase = [
            {
                id: 1,
                title: 'Amazing Amateur Performance',
                category: 'amateur',
                tags: ['amateur', 'performance', 'hot'],
                duration: '12:34',
                quality: 'HD',
                views: '125K',
                rating: '4.8',
                thumbnail: 'thumb1.jpg'
            },
            {
                id: 2,
                title: 'Professional Studio Production',
                category: 'professional',
                tags: ['professional', 'studio', 'quality'],
                duration: '18:42',
                quality: '4K',
                views: '89K',
                rating: '4.9',
                thumbnail: 'thumb2.jpg'
            },
            {
                id: 3,
                title: 'Hot MILF Content',
                category: 'milf',
                tags: ['milf', 'mature', 'experienced'],
                duration: '15:28',
                quality: 'HD',
                views: '156K',
                rating: '4.7',
                thumbnail: 'thumb3.jpg'
            },
            {
                id: 4,
                title: 'Teen (18+) Exclusive',
                category: 'teen',
                tags: ['teen', '18+', 'young', 'exclusive'],
                duration: '22:15',
                quality: '4K',
                views: '203K',
                rating: '4.9',
                thumbnail: 'thumb4.jpg'
            },
            {
                id: 5,
                title: 'Hardcore Action',
                category: 'hardcore',
                tags: ['hardcore', 'intense', 'action'],
                duration: '25:33',
                quality: '4K',
                views: '178K',
                rating: '4.6',
                thumbnail: 'thumb5.jpg'
            },
            {
                id: 6,
                title: 'Lesbian Romance',
                category: 'lesbian',
                tags: ['lesbian', 'romance', 'intimate'],
                duration: '19:45',
                quality: 'HD',
                views: '134K',
                rating: '4.8',
                thumbnail: 'thumb6.jpg'
            }
        ];
    }

    bindEvents() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Enhanced search functionality
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            
            // Enhanced search suggestions with debouncing
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearchInput(e.target.value);
                }, 300);
            });

            // Focus and blur events for search
            searchInput.addEventListener('focus', () => {
                this.showSearchHistory();
            });

            searchInput.addEventListener('blur', (e) => {
                // Delay hiding to allow clicking on suggestions
                setTimeout(() => {
                    if (!e.relatedTarget?.closest('.search-suggestions')) {
                        this.hideSearchSuggestions();
                    }
                }, 150);
            });
        }

        // Navigation links
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.navigateToSection(target);
            });
        });

        // Category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.getAttribute('data-category');
                this.openCategory(category);
            });
        });

        // Enhanced keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window events
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Click outside to close search suggestions
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-search')) {
                this.hideSearchSuggestions();
            }
        });
    }

    initializeComponents() {
        this.initializePlaceholderVideos();
        this.setupIntersectionObserver();
        this.initializeTooltips();
        this.createSearchResultsContainer();
    }

    createSearchResultsContainer() {
        // Create a container for search results if it doesn't exist
        if (!document.getElementById('search-results-section')) {
            const searchSection = document.createElement('section');
            searchSection.id = 'search-results-section';
            searchSection.className = 'search-results-section';
            searchSection.style.display = 'none';
            searchSection.innerHTML = `
                <div class="container">
                    <div class="search-results-header">
                        <h2 class="section-title">Search Results</h2>
                        <button class="close-search-btn" onclick="window.xshiverApp.closeSearchResults()">✕</button>
                    </div>
                    <div id="search-results-grid" class="video-grid">
                        <!-- Search results will be populated here -->
                    </div>
                    <div id="no-results" class="no-results" style="display: none;">
                        <h3>No results found</h3>
                        <p>Try adjusting your search terms or browse our categories.</p>
                    </div>
                </div>
            `;
            
            // Insert after trending section
            const trendingSection = document.getElementById('trending');
            if (trendingSection) {
                trendingSection.parentNode.insertBefore(searchSection, trendingSection.nextSibling);
            }
        }
    }

    performSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        const query = searchInput.value.trim();
        if (!query) {
            this.showNotification('Please enter a search term', 'warning');
            return;
        }

        if (this.isSearching) return;

        console.log('🔍 Searching for:', query);
        this.isSearching = true;
        
        // Show search loading
        this.showSearchLoading();
        
        // Hide suggestions
        this.hideSearchSuggestions();
        
        // Simulate API call delay
        setTimeout(() => {
            this.executeSearch(query);
        }, 800);
        
        // Add to search history
        this.addToSearchHistory(query);
    }

    executeSearch(query) {
        // Enhanced search algorithm
        const results = this.videoDatabase.filter(video => {
            const searchTerm = query.toLowerCase();
            return (
                video.title.toLowerCase().includes(searchTerm) ||
                video.category.toLowerCase().includes(searchTerm) ||
                video.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        });

        this.searchResults = results;
        this.displaySearchResults(query, results);
        this.isSearching = false;
    }

    displaySearchResults(query, results) {
        const searchSection = document.getElementById('search-results-section');
        const resultsGrid = document.getElementById('search-results-grid');
        const noResults = document.getElementById('no-results');
        const searchTitle = searchSection.querySelector('.section-title');

        if (!searchSection || !resultsGrid) return;

        // Update title
        searchTitle.textContent = `Search Results for "${query}" (${results.length})`;

        // Show search section
        searchSection.style.display = 'block';
        searchSection.scrollIntoView({ behavior: 'smooth' });

        if (results.length === 0) {
            resultsGrid.style.display = 'none';
            noResults.style.display = 'block';
        } else {
            resultsGrid.style.display = 'grid';
            noResults.style.display = 'none';
            
            // Clear previous results
            resultsGrid.innerHTML = '';
            
            // Create video cards for results
            results.forEach((video, index) => {
                const videoCard = this.createVideoCard(video);
                resultsGrid.appendChild(videoCard);
                
                // Animate in with delay
                setTimeout(() => {
                    videoCard.style.animation = 'slideInUp 0.5s ease forwards';
                }, index * 100);
            });
        }

        // Hide loading
        this.hideSearchLoading();
        
        this.showNotification(`Found ${results.length} results for "${query}"`, 'success');
    }

    closeSearchResults() {
        const searchSection = document.getElementById('search-results-section');
        if (searchSection) {
            searchSection.style.display = 'none';
        }
        
        // Clear search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    handleSearchInput(value) {
        if (value.length === 0) {
            this.showSearchHistory();
            return;
        }

        if (value.length > 1) {
            this.showSearchSuggestions(value);
        } else {
            this.hideSearchSuggestions();
        }
    }

    showSearchSuggestions(query) {
        // Get suggestions from video database
        const suggestions = new Set();
        
        // Add matching titles and categories
        this.videoDatabase.forEach(video => {
            if (video.title.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(video.title);
            }
            if (video.category.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(video.category);
            }
            video.tags.forEach(tag => {
                if (tag.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(tag);
                }
            });
        });

        // Convert to array and limit
        const suggestionArray = Array.from(suggestions).slice(0, 6);

        this.renderSuggestions(suggestionArray, 'suggestions');
    }

    showSearchHistory() {
        if (this.searchHistory.length > 0) {
            this.renderSuggestions(this.searchHistory.slice(0, 5), 'history');
        }
    }

    renderSuggestions(items, type) {
        let suggestionsEl = document.getElementById('search-suggestions');
        if (!suggestionsEl) {
            suggestionsEl = document.createElement('div');
            suggestionsEl.id = 'search-suggestions';
            suggestionsEl.className = 'search-suggestions';
            
            const searchContainer = document.querySelector('.nav-search');
            if (searchContainer) {
                searchContainer.appendChild(suggestionsEl);
            }
        }

        if (items.length > 0) {
            const header = type === 'history' ? '<div class="suggestion-header">Recent Searches</div>' : '';
            const icon = type === 'history' ? '🕒' : '🔍';
            
            suggestionsEl.innerHTML = header + items
                .map(item => `
                    <div class="suggestion-item" onclick="selectSuggestion('${item.replace(/'/g, "\\'")}')">
                        <span class="suggestion-icon">${icon}</span>
                        <span class="suggestion-text">${item}</span>
                        ${type === 'history' ? '<span class="remove-history" onclick="event.stopPropagation(); window.xshiverApp.removeFromHistory(\'' + item.replace(/'/g, "\\'") + '\')">✕</span>' : ''}
                    </div>
                `).join('');
            suggestionsEl.style.display = 'block';
        } else {
            suggestionsEl.style.display = 'none';
        }
    }

    hideSearchSuggestions() {
        const suggestionsEl = document.getElementById('search-suggestions');
        if (suggestionsEl) {
            suggestionsEl.style.display = 'none';
        }
    }

    removeFromHistory(query) {
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        localStorage.setItem('xshiver_search_history', JSON.stringify(this.searchHistory));
        
        // Refresh suggestions if showing history
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.value === '') {
            this.showSearchHistory();
        }
    }

    showSearchLoading() {
        // Create or update loading indicator
        let loadingEl = document.getElementById('search-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'search-loading';
            loadingEl.className = 'search-loading-overlay';
            loadingEl.innerHTML = `
                <div class="search-loading-content">
                    <div class="loading-spinner"></div>
                    <p>Searching videos...</p>
                </div>
            `;
            document.body.appendChild(loadingEl);
        }
        
        loadingEl.style.display = 'flex';
        setTimeout(() => loadingEl.classList.add('show'), 10);
    }

    hideSearchLoading() {
        const loadingEl = document.getElementById('search-loading');
        if (loadingEl) {
            loadingEl.classList.remove('show');
            setTimeout(() => {
                loadingEl.style.display = 'none';
            }, 300);
        }
    }

    addToSearchHistory(query) {
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        
        // Add to beginning
        this.searchHistory.unshift(query);
        
        // Keep only last 10 searches
        if (this.searchHistory.length > 10) {
            this.searchHistory.splice(10);
        }
        
        localStorage.setItem('xshiver_search_history', JSON.stringify(this.searchHistory));
    }

    // Keep all your existing methods (toggleMobileMenu, navigateToSection, etc.)
    toggleMobileMenu() {
        const mobileNav = document.getElementById('mobile-nav');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        
        if (mobileNav && mobileMenuBtn) {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            
            if (this.mobileMenuOpen) {
                mobileNav.classList.remove('hidden');
                mobileMenuBtn.classList.add('active');
                
                const spans = mobileMenuBtn.querySelectorAll('span');
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                mobileNav.classList.add('hidden');
                mobileMenuBtn.classList.remove('active');
                
                const spans = mobileMenuBtn.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        }
    }

    navigateToSection(sectionId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelector(`[href="#${sectionId}"]`)?.classList.add('active');
        
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        
        this.currentSection = sectionId;
        
        if (this.mobileMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    openCategory(category) {
        console.log('📂 Opening category:', category);
        
        // Perform category search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = category;
            this.performSearch();
        }
        
        this.showNotification(`Browsing ${category} videos...`, 'info');
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.style.opacity = '0';
        card.innerHTML = `
            <div class="video-thumbnail">
                <div class="thumbnail-placeholder" style="
                    background: linear-gradient(45deg, var(--deep-navy), var(--xshiver-secondary));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--xshiver-blue);
                    font-size: 2rem;
                ">▶️</div>
                <div class="video-duration">${video.duration}</div>
                <div class="video-quality">${video.quality}</div>
                <div class="video-overlay">
                    <div class="play-button">▶</div>
                </div>
            </div>
            <div class="video-info">
                <h4 class="video-title">${video.title}</h4>
                <div class="video-stats">
                    <span class="views">${video.views} views</span>
                    <span class="rating">★ ${video.rating}</span>
                </div>
                <div class="video-tags">
                    ${video.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.playVideo(video);
        });
        
        return card;
    }

    playVideo(video) {
        console.log('▶️ Playing video:', video.title);
        this.showNotification(`Playing: ${video.title}`, 'success');
    }

    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key) {
            case '/':
                e.preventDefault();
                document.getElementById('search-input')?.focus();
                break;
            case 'h':
                this.navigateToSection('home');
                break;
            case 'c':
                this.navigateToSection('categories');
                break;
            case 't':
                this.navigateToSection('trending');
                break;
            case 'Escape':
                this.hideSearchSuggestions();
                if (this.mobileMenuOpen) {
                    this.toggleMobileMenu();
                }
                break;
        }
    }

    handleResize() {
        if (window.innerWidth > 768 && this.mobileMenuOpen) {
            this.toggleMobileMenu();
        }
        this.recalculateLayout();
    }

    handleScroll() {
        const header = document.querySelector('.site-header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(15, 15, 26, 0.95)';
                header.style.backdropFilter = 'blur(20px)';
            } else {
                header.style.background = 'linear-gradient(135deg, var(--xshiver-dark), var(--deep-navy))';
                header.style.backdropFilter = 'blur(10px)';
            }
        }
        this.updateActiveSection();
    }

    updateActiveSection() {
        const sections = ['home', 'categories', 'trending'];
        const currentSection = sections.find(section => {
            const element = document.getElementById(section);
            if (element) {
                const rect = element.getBoundingClientRect();
                return rect.top <= 100 && rect.bottom > 100;
            }
            return false;
        });
        
        if (currentSection && currentSection !== this.currentSection) {
            this.currentSection = currentSection;
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[href="#${currentSection}"]`)?.classList.add('active');
        }
    }

    // Keep all other existing methods...
    initializePlaceholderVideos() {
        document.querySelectorAll('.video-card.placeholder').forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'slideInUp 0.5s ease forwards';
            }, index * 100);
        });
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        document.querySelectorAll('.category-card, .video-card, .section-title').forEach(el => {
            observer.observe(el);
        });
    }

    initializeTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 0.9rem;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.2s ease;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        }, 10);
        
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    onAgeVerified() {
        console.log('🎬 Age verification completed, initializing full functionality...');
        this.loadTrendingVideos();
        this.initializeAdvancedFeatures();
        this.showWelcomeAnimation();
    }

    loadTrendingVideos() {
        console.log('📈 Loading trending videos...');
        
        const trendingContainer = document.getElementById('trending-videos');
        if (trendingContainer) {
            trendingContainer.innerHTML = '';
            
            const trendingVideos = this.videoDatabase.slice(0, 4);
            
            trendingVideos.forEach((video, index) => {
                const videoCard = this.createVideoCard(video);
                trendingContainer.appendChild(videoCard);
                
                setTimeout(() => {
                    videoCard.style.animation = 'slideInUp 0.5s ease forwards';
                }, index * 100);
            });
        }
    }

    initializeAdvancedFeatures() {
        console.log('🚀 Initializing advanced features...');
        this.setupAdvancedSearch();
        this.initRecommendations();
        this.setupAnalytics();
    }

    setupAdvancedSearch() {
        const searchFilters = {
            duration: ['short', 'medium', 'long'],
            quality: ['480p', '720p', '1080p', '4k'],
            category: ['amateur', 'professional', 'milf', 'teen']
        };
        
        console.log('🔍 Advanced search initialized with filters:', searchFilters);
    }

    initRecommendations() {
        const userPreferences = JSON.parse(localStorage.getItem('xshiver_preferences') || '{}');
        console.log('🎯 Recommendations initialized for preferences:', userPreferences);
    }

    setupAnalytics() {
        const sessionData = {
            sessionId: this.generateSessionId(),
            startTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`
        };
        
        sessionStorage.setItem('xshiver_session', JSON.stringify(sessionData));
        console.log('📊 Analytics session started:', sessionData.sessionId);
    }

    generateSessionId() {
        return 'xs_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    showWelcomeAnimation() {
        const welcome = document.createElement('div');
        welcome.className = 'welcome-overlay';
        welcome.innerHTML = `
            <div class="welcome-content">
                <img src="assets/images/logo-xshiver.png" alt="Xshiver" class="welcome-logo">
                <h2>Welcome to Xshiver</h2>
                <p>Your premium adult entertainment destination</p>
            </div>
        `;
        
        welcome.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(15, 15, 26, 0.95), rgba(0, 0, 0, 0.9));
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5000;
            opacity: 0;
            transition: all 0.5s ease;
        `;
        
        document.body.appendChild(welcome);
        
        setTimeout(() => {
            welcome.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            welcome.style.opacity = '0';
            setTimeout(() => {
                welcome.remove();
            }, 500);
        }, 2000);
    }

    recalculateLayout() {
        console.log('📐 Recalculating layout for:', window.innerWidth + 'x' + window.innerHeight);
    }

    showNotification(message, type = 'info') {
        if (window.ageVerification) {
            window.ageVerification.showNotification(message, type);
        }
    }
}

// Global functions
function scrollToSection(sectionId) {
    if (window.xshiverApp) {
        window.xshiverApp.navigateToSection(sectionId);
    }
}

function showAllCategories() {
    console.log('📂 Showing all categories...');
    if (window.xshiverApp) {
        window.xshiverApp.showNotification('Loading all categories...', 'info');
    }
}

function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = suggestion;
        if (window.xshiverApp) {
            window.xshiverApp.performSearch();
            window.xshiverApp.hideSearchSuggestions();
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.xshiverApp = new XshiverApp();
});

// Enhanced CSS styles
const appStyles = document.createElement('style');
appStyles.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: slideInUp 0.6s ease forwards;
    }
    
    .search-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--xshiver-secondary);
        border: 1px solid var(--xshiver-blue);
        border-top: none;
        border-radius: 0 0 8px 8px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .suggestion-header {
        padding: 8px 15px;
        font-size: 0.85rem;
        color: var(--xshiver-accent);
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .suggestion-item {
        padding: 12px 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .suggestion-item:hover {
        background-color: rgba(74, 144, 226, 0.2);
    }
    
    .suggestion-item:last-child {
        border-bottom: none;
    }
    
    .suggestion-icon {
        opacity: 0.7;
        font-size: 0.9rem;
    }
    
    .suggestion-text {
        flex: 1;
    }
    
    .remove-history {
        opacity: 0.5;
        padding: 2px 6px;
        border-radius: 50%;
        transition: all 0.2s ease;
    }
    
    .remove-history:hover {
        opacity: 1;
        background: rgba(255, 0, 0, 0.2);
    }
    
    .search-results-section {
        padding: 60px 0;
        background: linear-gradient(135deg, var(--deep-navy), var(--xshiver-dark));
        min-height: 50vh;
    }
    
    .search-results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }
    
    .close-search-btn {
        background: var(--xshiver-secondary);
        border: 1px solid var(--xshiver-blue);
        color: var(--silver-text);
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .close-search-btn:hover {
        background: var(--xshiver-blue);
        color: white;
    }
    
    .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 25px;
        padding: 20px 0;
    }
    
    .video-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .video-card:hover .video-overlay {
        opacity: 1;
    }
    
    .play-button {
        width: 60px;
        height: 60px;
        background: var(--xshiver-blue);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
        transform: scale(0.8);
        transition: all 0.3s ease;
    }
    
    .video-card:hover .play-button {
        transform: scale(1);
    }
    
    .video-tags {
        margin-top: 8px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    
    .tag {
        background: rgba(74, 144, 226, 0.2);
        color: var(--xshiver-blue);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        border: 1px solid rgba(74, 144, 226, 0.3);
    }
    
    .no-results {
        text-align: center;
        padding: 60px 20px;
        color: var(--silver-text);
    }
    
    .no-results h3 {
        color: var(--xshiver-blue);
        margin-bottom: 15px;
        font-size: 1.5rem;
    }
    
    .search-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .search-loading-overlay.show {
        opacity: 1;
    }
    
    .search-loading-content {
        text-align: center;
        color: var(--silver-text);
    }
    
    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(74, 144, 226, 0.3);
        border-top: 4px solid var(--xshiver-blue);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    /* Keep all existing styles for welcome animation, tooltips etc. */
    .welcome-content {
        text-align: center;
        color: var(--silver-text);
    }
    
    .welcome-logo {
        width: 100px;
        height: auto;
        margin-bottom: 20px;
        filter: drop-shadow(0 0 30px var(--xshiver-blue));
    }
    
    .welcome-content h2 {
        font-size: 2.5rem;
        color: var(--xshiver-blue);
        margin-bottom: 10px;
    }
    
    .welcome-content p {
        font-size: 1.2rem;
        color: var(--xshiver-accent);
    }
    
    @media (max-width: 768px) {
        .video-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .search-results-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
        }
    }
`;
document.head.appendChild(appStyles);
