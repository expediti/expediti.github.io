// Sample video data
const sampleVideos = [
    {
        id: 1,
        title: "Amazing Nature Documentary - Wildlife Adventures",
        views: "2.1M",
        date: "3 days ago",
        duration: "15:32",
        category: "education",
        description: "Explore the wonders of nature in this breathtaking documentary."
    },
    {
        id: 2,
        title: "Epic Gaming Moments Compilation 2024",
        views: "890K",
        date: "1 day ago",
        duration: "8:45",
        category: "gaming",
        description: "The best gaming moments from top streamers this year."
    },
    {
        id: 3,
        title: "Latest Tech Reviews - Smartphones & Gadgets",
        views: "1.5M",
        date: "5 days ago",
        duration: "12:18",
        category: "tech",
        description: "Comprehensive reviews of the latest technology releases."
    },
    {
        id: 4,
        title: "Top Music Hits This Week - Chart Toppers",
        views: "3.2M",
        date: "2 days ago",
        duration: "25:07",
        category: "music",
        description: "The hottest music tracks dominating the charts right now."
    },
    {
        id: 5,
        title: "Comedy Sketch Collection - Laugh Out Loud",
        views: "756K",
        date: "4 days ago",
        duration: "18:22",
        category: "entertainment",
        description: "Hilarious comedy sketches that will make your day."
    },
    {
        id: 6,
        title: "Trending Dance Challenge - Viral Moves",
        views: "4.8M",
        date: "1 day ago",
        duration: "3:45",
        category: "trending",
        description: "The latest dance craze taking social media by storm."
    },
    {
        id: 7,
        title: "Cooking Masterclass - Professional Techniques",
        views: "1.1M",
        date: "6 days ago",
        duration: "22:15",
        category: "education",
        description: "Learn professional cooking techniques from master chefs."
    },
    {
        id: 8,
        title: "Sports Highlights - Championship Moments",
        views: "2.7M",
        date: "2 days ago",
        duration: "14:38",
        category: "entertainment",
        description: "The most exciting moments from recent sports championships."
    },
    {
        id: 9,
        title: "DIY Home Projects - Creative Ideas",
        views: "965K",
        date: "1 week ago",
        duration: "19:45",
        category: "education",
        description: "Transform your home with these creative DIY projects."
    },
    {
        id: 10,
        title: "Electronic Music Festival Highlights",
        views: "1.8M",
        date: "3 days ago",
        duration: "32:12",
        category: "music",
        description: "Experience the energy of the biggest electronic music festival."
    }
];

// DOM elements
const homePage = document.getElementById('homepage');
const videoPlayerPage = document.getElementById('video-player-page');
const trendingGrid = document.getElementById('trending-grid');
const recentGrid = document.getElementById('recent-grid');
const suggestionsGrid = document.getElementById('suggestions-grid');
const categoryBtns = document.querySelectorAll('.category-btn');
const searchBox = document.querySelector('.search-box');
const searchBtn = document.querySelector('.search-btn');
const loading = document.getElementById('loading');

// Current state
let currentCategory = 'all';
let currentVideo = null;
let searchQuery = '';

// Initialize the app
function init() {
    loadVideos();
    setupEventListeners();
    addSmoothScrolling();
    addParallaxEffect();
}

// Setup event listeners
function setupEventListeners() {
    // Category buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            if (category) {
                selectCategory(category);
            }
        });
    });

    // Search functionality
    searchBtn.addEventListener('click', performSearch);
    searchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Clear search when clicking logo
    const logo = document.querySelector('.logo');
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        clearSearch();
        showHomepage();
    });

    // Navigation links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href').substring(1);
            handleNavigation(target);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Handle navigation
function handleNavigation(target) {
    switch(target) {
        case 'home':
            clearSearch();
            showHomepage();
            break;
        case 'trending':
            selectCategory('trending');
            break;
        case 'categories':
            scrollToCategories();
            break;
        case 'about':
            showAbout();
            break;
    }
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // ESC key to go back to homepage
    if (e.key === 'Escape') {
        showHomepage();
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchBox.focus();
    }
}

// Create video card HTML
function createVideoCard(video) {
    return `
        <div class="video-card" onclick="playVideo(${video.id})" data-video-id="${video.id}">
            <div class="video-thumbnail">
                <i class="fas fa-play"></i>
                <div class="video-duration">${video.duration}</div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <div class="video-meta">
                    ${video.views} views • ${video.date}
                </div>
            </div>
        </div>
    `;
}

// Load videos into grids
function loadVideos() {
    showLoading();
    
    setTimeout(() => {
        let filteredVideos = sampleVideos;
        
        // Apply search filter
        if (searchQuery) {
            filteredVideos = sampleVideos.filter(video => 
                video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                video.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply category filter
        if (currentCategory !== 'all') {
            filteredVideos = filteredVideos.filter(video => video.category === currentCategory);
        }

        if (filteredVideos.length === 0) {
            displayNoResults();
            hideLoading();
            return;
        }

        // Load trending videos (first half)
        const midPoint = Math.ceil(filteredVideos.length / 2);
        const trendingVideos = filteredVideos.slice(0, midPoint);
        trendingGrid.innerHTML = trendingVideos.map(createVideoCard).join('');

        // Load recent videos (second half)
        const recentVideos = filteredVideos.slice(midPoint);
        recentGrid.innerHTML = recentVideos.map(createVideoCard).join('');

        // Update section titles
        updateSectionTitles();

        hideLoading();
        animateVideoCards();
    }, 300);
}

// Display no results message
function displayNoResults() {
    const message = searchQuery 
        ? `No videos found for "${searchQuery}"` 
        : `No videos found in ${currentCategory} category`;
    
    trendingGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <i class="fas fa-search" style="font-size: 3rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
            <p style="color: rgba(255,255,255,0.7); font-size: 1.1rem;">${message}</p>
            <button class="category-btn" onclick="clearSearch()" style="margin-top: 1rem;">
                <i class="fas fa-home"></i> Back to All Videos
            </button>
        </div>
    `;
    recentGrid.innerHTML = '';
}

// Update section titles based on current state
function updateSectionTitles() {
    const trendingTitle = document.querySelector('#trending .section-title');
    const recentTitle = document.querySelector('#recent-grid').previousElementSibling;
    
    if (searchQuery) {
        trendingTitle.innerHTML = `<i class="fas fa-search"></i> Search Results for "${searchQuery}"`;
        recentTitle.innerHTML = `<i class="fas fa-plus"></i> More Results`;
    } else if (currentCategory !== 'all') {
        const categoryName = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
        trendingTitle.innerHTML = `<i class="fas fa-fire"></i> Trending in ${categoryName}`;
        recentTitle.innerHTML = `<i class="fas fa-clock"></i> Recent ${categoryName}`;
    } else {
        trendingTitle.innerHTML = `<i class="fas fa-fire"></i> Trending Now`;
        recentTitle.innerHTML = `<i class="fas fa-clock"></i> Recently Added`;
    }
}

// Animate video cards on load
function animateVideoCards() {
    const cards = document.querySelectorAll('.video-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Select category
function selectCategory(category) {
    currentCategory = category;
    
    // Update active button
    categoryBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    loadVideos();
}

// Play video
function playVideo(videoId) {
    currentVideo = sampleVideos.find(video => video.id === videoId);
    if (currentVideo) {
        // Update player info
        document.getElementById('current-video-title').textContent = currentVideo.title;
        document.getElementById('current-video-views').textContent = currentVideo.views + ' views';
        document.getElementById('current-video-date').textContent = currentVideo.date;
        
        // Load suggestions (other videos excluding current)
        const suggestions = sampleVideos
            .filter(video => video.id !== videoId)
            .sort(() => Math.random() - 0.5) // Randomize
            .slice(0, 6);
        
        suggestionsGrid.innerHTML = suggestions.map(createVideoCard).join('');
        
        showVideoPlayer();
        
        // Add to view history (if you want to implement this feature)
        addToHistory(currentVideo);
    }
}

// Add to viewing history
function addToHistory(video) {
    let history = JSON.parse(localStorage.getItem('xshiver-history') || '[]');
    
    // Remove if already exists to avoid duplicates
    history = history.filter(item => item.id !== video.id);
    
    // Add to beginning
    history.unshift({
        id: video.id,
        title: video.title,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 items
    history = history.slice(0, 50);
    
    localStorage.setItem('xshiver-history', JSON.stringify(history));
}

// Show video player page
function showVideoPlayer() {
    homePage.style.display = 'none';
    videoPlayerPage.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Add some interactivity to the player
    const playerIcon = document.querySelector('.video-player i');
    playerIcon.addEventListener('click', togglePlayback);
}

// Toggle playback (simulate)
function togglePlayback() {
    const icon = document.querySelector('.video-player i');
    if (icon.classList.contains('fa-play')) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        // Simulate playing
        console.log('Playing:', currentVideo.title);
    } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        // Simulate pausing
        console.log('Paused:', currentVideo.title);
    }
}

// Show homepage
function showHomepage() {
    homePage.style.display = 'block';
    videoPlayerPage.style.display = 'none';
    currentVideo = null;
    
    // Reset player
    const playerIcon = document.querySelector('.video-player i');
    playerIcon.classList.remove('fa-pause');
    playerIcon.classList.add('fa-play');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Perform search
function performSearch() {
    const query = searchBox.value.trim();
    if (query) {
        searchQuery = query;
        currentCategory = 'all'; // Reset category filter when searching
        
        // Update active category button
        categoryBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === 'all') {
                btn.classList.add('active');
            }
        });
        
        loadVideos();
    }
}

// Clear search
function clearSearch() {
    searchQuery = '';
    searchBox.value = '';
    currentCategory = 'all';
    
    // Reset active category
    categoryBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') {
            btn.classList.add('active');
        }
    });
    
    loadVideos();
}

// Show loading
function showLoading() {
    loading.style.display = 'block';
}

// Hide loading
function hideLoading() {
    loading.style.display = 'none';
}

// Scroll to categories section
function scrollToCategories() {
    const categoriesSection = document.querySelector('.categories');
    categoriesSection.scrollIntoView({ behavior: 'smooth' });
}

// Show about section (you can customize this)
function showAbout() {
    alert('Xshiver - Premium Video Streaming Platform\n\nDiscover amazing videos from creators around the world.\n\nVersion 1.0');
}

// Add smooth scrolling for anchor links
function addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add parallax effect to hero section
function addParallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero && homePage.style.display !== 'none') {
            hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });
}

// Add intersection observer for lazy loading and animations
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });

    // Observe video cards
    document.querySelectorAll('.video-card').forEach(card => {
        observer.observe(card);
    });
}

// Utility function to format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

// Add error handling for video loading
function handleVideoError(videoId) {
    console.error(`Failed to load video with ID: ${videoId}`);
    // You could show an error message to the user here
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
    
    // Add some extra interactive features
    setTimeout(() => {
        setupIntersectionObserver();
    }, 1000);
});

// Export functions for global access (if needed)
window.playVideo = playVideo;
window.showHomepage = showHomepage;
window.clearSearch = clearSearch;
