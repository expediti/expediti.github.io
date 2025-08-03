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
        this.proces
