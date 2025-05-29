// Sample video data
const videoData = [
    {
        id: 1,
        title: "Amazing Sunset Timelapse",
        views: "2.1M",
        date: "3 days ago",
        duration: "4:32",
        category: "nature"
    },
    {
        id: 2,
        title: "JavaScript Tutorial for Beginners",
        views: "856K",
        date: "1 week ago",
        duration: "15:47",
        category: "tech"
    },
    {
        id: 3,
        title: "Epic Gaming Moments Compilation",
        views: "1.8M",
        date: "2 days ago",
        duration: "12:23",
        category: "gaming"
    },
    {
        id: 4,
        title: "Relaxing Piano Music",
        views: "3.2M",
        date: "5 days ago",
        duration: "45:12",
        category: "music"
    },
    {
        id: 5,
        title: "Cooking Masterclass: Italian Pasta",
        views: "742K",
        date: "4 days ago",
        duration: "8:56",
        category: "entertainment"
    },
    {
        id: 6,
        title: "Space Documentary: Journey to Mars",
        views: "1.5M",
        date: "1 week ago",
        duration: "28:34",
        category: "education"
    },
    {
        id: 7,
        title: "Street Art Revolution",
        views: "892K",
        date: "6 days ago",
        duration: "7:21",
        category: "entertainment"
    },
    {
        id: 8,
        title: "AI and Machine Learning Explained",
        views: "1.1M",
        date: "3 days ago",
        duration: "18:45",
        category: "tech"
    },
    {
        id: 9,
        title: "Mountain Hiking Adventure",
        views: "654K",
        date: "1 day ago",
        duration: "22:15",
        category: "nature"
    },
    {
        id: 10,
        title: "Electronic Music Mix 2024",
        views: "2.8M",
        date: "5 hours ago",
        duration: "60:00",
        category: "music"
    },
    {
        id: 11,
        title: "Photography Tips for Beginners",
        views: "445K",
        date: "2 weeks ago",
        duration: "11:33",
        category: "education"
    },
    {
        id: 12,
        title: "Indie Game Development Journey",
        views: "723K",
        date: "4 days ago",
        duration: "19:42",
        category: "gaming"
    }
];

let currentPage = 'home';
let loadedVideos = 8;
let currentCategory = 'all';

// Initialize the site
document.addEventListener('DOMContentLoaded', function() {
    loadVideos('trending-grid', videoData.slice(0, 4));
    loadVideos('recent-grid', videoData.slice(4, 8));
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.category) {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentCategory = this.dataset.category;
                filterVideos(this.dataset.category);
            }
        });
    });

    // Search functionality
    const searchBox = document.querySelector('.search-box');
    const searchBtn = document.querySelector('.search-btn');
    
    searchBtn.addEventListener('click', performSearch);
    searchBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Clear search on focus
    searchBox.addEventListener('focus', function() {
        if (this.value && currentCategory === 'search') {
            this.value = '';
            filterVideos('all');
            document.querySelector('.category-btn[data-category="all"]').classList.add('active');
        }
    });

    // Infinite scroll
    window.addEventListener('scroll', function() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
            if (currentPage === 'home') {
                loadMoreVideos();
            }
        }
    });

    // Navigation smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Load videos into grid
function loadVideos(gridId, videos) {
    const grid = document.getElementById(gridId);
    
    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        grid.appendChild(videoCard);
    });
}

// Create video card element
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.onclick = () => playVideo(video);
    
    // Add loading animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <div class="play-button">
                <i class="fas fa-play"></i>
            </div>
            <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <div class="video-meta">
                <div class="video-views">
                    <i class="fas fa-eye"></i>
                    <span>${video.views} views</span>
                </div>
                <div class="video-date">${video.date}</div>
            </div>
        </div>
    `;
    
    // Animate card appearance
    setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);
    
    return card;
}

// Play video function
function playVideo(video) {
    currentPage = 'video';
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('video-player-page').style.display = 'block';
    
    document.getElementById('current-video-title').textContent = video.title;
    document.getElementById('current-video-views').textContent = video.views + ' views';
    document.getElementById('current-video-date').textContent = video.date;
    
    // Load suggestions (excluding current video)
    const suggestions = videoData.filter(v => v.id !== video.id).slice(0, 6);
    const suggestionsGrid = document.getElementById('suggestions-grid');
    suggestionsGrid.innerHTML = '';
    loadVideos('suggestions-grid', suggestions);
    
    // Scroll to top smoothly
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Update page title
    document.title = `${video.title} - Xshiver`;
}

// Show homepage
function showHomepage() {
    currentPage = 'home';
    document.getElementById('homepage').style.display = 'block';
    document.getElementById('video-player-page').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Reset page title
    document.title = 'Xshiver - Premium Video Streaming';
}

// Filter videos by category
function filterVideos(category) {
    const grids = ['trending-grid', 'recent-grid'];
    grids.forEach(gridId => {
        const grid = document.getElementById(gridId);
        grid.innerHTML = '';
        
        let filteredVideos = videoData;
        if (category !== 'all') {
            filteredVideos = videoData.filter(video => 
                video.category === category || 
                video.title.toLowerCase().includes(category.toLowerCase())
            );
        }
        
        // Update section titles based on category
        if (category === 'trending') {
            document.querySelector('#trending .section-title').innerHTML = 
                '<i class="fas fa-fire"></i>Trending Now';
        } else if (category !== 'all') {
            document.querySelector('#trending .section-title').innerHTML = 
                `<i class="fas fa-filter"></i>${category.charAt(0).toUpperCase() + category.slice(1)} Videos`;
        } else {
            document.querySelector('#trending .section-title').innerHTML = 
                '<i class="fas fa-fire"></i>Trending Now';
        }
        
        const videosToShow = filteredVideos.slice(0, gridId === 'trending-grid' ? 4 : 8);
        loadVideos(gridId, videosToShow);
    });
}

// Search functionality
function performSearch() {
    const searchTerm = document.querySelector('.search-box').value.toLowerCase().trim();
    if (!searchTerm) return;
    
    currentCategory = 'search';
    
    const filteredVideos = videoData.filter(video => 
        video.title.toLowerCase().includes(searchTerm) ||
        video.category.toLowerCase().includes(searchTerm)
    );
    
    // Clear grids and show search results
    document.getElementById('trending-grid').innerHTML = '';
    document.getElementById('recent-grid').innerHTML = '';
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    
    if (filteredVideos.length > 0) {
        loadVideos('trending-grid', filteredVideos.slice(0, 8));
        document.querySelector('#trending .section-title').innerHTML = 
            `<i class="fas fa-search"></i>Search Results for "${searchTerm}"`;
        
        // Load more results in recent grid if available
        if (filteredVideos.length > 8) {
            loadVideos('recent-grid', filteredVideos.slice(8));
        }
    } else {
        document.getElementById('trending-grid').innerHTML = 
            '<p style="text-align: center; color: #888; grid-column: 1/-1; padding: 2rem;">No videos found matching your search. Try different keywords.</p>';
        document.querySelector('#trending .section-title').innerHTML = 
            `<i class="fas fa-search"></i>Search Results for "${searchTerm}"`;
    }
}

// Load more videos (infinite scroll)
function loadMoreVideos() {
    if (loadedVideos >= videoData.length * 3) return;
    
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    
    setTimeout(() => {
        // Create more video variations
        const moreVideos = videoData.slice(0, 4).map((video, index) => ({
            ...video,
            id: video.id + loadedVideos + index,
            title: video.title + ` (Part ${Math.floor(loadedVideos/4) + 2})`,
            views: generateRandomViews(),
            date: generateRandomDate()
        }));
        
        loadVideos('recent-grid', moreVideos);
        loadedVideos += 4;
        loading.style.display = 'none';
    }, 1000);
}

// Helper functions
function generateRandomViews() {
    const views = Math.floor(Math.random() * 5000) + 100;
    if (views > 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}

function generateRandomDate() {
    const dates = ['1 hour ago', '3 hours ago', '1 day ago', '2 days ago', '1 week ago', '2 weeks ago'];
    return dates[Math.floor(Math.random() * dates.length)];
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC key to go back to homepage from video player
    if (e.key === 'Escape' && currentPage === 'video') {
        showHomepage();
      }
