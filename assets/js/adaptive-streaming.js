/**
 * Adaptive Streaming Engine for Xshiver Video Player
 * Automatically adjusts video quality based on connection speed and device capability
 */

class AdaptiveStreaming {
    constructor(videoPlayer) {
        this.videoPlayer = videoPlayer;
        this.video = videoPlayer.video;
        this.currentQuality = 'auto';
        this.availableQualities = ['auto', '4k', '1080p', '720p', '480p'];
        this.isEnabled = true;
        this.bandwidthHistory = [];
        this.maxHistoryLength = 10;
        this.qualityChangeTimeout = null;
        this.connectionMonitor = null;
        
        // Performance thresholds (bits per second)
        this.qualityThresholds = {
            '4k': 25000000,      // 25 Mbps
            '1080p': 5000000,    // 5 Mbps
            '720p': 2500000,     // 2.5 Mbps
            '480p': 1000000,     // 1 Mbps
            '360p': 500000       // 0.5 Mbps
        };
        
        // Device capability detection
        this.deviceCapability = this.detectDeviceCapability();
        
        this.init();
    }
    
    init() {
        console.log('🔄 Initializing Adaptive Streaming...');
        
        this.setupEventListeners();
        this.startConnectionMonitoring();
        this.detectInitialConditions();
        
        console.log(`✅ Adaptive Streaming initialized - Device: ${this.deviceCapability.maxQuality}`);
    }
    
    setupEventListeners() {
        // Video events
        this.video.addEventListener('progress', this.onProgress.bind(this));
        this.video.addEventListener('stalled', this.onStalled.bind(this));
        this.video.addEventListener('waiting', this.onWaiting.bind(this));
        this.video.addEventListener('canplay', this.onCanPlay.bind(this));
        this.video.addEventListener('canplaythrough', this.onCanPlayThrough.bind(this));
        this.video.addEventListener('error', this.onError.bind(this));
        
        // Network events
        window.addEventListener('online', this.onOnline.bind(this));
        window.addEventListener('offline', this.onOffline.bind(this));
        
        // Visibility change (tab switching)
        document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
        
        // Connection change (if supported)
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', this.onConnectionChange.bind(this));
        }
    }
    
    detectDeviceCapability() {
        const capability = {
            maxQuality: '1080p',
            canHandle4K: false,
            isHighEnd: false,
            isMobile: false,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            }
        };
        
        // Detect device type
        const userAgent = navigator.userAgent.toLowerCase();
        capability.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Detect screen resolution
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const maxDimension = Math.max(screenWidth, screenHeight);
        
        // Determine max quality based on screen
        if (maxDimension >= 2160) {
            capability.maxQuality = '4k';
            capability.canHandle4K = true;
        } else if (maxDimension >= 1080) {
            capability.maxQuality = '1080p';
        } else if (maxDimension >= 720) {
            capability.maxQuality = '720p';
        } else {
            capability.maxQuality = '480p';
        }
        
        // Adjust for mobile devices
        if (capability.isMobile) {
            if (capability.maxQuality === '4k') {
                capability.maxQuality = '1080p'; // Limit mobile to 1080p for battery life
            }
        }
        
        // Detect performance capability
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4; // GB
        
        capability.isHighEnd = hardwareConcurrency >= 8 && memory >= 8;
        
        return capability;
    }
    
    detectInitialConditions() {
        // Get initial connection info
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.currentConnection = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
            
            console.log('📶 Initial connection:', this.currentConnection);
            
            // Set initial quality based on connection
            this.setQualityFromConnection();
        } else {
            // Fallback: start with medium quality
            this.recommendQuality('720p');
        }
    }
    
    setQualityFromConnection() {
        if (!this.currentConnection) return;
        
        const { effectiveType, downlink, saveData } = this.currentConnection;
        
        // Respect save data preference
        if (saveData) {
            this.recommendQuality('480p');
            return;
        }
        
        // Quality recommendation based on connection
        let recommendedQuality = '720p';
        
        switch (effectiveType) {
            case 'slow-2g':
            case '2g':
                recommendedQuality = '360p';
                break;
            case '3g':
                recommendedQuality = downlink > 1.5 ? '720p' : '480p';
                break;
            case '4g':
                if (downlink > 10) {
                    recommendedQuality = this.deviceCapability.canHandle4K ? '4k' : '1080p';
                } else if (downlink > 5) {
                    recommendedQuality = '1080p';
                } else {
                    recommendedQuality = '720p';
                }
                break;
            default:
                recommendedQuality = '720p';
        }
        
        // Don't exceed device capability
        recommendedQuality = this.capQualityToDevice(recommendedQuality);
        
        this.recommendQuality(recommendedQuality);
    }
    
    capQualityToDevice(quality) {
        const qualityOrder = ['360p', '480p', '720p', '1080p', '4k'];
        const deviceMaxIndex = qualityOrder.indexOf(this.deviceCapability.maxQuality);
        const requestedIndex = qualityOrder.indexOf(quality);
        
        if (requestedIndex > deviceMaxIndex) {
            return this.deviceCapability.maxQuality;
        }
        
        return quality;
    }
    
    startConnectionMonitoring() {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
        }
        
        // Monitor connection every 5 seconds
        this.connectionMonitor = setInterval(() => {
            this.monitorPerformance();
        }, 5000);
    }
    
    stopConnectionMonitoring() {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
            this.connectionMonitor = null;
        }
    }
    
    monitorPerformance() {
        if (!this.video || this.video.readyState < 2) return;
        
        // Calculate current bandwidth
        const bandwidth = this.calculateBandwidth();
        
        if (bandwidth > 0) {
            this.bandwidthHistory.push({
                bandwidth: bandwidth,
                timestamp: Date.now(),
                quality: this.currentQuality
            });
            
            // Keep history limited
            if (this.bandwidthHistory.length > this.maxHistoryLength) {
                this.bandwidthHistory.shift();
            }
            
            // Analyze performance and adjust quality
            this.analyzePerformanceAndAdjust();
        }
    }
    
    calculateBandwidth() {
        try {
            const buffered = this.video.buffered;
            if (buffered.length === 0) return 0;
            
            const bufferedEnd = buffered.end(buffered.length - 1);
            const currentTime = this.video.currentTime;
            const bufferedAhead = bufferedEnd - currentTime;
            
            // Estimate bandwidth based on buffer health
            if (bufferedAhead < 2) {
                return 'low';
            } else if (bufferedAhead < 5) {
                return 'medium';
            } else {
                return 'high';
            }
            
        } catch (error) {
            return 0;
        }
    }
    
    analyzePerformanceAndAdjust() {
        if (this.currentQuality === 'auto' && this.isEnabled) {
            const recentHistory = this.bandwidthHistory.slice(-5);
            
            if (recentHistory.length < 3) return;
            
            const lowBandwidthCount = recentHistory.filter(h => h.bandwidth === 'low').length;
            const highBandwidthCount = recentHistory.filter(h => h.bandwidth === 'high').length;
            
            // Decide on quality adjustment
            if (lowBandwidthCount >= 3) {
                this.stepDownQuality();
            } else if (highBandwidthCount >= 4) {
                this.stepUpQuality();
            }
        }
    }
    
    stepDownQuality() {
        const qualityOrder = ['4k', '1080p', '720p', '480p', '360p'];
        const currentIndex = qualityOrder.indexOf(this.getCurrentActualQuality());
        
        if (currentIndex < qualityOrder.length - 1) {
            const newQuality = qualityOrder[currentIndex + 1];
            console.log(`📉 Stepping down quality: ${this.getCurrentActualQuality()} → ${newQuality}`);
            this.switchQuality(newQuality);
        }
    }
    
    stepUpQuality() {
        const qualityOrder = ['4k', '1080p', '720p', '480p', '360p'];
        const currentIndex = qualityOrder.indexOf(this.getCurrentActualQuality());
        
        if (currentIndex > 0) {
            const newQuality = qualityOrder[currentIndex - 1];
            
            // Don't exceed device capability
            const cappedQuality = this.capQualityToDevice(newQuality);
            
            if (cappedQuality !== this.getCurrentActualQuality()) {
                console.log(`📈 Stepping up quality: ${this.getCurrentActualQuality()} → ${cappedQuality}`);
                this.switchQuality(cappedQuality);
            }
        }
    }
    
    async switchQuality(newQuality) {
        if (!this.videoPlayer.videoData) return;
        
        try {
            console.log(`🔄 Switching to quality: ${newQuality}`);
            
            // Get streaming URLs for new quality
            const streamingData = await window.catboxIntegration.getStreamingUrls(
                this.videoPlayer.videoData.catbox_video_url,
                newQuality
            );
            
            // Store current time and playing state
            const currentTime = this.video.currentTime;
            const wasPlaying = !this.video.paused;
            
            // Update video source
            const videoSource = this.video.querySelector('source') || this.video;
            videoSource.src = streamingData.primary;
            
            // Wait for new video to load
            this.video.load();
            
            // Restore playback position
            const onLoadedMetadata = () => {
                this.video.currentTime = currentTime;
                
                if (wasPlaying) {
                    this.video.play().catch(error => {
                        console.log('Auto-play after quality change failed:', error);
                    });
                }
                
                this.video.removeEventListener('loadedmetadata', onLoadedMetadata);
            };
            
            this.video.addEventListener('loadedmetadata', onLoadedMetadata);
            
            // Update UI
            this.updateQualityDisplay(newQuality);
            
            // Track quality change
            this.trackQualityChange(this.getCurrentActualQuality(), newQuality);
            
        } catch (error) {
            console.error('Error switching quality:', error);
        }
    }
    
    updateQualityDisplay(quality) {
        const qualityDisplay = document.getElementById('current-quality');
        if (qualityDisplay) {
            qualityDisplay.textContent = quality === 'auto' ? 'Auto' : quality.toUpperCase();
        }
        
        // Update quality menu
        const qualityMenu = document.getElementById('quality-menu');
        if (qualityMenu) {
            qualityMenu.querySelectorAll('.quality-option').forEach(option => {
                option.classList.remove('active');
                if (option.dataset.quality === quality) {
                    option.classList.add('active');
                }
            });
        }
    }
    
    // Public API methods
    changeQuality(quality) {
        console.log(`🎯 Manual quality change requested: ${quality}`);
        
        this.currentQuality = quality;
        
        if (quality === 'auto') {
            this.isEnabled = true;
            this.detectInitialConditions();
        } else {
            this.isEnabled = false;
            this.switchQuality(quality);
        }
        
        this.updateQualityDisplay(quality);
    }
    
    getCurrentActualQuality() {
        // Try to detect actual quality from video dimensions
        if (this.video.videoWidth && this.video.videoHeight) {
            const height = this.video.videoHeight;
            
            if (height >= 2160) return '4k';
            if (height >= 1080) return '1080p';
            if (height >= 720) return '720p';
            if (height >= 480) return '480p';
            return '360p';
        }
        
        return this.currentQuality === 'auto' ? '720p' : this.currentQuality;
    }
    
    recommendQuality(quality) {
        if (this.currentQuality === 'auto' && this.isEnabled) {
            console.log(`💡 Recommending quality: ${quality}`);
            this.switchQuality(quality);
        }
    }
    
    getAvailableQualities() {
        // Filter qualities based on device capability
        const deviceMaxQuality = this.deviceCapability.maxQuality;
        const qualityOrder = ['360p', '480p', '720p', '1080p', '4k'];
        const deviceMaxIndex = qualityOrder.indexOf(deviceMaxQuality);
        
        const available = ['auto'].concat(qualityOrder.slice(0, deviceMaxIndex + 1));
        
        return available;
    }
    
    // Event handlers
    onProgress(e) {
        // Update buffer progress
        if (this.video.buffered.length > 0) {
            const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
            const bufferHealth = (bufferedEnd - this.video.currentTime);
            
            // If buffer is getting low, consider quality reduction
            if (bufferHealth < 1 && this.isEnabled) {
                this.handleLowBuffer();
            }
        }
    }
    
    onStalled(e) {
        console.log('📱 Video stalled - considering quality reduction');
        this.handleBufferingIssue();
    }
    
    onWaiting(e) {
        console.log('⏳ Video waiting - buffering');
        this.handleBufferingIssue();
    }
    
    onCanPlay(e) {
        console.log('▶️ Video can play');
    }
    
    onCanPlayThrough(e) {
        console.log('🎬 Video can play through - good performance');
        
        // Good performance indicator - maybe we can step up quality
        if (this.isEnabled) {
            setTimeout(() => {
                this.considerQualityIncrease();
            }, 3000);
        }
    }
    
    onError(e) {
        console.error('❌ Video error - trying lower quality');
        
        if (this.isEnabled) {
            this.handleVideoError();
        }
    }
    
    onOnline(e) {
        console.log('🌐 Connection restored');
        this.setQualityFromConnection();
    }
    
    onOffline(e) {
        console.log('📵 Connection lost');
        // Pause video to prevent errors
        this.video.pause();
    }
    
    onVisibilityChange(e) {
        if (document.hidden) {
            // Tab is hidden - reduce quality to save bandwidth
            if (this.isEnabled && !this.video.paused) {
                this.recommendQuality('480p');
            }
        } else {
            // Tab is visible again - restore quality
            if (this.isEnabled) {
                setTimeout(() => {
                    this.setQualityFromConnection();
                }, 1000);
            }
        }
    }
    
    onConnectionChange(e) {
        if ('connection' in navigator) {
            this.currentConnection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
            
            console.log('📶 Connection changed:', this.currentConnection);
            
            if (this.isEnabled) {
                // Debounce connection changes
                clearTimeout(this.qualityChangeTimeout);
                this.qualityChangeTimeout = setTimeout(() => {
                    this.setQualityFromConnection();
                }, 2000);
            }
        }
    }
    
    // Issue handlers
    handleLowBuffer() {
        if (this.qualityChangeTimeout) return; // Don't change too frequently
        
        this.qualityChangeTimeout = setTimeout(() => {
            if (this.getCurrentActualQuality() !== '360p') {
                this.stepDownQuality();
            }
            this.qualityChangeTimeout = null;
        }, 2000);
    }
    
    handleBufferingIssue() {
        if (!this.isEnabled) return;
        
        // Immediately step down quality on buffering issues
        if (this.getCurrentActualQuality() !== '360p') {
            this.stepDownQuality();
        }
    }
    
    handleVideoError() {
        // Try lower quality on error
        const qualityOrder = ['4k', '1080p', '720p', '480p', '360p'];
        const currentIndex = qualityOrder.indexOf(this.getCurrentActualQuality());
        
        if (currentIndex < qualityOrder.length - 1) {
            const fallbackQuality = qualityOrder[currentIndex + 1];
            console.log(`🆘 Falling back to quality: ${fallbackQuality}`);
            this.switchQuality(fallbackQuality);
        }
    }
    
    considerQualityIncrease() {
        const bufferHealth = this.getBufferHealth();
        
        if (bufferHealth > 5 && this.getCurrentActualQuality() !== this.deviceCapability.maxQuality) {
            this.stepUpQuality();
        }
    }
    
    getBufferHealth() {
        try {
            if (this.video.buffered.length === 0) return 0;
            
            const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
            return bufferedEnd - this.video.currentTime;
        } catch (error) {
            return 0;
        }
    }
    
    // Analytics
    trackQualityChange(fromQuality, toQuality) {
        const analyticsData = {
            from_quality: fromQuality,
            to_quality: toQuality,
            timestamp: new Date().toISOString(),
            reason: 'adaptive_streaming',
            device_capability: this.deviceCapability,
            connection: this.currentConnection,
            buffer_health: this.getBufferHealth()
        };
        
        // Store in analytics
        const analytics = JSON.parse(localStorage.getItem('xshiver_quality_analytics') || '[]');
        analytics.push(analyticsData);
        
        // Keep only last 50 changes
        if (analytics.length > 50) {
            analytics.splice(0, analytics.length - 50);
        }
        
        localStorage.setItem('xshiver_quality_analytics', JSON.stringify(analytics));
        
        console.log('📊 Quality change tracked:', analyticsData);
    }
    
    getAnalytics() {
        const analytics = JSON.parse(localStorage.getItem('xshiver_quality_analytics') || '[]');
        
        const stats = {
            total_changes: analytics.length,
            quality_distribution: {},
            avg_quality_score: 0,
            frequent_changes: 0
        };
        
        // Calculate quality distribution
        ['4k', '1080p', '720p', '480p', '360p'].forEach(quality => {
            stats.quality_distribution[quality] = analytics.filter(a => a.to_quality === quality).length;
        });
        
        // Calculate average quality score
        const qualityScores = { '4k': 5, '1080p': 4, '720p': 3, '480p': 2, '360p': 1 };
        if (analytics.length > 0) {
            const totalScore = analytics.reduce((sum, a) => sum + (qualityScores[a.to_quality] || 3), 0);
            stats.avg_quality_score = (totalScore / analytics.length).toFixed(1);
        }
        
        // Count frequent changes (more than 3 changes in 5 minutes)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        stats.frequent_changes = analytics.filter(a => 
            new Date(a.timestamp).getTime() > fiveMinutesAgo
        ).length;
        
        return stats;
    }
    
    // Cleanup
    destroy() {
        this.stopConnectionMonitoring();
        
        if (this.qualityChangeTimeout) {
            clearTimeout(this.qualityChangeTimeout);
        }
        
        // Remove event listeners
        this.video.removeEventListener('progress', this.onProgress);
        this.video.removeEventListener('stalled', this.onStalled);
        this.video.removeEventListener('waiting', this.onWaiting);
        this.video.removeEventListener('canplay', this.onCanPlay);
        this.video.removeEventListener('canplaythrough', this.onCanPlayThrough);
        this.video.removeEventListener('error', this.onError);
        
        window.removeEventListener('online', this.onOnline);
        window.removeEventListener('offline', this.onOffline);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        
        if ('connection' in navigator) {
            navigator.connection.removeEventListener('change', this.onConnectionChange);
        }
        
        console.log('🗑️ Adaptive Streaming destroyed');
    }
}

// Export for global use
window.AdaptiveStreaming = AdaptiveStreaming;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveStreaming;
}
