/**
 * Advanced Playlist Manager for Xshiver
 * Handles playlist creation, management, and social features
 */

class PlaylistManager {
    constructor() {
        this.playlists = new Map();
        this.currentPlaylist = null;
        this.autoPlay = true;
        this.shuffleMode = false;
        this.repeatMode = 'none'; // 'none', 'playlist', 'single'
        
        // Playlist types
        this.playlistTypes = {
            CUSTOM: 'custom',
            FAVORITES: 'favorites',
            WATCH_LATER: 'watch_later',
            HISTORY: 'history',
            SMART: 'smart'
        };
        
        // Social features
        this.sharingEnabled = true;
        this.collaborativeEnabled = true;
        
        this.init();
    }
    
    init() {
        console.log('📝 Playlist Manager initializing...');
        
        // Load existing playlists
        this.loadPlaylists();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.initializeUI();
        
        console.log('✅ Playlist Manager initialized');
    }
    
    async loadPlaylists() {
        try {
            if (window.authSystem && window.authSystem.isLoggedIn()) {
                // Load user playlists from server
                await this.loadUserPlaylists();
            } else {
                // Load local playlists
                this.loadLocalPlaylists();
            }
            
            // Create default playlists if they don't exist
            this.createDefaultPlaylists();
            
        } catch (error) {
            console.error('Error loading playlists:', error);
            this.createDefaultPlaylists();
        }
    }
    
    async loadUserPlaylists() {
        // Mock API call - replace with actual implementation
        const response = await fetch('/api/playlists', {
            headers: {
                'Authorization': `Bearer ${window.authSystem.getToken()}`
            }
        });
        
        if (response.ok) {
            const playlistsData = await response.json();
            playlistsData.forEach(playlist => {
                this.playlists.set(playlist.id, playlist);
            });
        }
    }
    
    loadLocalPlaylists() {
        const stored = localStorage.getItem('xshiver_playlists');
        if (stored) {
            const playlistsData = JSON.parse(stored);
            playlistsData.forEach(playlist => {
                this.playlists.set(playlist.id, playlist);
            });
        }
    }
    
    createDefaultPlaylists() {
        // Create Favorites playlist if it doesn't exist
        if (!this.hasPlaylist('favorites')) {
            this.createPlaylist({
                id: 'favorites',
                name: 'Favorites',
                type: this.playlistTypes.FAVORITES,
                description: 'Your favorite videos',
                isDefault: true,
                isPublic: false,
                videos: []
            });
        }
        
        // Create Watch Later playlist if it doesn't exist
        if (!this.hasPlaylist('watch_later')) {
            this.createPlaylist({
                id: 'watch_later',
                name: 'Watch Later',
                type: this.playlistTypes.WATCH_LATER,
                description: 'Videos to watch later',
                isDefault: true,
                isPublic: false,
                videos: []
            });
        }
        
        // Create History playlist if it doesn't exist
        if (!this.hasPlaylist('history')) {
            this.createPlaylist({
                id: 'history',
                name: 'Watch History',
                type: this.playlistTypes.HISTORY,
                description: 'Recently watched videos',
                isDefault: true,
                isPublic: false,
                videos: [],
                maxSize: 100 // Limit history size
            });
        }
    }
    
    setupEventListeners() {
        // Video end event
        document.addEventListener('videoEnded', (e) => {
            if (this.autoPlay && this.currentPlaylist) {
                this.playNext();
            }
        });
        
        // Playlist UI events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('playlist-item')) {
                this.handlePlaylistItemClick(e);
            }
            
            if (e.target.classList.contains('add-to-playlist-btn')) {
                this.handleAddToPlaylistClick(e);
            }
            
            if (e.target.classList.contains('remove-from-playlist-btn')) {
                this.handleRemoveFromPlaylistClick(e);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.code) {
                case 'KeyN':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.showCreatePlaylistModal();
                    }
                    break;
                case 'KeyS':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleShuffle();
                    }
                    break;
                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleRepeat();
                    }
                    break;
            }
        });
    }
    
    initializeUI() {
        // Initialize playlist UI components
        this.updatePlaylistsUI();
        this.setupPlaylistControls();
    }
    
    // Playlist CRUD operations
    
    createPlaylist(options = {}) {
        const playlist = {
            id: options.id || this.generatePlaylistId(),
            name: options.name || 'New Playlist',
            description: options.description || '',
            type: options.type || this.playlistTypes.CUSTOM,
            isDefault: options.isDefault || false,
            isPublic: options.isPublic || false,
            isCollaborative: options.isCollaborative || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: this.getCurrentUserId(),
            videos: options.videos || [],
            thumbnail: options.thumbnail || null,
            tags: options.tags || [],
            maxSize: options.maxSize || null,
            
            // Social features
            likes: 0,
            followers: 0,
            collaborators: options.collaborators || [],
            
            // Playback settings
            autoPlay: true,
            shuffle: false,
            repeat: 'none'
        };
        
        this.playlists.set(playlist.id, playlist);
        this.savePlaylist(playlist);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('playlistCreated', {
            detail: { playlist }
        }));
        
        console.log(`📝 Created playlist: ${playlist.name}`);
        return playlist;
    }
    
    updatePlaylist(playlistId, updates) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        // Merge updates
        Object.assign(playlist, updates, {
            updatedAt: new Date().toISOString()
        });
        
        this.savePlaylist(playlist);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('playlistUpdated', {
            detail: { playlist }
        }));
        
        return playlist;
    }
    
    deletePlaylist(playlistId) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        if (playlist.isDefault) {
            throw new Error('Cannot delete default playlist');
        }
        
        this.playlists.delete(playlistId);
        this.removePlaylistFromStorage(playlistId);
        
        // If this was the current playlist, clear it
        if (this.currentPlaylist && this.currentPlaylist.id === playlistId) {
            this.currentPlaylist = null;
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('playlistDeleted', {
            detail: { playlistId, playlist }
        }));
        
        console.log(`📝 Deleted playlist: ${playlist.name}`);
    }
    
    // Video management in playlists
    
    addVideoToPlaylist(playlistId, video, position = -1) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        // Check if video already exists
        const existingIndex = playlist.videos.findIndex(v => v.id === video.id);
        if (existingIndex !== -1) {
            console.warn('Video already in playlist');
            return false;
        }
        
        // Check playlist size limit
        if (playlist.maxSize && playlist.videos.length >= playlist.maxSize) {
            // Remove oldest video if at limit
            playlist.videos.shift();
        }
        
        // Add video
        const videoEntry = {
            ...video,
            addedAt: new Date().toISOString(),
            addedBy: this.getCurrentUserId(),
            position: position === -1 ? playlist.videos.length : position
        };
        
        if (position === -1) {
            playlist.videos.push(videoEntry);
        } else {
            playlist.videos.splice(position, 0, videoEntry);
            // Update positions of subsequent videos
            this.updateVideoPositions(playlist);
        }
        
        playlist.updatedAt = new Date().toISOString();
        this.savePlaylist(playlist);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('videoAddedToPlaylist', {
            detail: { playlist, video: videoEntry }
        }));
        
        console.log(`📝 Added video "${video.title}" to playlist "${playlist.name}"`);
        return true;
    }
    
    removeVideoFromPlaylist(playlistId, videoId) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        const videoIndex = playlist.videos.findIndex(v => v.id === videoId);
        if (videoIndex === -1) {
            throw new Error('Video not found in playlist');
        }
        
        const removedVideo = playlist.videos.splice(videoIndex, 1)[0];
        this.updateVideoPositions(playlist);
        
        playlist.updatedAt = new Date().toISOString();
        this.savePlaylist(playlist);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('videoRemovedFromPlaylist', {
            detail: { playlist, video: removedVideo }
        }));
        
        console.log(`📝 Removed video "${removedVideo.title}" from playlist "${playlist.name}"`);
        return removedVideo;
    }
    
    moveVideoInPlaylist(playlistId, videoId, newPosition) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        const videoIndex = playlist.videos.findIndex(v => v.id === videoId);
        if (videoIndex === -1) {
            throw new Error('Video not found in playlist');
        }
        
        // Move video to new position
        const video = playlist.videos.splice(videoIndex, 1)[0];
        playlist.videos.splice(newPosition, 0, video);
        
        this.updateVideoPositions(playlist);
        
        playlist.updatedAt = new Date().toISOString();
        this.savePlaylist(playlist);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('playlistReordered', {
            detail: { playlist }
        }));
        
        return playlist;
    }
    
    updateVideoPositions(playlist) {
        playlist.videos.forEach((video, index) => {
            video.position = index;
        });
    }
    
    // Playlist playback
    
    playPlaylist(playlistId, startIndex = 0) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist || playlist.videos.length === 0) {
            throw new Error('Playlist not found or empty');
        }
        
        this.currentPlaylist = {
            ...playlist,
            currentIndex: startIndex,
            playOrder: this.generatePlayOrder(playlist)
        };
        
        // Play first video
        const video = this.getCurrentVideo();
        if (video) {
            this.playVideo(video);
        }
        
        // Update UI
        this.updatePlaylistPlayerUI();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('playlistStarted', {
            detail: { playlist: this.currentPlaylist }
        }));
        
        console.log(`📝 Started playlist: ${playlist.name}`);
    }
    
    playNext() {
        if (!this.currentPlaylist) return false;
        
        const nextIndex = this.getNextVideoIndex();
        if (nextIndex === -1) {
            // End of playlist
            this.handlePlaylistEnd();
            return false;
        }
        
        this.currentPlaylist.currentIndex = nextIndex;
        const video = this.getCurrentVideo();
        
        if (video) {
            this.playVideo(video);
            this.updatePlaylistPlayerUI();
            return true;
        }
        
        return false;
    }
    
    playPrevious() {
        if (!this.currentPlaylist) return false;
        
        const prevIndex = this.getPreviousVideoIndex();
        if (prevIndex === -1) return false;
        
        this.currentPlaylist.currentIndex = prevIndex;
        const video = this.getCurrentVideo();
        
        if (video) {
            this.playVideo(video);
            this.updatePlaylistPlayerUI();
            return true;
        }
        
        return false;
    }
    
    getCurrentVideo() {
        if (!this.currentPlaylist) return null;
        
        const playOrder = this.currentPlaylist.playOrder;
        const currentIndex = this.currentPlaylist.currentIndex;
        
        if (currentIndex >= 0 && currentIndex < playOrder.length) {
            const videoIndex = playOrder[currentIndex];
            return this.currentPlaylist.videos[videoIndex];
        }
        
        return null;
    }
    
    getNextVideoIndex() {
        if (!this.currentPlaylist) return -1;
        
        const currentIndex = this.currentPlaylist.currentIndex;
        const playOrderLength = this.currentPlaylist.playOrder.length;
        
        if (this.repeatMode === 'single') {
            return currentIndex; // Repeat current video
        }
        
        const nextIndex = currentIndex + 1;
        
        if (nextIndex >= playOrderLength) {
            if (this.repeatMode === 'playlist') {
                return 0; // Loop back to start
            }
            return -1; // End of playlist
        }
        
        return nextIndex;
    }
    
    getPreviousVideoIndex() {
        if (!this.currentPlaylist) return -1;
        
        const currentIndex = this.currentPlaylist.currentIndex;
        
        if (this.repeatMode === 'single') {
            return currentIndex; // Repeat current video
        }
        
        const prevIndex = currentIndex - 1;
        
        if (prevIndex < 0) {
            if (this.repeatMode === 'playlist') {
                return this.currentPlaylist.playOrder.length - 1; // Loop to end
            }
            return -1; // Start of playlist
        }
        
        return prevIndex;
    }
    
    generatePlayOrder(playlist) {
        let playOrder = Array.from({ length: playlist.videos.length }, (_, i) => i);
        
        if (this.shuffleMode) {
            playOrder = this.shuffleArray(playOrder);
        }
        
        return playOrder;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    playVideo(video) {
        // Navigate to video page or update current player
        if (window.videoPlayer) {
            window.videoPlayer.loadVideo(video);
        } else {
            window.location.href = `/pages/watch/video.html?id=${video.id}&playlist=${this.currentPlaylist.id}`;
        }
        
        // Track playback
        this.trackVideoPlay(video);
    }
    
    handlePlaylistEnd() {
        // Dispatch event
        document.dispatchEvent(new CustomEvent('playlistEnded', {
            detail: { playlist: this.currentPlaylist }
        }));
        
        // Reset current playlist if not repeating
        if (this.repeatMode !== 'playlist') {
            this.currentPlaylist = null;
            this.updatePlaylistPlayerUI();
        }
    }
    
    // Playback controls
    
    toggleShuffle() {
        this.shuffleMode = !this.shuffleMode;
        
        // Regenerate play order if playlist is active
        if (this.currentPlaylist) {
            this.currentPlaylist.playOrder = this.generatePlayOrder(this.currentPlaylist);
        }
        
        this.updatePlaylistPlayerUI();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('shuffleModeChanged', {
            detail: { shuffleMode: this.shuffleMode }
        }));
        
        console.log(`📝 Shuffle mode: ${this.shuffleMode ? 'ON' : 'OFF'}`);
    }
    
    toggleRepeat() {
        const modes = ['none', 'playlist', 'single'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        this.updatePlaylistPlayerUI();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('repeatModeChanged', {
            detail: { repeatMode: this.repeatMode }
        }));
        
        console.log(`📝 Repeat mode: ${this.repeatMode}`);
    }
    
    setAutoPlay(enabled) {
        this.autoPlay = enabled;
        
        // Save preference
        localStorage.setItem('playlist_autoplay', enabled.toString());
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('autoPlayChanged', {
            detail: { autoPlay: this.autoPlay }
        }));
    }
    
    // Smart playlists
    
    createSmartPlaylist(options) {
        const smartPlaylist = this.createPlaylist({
            ...options,
            type: this.playlistTypes.SMART,
            criteria: options.criteria || {},
            updateInterval: options.updateInterval || 3600000 // 1 hour
        });
        
        // Generate initial content
        this.updateSmartPlaylist(smartPlaylist.id);
        
        // Schedule regular updates
        this.scheduleSmartPlaylistUpdate(smartPlaylist.id);
        
        return smartPlaylist;
    }
    
    async updateSmartPlaylist(playlistId) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist || playlist.type !== this.playlistTypes.SMART) {
            return;
        }
        
        try {
            // Generate videos based on criteria
            const videos = await this.generateSmartPlaylistContent(playlist.criteria);
            
            // Update playlist
            playlist.videos = videos.map(video => ({
                ...video,
                addedAt: new Date().toISOString(),
                addedBy: 'system'
            }));
            
            playlist.updatedAt = new Date().toISOString();
            this.savePlaylist(playlist);
            
            console.log(`📝 Updated smart playlist: ${playlist.name} (${videos.length} videos)`);
            
        } catch (error) {
            console.error('Error updating smart playlist:', error);
        }
    }
    
    async generateSmartPlaylistContent(criteria) {
        // Generate content based on criteria
        let videos = [];
        
        if (criteria.category) {
            videos = await window.videoDatabase?.getVideosByCategory?.(criteria.category) || [];
        }
        
        if (criteria.tags && criteria.tags.length > 0) {
            const tagVideos = await window.videoDatabase?.getVideosByTags?.(criteria.tags) || [];
            videos = videos.length > 0 ? 
                videos.filter(v => tagVideos.some(tv => tv.id === v.id)) : 
                tagVideos;
        }
        
        if (criteria.rating && criteria.rating > 0) {
            videos = videos.filter(v => v.rating >= criteria.rating);
        }
        
        if (criteria.duration) {
            videos = videos.filter(v => {
                if (criteria.duration.min && v.duration < criteria.duration.min) return false;
                if (criteria.duration.max && v.duration > criteria.duration.max) return false;
                return true;
            });
        }
        
        if (criteria.dateRange) {
            const startDate = new Date(criteria.dateRange.start);
            const endDate = new Date(criteria.dateRange.end);
            videos = videos.filter(v => {
                const uploadDate = new Date(v.upload_date);
                return uploadDate >= startDate && uploadDate <= endDate;
            });
        }
        
        // Sort by criteria
        if (criteria.sortBy) {
            videos.sort((a, b) => {
                switch (criteria.sortBy) {
                    case 'rating':
                        return b.rating - a.rating;
                    case 'views':
                        return b.view_count - a.view_count;
                    case 'date':
                        return new Date(b.upload_date) - new Date(a.upload_date);
                    case 'title':
                        return a.title.localeCompare(b.title);
                    default:
                        return 0;
                }
            });
        }
        
        // Limit results
        if (criteria.limit) {
            videos = videos.slice(0, criteria.limit);
        }
        
        return videos;
    }
    
    scheduleSmartPlaylistUpdate(playlistId) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist || playlist.type !== this.playlistTypes.SMART) {
            return;
        }
        
        // Schedule next update
        setTimeout(() => {
            this.updateSmartPlaylist(playlistId);
            this.scheduleSmartPlaylistUpdate(playlistId); // Reschedule
        }, playlist.updateInterval);
    }
    
    // Social features
    
    sharePlaylist(playlistId, platform) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        const shareUrl = `${window.location.origin}/playlists/${playlistId}`;
        const shareText = `Check out my playlist: ${playlist.name}`;
        
        switch (platform) {
            case 'twitter':
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                window.open(twitterUrl, '_blank');
                break;
                
            case 'facebook':
                const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                window.open(facebookUrl, '_blank');
                break;
                
            case 'copy':
                navigator.clipboard.writeText(shareUrl);
                this.showNotification('Playlist link copied to clipboard');
                break;
        }
        
        // Track sharing
        this.trackPlaylistShare(playlistId, platform);
    }
    
    addCollaborator(playlistId, userId) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        if (!playlist.isCollaborative) {
            throw new Error('Playlist is not collaborative');
        }
        
        if (!playlist.collaborators.includes(userId)) {
            playlist.collaborators.push(userId);
            playlist.updatedAt = new Date().toISOString();
            this.savePlaylist(playlist);
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('collaboratorAdded', {
                detail: { playlist, userId }
            }));
        }
    }
    
    removeCollaborator(playlistId, userId) {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        const index = playlist.collaborators.indexOf(userId);
        if (index !== -1) {
            playlist.collaborators.splice(index, 1);
            playlist.updatedAt = new Date().toISOString();
            this.savePlaylist(playlist);
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('collaboratorRemoved', {
                detail: { playlist, userId }
            }));
        }
    }
    
    // UI methods
    
    updatePlaylistsUI() {
        const playlistsContainer = document.querySelector('.playlists-list');
        if (!playlistsContainer) return;
        
        const playlistsHTML = Array.from(this.playlists.values())
            .filter(p => !p.isDefault || p.videos.length > 0)
            .map(playlist => this.createPlaylistHTML(playlist))
            .join('');
        
        playlistsContainer.innerHTML = playlistsHTML || '<p class="no-playlists">No playlists yet. Create your first playlist!</p>';
    }
    
    createPlaylistHTML(playlist) {
        const thumbnailUrl = playlist.thumbnail || 
            (playlist.videos.length > 0 ? playlist.videos[0].thumbnail : '/assets/images/playlist-default.jpg');
        
        return `
            <div class="playlist-card" data-playlist-id="${playlist.id}">
                <div class="playlist-thumbnail">
                    <img src="${thumbnailUrl}" alt="${playlist.name}" loading="lazy">
                    <div class="playlist-overlay">
                        <button class="play-playlist-btn" onclick="playlistManager.playPlaylist('${playlist.id}')">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <polygon points="5,3 19,12 5,21"></polygon>
                            </svg>
                        </button>
                        <div class="playlist-stats">
                            <span class="video-count">${playlist.videos.length} videos</span>
                        </div>
                    </div>
                </div>
                <div class="playlist-info">
                    <h3 class="playlist-name">${playlist.name}</h3>
                    <p class="playlist-description">${playlist.description || 'No description'}</p>
                    <div class="playlist-meta">
                        <span class="playlist-type">${this.getPlaylistTypeLabel(playlist.type)}</span>
                        <span class="playlist-privacy">${playlist.isPublic ? 'Public' : 'Private'}</span>
                        ${playlist.isCollaborative ? '<span class="collaborative-badge">Collaborative</span>' : ''}
                    </div>
                    <div class="playlist-actions">
                        <button class="btn-secondary" onclick="playlistManager.editPlaylist('${playlist.id}')">Edit</button>
                        <button class="btn-secondary" onclick="playlistManager.sharePlaylist('${playlist.id}', 'copy')">Share</button>
                        ${!playlist.isDefault ? `<button class="btn-danger" onclick="playlistManager.deletePlaylist('${playlist.id}')">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    updatePlaylistPlayerUI() {
        const playerUI = document.querySelector('.playlist-player-ui');
        if (!playerUI) return;
        
        if (this.currentPlaylist) {
            playerUI.classList.remove('hidden');
            
            const currentVideo = this.getCurrentVideo();
            const playlistInfo = playerUI.querySelector('.current-playlist-info');
            const videoInfo = playerUI.querySelector('.current-video-info');
            const progressInfo = playerUI.querySelector('.playlist-progress');
            
            if (playlistInfo) {
                playlistInfo.textContent = this.currentPlaylist.name;
            }
            
            if (videoInfo && currentVideo) {
                videoInfo.textContent = currentVideo.title;
            }
            
            if (progressInfo) {
                const current = this.currentPlaylist.currentIndex + 1;
                const total = this.currentPlaylist.videos.length;
                progressInfo.textContent = `${current} / ${total}`;
            }
            
            // Update control states
            this.updatePlaylistControls();
        } else {
            playerUI.classList.add('hidden');
        }
    }
    
    updatePlaylistControls() {
        const shuffleBtn = document.querySelector('.shuffle-btn');
        const repeatBtn = document.querySelector('.repeat-btn');
        const autoPlayToggle = document.querySelector('.autoplay-toggle');
        
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.shuffleMode);
        }
        
        if (repeatBtn) {
            repeatBtn.classList.remove('repeat-none', 'repeat-playlist', 'repeat-single');
            repeatBtn.classList.add(`repeat-${this.repeatMode}`);
        }
        
        if (autoPlayToggle) {
            autoPlayToggle.checked = this.autoPlay;
        }
    }
    
    setupPlaylistControls() {
        // Previous button
        const prevBtn = document.querySelector('.playlist-prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.playPrevious());
        }
        
        // Next button
        const nextBtn = document.querySelector('.playlist-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.playNext());
        }
        
        // Shuffle button
        const shuffleBtn = document.querySelector('.shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }
        
        // Repeat button
        const repeatBtn = document.querySelector('.repeat-btn');
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => this.toggleRepeat());
        }
        
        // Auto-play toggle
        const autoPlayToggle = document.querySelector('.autoplay-toggle');
        if (autoPlayToggle) {
            autoPlayToggle.addEventListener('change', (e) => this.setAutoPlay(e.target.checked));
        }
    }
    
    showCreatePlaylistModal() {
        const modal = document.getElementById('create-playlist-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            const nameInput = modal.querySelector('#playlist-name');
            if (nameInput) {
                nameInput.focus();
            }
        }
    }
    
    showAddToPlaylistModal(videoId) {
        const modal = document.getElementById('add-to-playlist-modal');
        if (modal) {
            modal.dataset.videoId = videoId;
            modal.classList.remove('hidden');
            
            // Populate playlist options
            this.populatePlaylistOptions(modal);
        }
    }
    
    populatePlaylistOptions(modal) {
        const container = modal.querySelector('.playlist-options');
        if (!container) return;
        
        const playlistsHTML = Array.from(this.playlists.values())
            .filter(p => p.type === this.playlistTypes.CUSTOM || p.type === this.playlistTypes.FAVORITES)
            .map(playlist => `
                <div class="playlist-option" data-playlist-id="${playlist.id}">
                    <label>
                        <input type="checkbox" value="${playlist.id}">
                        <span>${playlist.name}</span>
                        <small>${playlist.videos.length} videos</small>
                    </label>
                </div>
            `).join('');
        
        container.innerHTML = playlistsHTML;
    }
    
    // Event handlers
    
    handlePlaylistItemClick(e) {
        const playlistId = e.target.closest('.playlist-card').dataset.playlistId;
        const playlist = this.playlists.get(playlistId);
        
        if (playlist) {
            // Navigate to playlist page
            window.location.href = `/pages/dashboard/playlists.html?id=${playlistId}`;
        }
    }
    
    handleAddToPlaylistClick(e) {
        const videoId = e.target.dataset.videoId;
        if (videoId) {
            this.showAddToPlaylistModal(videoId);
        }
    }
    
    handleRemoveFromPlaylistClick(e) {
        const playlistId = e.target.dataset.playlistId;
        const videoId = e.target.dataset.videoId;
        
        if (playlistId && videoId) {
            this.removeVideoFromPlaylist(playlistId, videoId);
            this.updatePlaylistsUI();
        }
    }
    
    // Utility methods
    
    generatePlaylistId() {
        return 'playlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getCurrentUserId() {
        return window.authSystem?.getUser()?.id || 'anonymous';
    }
    
    hasPlaylist(playlistId) {
        return this.playlists.has(playlistId);
    }
    
    getPlaylist(playlistId) {
        return this.playlists.get(playlistId);
    }
    
    getAllPlaylists() {
        return Array.from(this.playlists.values());
    }
    
    getUserPlaylists() {
        const userId = this.getCurrentUserId();
        return Array.from(this.playlists.values())
            .filter(p => p.createdBy === userId);
    }
    
    getPlaylistTypeLabel(type) {
        const labels = {
            [this.playlistTypes.CUSTOM]: 'Custom',
            [this.playlistTypes.FAVORITES]: 'Favorites',
            [this.playlistTypes.WATCH_LATER]: 'Watch Later',
            [this.playlistTypes.HISTORY]: 'History',
            [this.playlistTypes.SMART]: 'Smart Playlist'
        };
        
        return labels[type] || 'Unknown';
    }
    
    // Storage methods
    
    async savePlaylist(playlist) {
        if (window.authSystem && window.authSystem.isLoggedIn()) {
            // Save to server
            await this.savePlaylistToServer(playlist);
        } else {
            // Save locally
            this.savePlaylistLocally(playlist);
        }
    }
    
    async savePlaylistToServer(playlist) {
        try {
            const response = await fetch(`/api/playlists/${playlist.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authSystem.getToken()}`
                },
                body: JSON.stringify(playlist)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save playlist to server');
            }
        } catch (error) {
            console.error('Error saving playlist to server:', error);
            // Fallback to local storage
            this.savePlaylistLocally(playlist);
        }
    }
    
    savePlaylistLocally(playlist) {
        const playlists = Array.from(this.playlists.values());
        localStorage.setItem('xshiver_playlists', JSON.stringify(playlists));
    }
    
    async removePlaylistFromStorage(playlistId) {
        if (window.authSystem && window.authSystem.isLoggedIn()) {
            // Remove from server
            try {
                await fetch(`/api/playlists/${playlistId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${window.authSystem.getToken()}`
                    }
                });
            } catch (error) {
                console.error('Error removing playlist from server:', error);
            }
        }
        
        // Remove from local storage
        const playlists = Array.from(this.playlists.values());
        localStorage.setItem('xshiver_playlists', JSON.stringify(playlists));
    }
    
    // Analytics and tracking
    
    trackVideoPlay(video) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackAction('playlist_video_play', {
                videoId: video.id,
                playlistId: this.currentPlaylist?.id,
                position: this.currentPlaylist?.currentIndex
            });
        }
    }
    
    trackPlaylistShare(playlistId, platform) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackAction('playlist_share', {
                playlistId: playlistId,
                platform: platform
            });
        }
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
        }, 3000);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3500);
    }
    
    // Cleanup
    destroy() {
        // Save all playlists before destroying
        const playlists = Array.from(this.playlists.values());
        localStorage.setItem('xshiver_playlists', JSON.stringify(playlists));
        
        // Clear current playlist
        this.currentPlaylist = null;
        
        console.log('📝 Playlist Manager destroyed');
    }
}

// Global playlist manager instance
window.playlistManager = new PlaylistManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaylistManager;
}
