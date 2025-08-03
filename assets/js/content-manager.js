/**
 * Advanced Content Manager for Xshiver
 * Handles content upload, moderation, and lifecycle management
 */

class ContentManager {
    constructor() {
        this.uploadQueue = [];
        this.processingVideos = new Map();
        this.contentFilters = {};
        this.moderationQueue = [];
        
        // Content statuses
        this.statuses = {
            UPLOADING: 'uploading',
            PROCESSING: 'processing',
            PENDING_REVIEW: 'pending_review',
            APPROVED: 'approved',
            REJECTED: 'rejected',
            PUBLISHED: 'published',
            ARCHIVED: 'archived'
        };
        
        // Upload settings
        this.uploadSettings = {
            maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
            allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
            chunkSize: 5 * 1024 * 1024, // 5MB chunks
            maxConcurrentUploads: 3
        };
        
        this.init();
    }
    
    init() {
        console.log('📊 Content Manager initializing...');
        
        // Setup upload functionality
        this.setupUploadInterface();
        
        // Setup content moderation
        this.setupModerationTools();
        
        // Setup content analytics
        this.setupContentAnalytics();
        
        console.log('✅ Content Manager initialized');
    }
    
    setupUploadInterface() {
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                this.handleFilesDrop(e.dataTransfer.files);
            });
            
            // File input
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    this.handleFilesDrop(e.target.files);
                });
            }
        }
    }
    
    async handleFilesDrop(files) {
        for (let file of files) {
            if (this.validateFile(file)) {
                await this.addToUploadQueue(file);
            }
        }
        
        this.processUploadQueue();
    }
    
    validateFile(file) {
        // Check file type
        if (!this.uploadSettings.allowedTypes.includes(file.type)) {
            this.showUploadError(`Unsupported file type: ${file.type}`);
            return false;
        }
        
        // Check file size
        if (file.size > this.uploadSettings.maxFileSize) {
            this.showUploadError(`File too large: ${this.formatBytes(file.size)}`);
            return false;
        }
        
        return true;
    }
    
    async addToUploadQueue(file) {
        const uploadId = this.generateUploadId();
        
        const uploadItem = {
            id: uploadId,
            file: file,
            status: 'queued',
            progress: 0,
            metadata: await this.extractVideoMetadata(file),
            thumbnails: [],
            createdAt: new Date().toISOString()
        };
        
        this.uploadQueue.push(uploadItem);
        this.updateUploadUI();
        
        return uploadItem;
    }
    
    async extractVideoMetadata(file) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                resolve({
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    size: file.size,
                    type: file.type,
                    name: file.name
                });
                
                URL.revokeObjectURL(video.src);
            };
            
            video.src = URL.createObjectURL(file);
        });
    }
    
    async processUploadQueue() {
        const activeUploads = this.uploadQueue.filter(item => item.status === 'uploading').length;
        
        if (activeUploads >= this.uploadSettings.maxConcurrentUploads) {
            return; // Too many concurrent uploads
        }
        
        const nextUpload = this.uploadQueue.find(item => item.status === 'queued');
        if (nextUpload) {
            await this.startUpload(nextUpload);
        }
    }
    
    async startUpload(uploadItem) {
        uploadItem.status = 'uploading';
        this.updateUploadUI();
        
        try {
            // Generate thumbnails
            uploadItem.thumbnails = await this.generateThumbnails(uploadItem.file);
            
            // Upload file in chunks
            const uploadResult = await this.uploadFileInChunks(uploadItem);
            
            // Create content record
            const contentId = await this.createContentRecord(uploadItem, uploadResult);
            
            uploadItem.status = 'completed';
            uploadItem.contentId = contentId;
            
            // Start processing pipeline
            this.startContentProcessing(contentId);
            
        } catch (error) {
            console.error('Upload failed:', error);
            uploadItem.status = 'failed';
            uploadItem.error = error.message;
        }
        
        this.updateUploadUI();
        
        // Process next item in queue
        setTimeout(() => this.processUploadQueue(), 1000);
    }
    
    async generateThumbnails(file) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const thumbnails = [];
                const intervals = [0.1, 0.3, 0.5, 0.7, 0.9]; // 10%, 30%, 50%, 70%, 90%
                
                let completed = 0;
                
                intervals.forEach((interval, index) => {
                    video.currentTime = video.duration * interval;
                    
                    video.onseeked = () => {
                        ctx.drawImage(video, 0, 0);
                        
                        canvas.toBlob((blob) => {
                            thumbnails[index] = {
                                time: video.currentTime,
                                blob: blob,
                                url: URL.createObjectURL(blob)
                            };
                            
                            completed++;
                            if (completed === intervals.length) {
                                resolve(thumbnails);
                            }
                        }, 'image/jpeg', 0.8);
                    };
                });
            };
            
            video.src = URL.createObjectURL(file);
        });
    }
    
    async uploadFileInChunks(uploadItem) {
        const file = uploadItem.file;
        const totalChunks = Math.ceil(file.size / this.uploadSettings.chunkSize);
        const uploadId = await this.initializeChunkedUpload(uploadItem);
        
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * this.uploadSettings.chunkSize;
            const end = Math.min(start + this.uploadSettings.chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            await this.uploadChunk(uploadId, chunkIndex, chunk);
            
            // Update progress
            uploadItem.progress = ((chunkIndex + 1) / totalChunks) * 100;
            this.updateUploadProgress(uploadItem);
        }
        
        // Finalize upload
        return await this.finalizeChunkedUpload(uploadId);
    }
    
    async initializeChunkedUpload(uploadItem) {
        const response = await fetch('/api/upload/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authSystem.getToken()}`
            },
            body: JSON.stringify({
                filename: uploadItem.file.name,
                filesize: uploadItem.file.size,
                contentType: uploadItem.file.type,
                metadata: uploadItem.metadata
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to initialize upload');
        }
        
        const result = await response.json();
        return result.uploadId;
    }
    
    async uploadChunk(uploadId, chunkIndex, chunk) {
        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex);
        formData.append('chunk', chunk);
        
        const response = await fetch('/api/upload/chunk', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.authSystem.getToken()}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Failed to upload chunk ${chunkIndex}`);
        }
        
        return await response.json();
    }
    
    async finalizeChunkedUpload(uploadId) {
        const response = await fetch('/api/upload/finalize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authSystem.getToken()}`
            },
            body: JSON.stringify({ uploadId })
        });
        
        if (!response.ok) {
            throw new Error('Failed to finalize upload');
        }
        
        return await response.json();
    }
    
    async createContentRecord(uploadItem, uploadResult) {
        const contentData = {
            title: uploadItem.metadata.name.replace(/\.[^/.]+$/, ""), // Remove extension
            description: '',
            category: 'uncategorized',
            tags: [],
            duration: uploadItem.metadata.duration,
            fileUrl: uploadResult.fileUrl,
            thumbnails: uploadItem.thumbnails.map(thumb => thumb.url),
            metadata: uploadItem.metadata,
            status: this.statuses.PROCESSING
        };
        
        const response = await fetch('/api/content/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authSystem.getToken()}`
            },
            body: JSON.stringify(contentData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create content record');
        }
        
        const result = await response.json();
        return result.contentId;
    }
    
    startContentProcessing(contentId) {
        this.processingVideos.set(contentId, {
            id: contentId,
            stage: 'transcoding',
            progress: 0,
            startTime: Date.now()
        });
        
        // Simulate processing stages
        this.simulateProcessingStages(contentId);
    }
    
    async simulateProcessingStages(contentId) {
        const stages = [
            { name: 'transcoding', duration: 5000 },
            { name: 'thumbnail_generation', duration: 2000 },
            { name: 'content_analysis', duration: 3000 },
            { name: 'moderation_check', duration: 1000 }
        ];
        
        for (const stage of stages) {
            await this.simulateProcessingStage(contentId, stage);
        }
        
                // Move to pending review
        await this.moveToModerationQueue(contentId);
        this.processingVideos.delete(contentId);
    }
    
    async simulateProcessingStage(contentId, stage) {
        const processing = this.processingVideos.get(contentId);
        if (!processing) return;
        
        processing.stage = stage.name;
        processing.progress = 0;
        
        // Simulate progress
        const progressInterval = setInterval(() => {
            processing.progress += Math.random() * 20;
            if (processing.progress >= 100) {
                processing.progress = 100;
                clearInterval(progressInterval);
            }
            
            this.updateProcessingUI(contentId, processing);
        }, 200);
        
        await new Promise(resolve => setTimeout(resolve, stage.duration));
        clearInterval(progressInterval);
        
        processing.progress = 100;
        this.updateProcessingUI(contentId, processing);
    }
    
    async moveToModerationQueue(contentId) {
        this.moderationQueue.push({
            id: contentId,
            queuedAt: new Date().toISOString(),
            priority: 'normal'
        });
        
        // Update content status
        await this.updateContentStatus(contentId, this.statuses.PENDING_REVIEW);
        
        // Notify moderators
        this.notifyModerators(contentId);
    }
    
    setupModerationTools() {
        // Auto-moderation rules
        this.autoModerationRules = [
            {
                name: 'inappropriate_content',
                enabled: true,
                action: 'flag',
                confidence: 0.8
            },
            {
                name: 'spam_detection',
                enabled: true,
                action: 'reject',
                confidence: 0.9
            }
        ];
        
        // Setup moderation interface
        this.setupModerationInterface();
    }
    
    setupModerationInterface() {
        const moderationPanel = document.getElementById('moderation-panel');
        if (moderationPanel) {
            this.renderModerationQueue();
        }
    }
    
    renderModerationQueue() {
        const container = document.getElementById('moderation-queue');
        if (!container) return;
        
        if (this.moderationQueue.length === 0) {
            container.innerHTML = '<p class="no-items">No items in moderation queue</p>';
            return;
        }
        
        const queueHTML = this.moderationQueue.map(item => `
            <div class="moderation-item" data-content-id="${item.id}">
                <div class="item-preview">
                    <video class="preview-video" src="/api/content/${item.id}/preview" controls></video>
                </div>
                <div class="item-details">
                    <h4>Content ID: ${item.id}</h4>
                    <p>Queued: ${this.formatRelativeTime(item.queuedAt)}</p>
                    <p>Priority: ${item.priority}</p>
                </div>
                <div class="moderation-actions">
                    <button class="btn-success" onclick="contentManager.approveContent('${item.id}')">
                        Approve
                    </button>
                    <button class="btn-danger" onclick="contentManager.rejectContent('${item.id}')">
                        Reject
                    </button>
                    <button class="btn-secondary" onclick="contentManager.flagContent('${item.id}')">
                        Flag for Review
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = queueHTML;
    }
    
    async approveContent(contentId) {
        try {
            await this.updateContentStatus(contentId, this.statuses.APPROVED);
            this.removeFromModerationQueue(contentId);
            
            // Auto-publish if configured
            const autoPublish = await this.getContentSetting('auto_publish_approved');
            if (autoPublish) {
                await this.publishContent(contentId);
            }
            
            this.showNotification('Content approved successfully', 'success');
            
        } catch (error) {
            console.error('Error approving content:', error);
            this.showNotification('Failed to approve content', 'error');
        }
    }
    
    async rejectContent(contentId, reason) {
        try {
            await this.updateContentStatus(contentId, this.statuses.REJECTED);
            this.removeFromModerationQueue(contentId);
            
            // Send rejection notification
            await this.sendRejectionNotification(contentId, reason);
            
            this.showNotification('Content rejected', 'success');
            
        } catch (error) {
            console.error('Error rejecting content:', error);
            this.showNotification('Failed to reject content', 'error');
        }
    }
    
    async publishContent(contentId) {
        try {
            await this.updateContentStatus(contentId, this.statuses.PUBLISHED);
            
            // Update search index
            await this.updateSearchIndex(contentId);
            
            // Generate social media posts
            await this.generateSocialPosts(contentId);
            
            // Send publication notification
            await this.sendPublicationNotification(contentId);
            
            this.showNotification('Content published successfully', 'success');
            
        } catch (error) {
            console.error('Error publishing content:', error);
            this.showNotification('Failed to publish content', 'error');
        }
    }
    
    setupContentAnalytics() {
        this.analyticsData = {
            uploadTrends: [],
            categoryDistribution: {},
            qualityMetrics: {},
            moderationStats: {}
        };
        
        // Load analytics data
        this.loadContentAnalytics();
    }
    
    async loadContentAnalytics() {
        try {
            const response = await fetch('/api/analytics/content', {
                headers: {
                    'Authorization': `Bearer ${window.authSystem.getToken()}`
                }
            });
            
            if (response.ok) {
                this.analyticsData = await response.json();
                this.updateAnalyticsUI();
            }
            
        } catch (error) {
            console.error('Error loading content analytics:', error);
        }
    }
    
    updateAnalyticsUI() {
        // Update upload trends chart
        this.updateUploadTrendsChart();
        
        // Update category distribution
        this.updateCategoryChart();
        
        // Update quality metrics
        this.updateQualityMetrics();
    }
    
    // UI Update Methods
    
    updateUploadUI() {
        const container = document.getElementById('upload-queue');
        if (!container) return;
        
        if (this.uploadQueue.length === 0) {
            container.innerHTML = '<p class="no-uploads">No uploads in queue</p>';
            return;
        }
        
        const uploadsHTML = this.uploadQueue.map(upload => `
            <div class="upload-item ${upload.status}" data-upload-id="${upload.id}">
                <div class="upload-thumbnail">
                    ${upload.thumbnails.length > 0 ? 
                        `<img src="${upload.thumbnails[0].url}" alt="Thumbnail">` : 
                        '<div class="no-thumbnail">📹</div>'
                    }
                </div>
                <div class="upload-details">
                    <h4>${upload.file.name}</h4>
                    <p>${this.formatBytes(upload.file.size)} • ${this.formatDuration(upload.metadata.duration)}</p>
                    <div class="upload-status">
                        ${this.getUploadStatusText(upload)}
                    </div>
                    ${upload.status === 'uploading' ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${upload.progress}%"></div>
                        </div>
                        <div class="progress-text">${Math.round(upload.progress)}%</div>
                    ` : ''}
                </div>
                <div class="upload-actions">
                    ${upload.status === 'queued' ? `
                        <button class="btn-sm btn-danger" onclick="contentManager.cancelUpload('${upload.id}')">
                            Cancel
                        </button>
                    ` : ''}
                    ${upload.status === 'completed' ? `
                        <button class="btn-sm btn-primary" onclick="contentManager.editContent('${upload.contentId}')">
                            Edit
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = uploadsHTML;
    }
    
    updateUploadProgress(uploadItem) {
        const element = document.querySelector(`[data-upload-id="${uploadItem.id}"] .progress-fill`);
        if (element) {
            element.style.width = `${uploadItem.progress}%`;
        }
        
        const progressText = document.querySelector(`[data-upload-id="${uploadItem.id}"] .progress-text`);
        if (progressText) {
            progressText.textContent = `${Math.round(uploadItem.progress)}%`;
        }
    }
    
    updateProcessingUI(contentId, processing) {
        const element = document.querySelector(`[data-content-id="${contentId}"] .processing-stage`);
        if (element) {
            element.textContent = `${processing.stage}: ${Math.round(processing.progress)}%`;
        }
    }
    
    getUploadStatusText(upload) {
        switch (upload.status) {
            case 'queued':
                return 'Waiting in queue...';
            case 'uploading':
                return 'Uploading...';
            case 'completed':
                return 'Upload complete';
            case 'failed':
                return `Failed: ${upload.error}`;
            default:
                return upload.status;
        }
    }
    
    // Content Management API Methods
    
    async updateContentStatus(contentId, status) {
        const response = await fetch(`/api/content/${contentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authSystem.getToken()}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update content status');
        }
        
        return await response.json();
    }
    
    async getContentSetting(key) {
        try {
            const response = await fetch(`/api/settings/content/${key}`, {
                headers: {
                    'Authorization': `Bearer ${window.authSystem.getToken()}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.value;
            }
        } catch (error) {
            console.error('Error getting content setting:', error);
        }
        
        return false; // Default value
    }
    
    async sendRejectionNotification(contentId, reason) {
        await fetch('/api/notifications/content-rejection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authSystem.getToken()}`
            },
            body: JSON.stringify({
                contentId,
                reason: reason || 'Content did not meet community guidelines'
            })
        });
    }
    
    async sendPublicationNotification(contentId) {
        await fetch('/api/notifications/content-published', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.authSystem.getToken()}`
            },
            body: JSON.stringify({ contentId })
        });
    }
    
    // Utility Methods
    
    generateUploadId() {
        return 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
        return `${Math.floor(diffMinutes / 1440)} days ago`;
    }
    
    removeFromModerationQueue(contentId) {
        this.moderationQueue = this.moderationQueue.filter(item => item.id !== contentId);
        this.renderModerationQueue();
    }
    
    notifyModerators(contentId) {
        // Send notification to moderators
        if (window.notificationSystem) {
            window.notificationSystem.sendNotification({
                type: 'moderation_required',
                contentId: contentId,
                recipients: ['moderators']
            });
        }
    }
    
    showUploadError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
        }, 5000);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5500);
    }
    
    // Public API
    
    cancelUpload(uploadId) {
        const index = this.uploadQueue.findIndex(item => item.id === uploadId);
        if (index !== -1) {
            this.uploadQueue.splice(index, 1);
            this.updateUploadUI();
        }
    }
    
    getUploadProgress(uploadId) {
        const upload = this.uploadQueue.find(item => item.id === uploadId);
        return upload ? upload.progress : 0;
    }
    
    getModerationQueue() {
        return [...this.moderationQueue];
    }
    
    // Cleanup
    destroy() {
        this.uploadQueue = [];
        this.processingVideos.clear();
        this.moderationQueue = [];
        
        console.log('📊 Content Manager destroyed');
    }
}

// Global content manager instance
window.contentManager = new ContentManager();

