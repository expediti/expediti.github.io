/**
 * Social Features & API Integration for Xshiver
 * Handles social interactions, sharing, and external API integrations
 */

class SocialFeatures {
    constructor() {
        this.apiClient = null;
        this.socialConnections = new Map();
        this.activityFeed = [];
        this.notifications = [];
        
        // Social platforms
        this.platforms = {
            TWITTER: 'twitter',
            FACEBOOK: 'facebook',
            REDDIT: 'reddit',
            DISCORD: 'discord',
            TELEGRAM: 'telegram'
        };
        
        // Activity types
        this.activityTypes = {
            LIKE: 'like',
            COMMENT: 'comment',
            SHARE: 'share',
            FOLLOW: 'follow',
            PLAYLIST_CREATE: 'playlist_create',
            REVIEW: 'review'
        };
        
        this.init();
    }
    
    async init() {
        console.log('🌐 Social Features initializing...');
        
        // Initialize API client
        this.initializeAPIClient();
        
        // Load social connections
        await this.loadSocialConnections();
        
        // Setup social interfaces
        this.setupSocialInterfaces();
        
        // Setup activity tracking
        this.setupActivityTracking();
        
        console.log('✅ Social Features initialized');
    }
    
    initializeAPIClient() {
        this.apiClient = {
            baseURL: '/api/v1',
            headers: {
                'Content-Type': 'application/json'
            },
            
            async request(method, endpoint, data = null) {
                const url = `${this.baseURL}${endpoint}`;
                const options = {
                    method,
                    headers: { ...this.headers }
                };
                
                if (window.authSystem?.getToken()) {
                    options.headers.Authorization = `Bearer ${window.authSystem.getToken()}`;
                }
                
                if (data) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                }
                
                return await response.json();
            },
            
            get: function(endpoint) {
                return this.request('GET', endpoint);
            },
            
            post: function(endpoint, data) {
                return this.request('POST', endpoint, data);
            },
            
            put: function(endpoint, data) {
                return this.request('PUT', endpoint, data);
            },
            
            delete: function(endpoint) {
                return this.request('DELETE', endpoint);
            }
        };
    }
    
    async loadSocialConnections() {
        if (!window.authSystem?.isLoggedIn()) return;
        
        try {
            const connections = await this.apiClient.get('/social/connections');
            
            connections.forEach(connection => {
                this.socialConnections.set(connection.platform, connection);
            });
            
        } catch (error) {
            console.error('Error loading social connections:', error);
        }
    }
    
    setupSocialInterfaces() {
        // Like buttons
        this.setupLikeButtons();
        
        // Share buttons
        this.setupShareButtons();
        
        // Comment system
        this.setupCommentSystem();
        
        // Follow system
        this.setupFollowSystem();
        
        // Social login
        this.setupSocialLogin();
    }
    
    setupLikeButtons() {
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('like-btn') || e.target.closest('.like-btn')) {
                const btn = e.target.closest('.like-btn');
                const contentId = btn.dataset.contentId;
                const isLiked = btn.classList.contains('liked');
                
                try {
                    if (isLiked) {
                        await this.unlikeContent(contentId);
                        btn.classList.remove('liked');
                        this.updateLikeCount(btn, -1);
                    } else {
                        await this.likeContent(contentId);
                        btn.classList.add('liked');
                        this.updateLikeCount(btn, 1);
                    }
                } catch (error) {
                    console.error('Error toggling like:', error);
                }
            }
        });
    }
    
    setupShareButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-btn') || e.target.closest('.share-btn')) {
                const btn = e.target.closest('.share-btn');
                const contentId = btn.dataset.contentId;
                
                this.showShareModal(contentId);
            }
        });
    }
    
    setupCommentSystem() {
        // Comment form submissions
        document.addEventListener('submit', async (e) => {
            if (e.target.classList.contains('comment-form')) {
                e.preventDefault();
                
                const form = e.target;
                const contentId = form.dataset.contentId;
                const commentText = form.querySelector('textarea').value.trim();
                
                if (commentText) {
                    try {
                        await this.addComment(contentId, commentText);
                        form.querySelector('textarea').value = '';
                        await this.loadComments(contentId);
                    } catch (error) {
                        console.error('Error adding comment:', error);
                    }
                }
            }
        });
        
        // Comment like/reply buttons
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('comment-like-btn')) {
                const commentId = e.target.dataset.commentId;
                await this.toggleCommentLike(commentId);
            }
            
            if (e.target.classList.contains('comment-reply-btn')) {
                const commentId = e.target.dataset.commentId;
                this.showReplyForm(commentId);
            }
        });
    }
    
    setupFollowSystem() {
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('follow-btn') || e.target.closest('.follow-btn')) {
                const btn = e.target.closest('.follow-btn');
                const userId = btn.dataset.userId;
                const isFollowing = btn.classList.contains('following');
                
                try {
                    if (isFollowing) {
                        await this.unfollowUser(userId);
                        btn.classList.remove('following');
                        btn.textContent = 'Follow';
                    } else {
                        await this.followUser(userId);
                        btn.classList.add('following');
                        btn.textContent = 'Following';
                    }
                } catch (error) {
                    console.error('Error toggling follow:', error);
                }
            }
        });
    }
    
    setupSocialLogin() {
        // Google OAuth
        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                this.initiateOAuthLogin('google');
            });
        }
        
        // Facebook OAuth
        const facebookBtn = document.getElementById('facebook-login-btn');
        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => {
                this.initiateOAuthLogin('facebook');
            });
        }
        
        // Twitter OAuth
        const twitterBtn = document.getElementById('twitter-login-btn');
        if (twitterBtn) {
            twitterBtn.addEventListener('click', () => {
                this.initiateOAuthLogin('twitter');
            });
        }
    }
    
    setupActivityTracking() {
        // Track user activities
        document.addEventListener('videoPlay', (e) => {
            this.trackActivity(this.activityTypes.LIKE, {
                contentId: e.detail.videoId,
                action: 'video_play'
            });
        });
        
        document.addEventListener('playlistCreated', (e) => {
            this.trackActivity(this.activityTypes.PLAYLIST_CREATE, {
                playlistId: e.detail.playlist.id,
                playlistName: e.detail.playlist.name
            });
        });
    }
    
    // Social Actions
    
    async likeContent(contentId) {
        const result = await this.apiClient.post('/social/like', {
            contentId: contentId,
            type: 'video'
        });
        
        this.trackActivity(this.activityTypes.LIKE, {
            contentId: contentId
        });
        
        return result;
    }
    
    async unlikeContent(contentId) {
        return await this.apiClient.delete(`/social/like/${contentId}`);
    }
    
    async addComment(contentId, text, parentId = null) {
        const result = await this.apiClient.post('/social/comment', {
            contentId: contentId,
            text: text,
            parentId: parentId
        });
        
        this.trackActivity(this.activityTypes.COMMENT, {
            contentId: contentId,
            commentId: result.commentId
        });
        
        return result;
    }
    
    async loadComments(contentId) {
        const comments = await this.apiClient.get(`/social/comments/${contentId}`);
        this.displayComments(contentId, comments);
        return comments;
    }
    
    async toggleCommentLike(commentId) {
        return await this.apiClient.post(`/social/comment/${commentId}/like`);
    }
    
    async followUser(userId) {
        const result = await this.apiClient.post('/social/follow', {
            userId: userId
        });
        
        this.trackActivity(this.activityTypes.FOLLOW, {
            userId: userId
        });
        
        return result;
    }
    
    async unfollowUser(userId) {
        return await this.apiClient.delete(`/social/follow/${userId}`);
    }
    
    async shareContent(contentId, platform, message = '') {
        const shareData = {
            contentId: contentId,
            platform: platform,
            message: message,
            url: `${window.location.origin}/watch/${contentId}`
        };
        
        switch (platform) {
            case this.platforms.TWITTER:
                return await this.shareToTwitter(shareData);
            case this.platforms.FACEBOOK:
                return await this.shareToFacebook(shareData);
            case this.platforms.REDDIT:
                return await this.shareToReddit(shareData);
            case 'native':
                return await this.nativeShare(shareData);
            case 'copy':
                return await this.copyToClipboard(shareData.url);
        }
    }
    
    async shareToTwitter(shareData) {
        const text = `${shareData.message} ${shareData.url}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        
        this.trackActivity(this.activityTypes.SHARE, {
            contentId: shareData.contentId,
            platform: 'twitter'
        });
    }
    
    async shareToFacebook(shareData) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
        
        window.open(facebookUrl, '_blank', 'width=550,height=420');
        
        this.trackActivity(this.activityTypes.SHARE, {
            contentId: shareData.contentId,
            platform: 'facebook'
        });
    }
    
    async shareToReddit(shareData) {
        const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.message)}`;
        
        window.open(redditUrl, '_blank');
        
        this.trackActivity(this.activityTypes.SHARE, {
            contentId: shareData.contentId,
            platform: 'reddit'
        });
    }
    
    async nativeShare(shareData) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareData.message,
                    url: shareData.url
                });
                
                this.trackActivity(this.activityTypes.SHARE, {
                    contentId: shareData.contentId,
                    platform: 'native'
                });
            } catch (error) {
                console.error('Native share failed:', error);
                await this.copyToClipboard(shareData.url);
            }
        } else {
            await this.copyToClipboard(shareData.url);
        }
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Link copied to clipboard!', 'success');
        } catch (error) {
            console.error('Clipboard copy failed:', error);
            this.showNotification('Failed to copy link', 'error');
        }
    }
    
    // OAuth Integration
    
    async initiateOAuthLogin(provider) {
        const authWindow = window.open(
            `/auth/oauth/${provider}`,
            'oauth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        // Listen for OAuth completion
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'oauth_success') {
                authWindow.close();
                this.handleOAuthSuccess(event.data);
            } else if (event.data.type === 'oauth_error') {
                authWindow.close();
                this.handleOAuthError(event.data.error);
            }
        });
    }
    
    handleOAuthSuccess(data) {
        // Update authentication state
        if (window.authSystem) {
            window.authSystem.handleOAuthLogin(data.token, data.user);
        }
        
        this.showNotification('Successfully logged in!', 'success');
        
        // Reload social connections
        this.loadSocialConnections();
    }
    
    handleOAuthError(error) {
        console.error('OAuth error:', error);
        this.showNotification('Login failed. Please try again.', 'error');
    }
    
    // Activity Feed
    
    async loadActivityFeed(userId = null, limit = 20) {
        try {
            const endpoint = userId ? `/social/activity/${userId}` : '/social/activity/feed';
            const activities = await this.apiClient.get(`${endpoint}?limit=${limit}`);
            
            this.activityFeed = activities;
            this.displayActivityFeed();
            
            return activities;
        } catch (error) {
            console.error('Error loading activity feed:', error);
            return [];
        }
    }
    
    trackActivity(type, data) {
        if (!window.authSystem?.isLoggedIn()) return;
        
        const activity = {
            type: type,
            data: data,
            timestamp: new Date().toISOString(),
            userId: window.authSystem.getUser().id
        };
        
        // Send to server
        this.apiClient.post('/social/activity', activity)
            .catch(error => console.error('Error tracking activity:', error));
        
        // Add to local feed
        this.activityFeed.unshift(activity);
        
        // Limit local feed size
        if (this.activityFeed.length > 100) {
            this.activityFeed = this.activityFeed.slice(0, 100);
        }
    }
    
    displayActivityFeed() {
        const container = document.getElementById('activity-feed');
        if (!container) return;
        
        if (this.activityFeed.length === 0) {
            container.innerHTML = '<p class="no-activity">No recent activity</p>';
            return;
        }
        
        const feedHTML = this.activityFeed.map(activity => 
            this.createActivityItemHTML(activity)
        ).join('');
        
        container.innerHTML = feedHTML;
    }
    
    createActivityItemHTML(activity) {
        const icon = this.getActivityIcon(activity.type);
        const text = this.getActivityText(activity);
        const time = this.formatRelativeTime(activity.timestamp);
        
        return `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div class="activity-text">${text}</div>
                    <div class="activity-time">${time}</div>
                </div>
            </div>
        `;
    }
    
    getActivityIcon(type) {
        const icons = {
            [this.activityTypes.LIKE]: '❤️',
            [this.activityTypes.COMMENT]: '💬',
            [this.activityTypes.SHARE]: '📤',
            [this.activityTypes.FOLLOW]: '👥',
            [this.activityTypes.PLAYLIST_CREATE]: '📝',
            [this.activityTypes.REVIEW]: '⭐'
        };
        
        return icons[type] || '📋';
    }
    
    getActivityText(activity) {
        switch (activity.type) {
            case this.activityTypes.LIKE:
                return 'liked a video';
            case this.activityTypes.COMMENT:
                return 'commented on a video';
            case this.activityTypes.SHARE:
                return `shared a video on ${activity.data.platform}`;
            case this.activityTypes.FOLLOW:
                return 'followed a user';
            case this.activityTypes.PLAYLIST_CREATE:
                return `created playlist "${activity.data.playlistName}"`;
            default:
                return 'performed an action';
        }
    }
    
    // UI Methods
    
    updateLikeCount(button, delta) {
        const countElement = button.querySelector('.like-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = Math.max(0, currentCount + delta);
        }
    }
    
    displayComments(contentId, comments) {
        const container = document.getElementById(`comments-${contentId}`);
        if (!container) return;
        
        if (comments.length === 0) {
            container.innerHTML = '<p class="no-comments">No comments yet</p>';
            return;
        }
        
        const commentsHTML = comments.map(comment => 
            this.createCommentHTML(comment)
        ).join('');
        
        container.innerHTML = commentsHTML;
    }
    
    createCommentHTML(comment) {
        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-avatar">
                    <img src="${comment.user.avatar}" alt="${comment.user.name}">
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user.name}</span>
                        <span class="comment-time">${this.formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        <button class="comment-like-btn" data-comment-id="${comment.id}">
                            <span class="like-icon">👍</span>
                            <span class="like-count">${comment.likes || 0}</span>
                        </button>
                        <button class="comment-reply-btn" data-comment-id="${comment.id}">
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    showShareModal(contentId) {
        const modal = document.createElement('div');
        modal.className = 'share-modal modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Share this content</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="share-options">
                        <button class="share-option" onclick="socialFeatures.shareContent('${contentId}', 'twitter')">
                            <div class="share-icon">🐦</div>
                            <span>Twitter</span>
                        </button>
                        <button class="share-option" onclick="socialFeatures.shareContent('${contentId}', 'facebook')">
                            <div class="share-icon">📘</div>
                            <span>Facebook</span>
                        </button>
                        <button class="share-option" onclick="socialFeatures.shareContent('${contentId}', 'reddit')">
                            <div class="share-icon">🤖</div>
                            <span>Reddit</span>
                        </button>
                        <button class="share-option" onclick="socialFeatures.shareContent('${contentId}', 'native')">
                            <div class="share-icon">📱</div>
                            <span>More</span>
                        </button>
                        <button class="share-option" onclick="socialFeatures.shareContent('${contentId}', 'copy')">
                            <div class="share-icon">🔗</div>
                            <span>Copy Link</span>
                        </button>
                    </div>
                    
                    <div class="share-link">
                        <label>Direct Link:</label>
                        <div class="link-container">
                            <input type="text" readonly value="${window.location.origin}/watch/${contentId}" id="share-link-input">
                            <button onclick="socialFeatures.copyToClipboard(document.getElementById('share-link-input').value)">Copy</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    showReplyForm(commentId) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;
        
        // Remove existing reply forms
        const existingForms = commentElement.querySelectorAll('.reply-form');
        existingForms.forEach(form => form.remove());
        
        const replyForm = document.createElement('div');
        replyForm.className = 'reply-form';
        replyForm.innerHTML = `
            <textarea placeholder="Write a reply..." rows="2"></textarea>
            <div class="reply-actions">
                <button class="btn-secondary" onclick="this.closest('.reply-form').remove()">Cancel</button>
                <button class="btn-primary" onclick="socialFeatures.submitReply('${commentId}', this)">Reply</button>
            </div>
        `;
        
        commentElement.appendChild(replyForm);
    }
    
    async submitReply(parentCommentId, buttonElement) {
        const replyForm = buttonElement.closest('.reply-form');
        const textarea = replyForm.querySelector('textarea');
        const replyText = textarea.value.trim();
        
        if (!replyText) return;
        
        try {
            // Get content ID from the comment element
            const commentElement = replyForm.closest('[data-comment-id]');
            const contentId = commentElement.closest('[data-content-id]').dataset.contentId;
            
            await this.addComment(contentId, replyText, parentCommentId);
            replyForm.remove();
            
            // Reload comments
            await this.loadComments(contentId);
            
        } catch (error) {
            console.error('Error submitting reply:', error);
            this.showNotification('Failed to post reply', 'error');
        }
    }
    
    // Utility Methods
    
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffSeconds = Math.floor(diffTime / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSeconds < 60) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
    
    showNotification(message, type = 'info') {
        if (window.notificationSystem) {
            window.notificationSystem.show(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('fade-out');
            }, 3000);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3500);
        }
    }
    
    // Public API
    
    getApiClient() {
        return this.apiClient;
    }
    
    getSocialConnection(platform) {
        return this.socialConnections.get(platform);
    }
    
    getActivityFeed() {
        return [...this.activityFeed];
    }
    
    // Cleanup
    destroy() {
        this.socialConnections.clear();
        this.activityFeed = [];
        this.notifications = [];
        
        console.log('🌐 Social Features destroyed');
    }
}

// Global social features instance
window.socialFeatures = new SocialFeatures();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialFeatures;
}
