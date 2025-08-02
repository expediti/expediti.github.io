/**
 * Chromecast Support for Xshiver Video Player
 * Enables casting videos to TV and smart devices
 */

class ChromecastSupport {
    constructor() {
        this.isAvailable = false;
        this.isConnected = false;
        this.currentSession = null;
        this.currentMedia = null;
        this.applicationId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
        
        this.init();
    }
    
    async init() {
        console.log('📺 Initializing Chromecast support...');
        
        try {
            await this.loadCastSDK();
            this.setupCastFramework();
        } catch (error) {
            console.log('Chromecast not available:', error);
        }
    }
    
    loadCastSDK() {
        return new Promise((resolve, reject) => {
            // Check if Cast SDK is already loaded
            if (window.chrome && window.chrome.cast) {
                resolve();
                return;
            }
            
            // Load Cast SDK script
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
            script.async = true;
            
            script.onload = () => {
                // Wait for Cast API to be ready
                window['__onGCastApiAvailable'] = (isAvailable) => {
                    if (isAvailable) {
                        resolve();
                    } else {
                        reject(new Error('Cast API not available'));
                    }
                };
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Cast SDK'));
            };
            
            document.head.appendChild(script);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Cast SDK load timeout'));
            }, 10000);
        });
    }
    
    setupCastFramework() {
        const context = cast.framework.CastContext.getInstance();
        
        context.setOptions({
            receiverApplicationId: this.applicationId,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });
        
        // Listen for Cast state changes
        context.addEventListener(
            cast.framework.CastContextEventType.CAST_STATE_CHANGED,
            this.onCastStateChanged.bind(this)
        );
        
        // Listen for session changes
        context.addEventListener(
            cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            this.onSessionStateChanged.bind(this)
        );
        
        this.isAvailable = true;
        this.updateCastButton();
        
        console.log('✅ Chromecast support initialized');
    }
    
    onCastStateChanged(event) {
        console.log('📺 Cast state changed:', event.castState);
        
        switch (event.castState) {
            case cast.framework.CastState.NO_DEVICES_AVAILABLE:
                this.hidecastButton();
                break;
            case cast.framework.CastState.NOT_CONNECTED:
                this.isConnected = false;
                this.updateCastButton();
                break;
            case cast.framework.CastState.CONNECTING:
                this.updateCastButton();
                break;
            case cast.framework.CastState.CONNECTED:
                this.isConnected = true;
                this.currentSession = cast.framework.CastContext.getInstance().getCurrentSession();
                this.updateCastButton();
                break;
        }
    }
    
    onSessionStateChanged(event) {
        console.log('📺 Session state changed:', event.sessionState);
        
        switch (event.sessionState) {
            case cast.framework.SessionState.SESSION_STARTED:
                this.onSessionStarted(event.session);
                break;
            case cast.framework.SessionState.SESSION_RESUMED:
                this.onSessionResumed(event.session);
                break;
            case cast.framework.SessionState.SESSION_ENDED:
                this.onSessionEnded();
                break;
        }
    }
    
    onSessionStarted(session) {
        console.log('📺 Cast session started');
        this.currentSession = session;
        
        // Show cast controls
        this.showCastControls();
        
        // Track casting start
        this.trackCastEvent('session_started');
    }
    
    onSessionResumed(session) {
        console.log('📺 Cast session resumed');
        this.currentSession = session;
        
        // Get current media
        const mediaSession = session.getMediaSession();
        if (mediaSession) {
            this.currentMedia = mediaSession;
            this.syncWithCastMedia();
        }
        
        this.showCastControls();
        this.trackCastEvent('session_resumed');
    }
    
    onSessionEnded() {
        console.log('📺 Cast session ended');
        
        this.currentSession = null;
        this.currentMedia = null;
        this.isConnected = false;
        
        // Hide cast controls
        this.hideCastControls();
        
        // Resume local playback
        this.resumeLocalPlayback();
        
        this.trackCastEvent('session_ended');
    }
    
    // Public API methods
    async initiateCast(videoData) {
        if (!this.isAvailable) {
            throw new Error('Chromecast not available');
        }
        
        try {
            console.log('📺 Initiating cast for:', videoData.title);
            
            const context = cast.framework.CastContext.getInstance();
            
            if (this.isConnected) {
                // Already connected, load media
                await this.loadMediaToCast(videoData);
            } else {
                // Request session
                await context.requestSession();
                // Media will be loaded in onSessionStarted
                this.pendingVideoData = videoData;
            }
            
        } catch (error) {
            console.error('Cast initiation failed:', error);
            throw error;
        }
    }
    
    async loadMediaToCast(videoData) {
        if (!this.currentSession) {
            throw new Error('No active cast session');
        }
        
        try {
            // Create media info
            const mediaInfo = new chrome.cast.media.MediaInfo(
                videoData.catbox_video_url,
                'video/mp4'
            );
            
            mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
            mediaInfo.metadata.title = videoData.title;
            mediaInfo.metadata.subtitle = videoData.description;
            mediaInfo.metadata.images = [
                new chrome.cast.Image(videoData.catbox_thumbnail_url)
            ];
            
            // Set duration if available
            if (videoData.duration) {
                mediaInfo.duration = videoData.duration;
            }
            
            // Create load request
            const request = new chrome.cast.media.LoadRequest(mediaInfo);
            
            // Set current time if video is playing locally
            if (window.xshiverPlayer && window.xshiverPlayer.video) {
                request.currentTime = window.xshiverPlayer.video.currentTime;
                
                // Pause local video
                window.xshiverPlayer.video.pause();
            }
            
            // Load media on cast device
            const mediaSession = await this.currentSession.loadMedia(request);
            
            this.currentMedia = mediaSession;
            this.setupMediaListeners();
            
            // Show cast controls
            this.showCastControls();
            
            console.log('✅ Media loaded to cast device');
            this.trackCastEvent('media_loaded', { title: videoData.title });
            
        } catch (error) {
            console.error('Failed to load media to cast:', error);
            throw error;
        }
    }
    
    setupMediaListeners() {
        if (!this.currentMedia) return;
        
        this.currentMedia.addUpdateListener((isAlive) => {
            if (isAlive) {
                this.updateCastControls();
            }
        });
    }
    
    async stopCasting() {
        if (!this.currentSession) return;
        
        try {
            await this.currentSession.endSession(true);
            console.log('📺 Cast session ended by user');
        } catch (error) {
            console.error('Failed to stop casting:', error);
        }
    }
    
    // Cast control methods
    async playCast() {
        if (!this.currentMedia) return;
        
        try {
            await this.currentMedia.play();
            this.updateCastControls();
        } catch (error) {
            console.error('Cast play failed:', error);
        }
    }
    
    async pauseCast() {
        if (!this.currentMedia) return;
        
        try {
            await this.currentMedia.pause();
            this.updateCastControls();
        } catch (error) {
            console.error('Cast pause failed:', error);
        }
    }
    
    async seekCast(time) {
        if (!this.currentMedia) return;
        
        try {
            const request = new chrome.cast.media.SeekRequest();
            request.currentTime = time;
            
            await this.currentMedia.seek(request);
            this.updateCastControls();
        } catch (error) {
            console.error('Cast seek failed:', error);
        }
    }
    
    async setVolumeCast(volume) {
        if (!this.currentSession) return;
        
        try {
            const volumeRequest = new chrome.cast.Volume(volume, false);
            const request = new chrome.cast.media.VolumeRequest(volumeRequest);
            
            await this.currentMedia.setVolume(request);
            this.updateCastControls();
        } catch (error) {
            console.error('Cast volume change failed:', error);
        }
    }
    
    // UI management
    updateCastButton() {
        const castBtn = document.getElementById('cast-btn');
        if (!castBtn) return;
        
        if (!this.isAvailable) {
            castBtn.style.display = 'none';
            return;
        }
        
        castBtn.style.display = 'flex';
        
        // Update button appearance based on connection state
        if (this.isConnected) {
            castBtn.classList.add('casting');
            castBtn.style.color = '#4A90E2';
            castBtn.title = 'Casting - Click to stop';
        } else {
            castBtn.classList.remove('casting');
            castBtn.style.color = '';
            castBtn.title = 'Cast to TV';
        }
        
        // Update click handler
        castBtn.onclick = () => {
            if (this.isConnected) {
                this.stopCasting();
            } else {
                this.initiateCastFromButton();
            }
        };
    }
    
    hidecastButton() {
        const castBtn = document.getElementById('cast-btn');
        if (castBtn) {
            castBtn.style.display = 'none';
        }
    }
    
    async initiateCastFromButton() {
        if (window.xshiverPlayer && window.xshiverPlayer.videoData) {
            try {
                await this.initiateCast(window.xshiverPlayer.videoData);
            } catch (error) {
                this.showCastError('Failed to start casting');
            }
        } else {
            this.showCastError('No video to cast');
        }
    }
    
    showCastControls() {
        // Create or show cast control panel
        let castControls = document.getElementById('cast-controls');
        
        if (!castControls) {
            castControls = this.createCastControls();
            document.body.appendChild(castControls);
        }
        
        castControls.classList.add('visible');
        this.updateCastControls();
    }
    
    hideCastControls() {
        const castControls = document.getElementById('cast-controls');
        if (castControls) {
            castControls.classList.remove('visible');
        }
    }
    
    createCastControls() {
        const controls = document.createElement('div');
        controls.id = 'cast-controls';
        controls.className = 'cast-controls-panel';
        
        controls.innerHTML = `
            <div class="cast-controls-content">
                <div class="cast-info">
                    <div class="cast-icon">📺</div>
                    <div class="cast-text">
                        <div class="cast-device-name" id="cast-device-name">Casting to TV</div>
                        <div class="cast-media-title" id="cast-media-title">Video Title</div>
                    </div>
                </div>
                <div class="cast-controls-buttons">
                    <button id="cast-play-pause" class="cast-control-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>
                    <div class="cast-time-display">
                        <span id="cast-current-time">0:00</span>
                        <span>/</span>
                        <span id="cast-duration">0:00</span>
                    </div>
                    <button id="cast-stop" class="cast-control-btn" title="Stop Casting">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <rect x="6" y="6" width="12" height="12"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="cast-progress-container">
                <div class="cast-progress-bar" id="cast-progress-bar">
                    <div class="cast-progress-filled" id="cast-progress-filled"></div>
                </div>
            </div>
        `;
        
        // Add event listeners
        controls.querySelector('#cast-play-pause').onclick = () => {
            if (this.currentMedia) {
                if (this.currentMedia.playerState === chrome.cast.media.PlayerState.PLAYING) {
                    this.pauseCast();
                } else {
                    this.playCast();
                }
            }
        };
        
        controls.querySelector('#cast-stop').onclick = () => {
            this.stopCasting();
        };
        
        // Progress bar click
        const progressBar = controls.querySelector('#cast-progress-bar');
        progressBar.onclick = (e) => {
            if (this.currentMedia && this.currentMedia.duration) {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const time = percent * this.currentMedia.duration;
                this.seekCast(time);
            }
        };
        
        return controls;
    }
    
    updateCastControls() {
        if (!this.currentMedia || !this.currentSession) return;
        
        // Update device name
        const deviceName = document.getElementById('cast-device-name');
        if (deviceName) {
            deviceName.textContent = `Casting to ${this.currentSession.getReceiverFriendlyName()}`;
        }
        
        // Update media title
        const mediaTitle = document.getElementById('cast-media-title');
        if (mediaTitle && this.currentMedia.metadata) {
            mediaTitle.textContent = this.currentMedia.metadata.title || 'Unknown';
        }
        
        // Update play/pause button
        const playPauseBtn = document.getElementById('cast-play-pause');
        if (playPauseBtn) {
            const isPlaying = this.currentMedia.playerState === chrome.cast.media.PlayerState.PLAYING;
            
            playPauseBtn.innerHTML = isPlaying ? `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
            ` : `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <polygon points="5,3 19,12 5,21"></polygon>
                </svg>
            `;
        }
        
        // Update time displays
        const currentTimeEl = document.getElementById('cast-current-time');
        const durationEl = document.getElementById('cast-duration');
        
        if (currentTimeEl && this.currentMedia.getEstimatedTime) {
            currentTimeEl.textContent = this.formatTime(this.currentMedia.getEstimatedTime());
        }
        
        if (durationEl && this.currentMedia.duration) {
            durationEl.textContent = this.formatTime(this.currentMedia.duration);
        }
        
        // Update progress bar
        const progressFilled = document.getElementById('cast-progress-filled');
        if (progressFilled && this.currentMedia.duration) {
            const progress = (this.currentMedia.getEstimatedTime() / this.currentMedia.duration) * 100;
            progressFilled.style.width = `${progress}%`;
        }
    }
    
    syncWithCastMedia() {
        if (!this.currentMedia) return;
        
        // Sync local player with cast playback
        if (window.xshiverPlayer && window.xshiverPlayer.video) {
            const localVideo = window.xshiverPlayer.video;
            
            // Pause local video
            localVideo.pause();
            
            // Sync time
            localVideo.currentTime = this.currentMedia.getEstimatedTime();
        }
    }
    
    resumeLocalPlayback() {
        if (!window.xshiverPlayer || !window.xshiverPlayer.video) return;
        
        const localVideo = window.xshiverPlayer.video;
        
        // Sync time from cast if available
        if (this.currentMedia && this.currentMedia.getEstimatedTime) {
            localVideo.currentTime = this.currentMedia.getEstimatedTime();
        }
        
        // Resume playback
        localVideo.play().catch(error => {
            console.log('Auto-resume after casting failed:', error);
        });
    }
    
    showCastError(message) {
        // Show error notification
        const errorEl = document.createElement('div');
        errorEl.className = 'cast-error-notification';
        errorEl.textContent = message;
        
        errorEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            errorEl.remove();
        }, 3000);
    }
    
    // Utility methods
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    trackCastEvent(event, data = {}) {
        // Google Analytics 4 event tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'cast_' + event, {
                device_name: this.currentSession ? this.currentSession.getReceiverFriendlyName() : 'unknown',
                ...data
            });
        }
        
        // Custom analytics
        const analytics = JSON.parse(localStorage.getItem('xshiver_cast_analytics') || '[]');
        analytics.push({
            event,
            data,
            timestamp: new Date().toISOString(),
            session_id: this.currentSession ? this.currentSession.getSessionId() : null
        });
        
        // Keep only last 50 events
        if (analytics.length > 50) {
            analytics.splice(0, analytics.length - 50);
        }
        
        localStorage.setItem('xshiver_cast_analytics', JSON.stringify(analytics));
        
        console.log(`📊 Cast event tracked: ${event}`, data);
    }
    
    // Public getters
    get isSupported() {
        return this.isAvailable;
    }
    
    get isCasting() {
        return this.isConnected;
    }
    
    get currentDevice() {
        return this.currentSession ? this.currentSession.getReceiverFriendlyName() : null;
    }
    
    // Cleanup
    destroy() {
        if (this.currentSession) {
            this.stopCasting();
        }
        
        const castControls = document.getElementById('cast-controls');
        if (castControls) {
            castControls.remove();
        }
        
        console.log('🗑️ Chromecast support destroyed');
    }
}

// Initialize global Chromecast support
document.addEventListener('DOMContentLoaded', () => {
    window.ChromecastSupport = new ChromecastSupport();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChromecastSupport;
}
