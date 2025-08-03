/**
 * Advanced AI Recommendation Engine for Xshiver
 * Provides personalized content recommendations using multiple algorithms
 */

class RecommendationEngine {
    constructor() {
        this.userId = null;
        this.userProfile = null;
        this.viewingHistory = [];
        this.preferences = {};
        this.algorithms = new Map();
        
        // Recommendation weights
        this.weights = {
            collaborative: 0.4,      // User-based collaborative filtering
            contentBased: 0.3,       // Content-based filtering
            demographic: 0.1,        // Demographic filtering
            trending: 0.1,           // Trending content
            contextual: 0.1          // Contextual recommendations
        };
        
        // User behavior tracking
        this.behaviorData = {
            watchTime: new Map(),
            ratings: new Map(),
            searches: [],
            categories: new Map(),
            interactions: []
        };
        
        this.init();
    }
    
    init() {
        console.log('🤖 AI Recommendation Engine initializing...');
        
        // Initialize recommendation algorithms
        this.initializeAlgorithms();
        
        // Load user data
        this.loadUserData();
        
        // Setup behavior tracking
        this.setupBehaviorTracking();
        
        // Start recommendation updates
        this.startRecommendationUpdates();
        
        console.log('✅ AI Recommendation Engine initialized');
    }
    
    initializeAlgorithms() {
        // Collaborative Filtering Algorithm
        this.algorithms.set('collaborative', {
            name: 'Collaborative Filtering',
            weight: this.weights.collaborative,
            compute: this.computeCollaborativeRecommendations.bind(this)
        });
        
        // Content-Based Filtering Algorithm
        this.algorithms.set('contentBased', {
            name: 'Content-Based Filtering',
            weight: this.weights.contentBased,
            compute: this.computeContentBasedRecommendations.bind(this)
        });
        
        // Demographic Filtering Algorithm
        this.algorithms.set('demographic', {
            name: 'Demographic Filtering',
            weight: this.weights.demographic,
            compute: this.computeDemographicRecommendations.bind(this)
        });
        
        // Trending Algorithm
        this.algorithms.set('trending', {
            name: 'Trending Content',
            weight: this.weights.trending,
            compute: this.computeTrendingRecommendations.bind(this)
        });
        
        // Contextual Algorithm
        this.algorithms.set('contextual', {
            name: 'Contextual Recommendations',
            weight: this.weights.contextual,
            compute: this.computeContextualRecommendations.bind(this)
        });
    }
    
    async loadUserData() {
        if (!window.authSystem || !window.authSystem.isLoggedIn()) {
            this.setupAnonymousRecommendations();
            return;
        }
        
        this.userId = window.authSystem.getUser().id;
        
        try {
            // Load user profile and preferences
            this.userProfile = await this.fetchUserProfile();
            this.viewingHistory = await this.fetchViewingHistory();
            this.preferences = await this.fetchUserPreferences();
            
            // Load behavior data
            await this.loadBehaviorData();
            
        } catch (error) {
            console.error('Error loading user data:', error);
            this.setupAnonymousRecommendations();
        }
    }
    
    setupAnonymousRecommendations() {
        // Setup recommendations for anonymous users
        this.userProfile = {
            anonymous: true,
            region: this.detectUserRegion(),
            device: this.detectDeviceType(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        this.preferences = {
            categories: ['trending', 'popular'],
            mature: false,
            quality: 'auto'
        };
    }
    
    setupBehaviorTracking() {
        // Track video watching behavior
        document.addEventListener('videoPlay', (e) => {
            this.trackVideoPlay(e.detail);
        });
        
        document.addEventListener('videoEnd', (e) => {
            this.trackVideoComplete(e.detail);
        });
        
        document.addEventListener('videoSeek', (e) => {
            this.trackVideoSeek(e.detail);
        });
        
        document.addEventListener('videoRate', (e) => {
            this.trackVideoRating(e.detail);
        });
        
        document.addEventListener('search', (e) => {
            this.trackSearch(e.detail);
        });
        
        document.addEventListener('categoryClick', (e) => {
            this.trackCategoryInteraction(e.detail);
        });
    }
    
    startRecommendationUpdates() {
        // Update recommendations periodically
        setInterval(() => {
            this.updateRecommendations();
        }, 300000); // Every 5 minutes
        
        // Update on significant behavior changes
        this.behaviorChangeThreshold = 10;
        this.behaviorChanges = 0;
    }
    
    // Algorithm Implementations
    
    async computeCollaborativeRecommendations(limit = 10) {
        if (!this.userId || this.viewingHistory.length < 5) {
            return []; // Need sufficient data for collaborative filtering
        }
        
        try {
            // Find similar users based on viewing patterns
            const similarUsers = await this.findSimilarUsers();
            
            // Get recommendations from similar users
            const recommendations = [];
            
            for (const similarUser of similarUsers.slice(0, 20)) {
                const userVideos = await this.fetchUserViewedVideos(similarUser.id);
                
                for (const video of userVideos) {
                    // Skip if user has already watched
                    if (this.hasWatched(video.id)) continue;
                    
                    const score = this.calculateCollaborativeScore(video, similarUser.similarity);
                    
                    recommendations.push({
                        video: video,
                        score: score,
                        reason: `Users like you also watched this`,
                        algorithm: 'collaborative'
                    });
                }
            }
            
            // Sort by score and return top recommendations
            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error in collaborative filtering:', error);
            return [];
        }
    }
    
    async computeContentBasedRecommendations(limit = 10) {
        try {
            const recommendations = [];
            
            // Analyze user's preferred categories, actors, directors
            const preferences = this.analyzeContentPreferences();
            
            // Get candidate videos
            const candidates = await this.fetchCandidateVideos(preferences);
            
            for (const video of candidates) {
                if (this.hasWatched(video.id)) continue;
                
                const score = this.calculateContentBasedScore(video, preferences);
                
                recommendations.push({
                    video: video,
                    score: score,
                    reason: this.generateContentBasedReason(video, preferences),
                    algorithm: 'contentBased'
                });
            }
            
            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error in content-based filtering:', error);
            return [];
        }
    }
    
    async computeDemographicRecommendations(limit = 10) {
        try {
            const recommendations = [];
            
            // Get demographic data
            const demographics = {
                age: this.userProfile?.age || null,
                gender: this.userProfile?.gender || null,
                region: this.userProfile?.region || this.detectUserRegion(),
                language: this.userProfile?.language || navigator.language
            };
            
            // Get popular content for this demographic
            const popularVideos = await this.fetchPopularByDemographic(demographics);
            
            for (const video of popularVideos) {
                if (this.hasWatched(video.id)) continue;
                
                const score = this.calculateDemographicScore(video, demographics);
                
                recommendations.push({
                    video: video,
                    score: score,
                    reason: 'Popular in your region',
                    algorithm: 'demographic'
                });
            }
            
            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error in demographic filtering:', error);
            return [];
        }
    }
    
    async computeTrendingRecommendations(limit = 10) {
        try {
            const recommendations = [];
            
            // Get trending videos
            const trendingVideos = await this.fetchTrendingVideos();
            
            for (const video of trendingVideos) {
                if (this.hasWatched(video.id)) continue;
                
                const score = this.calculateTrendingScore(video);
                
                recommendations.push({
                    video: video,
                    score: score,
                    reason: 'Trending now',
                    algorithm: 'trending'
                });
            }
            
            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error in trending recommendations:', error);
            return [];
        }
    }
    
    async computeContextualRecommendations(limit = 10) {
        try {
            const recommendations = [];
            
            // Get contextual information
            const context = {
                timeOfDay: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                device: this.detectDeviceType(),
                location: this.userProfile?.region,
                sessionLength: this.getSessionLength(),
                recentActivity: this.getRecentActivity()
            };
            
            // Get contextually relevant videos
            const contextualVideos = await this.fetchContextualVideos(context);
            
            for (const video of contextualVideos) {
                if (this.hasWatched(video.id)) continue;
                
                const score = this.calculateContextualScore(video, context);
                
                recommendations.push({
                    video: video,
                    score: score,
                    reason: this.generateContextualReason(context),
                    algorithm: 'contextual'
                });
            }
            
            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error in contextual recommendations:', error);
            return [];
        }
    }
    
    // Main recommendation generation
    async generateRecommendations(options = {}) {
        const {
            limit = 20,
            category = null,
            excludeWatched = true,
            includeReasons = true
        } = options;
        
        console.log('🤖 Generating recommendations...');
        
        try {
            const allRecommendations = [];
            
            // Run all algorithms in parallel
            const algorithmPromises = Array.from(this.algorithms.entries()).map(
                async ([key, algorithm]) => {
                    try {
                        const recommendations = await algorithm.compute(Math.ceil(limit * 1.5));
                        return recommendations.map(rec => ({
                            ...rec,
                            weightedScore: rec.score * algorithm.weight,
                            algorithm: key
                        }));
                    } catch (error) {
                        console.error(`Error in ${algorithm.name}:`, error);
                        return [];
                    }
                }
            );
            
            const algorithmResults = await Promise.all(algorithmPromises);
            
            // Combine all recommendations
            algorithmResults.forEach(recommendations => {
                allRecommendations.push(...recommendations);
            });
            
            // Remove duplicates and merge scores
            const videoMap = new Map();
            
            allRecommendations.forEach(rec => {
                const videoId = rec.video.id;
                
                if (videoMap.has(videoId)) {
                    const existing = videoMap.get(videoId);
                    existing.weightedScore += rec.weightedScore;
                    existing.algorithms.push(rec.algorithm);
                    existing.reasons.push(rec.reason);
                } else {
                    videoMap.set(videoId, {
                        ...rec,
                        algorithms: [rec.algorithm],
                        reasons: [rec.reason]
                    });
                }
            });
            
            // Convert map to array and sort
            const finalRecommendations = Array.from(videoMap.values())
                .sort((a, b) => b.weightedScore - a.weightedScore)
                .slice(0, limit);
            
            // Add diversity to recommendations
            const diverseRecommendations = this.addDiversity(finalRecommendations);
            
            // Cache recommendations
            await this.cacheRecommendations(diverseRecommendations);
            
            console.log(`✅ Generated ${diverseRecommendations.length} recommendations`);
            
            return diverseRecommendations;
            
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return await this.getFallbackRecommendations(limit);
        }
    }
    
    addDiversity(recommendations) {
        // Ensure recommendations are diverse across categories, duration, etc.
        const diverse = [];
        const categoryCount = new Map();
        const maxPerCategory = Math.max(2, Math.ceil(recommendations.length / 5));
        
        for (const rec of recommendations) {
            const category = rec.video.category;
            const count = categoryCount.get(category) || 0;
            
            if (count < maxPerCategory) {
                diverse.push(rec);
                categoryCount.set(category, count + 1);
            }
        }
        
        // Fill remaining slots with highest scoring items
        const remaining = recommendations.length - diverse.length;
        const unusedRecs = recommendations.filter(rec => !diverse.includes(rec));
        diverse.push(...unusedRecs.slice(0, remaining));
        
        return diverse;
    }
    
    // Behavior tracking methods
    trackVideoPlay(data) {
        this.behaviorData.interactions.push({
            type: 'play',
            videoId: data.videoId,
            timestamp: Date.now(),
            position: data.position || 0
        });
        
        this.behaviorChanges++;
        this.checkForBehaviorUpdate();
    }
    
    trackVideoComplete(data) {
        const watchTime = data.duration * (data.completionRate || 1);
        
        this.behaviorData.watchTime.set(data.videoId, 
            (this.behaviorData.watchTime.get(data.videoId) || 0) + watchTime
        );
        
        this.behaviorData.interactions.push({
            type: 'complete',
            videoId: data.videoId,
            timestamp: Date.now(),
            watchTime: watchTime,
            completionRate: data.completionRate
        });
        
        this.behaviorChanges++;
        this.checkForBehaviorUpdate();
    }
    
    trackVideoRating(data) {
        this.behaviorData.ratings.set(data.videoId, data.rating);
        
        this.behaviorData.interactions.push({
            type: 'rating',
            videoId: data.videoId,
            timestamp: Date.now(),
            rating: data.rating
        });
        
        this.behaviorChanges += 2; // Ratings are more significant
        this.checkForBehaviorUpdate();
    }
    
    trackSearch(data) {
        this.behaviorData.searches.push({
            query: data.query,
            timestamp: Date.now(),
            resultsFound: data.resultsFound,
            clicked: data.clicked
        });
        
        this.behaviorChanges++;
        this.checkForBehaviorUpdate();
    }
    
    trackCategoryInteraction(data) {
        const category = data.category;
        this.behaviorData.categories.set(category,
            (this.behaviorData.categories.get(category) || 0) + 1
        );
        
        this.behaviorChanges++;
        this.checkForBehaviorUpdate();
    }
    
    checkForBehaviorUpdate() {
        if (this.behaviorChanges >= this.behaviorChangeThreshold) {
            this.updateRecommendations();
            this.behaviorChanges = 0;
        }
    }
    
    async updateRecommendations() {
        try {
            // Update user preferences based on recent behavior
            await this.updateUserPreferences();
            
            // Generate fresh recommendations
            const newRecommendations = await this.generateRecommendations();
            
            // Broadcast update event
            document.dispatchEvent(new CustomEvent('recommendationsUpdated', {
                detail: { recommendations: newRecommendations }
            }));
            
        } catch (error) {
            console.error('Error updating recommendations:', error);
        }
    }
    
    // Utility methods
    analyzeContentPreferences() {
        const preferences = {
            categories: new Map(),
            tags: new Map(),
            duration: { min: 0, max: Infinity, preferred: 0 },
            quality: new Map(),
            rating: { min: 0, preferred: 5 }
        };
        
        // Analyze viewing history
        this.viewingHistory.forEach(video => {
            // Category preferences
            preferences.categories.set(video.category,
                (preferences.categories.get(video.category) || 0) + 1
            );
            
            // Tag preferences
            video.tags?.forEach(tag => {
                preferences.tags.set(tag,
                    (preferences.tags.get(tag) || 0) + 1
                );
            });
            
            // Duration preferences
            if (video.duration) {
                preferences.duration.preferred = 
                    (preferences.duration.preferred + video.duration) / 2;
            }
            
            // Quality preferences
            if (video.quality) {
                preferences.quality.set(video.quality,
                    (preferences.quality.get(video.quality) || 0) + 1
                );
            }
        });
        
        return preferences;
    }
    
    calculateCollaborativeScore(video, similarity) {
        let score = similarity;
        
        // Boost score based on video popularity among similar users
        score *= (video.rating || 3) / 5;
        score *= Math.log(video.view_count + 1) / 10;
        
        // Consider recency
        const daysSinceUpload = (Date.now() - new Date(video.upload_date)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpload < 30) {
            score *= 1.2; // Boost recent content
        }
        
        return Math.min(score, 1);
    }
    
    calculateContentBasedScore(video, preferences) {
        let score = 0;
        
        // Category match
        const categoryScore = preferences.categories.get(video.category) || 0;
        score += (categoryScore / Math.max(...preferences.categories.values())) * 0.4;
        
        // Tag matches
        let tagScore = 0;
        video.tags?.forEach(tag => {
            const tagWeight = preferences.tags.get(tag) || 0;
            tagScore += tagWeight;
        });
        if (preferences.tags.size > 0) {
            score += (tagScore / (Math.max(...preferences.tags.values()) * video.tags?.length || 1)) * 0.3;
        }
        
        // Duration preference
        const durationDiff = Math.abs(video.duration - preferences.duration.preferred);
        const maxDuration = Math.max(video.duration, preferences.duration.preferred);
        score += (1 - (durationDiff / maxDuration)) * 0.2;
        
        // Rating boost
        score += (video.rating / 5) * 0.1;
        
        return Math.min(score, 1);
    }
    
    hasWatched(videoId) {
        return this.viewingHistory.some(video => video.id === videoId);
    }
    
    detectUserRegion() {
        // Attempt to detect user region from various sources
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        
        // Simple region mapping based on timezone and language
        if (timeZone.includes('America/')) return 'Americas';
        if (timeZone.includes('Europe/')) return 'Europe';
        if (timeZone.includes('Asia/')) return 'Asia';
        if (language.startsWith('en')) return 'English';
        
        return 'Global';
    }
    
    detectDeviceType() {
        const userAgent = navigator.userAgent;
        
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
        if (/Tablet|iPad/.test(userAgent)) return 'Tablet';
        if (/Smart TV|WebOS|Tizen/.test(userAgent)) return 'TV';
        
        return 'Desktop';
    }
    
    getSessionLength() {
        // Calculate current session length
        const sessionStart = sessionStorage.getItem('sessionStart');
        if (sessionStart) {
            return Date.now() - parseInt(sessionStart);
        }
        return 0;
    }
    
    getRecentActivity() {
        // Get recent interactions (last 30 minutes)
        const cutoff = Date.now() - (30 * 60 * 1000);
        return this.behaviorData.interactions.filter(
            interaction => interaction.timestamp > cutoff
        );
    }
    
    // API methods (would integrate with your backend)
    async fetchUserProfile() {
        // Mock implementation - replace with actual API call
        return {
            id: this.userId,
            age: 25,
            gender: 'unspecified',
            region: this.detectUserRegion(),
            language: navigator.language,
            preferences: {}
        };
    }
    
    async fetchViewingHistory() {
        // Mock implementation - replace with actual API call
        return window.userManager?.getWatchHistory() || [];
    }
    
    async fetchUserPreferences() {
        // Mock implementation - replace with actual API call
        return JSON.parse(localStorage.getItem('userPreferences') || '{}');
    }
    
    async loadBehaviorData() {
        // Load existing behavior data from storage
        const stored = localStorage.getItem('behaviorData');
        if (stored) {
            const data = JSON.parse(stored);
            this.behaviorData = {
                ...this.behaviorData,
                ...data,
                watchTime: new Map(data.watchTime || []),
                ratings: new Map(data.ratings || []),
                categories: new Map(data.categories || [])
            };
        }
    }
    
    async saveBehaviorData() {
        // Save behavior data to storage
        const dataToSave = {
            ...this.behaviorData,
            watchTime: Array.from(this.behaviorData.watchTime.entries()),
            ratings: Array.from(this.behaviorData.ratings.entries()),
            categories: Array.from(this.behaviorData.categories.entries())
        };
        
        localStorage.setItem('behaviorData', JSON.stringify(dataToSave));
    }
    
    async findSimilarUsers() {
        // Mock implementation - would use collaborative filtering algorithm
        return [
            { id: 'user123', similarity: 0.85 },
            { id: 'user456', similarity: 0.78 },
            { id: 'user789', similarity: 0.72 }
        ];
    }
    
    async fetchUserViewedVideos(userId) {
        // Mock implementation - would fetch from API
        return window.videoDatabase?.getVideosByUser?.(userId) || [];
    }
    
    async fetchCandidateVideos(preferences) {
        // Mock implementation - would fetch based on preferences
        const topCategories = Array.from(preferences.categories.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category]) => category);
        
        return window.videoDatabase?.getVideosByCategories?.(topCategories) || [];
    }
    
    async fetchPopularByDemographic(demographics) {
        // Mock implementation - would fetch popular content for demographic
        return window.videoDatabase?.getPopularVideos?.() || [];
    }
    
    async fetchTrendingVideos() {
        // Mock implementation - would fetch trending content
        return window.videoDatabase?.getTrendingVideos?.() || [];
    }
    
    async fetchContextualVideos(context) {
        // Mock implementation - would fetch contextually relevant content
        return window.videoDatabase?.getContextualVideos?.(context) || [];
    }
    
    async getFallbackRecommendations(limit) {
        // Fallback to popular/trending content if algorithms fail
        const popular = await window.videoDatabase?.getPopularVideos?.() || [];
        return popular.slice(0, limit).map(video => ({
            video: video,
            score: 0.5,
            reason: 'Popular content',
            algorithm: 'fallback'
        }));
    }
    
    async cacheRecommendations(recommendations) {
        // Cache recommendations for quick access
        const cacheData = {
            recommendations: recommendations,
            timestamp: Date.now(),
            userId: this.userId
        };
        
        sessionStorage.setItem('cachedRecommendations', JSON.stringify(cacheData));
    }
    
    getCachedRecommendations() {
        const cached = sessionStorage.getItem('cachedRecommendations');
        if (cached) {
            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;
            
            // Use cache if less than 10 minutes old
            if (age < 600000 && data.userId === this.userId) {
                return data.recommendations;
            }
        }
        
        return null;
    }
    
    // Public API
    async getRecommendations(options = {}) {
        // Check cache first
        const cached = this.getCachedRecommendations();
        if (cached && !options.fresh) {
            return cached;
        }
        
        return await this.generateRecommendations(options);
    }
    
    async getRecommendationsByCategory(category, limit = 10) {
        return await this.generateRecommendations({
            limit,
            category,
            includeReasons: true
        });
    }
    
    async updateUserPreferences() {
        // Update preferences based on recent behavior
        const preferences = this.analyzeContentPreferences();
        
        // Save updated preferences
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        
        // Save behavior data
        await this.saveBehaviorData();
    }
    
    explainRecommendation(videoId) {
        // Provide explanation for why a video was recommended
        const cached = this.getCachedRecommendations();
        const rec = cached?.find(r => r.video.id === videoId);
        
        if (rec) {
            return {
                reasons: rec.reasons,
                algorithms: rec.algorithms,
                score: rec.weightedScore,
                explanation: this.generateDetailedExplanation(rec)
            };
        }
        
        return null;
    }
    
    generateDetailedExplanation(recommendation) {
        const explanations = [];
        
        recommendation.algorithms.forEach(algorithm => {
            switch (algorithm) {
                case 'collaborative':
                    explanations.push('Users with similar tastes enjoyed this content');
                    break;
                case 'contentBased':
                    explanations.push('Matches your viewing preferences and interests');
                    break;
                case 'demographic':
                    explanations.push('Popular among users in your demographic');
                    break;
                case 'trending':
                    explanations.push('Currently trending and popular');
                    break;
                case 'contextual':
                    explanations.push('Relevant to your current context and time');
                    break;
            }
        });
        
        return explanations.join('. ');
    }
    
    // Cleanup
    destroy() {
        // Save final behavior data
        this.saveBehaviorData();
        
        // Clear intervals
        // (implement if you add any intervals)
        
        console.log('🤖 Recommendation Engine destroyed');
    }
}

// Global recommendation engine instance
window.recommendationEngine = new RecommendationEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationEngine;
}
