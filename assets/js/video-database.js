/**
 * Xshiver Video Database System
 * Manages video data and Catbox integration
 */

class VideoDatabase {
    constructor() {
        this.videos = [];
        this.categories = [];
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
        console.log('🗃️ Initializing Video Database...');
        
        try {
            await this.loadVideoData();
            await this.loadCategoryData();
            this.isInitialized = true;
            console.log('✅ Video Database initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Video Database:', error);
        }
    }
    
    async loadVideoData() {
        // Try to load from data file first
        try {
            const response = await fetch('../../assets/data/videos.json');
            if (response.ok) {
                this.videos = await response.json();
                return;
            }
        } catch (error) {
            console.log('Loading mock data instead of JSON file');
        }
        
        // Fallback to mock data for development
        this.videos = this.generateMockData();
        
        // Store in localStorage for persistence
        localStorage.setItem('xshiver_video_database', JSON.stringify(this.videos));
    }
    
    async loadCategoryData() {
        this.categories = [
            {
                id: 'amateur',
                name: 'Amateur',
                description: 'Real people, authentic content',
                icon: '👥',
                seoTitle: 'Amateur Adult Videos - Free HD Streaming | Xshiver'
            },
            {
                id: 'professional',
                name: 'Professional',
                description: 'High-quality studio productions',
                icon: '🎬',
                seoTitle: 'Professional Adult Content - Premium HD Videos | Xshiver'
            },
            {
                id: 'milf',
                name: 'MILF',
                description: 'Mature and experienced women',
                icon: '👩',
                seoTitle: 'MILF Adult Videos - Mature Women Content | Xshiver'
            },
            {
                id: 'teen',
                name: 'Teen (18+)',
                description: 'Young adult content (18+)',
                icon: '👧',
                seoTitle: 'Teen 18+ Adult Videos - Young Adult Content | Xshiver'
            },
            {
                id: 'hardcore',
                name: 'Hardcore',
                description: 'Intense adult experiences',
                icon: '🔥',
                seoTitle: 'Hardcore Adult Videos - Intense Content | Xshiver'
            },
            {
                id: 'lesbian',
                name: 'Lesbian',
                description: 'Women loving women',
                icon: '👩‍❤️‍👩',
                seoTitle: 'Lesbian Adult Videos - Women Content | Xshiver'
            },
            {
                id: 'anal',
                name: 'Anal',
                description: 'Anal adult content',
                icon: '🍑',
                seoTitle: 'Anal Adult Videos - Premium Content | Xshiver'
            },
            {
                id: 'blowjob',
                name: 'Blowjob',
                description: 'Oral pleasure content',
                icon: '👄',
                seoTitle: 'Blowjob Adult Videos - Oral Content | Xshiver'
            },
            {
                id: 'threesome',
                name: 'Threesome',
                description: 'Multiple partner content',
                icon: '👥',
                seoTitle: 'Threesome Adult Videos - Group Content | Xshiver'
            },
            {
                id: 'solo',
                name: 'Solo',
                description: 'Single performer content',
                icon: '👤',
                seoTitle: 'Solo Adult Videos - Single Performer | Xshiver'
            }
        ];
    }
    
    generateMockData() {
        const mockVideos = [];
        const categories = ['amateur', 'professional', 'milf', 'teen', 'hardcore', 'lesbian', 'anal', 'blowjob', 'threesome', 'solo'];
        const qualities = ['480p', '720p', '1080p', '4k'];
        
        for (let i = 1; i <= 100; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const quality = qualities[Math.floor(Math.random() * qualities.length)];
            const duration = Math.floor(Math.random() * 1800) + 300; // 5-35 minutes
            const views = Math.floor(Math.random() * 500000) + 1000;
            const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0-5.0 rating
            
            mockVideos.push({
                id: i,
                title: this.generateVideoTitle(category, i),
                description: this.generateVideoDescription(category),
                catbox_video_url: `https://files.catbox.moe/sample-video-${i}.mp4`,
                catbox_thumbnail_url: `https://files.catbox.moe/sample-thumb-${i}.jpg`,
                duration: duration,
                quality: quality,
                category: category,
                tags: this.generateTags(category),
                upload_date: this.generateRandomDate(),
                view_count: views,
                rating: parseFloat(rating),
                status: 'active',
                uploader: this.generateUploader(),
                file_size: Math.floor(Math.random() * 500) + 50, // MB
                resolution: this.getResolution(quality)
            });
        }
        
        return mockVideos;
    }
    
    generateVideoTitle(category, index) {
        const titleTemplates = {
            amateur: [
                'Amateur Couple Private Session',
                'Real Amateur Home Video',
                'Authentic Amateur Experience',
                'Private Amateur Collection',
                'Genuine Amateur Content'
            ],
            professional: [
                'Professional Studio Production',
                'High Quality Professional Scene',
                'Premium Studio Content',
                'Professional Adult Film',
                'Studio Quality Production'
            ],
            milf: [
                'Experienced MILF Action',
                'Mature Woman Experience',
                'MILF Premium Content',
                'Sophisticated Mature Lady',
                'Experienced Woman Special'
            ],
            teen: [
                'Young Adult (18+) Content',
                'Fresh 18+ Experience',
                'Young Adult Premium',
                'Teen 18+ Special',
                'Young Adult Collection'
            ],
            hardcore: [
                'Intense Hardcore Action',
                'Extreme Adult Content',
                'Hardcore Premium Scene',
                'Intense Adult Experience',
                'Hardcore Collection'
            ],
            lesbian: [
                'Lesbian Love Scene',
                'Women Only Content',
                'Lesbian Premium Experience',
                'Girl on Girl Action',
                'Lesbian Special Collection'
            ]
        };
        
        const templates = titleTemplates[category] || titleTemplates.amateur;
        const baseTitle = templates[index % templates.length];
        return `${baseTitle} ${index}`;
    }
    
    generateVideoDescription(category) {
        const descriptions = {
            amateur: 'Authentic amateur content featuring real couples in intimate moments. Genuine passion and authentic experiences.',
            professional: 'High-quality studio production with professional performers and excellent cinematography.',
            milf: 'Experienced mature women showcasing their expertise and sensuality.',
            teen: 'Young adult content featuring 18+ performers in exciting scenarios.',
            hardcore: 'Intense adult content for those seeking more extreme experiences.',
            lesbian: 'Beautiful women exploring their sexuality together in passionate encounters.'
        };
        
        return descriptions[category] || descriptions.amateur;
    }
    
    generateTags(category) {
        const tagSets = {
            amateur: ['amateur', 'couple', 'real', 'homemade', 'private'],
            professional: ['professional', 'studio', 'hd', 'premium', 'quality'],
            milf: ['milf', 'mature', 'experienced', 'cougar', 'older'],
            teen: ['teen', '18+', 'young', 'fresh', 'college'],
            hardcore: ['hardcore', 'intense', 'extreme', 'rough', 'wild'],
            lesbian: ['lesbian', 'girl', 'women', 'sapphic', 'gay']
        };
        
        const baseTags = tagSets[category] || tagSets.amateur;
        const commonTags = ['adult', 'video', 'streaming', 'hd'];
        
        return [...baseTags, ...commonTags.slice(0, 2)];
    }
    
    generateRandomDate() {
        const start = new Date(2024, 0, 1);
        const end = new Date();
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString();
    }
    
    generateUploader() {
        const uploaders = [
            'XshiverStudio',
            'PremiumContent',
            'HDProductions',
            'StudioAlpha',
            'EliteVideos',
            'PlatinumStudio',
            'ProContent',
            'StudioBeta'
        ];
        
        return uploaders[Math.floor(Math.random() * uploaders.length)];
    }
    
    getResolution(quality) {
        const resolutions = {
            '480p': '854x480',
            '720p': '1280x720',
            '1080p': '1920x1080',
            '4k': '3840x2160'
        };
        
        return resolutions[quality] || '1280x720';
    }
    
    // Public API methods
    async getVideo(id) {
        await this.ensureInitialized();
        
        const video = this.videos.find(v => v.id == id);
        if (video) {
            // Increment view count
            video.view_count++;
            this.saveToLocalStorage();
            
            console.log(`📹 Retrieved video: ${video.title}`);
            return video;
        }
        
        console.log(`❌ Video not found: ${id}`);
        return null;
    }
    
    async getVideosByCategory(category, limit = 20, offset = 0) {
        await this.ensureInitialized();
        
        const categoryVideos = this.videos
            .filter(v => v.category === category && v.status === 'active')
            .slice(offset, offset + limit);
        
        console.log(`📂 Retrieved ${categoryVideos.length} videos for category: ${category}`);
        return categoryVideos;
    }
    
    async getTrendingVideos(limit = 20) {
        await this.ensureInitialized();
        
        const trending = this.videos
            .filter(v => v.status === 'active')
            .sort((a, b) => {
                // Sort by recent views and rating
                const aScore = (a.view_count * 0.7) + (a.rating * 1000);
                const bScore = (b.view_count * 0.7) + (b.rating * 1000);
                return bScore - aScore;
            })
            .slice(0, limit);
        
        console.log(`🔥 Retrieved ${trending.length} trending videos`);
        return trending;
    }
    
    async getNewReleases(limit = 20) {
        await this.ensureInitialized();
        
        const newReleases = this.videos
            .filter(v => v.status === 'active')
            .sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date))
            .slice(0, limit);
        
        console.log(`🆕 Retrieved ${newReleases.length} new releases`);
        return newReleases;
    }
    
    async getTopRated(limit = 20) {
        await this.ensureInitialized();
        
        const topRated = this.videos
            .filter(v => v.status === 'active')
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
        
        console.log(`⭐ Retrieved ${topRated.length} top rated videos`);
        return topRated;
    }
    
    async searchVideos(query, filters = {}, limit = 20, offset = 0) {
        await this.ensureInitialized();
        
        let results = this.videos.filter(v => v.status === 'active');
        
        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            results = results.filter(v => 
                v.title.toLowerCase().includes(searchTerm) ||
                v.description.toLowerCase().includes(searchTerm) ||
                v.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply filters
        if (filters.category) {
            results = results.filter(v => v.category === filters.category);
        }
        
        if (filters.duration) {
            results = results.filter(v => {
                switch(filters.duration) {
                    case 'short': return v.duration < 600; // Under 10 minutes
                    case 'medium': return v.duration >= 600 && v.duration < 1800; // 10-30 minutes
                    case 'long': return v.duration >= 1800; // Over 30 minutes
                    default: return true;
                }
            });
        }
        
        if (filters.quality) {
            results = results.filter(v => v.quality === filters.quality);
        }
        
        if (filters.upload_date) {
            const now = new Date();
            results = results.filter(v => {
                const uploadDate = new Date(v.upload_date);
                const daysDiff = (now - uploadDate) / (1000 * 60 * 60 * 24);
                
                switch(filters.upload_date) {
                    case 'today': return daysDiff <= 1;
                    case 'week': return daysDiff <= 7;
                    case 'month': return daysDiff <= 30;
                    default: return true;
                }
            });
        }
        
        // Sort results
        if (filters.sort) {
            switch(filters.sort) {
                case 'newest':
                    results.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
                    break;
                case 'oldest':
                    results.sort((a, b) => new Date(a.upload_date) - new Date(b.upload_date));
                    break;
                case 'most_viewed':
                    results.sort((a, b) => b.view_count - a.view_count);
                    break;
                case 'highest_rated':
                    results.sort((a, b) => b.rating - a.rating);
                    break;
                case 'longest':
                    results.sort((a, b) => b.duration - a.duration);
                    break;
                case 'shortest':
                    results.sort((a, b) => a.duration - b.duration);
                    break;
                default:
                    // Default: relevance (keep current order)
                    break;
            }
        }
        
        const paginatedResults = results.slice(offset, offset + limit);
        
        console.log(`🔍 Search "${query}" returned ${paginatedResults.length}/${results.length} results`);
        return {
            videos: paginatedResults,
            total: results.length,
            hasMore: offset + limit < results.length
        };
    }
    
    async getRelatedVideos(category, tags, limit = 10, excludeId = null) {
        await this.ensureInitialized();
        
        let related = this.videos.filter(v => 
            v.status === 'active' && 
            v.id !== excludeId
        );
        
        // Score videos based on similarity
        related = related.map(v => {
            let score = 0;
            
            // Same category bonus
            if (v.category === category) {
                score += 10;
            }
            
            // Tag similarity bonus
            if (tags && Array.isArray(tags)) {
                const matchingTags = v.tags.filter(tag => tags.includes(tag));
                score += matchingTags.length * 2;
            }
            
            // Rating bonus
            score += v.rating;
            
            // Recent upload bonus
            const daysSinceUpload = (new Date() - new Date(v.upload_date)) / (1000 * 60 * 60 * 24);
            if (daysSinceUpload < 30) {
                score += 2;
            }
            
            return { ...v, similarity_score: score };
        });
        
        // Sort by similarity score and return top results
        related.sort((a, b) => b.similarity_score - a.similarity_score);
        const results = related.slice(0, limit);
        
        console.log(`🎯 Found ${results.length} related videos`);
        return results;
    }
    
    async getCategories() {
        await this.ensureInitialized();
        
        // Add video counts to categories
        const categoriesWithCounts = this.categories.map(cat => ({
            ...cat,
            video_count: this.videos.filter(v => v.category === cat.id && v.status === 'active').length
        }));
        
        return categoriesWithCounts;
    }
    
    async getCategoryStats() {
        await this.ensureInitialized();
        
        const stats = {};
        
        this.categories.forEach(cat => {
            const categoryVideos = this.videos.filter(v => v.category === cat.id && v.status === 'active');
            
            stats[cat.id] = {
                name: cat.name,
                video_count: categoryVideos.length,
                total_views: categoryVideos.reduce((sum, v) => sum + v.view_count, 0),
                average_rating: categoryVideos.length > 0 ? 
                    (categoryVideos.reduce((sum, v) => sum + v.rating, 0) / categoryVideos.length).toFixed(1) : 0,
                latest_upload: categoryVideos.length > 0 ?
                    categoryVideos.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date))[0].upload_date : null
            };
        });
        
        return stats;
    }
    
    // Admin methods (for adding videos)
    async addVideo(videoData) {
        await this.ensureInitialized();
        
        const newVideo = {
            id: this.getNextId(),
            ...videoData,
            upload_date: new Date().toISOString(),
            view_count: 0,
            rating: 0,
            status: 'active'
        };
        
        this.videos.push(newVideo);
        this.saveToLocalStorage();
        
        console.log(`➕ Added new video: ${newVideo.title}`);
        return newVideo;
    }
    
    async updateVideo(id, updates) {
        await this.ensureInitialized();
        
        const videoIndex = this.videos.findIndex(v => v.id == id);
        if (videoIndex !== -1) {
            this.videos[videoIndex] = { ...this.videos[videoIndex], ...updates };
            this.saveToLocalStorage();
            
            console.log(`✏️ Updated video: ${this.videos[videoIndex].title}`);
            return this.videos[videoIndex];
        }
        
        return null;
    }
    
    async deleteVideo(id) {
        await this.ensureInitialized();
        
        const videoIndex = this.videos.findIndex(v => v.id == id);
        if (videoIndex !== -1) {
            const deletedVideo = this.videos[videoIndex];
            this.videos[videoIndex].status = 'deleted';
            this.saveToLocalStorage();
            
            console.log(`🗑️ Deleted video: ${deletedVideo.title}`);
            return true;
        }
        
        return false;
    }
    
    // Utility methods
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.init();
        }
    }
    
    getNextId() {
        const maxId = Math.max(...this.videos.map(v => v.id), 0);
        return maxId + 1;
    }
    
    saveToLocalStorage() {
        localStorage.setItem('xshiver_video_database', JSON.stringify(this.videos));
    }
    
    // Analytics methods
    async getViewStats(timeframe = '30d') {
        await this.ensureInitialized();
        
        const stats = {
            total_videos: this.videos.filter(v => v.status === 'active').length,
            total_views: this.videos.reduce((sum, v) => sum + v.view_count, 0),
            average_rating: 0,
            most_viewed: null,
            trending_categories: {}
        };
        
        // Calculate average rating
        const activeVideos = this.videos.filter(v => v.status === 'active');
        if (activeVideos.length > 0) {
            stats.average_rating = (activeVideos.reduce((sum, v) => sum + v.rating, 0) / activeVideos.length).toFixed(1);
        }
        
        // Find most viewed video
        stats.most_viewed = activeVideos.sort((a, b) => b.view_count - a.view_count)[0];
        
        // Category trends
        this.categories.forEach(cat => {
            const categoryVideos = activeVideos.filter(v => v.category === cat.id);
            stats.trending_categories[cat.id] = {
                name: cat.name,
                video_count: categoryVideos.length,
                total_views: categoryVideos.reduce((sum, v) => sum + v.view_count, 0)
            };
        });
        
        return stats;
    }
    
    // Backup and restore
    exportDatabase() {
        return {
            videos: this.videos,
            categories: this.categories,
            exported_at: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    async importDatabase(data) {
        if (data.videos && Array.isArray(data.videos)) {
            this.videos = data.videos;
            this.saveToLocalStorage();
            console.log(`📥 Imported ${data.videos.length} videos`);
            return true;
        }
        
        return false;
    }
    
    // Search suggestions
    async getSearchSuggestions(query, limit = 5) {
        await this.ensureInitialized();
        
        if (!query || query.length < 2) return [];
        
        const searchTerm = query.toLowerCase();
        const suggestions = new Set();
        
        // Add matching titles
        this.videos.forEach(video => {
            if (video.status === 'active' && video.title.toLowerCase().includes(searchTerm)) {
                suggestions.add(video.title);
            }
        });
        
        // Add matching tags
        this.videos.forEach(video => {
            if (video.status === 'active') {
                video.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(searchTerm)) {
                        suggestions.add(tag);
                    }
                });
            }
        });
        
        // Add matching categories
        this.categories.forEach(cat => {
            if (cat.name.toLowerCase().includes(searchTerm)) {
                suggestions.add(cat.name);
            }
        });
        
        return Array.from(suggestions).slice(0, limit);
    }
}

// Initialize global video database
window.videoDatabase = new VideoDatabase();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoDatabase;
}
