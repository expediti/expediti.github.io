/**
 * Xshiver Custom Video Player
 * Advanced video player with Catbox integration and adaptive streaming
 */

class XshiverVideoPlayer {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.video = this.container.querySelector('#main-video');
        this.options = {
            autoplay: false,
            loop: false,
            muted: false,
            volume: 0.8,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            qualities: ['auto', '4k', '1080p', '720p', '480p'],
            ...options
        };
        
        this.isPlaying = false;
        this.isMuted = false;
        this.isFullscreen = false;
        this.isTheaterMode = false;
        this.currentVolume = this.options.volume;
        this.currentTime = 0;
        this.duration = 0;
        this.playbackRate = 1;
        this.currentQuality = 'auto';
        this.videoData = null;
        
        this.controlsTimeout = null;
        this.progressUpdateInterval = null;
        
        this.init();
    }
    
    init() {
        console.log('🎬 Initializing Xshiver Video Player...');
        
        this.bindElements();
        this.setupEventListeners();
        this.loadVideoFromURL();
        this.initializeControls();
        this.setupKeyboardShortcuts();
        this.setupTouchControls();
        this.setupAdaptiveStreaming();
        
        console.log('✅ Video player initialized');
    }
    
    bindElements() {
        // Control elements
        this.bigPlayBtn = this.container.querySelector('#big-play-btn');
        this.playPauseBtn = this.container.querySelector('#play-pause-btn');
        this.volumeBtn = this.container.querySelector('#volume-btn');
        this.fullscreenBtn = this.container.querySelector('#fullscreen-btn');
        this.speedBtn = this.container.querySelector('#speed-btn');
        this.qualityBtn = this.container.querySelector('#quality-btn');
        this.castBtn = this.container.querySelector('#cast-btn');
        
        // Progress elements
        this.progressBar = this.container.querySelector('#progress-bar');
        this.progressFilled = this.container.querySelector('#progress-filled');
        this.progressBuffer = this.container.querySelector('#progress-buffer');
        this.progressThumb = this.container.querySelector('#progress-thumb');
        
        // Volume elements
        this.volumeSlider = this.container.querySelector('#volume-slider');
        this.volumeFilled = this.container.querySelector('#volume-filled');
        this.volumeThumb = this.container.querySelector('#volume-thumb');
        
        // Time elements
        this.currentTimeDisplay = this.container.querySelector('#current-time');
        this.durationDisplay = this.container.querySelector('#duration-time');
        
        // Menu elements
        this.qualityMenu = this.container.querySelector('#quality-menu');
        this.speedMenu = this.container.querySelector('#speed-menu');
        
        // Overlay elements
        this.controlsOverlay = this.container.querySelector('#controls-overlay');
        this.loadingOverlay = this.container.querySelector('#video-loading');
        
        // Info elements
        this.videoTitle = document.getElementById('current-video-title');
        this.currentQualityDisplay = document.getElementById('current-quality');
        this.speedText = document.getElementById('speed-text');
    }
    
    setupEventListeners() {
        // Video events
        this.video.addEventListener('loadstart', this.onLoadStart.bind(this));
        this.video.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
        this.video.addEventListener('canplay', this.onCanPlay.bind(this));
        this.video.addEventListener('play', this.onPlay.bind(this));
        this.video.addEventListener('pause', this.onPause.bind(this));
        this.video.addEventListener('ended', this.onEnded.bind(this));
        this.video.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
        this.video.addEventListener('progress', this.onProgress.bind(this));
        this.video.addEventListener('volumechange', this.onVolumeChange.bind(this));
        this.video.addEventListener('ratechange', this.onRateChange.bind(this));
        this.video.addEventListener('error', this.onError.bind(this));
        
        // Control button events
        this.bigPlayBtn?.addEventListener('click', this.togglePlayPause.bind(this));
        this.playPauseBtn?.addEventListener('click', this.togglePlayPause.bind(this));
        this.volumeBtn?.addEventListener('click', this.toggleMute.bind(this));
        this.fullscreenBtn?.addEventListener('click', this.toggleFullscreen.bind(this));
        this.speedBtn?.addEventListener('click', this.toggleSpeedMenu.bind(this));
        this.qualityBtn?.addEventListener('click', this.toggleQualityMenu.bind(this));
        this.castBtn?.addEventListener('click', this.initiateCast.bind(this));
        
        // Progress bar events
        if (this.progressBar) {
            this.progressBar.addEventListener('click', this.seekToPosition.bind(this));
            this.progressBar.addEventListener('mousemove', this.updateProgressThumb.bind(this));
        }
        
        // Volume slider events
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('click', this.setVolumeFromClick.bind(this));
            this.volumeSlider.addEventListener('mousemove', this.updateVolumeThumb.bind(this));
        }
        
        // Menu events
        this.setupMenuEvents();
        
        // Container events
        this.container.addEventListener('mousemove', this.showControls.bind(this));
        this.container.addEventListener('mouseleave', this.hideControls.bind(this));
        this.container.addEventListener('click', this.handleContainerClick.bind(this));
        
        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
    }
    
    setupMenuEvents() {
        // Quality menu events
        if (this.qualityMenu) {
            this.qualityMenu.querySelectorAll('.quality-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    this.changeQuality(e.target.dataset.quality);
                });
            });
        }
        
        // Speed menu events
        if (this.speedMenu) {
            this.speedMenu.querySelectorAll('.speed-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    this.changePlaybackRate(parseFloat(e.target.dataset.speed));
                });
            });
        }
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.qualityBtn?.contains(e.target) && !this.qualityMenu?.contains(e.target)) {
                this.hideQualityMenu();
            }
            if (!this.speedBtn?.contains(e.target) && !this.speedMenu?.contains(e.target)) {
                this.hideSpeedMenu();
            }
        });
    }
    
    loadVideoFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        
        if (videoId) {
            this.loadVideo(videoId);
        } else {
            console.error('No video ID provided in URL');
            this.showError('No video specified');
        }
    }
    
    async loadVideo(videoId) {
        try {
            console.log(`🔍 Loading video: ${videoId}`);
            this.showLoading();
            
            // Get video data from database
            const videoData = await window.videoDatabase.getVideo(videoId);
            
            if (!videoData) {
                throw new Error('Video not found');
            }
            
            this.videoData = videoData;
            
            // Set video source
            const videoSource = this.container.querySelector('#video-source');
            videoSource.src = videoData.catbox_video_url;
            
            // Update page metadata
            this.updatePageMetadata(videoData);
            
            // Load video
            this.video.load();
            
            // Set initial volume
            this.video.volume = this.currentVolume;
            
            // Load related videos
            this.loadRelatedVideos(videoData.category, videoData.tags);
            
        } catch (error) {
            console.error('Error loading video:', error);
            this.showError(`Failed to load video: ${error.message}`);
        }
    }
    
    updatePageMetadata(videoData) {
        // Update page title
        document.title = `${videoData.title} - Xshiver`;
        document.getElementById('video-title').textContent = `${videoData.title} - Xshiver`;
        
        // Update meta description
        document.getElementById('video-description').content = videoData.description;
        
        // Update Open Graph tags
        document.getElementById('og-title').content = videoData.title;
        document.getElementById('og-description').content = videoData.description;
        document.getElementById('og-video').content = videoData.catbox_video_url;
        document.getElementById('og-thumbnail').content = videoData.catbox_thumbnail_url;
        
        // Update video title in player
        if (this.videoTitle) {
            this.videoTitle.textContent = videoData.title;
        }
        
        // Update video info section
        this.updateVideoInfo(videoData);
        
        // Update schema markup
        this.updateSchemaMarkup(videoData);
    }
    
    updateVideoInfo(videoData) {
        // Update views
        const viewsElement = document.getElementById('video-views');
        if (viewsElement) {
            viewsElement.textContent = `${videoData.view_count.toLocaleString()} views`;
        }
        
        // Update upload date
        const dateElement = document.getElementById('upload-date');
        if (dateElement) {
            const date = new Date(videoData.upload_date);
            dateElement.textContent = date.toLocaleDateString();
        }
        
        // Update duration
        const durationElement = document.getElementById('video-duration');
        if (durationElement) {
            durationElement.textContent = this.formatTime(videoData.duration);
        }
        
        // Update rating
        const ratingElement = document.getElementById('rating-text');
        if (ratingElement) {
            ratingElement.textContent = `${videoData.rating}/5`;
        }
        
        // Update rating stars
        this.updateRatingStars(videoData.rating);
        
        // Update description
        const descElement = document.getElementById('video-description-text');
        if (descElement) {
            descElement.textContent = videoData.description;
        }
        
        // Update tags
        this.updateVideoTags(videoData.tags);
    }
    
    updateRatingStars(rating) {
        const starsContainer = document.getElementById('rating-stars');
        if (!starsContainer) return;
        
        const stars = starsContainer.querySelectorAll('.star');
        const fullStars = Math.floor(rating);
        
        stars.forEach((star, index) => {
            if (index < fullStars) {
                star.textContent = '★';
            } else {
                star.textContent = '☆';
            }
        });
    }
    
    updateVideoTags(tags) {
        const tagsContainer = document.getElementById('video-tags');
        if (!tagsContainer || !tags) return;
        
        tagsContainer.innerHTML = '';
        
        tags.forEach(tag => {
            const tagElement = document.createElement('a');
            tagElement.className = 'video-tag';
            tagElement.href = `#`; // In real app: `/search?tag=${encodeURIComponent(tag)}`
            tagElement.textContent = `#${tag}`;
            tagsContainer.appendChild(tagElement);
        });
    }
    
    updateSchemaMarkup(videoData) {
        const schemaScript = document.getElementById('video-schema');
        if (schemaScript) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "VideoObject",
                "name": videoData.title,
                "description": videoData.description,
                "thumbnailUrl": videoData.catbox_thumbnail_url,
                "uploadDate": videoData.upload_date,
                "duration": `PT${videoData.duration}S`,
                "contentUrl": videoData.catbox_video_url,
                "embedUrl": window.location.href,
                "interactionCount": videoData.view_count
            };
            
            schemaScript.textContent = JSON.stringify(schema);
        }
    }
    
    // Video event handlers
    onLoadStart() {
        console.log('📹 Video load started');
        this.showLoading();
    }
    
    onLoadedMetadata() {
        console.log('📊 Video metadata loaded');
        this.duration = this.video.duration;
        this.updateDurationDisplay();
        this.initializeProgress();
    }
    
    onCanPlay() {
        console.log('✅ Video ready to play');
        this.hideLoading();
        
        // Auto-play if enabled and allowed by browser
        if (this.options.autoplay) {
            this.play().catch(error => {
                console.log('Autoplay prevented:', error);
            });
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        this.updatePlayPauseButton();
        this.hideBigPlayButton();
        this.startProgressUpdates();
        
        // Track play event
        this.trackEvent('video_play');
    }
    
    onPause() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.showBigPlayButton();
        this.stopProgressUpdates();
        
        // Track pause event
        this.trackEvent('video_pause');
    }
    
    onEnded() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.showBigPlayButton();
        this.stopProgressUpdates();
        
        // Track completion
        this.trackEvent('video_complete');
        
        // Auto-advance to next video or show replay
        this.handleVideoEnd();
    }
    
    onTimeUpdate() {
        this.currentTime = this.video.currentTime;
        this.updateProgressBar();
        this.updateCurrentTimeDisplay();
        
        // Track progress milestones
        this.trackProgressMilestones();
    }
    
    onProgress() {
        this.updateBufferProgress();
    }
    
    onVolumeChange() {
        this.currentVolume = this.video.volume;
        this.isMuted = this.video.muted;
        this.updateVolumeDisplay();
        this.updateVolumeButton();
    }
    
    onRateChange() {
        this.playbackRate = this.video.playbackRate;
        this.updateSpeedDisplay();
    }
    
    onError(error) {
        console.error('Video error:', error);
        this.showError('Failed to load video. Please try again.');
    }
    
    // Control methods
    async play() {
        try {
            await this.video.play();
        } catch (error) {
            console.error('Play failed:', error);
            throw error;
        }
    }
    
    pause() {
        this.video.pause();
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    seek(time) {
        if (time >= 0 && time <= this.duration) {
            this.video.currentTime = time;
        }
    }
    
    seekToPosition(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * this.duration;
        this.seek(time);
    }
    
    setVolume(volume) {
        this.video.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggleMute() {
        this.video.muted = !this.video.muted;
    }
    
    setVolumeFromClick(e) {
        const rect = this.volumeSlider.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const volume = Math.max(0, Math.min(1, percent));
        this.setVolume(volume);
        
        // Unmute if setting volume
        if (this.video.muted && volume > 0) {
            this.video.muted = false;
        }
    }
    
    changePlaybackRate(rate) {
        this.video.playbackRate = rate;
        this.hideSpeedMenu();
        this.updateSpeedMenuActive(rate);
    }
    
    changeQuality(quality) {
        console.log(`🎥 Changing quality to: ${quality}`);
        this.currentQuality = quality;
        this.hideQualityMenu();
        this.updateQualityDisplay(quality);
        this.updateQualityMenuActive(quality);
        
        // Implement quality switching logic
        if (window.adaptiveStreaming) {
            window.adaptiveStreaming.changeQuality(quality);
        }
    }
    
    // Fullscreen methods
    async toggleFullscreen() {
        if (this.isFullscreen) {
            await this.exitFullscreen();
        } else {
            await this.enterFullscreen();
        }
    }
    
    async enterFullscreen() {
        try {
            if (this.container.requestFullscreen) {
                await this.container.requestFullscreen();
            } else if (this.container.webkitRequestFullscreen) {
                await this.container.webkitRequestFullscreen();
            } else if (this.container.mozRequestFullScreen) {
                await this.container.mozRequestFullScreen();
            } else if (this.container.msRequestFullscreen) {
                await this.container.msRequestFullscreen();
            }
        } catch (error) {
            console.error('Fullscreen request failed:', error);
        }
    }
    
    async exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
        } catch (error) {
            console.error('Exit fullscreen failed:', error);
        }
    }
    
    onFullscreenChange() {
        this.isFullscreen = !!(document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.mozFullScreenElement || 
                              document.msFullscreenElement);
        
        this.updateFullscreenButton();
        
        if (this.isFullscreen) {
            this.trackEvent('fullscreen_enter');
        } else {
            this.trackEvent('fullscreen_exit');
        }
    }
    
    // Theater mode
    toggleTheaterMode() {
        this.isTheaterMode = !this.isTheaterMode;
        
        if (this.isTheaterMode) {
            this.container.classList.add('theater-mode');
            document.body.style.overflow = 'hidden';
        } else {
            this.container.classList.remove('theater-mode');
            document.body.style.overflow = '';
        }
        
        this.trackEvent(this.isTheaterMode ? 'theater_enter' : 'theater_exit');
    }
    
    // UI update methods
    updatePlayPauseButton() {
        const playIcon = this.playPauseBtn?.querySelector('.play-icon');
        const pauseIcon = this.playPauseBtn?.querySelector('.pause-icon');
        
        if (playIcon && pauseIcon) {
            if (this.isPlaying) {
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
            } else {
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
        }
    }
    
    updateVolumeButton() {
        const volumeHigh = this.volumeBtn?.querySelector('.volume-high');
        const volumeMuted = this.volumeBtn?.querySelector('.volume-muted');
        
        if (volumeHigh && volumeMuted) {
            if (this.isMuted || this.currentVolume === 0) {
                volumeHigh.classList.add('hidden');
                volumeMuted.classList.remove('hidden');
            } else {
                volumeHigh.classList.remove('hidden');
                volumeMuted.classList.add('hidden');
            }
        }
    }
    
    updateFullscreenButton() {
        const expandIcon = this.fullscreenBtn?.querySelector('.expand-icon');
        const compressIcon = this.fullscreenBtn?.querySelector('.compress-icon');
        
        if (expandIcon && compressIcon) {
            if (this.isFullscreen) {
                expandIcon.classList.add('hidden');
                compressIcon.classList.remove('hidden');
            } else {
                expandIcon.classList.remove('hidden');
                compressIcon.classList.add('hidden');
            }
        }
    }
    
    updateProgressBar() {
        if (!this.progressFilled || this.duration === 0) return;
        
        const percent = (this.currentTime / this.duration) * 100;
        this.progressFilled.style.width = `${percent}%`;
    }
    
    updateBufferProgress() {
        if (!this.progressBuffer || !this.video.buffered.length) return;
        
        const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
        const percent = (bufferedEnd / this.duration) * 100;
        this.progressBuffer.style.width = `${percent}%`;
    }
    
    updateProgressThumb(e) {
        if (!this.progressThumb) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const position = Math.max(0, Math.min(100, percent * 100));
        
        this.progressThumb.style.left = `${position}%`;
    }
    
    updateVolumeDisplay() {
        if (!this.volumeFilled) return;
        
        const percent = this.isMuted ? 0 : this.currentVolume * 100;
        this.volumeFilled.style.width = `${percent}%`;
    }
    
    updateVolumeThumb(e) {
        if (!this.volumeThumb) return;
        
        const rect = this.volumeSlider.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const position = Math.max(0, Math.min(100, percent * 100));
        
        this.volumeThumb.style.left = `${position}%`;
    }
    
    updateCurrentTimeDisplay() {
        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.textContent = this.formatTime(this.currentTime);
        }
    }
    
    updateDurationDisplay() {
        if (this.durationDisplay) {
            this.durationDisplay.textContent = this.formatTime(this.duration);
        }
    }
    
    updateSpeedDisplay() {
        if (this.speedText) {
            this.speedText.textContent = `${this.playbackRate}x`;
        }
    }
    
    updateQualityDisplay(quality) {
        if (this.currentQualityDisplay) {
            this.currentQualityDisplay.textContent = quality === 'auto' ? 'Auto' : quality.toUpperCase();
        }
    }
    
    updateSpeedMenuActive(rate) {
        if (!this.speedMenu) return;
        
        this.speedMenu.querySelectorAll('.speed-option').forEach(option => {
            option.classList.remove('active');
            if (parseFloat(option.dataset.speed) === rate) {
                option.classList.add('active');
            }
        });
    }
    
    updateQualityMenuActive(quality) {
        if (!this.qualityMenu) return;
        
        this.qualityMenu.querySelectorAll('.quality-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.quality === quality) {
                option.classList.add('active');
            }
        });
    }
    
    // Controls visibility
    showControls() {
        this.controlsOverlay?.classList.add('show');
        this.clearControlsTimeout();
        
        if (this.isPlaying) {
            this.setControlsTimeout();
        }
    }
    
    hideControls() {
        if (!this.isPlaying) return; // Keep controls visible when paused
        
        this.controlsOverlay?.classList.remove('show');
        this.clearControlsTimeout();
    }
    
    setControlsTimeout() {
        this.controlsTimeout = setTimeout(() => {
            this.hideControls();
        }, 3000);
    }
    
    clearControlsTimeout() {
        if (this.controlsTimeout) {
            clearTimeout(this.controlsTimeout);
            this.controlsTimeout = null;
        }
    }
    
    showBigPlayButton() {
        this.bigPlayBtn?.classList.remove('hidden');
    }
    
    hideBigPlayButton() {
        this.bigPlayBtn?.classList.add('hidden');
    }
    
    // Menu methods
    toggleSpeedMenu() {
        this.speedMenu?.classList.toggle('hidden');
        this.hideQualityMenu(); // Close other menus
    }
    
    toggleQualityMenu() {
        this.qualityMenu?.classList.toggle('hidden');
        this.hideSpeedMenu(); // Close other menus
    }
    
    hideSpeedMenu() {
        this.speedMenu?.classList.add('hidden');
    }
    
    hideQualityMenu() {
        this.qualityMenu?.classList.add('hidden');
    }
    
    // Loading and error states
    showLoading() {
        this.loadingOverlay?.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loadingOverlay?.classList.add('hidden');
    }
    
    showError(message) {
        this.hideLoading();
        
        // Create error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'video-error-overlay';
        errorOverlay.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h3>Error Loading Video</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="location.reload()">Retry</button>
            </div>
        `;
        
        this.container.appendChild(errorOverlay);
    }
    
    // Utility methods
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    startProgressUpdates() {
        if (this.progressUpdateInterval) return;
        
        this.progressUpdateInterval = setInterval(() => {
            if (this.isPlaying && !isNaN(this.video.currentTime)) {
                this.onTimeUpdate();
            }
        }, 100);
    }
    
    stopProgressUpdates() {
        if (this.progressUpdateInterval) {
            clearInterval(this.progressUpdateInterval);
            this.progressUpdateInterval = null;
        }
    }
    
    initializeProgress() {
        this.updateProgressBar();
        this.updateBufferProgress();
    }
    
    initializeControls() {
        // Set initial control states
        this.updatePlayPauseButton();
        this.updateVolumeButton();
        this.updateVolumeDisplay();
        this.updateFullscreenButton();
        this.updateSpeedDisplay();
        this.updateQualityDisplay(this.currentQuality);
        
        // Initialize volume
        this.setVolume(this.currentVolume);
    }
    
    // Advanced features
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when video player is focused or visible
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.code) {
                case 'Space':
                case 'KeyK':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                    
                case 'KeyF':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                    
                case 'KeyT':
                    e.preventDefault();
                    this.toggleTheaterMode();
                    break;
                    
                case 'KeyM':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                    
                case 'ArrowLeft':
                    e.preventDefault();
                    this.seek(this.currentTime - 10);
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    this.seek(this.currentTime + 10);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.setVolume(this.currentVolume + 0.1);
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this.setVolume(this.currentVolume - 0.1);
                    break;
                    
                case 'Digit0':
                case 'Numpad0':
                    e.preventDefault();
                    this.seek(0);
                    break;
                    
                case 'Digit1':
                case 'Numpad1':
                    e.preventDefault();
                    this.seek(this.duration * 0.1);
                    break;
                    
                case 'Digit2':
                case 'Numpad2':
                    e.preventDefault();
                    this.seek(this.duration * 0.2);
                    break;
                    
                case 'Digit3':
                case 'Numpad3':
                    e.preventDefault();
                    this.seek(this.duration * 0.3);
                    break;
                    
                case 'Digit4':
                case 'Numpad4':
                    e.preventDefault();
                    this.seek(this.duration * 0.4);
                    break;
                    
                case 'Digit5':
                case 'Numpad5':
                    e.preventDefault();
                    this.seek(this.duration * 0.5);
                    break;
                    
                case 'Digit6':
                case 'Numpad6':
                    e.preventDefault();
                    this.seek(this.duration * 0.6);
                    break;
                    
                case 'Digit7':
                case 'Numpad7':
                    e.preventDefault();
                    this.seek(this.duration * 0.7);
                    break;
                    
                case 'Digit8':
                case 'Numpad8':
                    e.preventDefault();
                    this.seek(this.duration * 0.8);
                    break;
                    
                case 'Digit9':
                case 'Numpad9':
                    e.preventDefault();
                    this.seek(this.duration * 0.9);
                    break;
            }
        });
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let volumeAdjustment = false;
        let seekAdjustment = false;
        
        this.video.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = this.currentTime;
            volumeAdjustment = touchStartX < this.container.offsetWidth * 0.5;
            seekAdjustment = !volumeAdjustment;
        }, { passive: true });
        
        this.video.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                // Vertical swipe
                if (volumeAdjustment) {
                    // Left side: volume control
                    const volumeChange = -deltaY / 200;
                    const newVolume = Math.max(0, Math.min(1, this.currentVolume + volumeChange));
                    this.setVolume(newVolume);
                }
            } else {
                // Horizontal swipe: seeking
                if (seekAdjustment) {
                    const timeChange = (deltaX / this.container.offsetWidth) * 60; // 60 seconds per full swipe
                    const newTime = Math.max(0, Math.min(this.duration, touchStartTime + timeChange));
                    this.seek(newTime);
                }
            }
        }, { passive: false });
        
        // Double tap to toggle play/pause
        let lastTap = 0;
        this.video.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Double tap
                this.togglePlayPause();
                e.preventDefault();
            }
            
            lastTap = currentTime;
        });
    }
    
    setupAdaptiveStreaming() {
        // Initialize adaptive streaming if available
        if (window.AdaptiveStreaming) {
            this.adaptiveStreaming = new window.AdaptiveStreaming(this);
        }
    }
    
    handleContainerClick(e) {
        // Toggle play/pause on container click (but not on controls)
        if (e.target === this.video || e.target === this.container) {
            this.togglePlayPause();
        }
    }
    
    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth <= 768) {
            // Mobile adjustments
            this.hideQualityMenu();
            this.hideSpeedMenu();
        }
    }
    
    handleVideoEnd() {
        // Auto-advance to next related video or show replay option
        console.log('🏁 Video ended');
        
        // Show replay button or next video suggestion
        setTimeout(() => {
            if (this.hasRelatedVideos()) {
                this.showNextVideoSuggestion();
            } else {
                this.showReplayOption();
            }
        }, 2000);
    }
    
    hasRelatedVideos() {
        const relatedVideos = document.querySelectorAll('.related-video-card:not(.placeholder)');
        return relatedVideos.length > 0;
    }
    
    showNextVideoSuggestion() {
        // Implementation for next video suggestion
        console.log('📱 Showing next video suggestion');
    }
    
    showReplayOption() {
        // Show replay button
        const replayBtn = document.createElement('button');
        replayBtn.className = 'replay-btn';
        replayBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M4 2v6l-2-2-2 2 4 4 4-4-2-2-2 2V2z"/>
                <path d="M20 18.5A8.5 8.5 0 1 1 11.5 2c3.92 0 7.24 2.65 8.23 6.25"/>
            </svg>
            <span>Replay</span>
        `;
        
        replayBtn.onclick = () => {
            this.seek(0);
            this.play();
            replayBtn.remove();
        };
        
        // Position replay button
        replayBtn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(74, 144, 226, 0.9);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 16px 24px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 20;
        `;
        
        this.container.appendChild(replayBtn);
    }
    
    trackProgressMilestones() {
        const progress = (this.currentTime / this.duration) * 100;
        
        if (!this.milestones) {
            this.milestones = { 25: false, 50: false, 75: false, 95: false };
        }
        
        [25, 50, 75, 95].forEach(milestone => {
            if (progress >= milestone && !this.milestones[milestone]) {
                this.milestones[milestone] = true;
                this.trackEvent('video_progress', { milestone });
            }
        });
    }
    
    // Chromecast integration
    initiateCast() {
        if (window.ChromecastSupport) {
            window.ChromecastSupport.initiateCast(this.videoData);
        } else {
            console.log('Chromecast not available');
        }
    }
    
    async loadRelatedVideos(category, tags) {
        try {
            const relatedVideos = await window.videoDatabase.getRelatedVideos(category, tags, 10);
            this.displayRelatedVideos(relatedVideos);
        } catch (error) {
            console.error('Error loading related videos:', error);
        }
    }
    
    displayRelatedVideos(videos) {
        const container = document.getElementById('related-videos');
        if (!container) return;
        
        // Clear placeholder
        container.innerHTML = '';
        
        videos.forEach(video => {
            const videoCard = this.createRelatedVideoCard(video);
            container.appendChild(videoCard);
        });
    }
    
    createRelatedVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'related-video-card';
        card.onclick = () => {
            window.location.href = `video.html?id=${video.id}`;
        };
        
        card.innerHTML = `
            <div class="related-thumbnail">
                <img src="${video.catbox_thumbnail_url}" alt="${video.title}" loading="lazy">
                <span class="related-duration">${this.formatTime(video.duration)}</span>
            </div>
            <div class="related-info">
                <h4 class="related-title">${video.title}</h4>
                <p class="related-views">${video.view_count.toLocaleString()} views</p>
            </div>
        `;
        
        return card;
    }
    
    // Analytics and tracking
    trackEvent(event, data = {}) {
        // Google Analytics 4 event tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', event, {
                video_id: this.videoData?.id,
                video_title: this.videoData?.title,
                video_duration: this.duration,
                current_time: this.currentTime,
                ...data
            });
        }
        
        // Custom analytics
        console.log(`📊 Event: ${event}`, data);
        
        // Store analytics data locally
        this.storeAnalyticsEvent(event, data);
    }
    
    storeAnalyticsEvent(event, data) {
        const analyticsData = JSON.parse(localStorage.getItem('xshiver_analytics') || '[]');
        analyticsData.push({
            event,
            data,
            timestamp: new Date().toISOString(),
            videoId: this.videoData?.id,
            sessionId: this.getSessionId()
        });
        
        // Keep only last 100 events
        if (analyticsData.length > 100) {
            analyticsData.splice(0, analyticsData.length - 100);
        }
        
        localStorage.setItem('xshiver_analytics', JSON.stringify(analyticsData));
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('xshiver_session_id');
        if (!sessionId) {
            sessionId = 'xs_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            sessionStorage.setItem('xshiver_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Cleanup
    destroy() {
        this.stopProgressUpdates();
        this.clearControlsTimeout();
        
        // Remove event listeners
        this.video.removeEventListener('loadstart', this.onLoadStart);
        this.video.removeEventListener('loadedmetadata', this.onLoadedMetadata);
        // ... remove all other event listeners
        
        // Clear references
        this.video = null;
        this.container = null;
        this.videoData = null;
        
        console.log('🗑️ Video player destroyed');
    }
}

// Global functions for HTML onclick handlers
function goBack() {
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        history.back();
    } else {
        window.location.href = '../../index.html';
    }
}

function closeShareModal() {
    document.getElementById('share-modal').classList.remove('active');
}

function shareToTwitter() {
    const url = window.location.href;
    const text = document.getElementById('current-video-title').textContent;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}

function shareToFacebook() {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
}

function shareToReddit() {
    const url = window.location.href;
    const title = document.getElementById('current-video-title').textContent;
    const redditUrl = `https://reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(redditUrl, '_blank', 'width=800,height=600');
}

function copyVideoLink() {
    const linkInput = document.getElementById('video-link');
    linkInput.value = window.location.href;
    linkInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const btn = event.target.closest('.share-btn');
    const originalText = btn.querySelector('span:last-child').textContent;
    btn.querySelector('span:last-child').textContent = 'Copied!';
    
    setTimeout(() => {
        btn.querySelector('span:last-child').textContent = originalText;
    }, 2000);
}

// Initialize video player when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for age verification
    const checkVerification = () => {
        if (window.ageVerification && window.ageVerification.isVerified()) {
            // Initialize video player
            window.xshiverPlayer = new XshiverVideoPlayer('xshiver-player');
            
            // Setup additional functionality
            setupVideoPageActions();
        } else {
            setTimeout(checkVerification, 100);
        }
    };
    
    checkVerification();
});

function setupVideoPageActions() {
    // Bookmark functionality
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
            if (window.xshiverPlayer && window.xshiverPlayer.videoData) {
                toggleBookmark(window.xshiverPlayer.videoData);
            }
        });
        
        // Check if video is already bookmarked
        updateBookmarkButton();
    }
    
    // Share functionality
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            document.getElementById('share-modal').classList.add('active');
        });
    }
    
    // Theater mode
    const theaterBtn = document.getElementById('theater-mode-btn');
    if (theaterBtn) {
        theaterBtn.addEventListener('click', () => {
            if (window.xshiverPlayer) {
                window.xshiverPlayer.toggleTheaterMode();
            }
        });
    }
}

function toggleBookmark(videoData) {
    const bookmarks = JSON.parse(localStorage.getItem('xshiver_bookmarks') || '{}');
    
    if (bookmarks[videoData.id]) {
        // Remove bookmark
        delete bookmarks[videoData.id];
        showToast('Bookmark removed', 'info');
    } else {
        // Add bookmark
        bookmarks[videoData.id] = {
            id: videoData.id,
            title: videoData.title,
            thumbnail: videoData.catbox_thumbnail_url,
            duration: videoData.duration,
            bookmarkedAt: new Date().toISOString()
        };
        showToast('Video bookmarked!', 'success');
    }
    
    localStorage.setItem('xshiver_bookmarks', JSON.stringify(bookmarks));
    updateBookmarkButton();
}

function updateBookmarkButton() {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (!bookmarkBtn || !window.xshiverPlayer || !window.xshiverPlayer.videoData) return;
    
    const bookmarks = JSON.parse(localStorage.getItem('xshiver_bookmarks') || '{}');
    const isBookmarked = !!bookmarks[window.xshiverPlayer.videoData.id];
    
    bookmarkBtn.style.color = isBookmarked ? '#ffd700' : '';
    bookmarkBtn.title = isBookmarked ? 'Remove Bookmark' : 'Bookmark Video';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XshiverVideoPlayer;
}
