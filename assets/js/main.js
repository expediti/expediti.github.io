/**
 * Main JavaScript functionality for Xshiver Video Platform
 * Handles navigation, search, and basic interactions
 */

class XshiverApp {
    constructor() {
        this.currentSection = 'home';
        this.mobileMenuOpen = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeComponents();
        
        // Listen for age verification completion
        document.addEventListener('xshiverAgeVerified', () => {
            this.onAgeVerified();
        });
    }

    bindEvents() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Search functionality
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
            
            // Search suggestions (basic implementation)
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
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

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Scroll handling for header
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    initializeComponents() {
        // Initialize any component that needs setup
        this.initializePlaceholderVideos();
        this.setupIntersectionObserver();
        this.initializeTooltips();
    }

    onAgeVerified() {
        console.log('🎬 Age verification completed, initializing full functionality...');
        
        // Load trending videos
        this.loadTrendingVideos();
        
        // Initialize advanced features
        this.initializeAdvancedFeatures();
        
        // Show welcome animation
        this.showWelcomeAnimation();
    }

    toggleMobileMenu() {
        const mobileNav = document.getElementById('mobile-nav');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        
        if (mobileNav && mobileMenuBtn) {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            
            if (this.mobileMenuOpen) {
                mobileNav.classList.remove('hidden');
                mobileMenuBtn.classList.add('active');
                
                // Animate menu button
                const spans = mobileMenuBtn.querySelectorAll('span');
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                mobileNav.classList.add('hidden');
                mobileMenuBtn.classList.remove('active');
                
                // Reset menu button
                const spans = mobileMenuBtn.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        }
    }

    performSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            const query = searchInput.value.trim();
            if (query) {
                console.log('🔍 Searching for:', query);
                
                // Show search loading
                this.showSearchLoading();
                
                // In a real app, this would make an API call
                setTimeout(() => {
                    this.displaySearchResults(query);
                }, 1000);
                
                // Add to search history
                this.addToSearchHistory(query);
            }
        }
    }

    handleSearchInput(value) {
        if (value.length > 2) {
            // Show search suggestions
            this.showSearchSuggestions(value);
        } else {
            this.hideSearchSuggestions();
        }
    }

    showSearchSuggestions(query) {
        // Mock search suggestions based on categories
        const suggestions = [
            'amateur videos',
            'professional content',
            'milf videos',
            'teen 18+ content',
            'hardcore videos',
            'lesbian content'
        ].filter(suggestion => 
            suggestion.toLowerCase().includes(query.toLowerCase())
        );

        // Create suggestions dropdown (basic implementation)
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

        if (suggestions.length > 0) {
            suggestionsEl.innerHTML = suggestions
                .slice(0, 5)
                .map(suggestion => `
                    <div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">
                        ${suggestion}
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

    navigateToSection(sectionId) {
        // Update active navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelector(`[href="#${sectionId}"]`)?.classList.add('active');
        
        // Scroll to section
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        
        this.currentSection = sectionId;
        
        // Close mobile menu if open
        if (this.mobileMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    openCategory(category) {
        console.log('📂 Opening category:', category);
        
        // In a real app, this would navigate to category page
        // For now, show a notification
        this.showNotification(`Opening ${category} category...`, 'info');
        
        // Simulate navigation delay
        setTimeout(() => {
            // This would typically be: window.location.href = `pages/categories/${category}.html`;
            console.log(`Would navigate to: pages/categories/${category}.html`);
        }, 500);
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not in input fields
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
        // Handle responsive changes
        if (window.innerWidth > 768 && this.mobileMenuOpen) {
            this.toggleMobileMenu();
        }
        
        // Recalculate any layout-dependent features
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
        
        // Update active section based on scroll position
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
            
            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[href="#${currentSection}"]`)?.classList.add('active');
        }
    }

    initializePlaceholderVideos() {
        // Add some animation to placeholder cards
        document.querySelectorAll('.video-card.placeholder').forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'slideInUp 0.5s ease forwards';
            }, index * 100);
        });
    }

    setupIntersectionObserver() {
        // Set up intersection observer for lazy loading and animations
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
        
        // Observe elements that should animate on scroll
        document.querySelectorAll('.category-card, .video-card, .section-title').forEach(el => {
            observer.observe(el);
        });
    }

    initializeTooltips() {
        // Simple tooltip system
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

    loadTrendingVideos() {
        // Simulate loading trending videos
        console.log('📈 Loading trending videos...');
        
        const trendingContainer = document.getElementById('trending-videos');
        if (trendingContainer) {
            // Remove placeholder cards
            trendingContainer.innerHTML = '';
            
            // Mock trending videos data
            const trendingVideos = [
                {
                    id: 1,
                    title: 'Amazing Amateur Performance',
                    duration: '12:34',
                    quality: 'HD',
                    views: '125K',
                    rating: '4.8'
                },
                {
                    id: 2,
                    title: 'Professional Studio Production',
                    duration: '18:42',
                    quality: '4K',
                    views: '89K',
                    rating: '4.9'
                },
                {
                    id: 3,
                    title: 'Hot MILF Content',
                    duration: '15:28',
                    quality: 'HD',
                    views: '156K',
                    rating: '4.7'
                },
                {
                    id: 4,
                    title: 'Teen (18+) Exclusive',
                    duration: '22:15',
                    quality: '4K',
                    views: '203K',
                    rating: '4.9'
                }
            ];
            
            // Create video cards
            trendingVideos.forEach((video, index) => {
                const videoCard = this.createVideoCard(video);
                trendingContainer.appendChild(videoCard);
                
                // Animate in
                setTimeout(() => {
                    videoCard.style.animation = 'slideInUp 0.5s ease forwards';
                }, index * 100);
            });
        }
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
            </div>
            <div class="video-info">
                <h4 class="video-title">${video.title}</h4>
                <div class="video-stats">
                    <span class="views">${video.views} views</span>
                    <span class="rating">★ ${video.rating}</span>
                </div>
            </div>
        `;
        
        // Add click handler
        card.addEventListener('click', () => {
            this.playVideo(video);
        });
        
        return card;
    }

    playVideo(video) {
        console.log('▶️ Playing video:', video.title);
        this.showNotification(`Playing: ${video.title}`, 'success');
        
        // In a real app, this would navigate to video player
        // window.location.href = `pages/watch/video.html?id=${video.id}`;
    }

    initializeAdvancedFeatures() {
        // Initialize features that require age verification
        console.log('🚀 Initializing advanced features...');
        
        // Setup advanced search
        this.setupAdvancedSearch();
        
        // Initialize recommendation engine
        this.initRecommendations();
        
        // Setup analytics
        this.setupAnalytics();
    }

    setupAdvancedSearch() {
        // Advanced search functionality
        const searchFilters = {
            duration: ['short', 'medium', 'long'],
            quality: ['480p', '720p', '1080p', '4k'],
            category: ['amateur', 'professional', 'milf', 'teen']
        };
        
        console.log('🔍 Advanced search initialized with filters:', searchFilters);
    }

    initRecommendations() {
        // Simple recommendation system based on viewed categories
        const userPreferences = JSON.parse(localStorage.getItem('xshiver_preferences') || '{}');
        console.log('🎯 Recommendations initialized for preferences:', userPreferences);
    }

    setupAnalytics() {
        // Basic analytics tracking
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
        // Create welcome overlay
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

    showSearchLoading() {
        const loadingEl = document.createElement('div');
        loadingEl.id = 'search-loading';
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Searching...</p>
        `;
        
        // Add to search results area
        console.log('🔄 Search loading...');
    }

    displaySearchResults(query) {
        console.log('📋 Displaying results for:', query);
        this.showNotification(`Found results for "${query}"`, 'success');
    }

    addToSearchHistory(query) {
        const history = JSON.parse(localStorage.getItem('xshiver_search_history') || '[]');
        history.unshift(query);
        
        // Keep only last 20 searches
        if (history.length > 20) {
            history.splice(20);
        }
        
        localStorage.setItem('xshiver_search_history', JSON.stringify(history));
    }

    recalculateLayout() {
        // Handle any layout calculations on resize
        console.log('📐 Recalculating layout for:', window.innerWidth + 'x' + window.innerHeight);
    }

    showNotification(message, type = 'info') {
        // Use the notification system from age verification
        if (window.ageVerification) {
            window.ageVerification.showNotification(message, type);
        }
    }
}

// Global functions for HTML onclick handlers
function scrollToSection(sectionId) {
    if (window.xshiverApp) {
        window.xshiverApp.navigateToSection(sectionId);
    }
}

function showAllCategories() {
    console.log('📂 Showing all categories...');
    // In a real app, this would navigate to categories page
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.xshiverApp = new XshiverApp();
});

// Add CSS animations
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
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
    }
    
    .suggestion-item {
        padding: 10px 15px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .suggestion-item:hover {
        background-color: rgba(74, 144, 226, 0.2);
    }
    
    .suggestion-item:last-child {
        border-bottom: none;
    }
    
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
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(74, 144, 226, 0.3);
        border-top: 4px solid var(--xshiver-blue);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(appStyles);
