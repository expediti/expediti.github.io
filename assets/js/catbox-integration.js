/**
 * Catbox Cloud Storage Integration for Xshiver
 * Handles video streaming and thumbnail management
 */

class CatboxIntegration {
    constructor() {
        this.apiEndpoint = 'https://catbox.moe/user/api.php';
        this.uploaderEndpoint = 'https://litterbox.catbox.moe/resources/internals/api.php';
        this.maxVideoSize = 200 * 1024 * 1024; // 200MB
        this.maxThumbnailSize = 5 * 1024 * 1024; // 5MB
        this.supportedVideoFormats = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
        this.supportedImageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        
        console.log('📦 Catbox Integration initialized');
    }
    
    // Video streaming methods
    async getStreamingUrls(videoUrl, quality = 'auto') {
        try {
            console.log(`🎥 Getting streaming URLs for quality: ${quality}`);
            
            if (!this.isValidCatboxUrl(videoUrl)) {
                throw new Error('Invalid Catbox URL');
            }
            
            // For Catbox, the direct URL is the streaming URL
            const baseUrl = videoUrl.replace(/\.[^/.]+$/, ""); // Remove extension
            const extension = this.getFileExtension(videoUrl);
            
            const streamingUrls = {
                auto: videoUrl,
                '4k': `${baseUrl}_4k.${extension}`,
                '1080p': `${baseUrl}_1080p.${extension}`,
                '720p': `${baseUrl}_720p.${extension}`,
                '480p': `${baseUrl}_480p.${extension}`
            };
            
            // Check if quality-specific URLs exist, fallback to original
            const qualityUrl = streamingUrls[quality] || videoUrl;
            
            // Verify URL accessibility
            const isAccessible = await this.verifyUrlAccessibility(qualityUrl);
            
            return {
                primary: isAccessible ? qualityUrl : videoUrl,
                fallback: videoUrl,
                available_qualities: await this.getAvailableQualities(baseUrl, extension)
            };
            
        } catch (error) {
            console.error('Error getting streaming URLs:', error);
            return {
                primary: videoUrl,
                fallback: videoUrl,
                available_qualities: ['auto']
            };
        }
    }
    
    async getAvailableQualities(baseUrl, extension) {
        const qualities = ['4k', '1080p', '720p', '480p'];
        const available = ['auto']; // Always include auto
        
        // Check which quality versions exist
        for (const quality of qualities) {
            const qualityUrl = `${baseUrl}_${quality}.${extension}`;
            if (await this.verifyUrlAccessibility(qualityUrl, false)) {
                available.push(quality);
            }
        }
        
        return available;
    }
    
    async verifyUrlAccessibility(url, logErrors = true) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch (error) {
            if (logErrors) {
                console.log(`URL not accessible: ${url}`);
            }
            return false;
        }
    }
    
    // Upload methods (for admin functionality)
    async uploadVideo(file, userHash = null) {
        try {
            console.log(`📤 Uploading video: ${file.name}`);
            
            // Validate file
            this.validateVideoFile(file);
            
            const formData = new FormData();
            formData.append('fileToUpload', file);
            formData.append('reqtype', 'fileupload');
            
            if (userHash) {
                formData.append('userhash', userHash);
            }
            
            // Show upload progress
            const uploadPromise = this.uploadWithProgress(formData, (progress) => {
                this.onUploadProgress('video', progress);
            });
            
            const response = await uploadPromise;
            const result = await response.text();
            
            if (response.ok && this.isValidCatboxUrl(result.trim())) {
                const videoUrl = result.trim();
                console.log(`✅ Video uploaded successfully: ${videoUrl}`);
                
                // Generate thumbnail
                const thumbnailUrl = await this.generateThumbnail(file, videoUrl);
                
                return {
                    success: true,
                    videoUrl: videoUrl,
                    thumbnailUrl: thumbnailUrl,
                    filename: file.name,
                    size: file.size,
                    type: file.type
                };
            } else {
                throw new Error(`Upload failed: ${result}`);
            }
            
        } catch (error) {
            console.error('Video upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async uploadThumbnail(file, userHash = null) {
        try {
            console.log(`🖼️ Uploading thumbnail: ${file.name}`);
            
            // Validate file
            this.validateImageFile(file);
            
            const formData = new FormData();
            formData.append('fileToUpload', file);
            formData.append('reqtype', 'fileupload');
            
            if (userHash) {
                formData.append('userhash', userHash);
            }
            
            const response = await this.uploadWithProgress(formData, (progress) => {
                this.onUploadProgress('thumbnail', progress);
            });
            
            const result = await response.text();
            
            if (response.ok && this.isValidCatboxUrl(result.trim())) {
                const thumbnailUrl = result.trim();
                console.log(`✅ Thumbnail uploaded successfully: ${thumbnailUrl}`);
                
                return {
                    success: true,
                    url: thumbnailUrl,
                    filename: file.name,
                    size: file.size
                };
            } else {
                throw new Error(`Thumbnail upload failed: ${result}`);
            }
            
        } catch (error) {
            console.error('Thumbnail upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async uploadWithProgress(formData, progressCallback) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100;
                    progressCallback(progress);
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({
                        ok: true,
                        text: () => Promise.resolve(xhr.responseText)
                    });
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });
            
            xhr.open('POST', this.apiEndpoint);
            xhr.send(formData);
        });
    }
    
    // Thumbnail generation
    async generateThumbnail(videoFile, videoUrl) {
        try {
            console.log('🎬 Generating thumbnail from video...');
            
            // Create video element for thumbnail extraction
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.muted = true;
            
            return new Promise((resolve, reject) => {
                video.addEventListener('loadedmetadata', () => {
                    // Seek to 10% of video duration for thumbnail
                    video.currentTime = video.duration * 0.1;
                });
                
                video.addEventListener('seeked', async () => {
                    try {
                        // Create canvas and draw video frame
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = 320;
                        canvas.height = 180;
                        
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        // Convert to blob
                        canvas.toBlob(async (blob) => {
                            const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                            const uploadResult = await this.uploadThumbnail(thumbnailFile);
                            
                            if (uploadResult.success) {
                                resolve(uploadResult.url);
                            } else {
                                // Fallback: generate placeholder thumbnail URL
                                resolve(this.generatePlaceholderThumbnail(videoUrl));
                            }
                        }, 'image/jpeg', 0.8);
                        
                    } catch (error) {
                        console.error('Thumbnail generation error:', error);
                        resolve(this.generatePlaceholderThumbnail(videoUrl));
                    }
                });
                
                video.addEventListener('error', () => {
                    console.log('Video load error, using placeholder thumbnail');
                    resolve(this.generatePlaceholderThumbnail(videoUrl));
                });
                
                // Load video from URL or file
                if (videoUrl && this.isValidCatboxUrl(videoUrl)) {
                    video.src = videoUrl;
                } else {
                    const videoObjectUrl = URL.createObjectURL(videoFile);
                    video.src = videoObjectUrl;
                    
                    // Clean up object URL when done
                    video.addEventListener('loadeddata', () => {
                        URL.revokeObjectURL(videoObjectUrl);
                    });
                }
                
                video.load();
            });
            
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            return this.generatePlaceholderThumbnail(videoUrl);
        }
    }
    
    generatePlaceholderThumbnail(videoUrl) {
        // Generate a placeholder thumbnail URL based on video URL
        const videoId = this.extractVideoId(videoUrl);
        return `https://via.placeholder.com/320x180/4A90E2/FFFFFF?text=Video+${videoId}`;
    }
    
    // File validation
    validateVideoFile(file) {
        if (!file) {
            throw new Error('No video file provided');
        }
        
        if (file.size > this.maxVideoSize) {
            throw new Error(`Video file too large. Maximum size: ${this.formatFileSize(this.maxVideoSize)}`);
        }
        
        const extension = this.getFileExtension(file.name).toLowerCase();
        if (!this.supportedVideoFormats.includes(extension)) {
            throw new Error(`Unsupported video format. Supported formats: ${this.supportedVideoFormats.join(', ')}`);
        }
    }
    
    validateImageFile(file) {
        if (!file) {
            throw new Error('No image file provided');
        }
        
        if (file.size > this.maxThumbnailSize) {
            throw new Error(`Image file too large. Maximum size: ${this.formatFileSize(this.maxThumbnailSize)}`);
        }
        
        const extension = this.getFileExtension(file.name).toLowerCase();
        if (!this.supportedImageFormats.includes(extension)) {
            throw new Error(`Unsupported image format. Supported formats: ${this.supportedImageFormats.join(', ')}`);
        }
    }
    
    // URL utilities
    isValidCatboxUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        const catboxDomains = [
            'files.catbox.moe',
            'litter.catbox.moe',
            'pomf.lain.la',
            'catbox.moe'
        ];
        
        try {
            const urlObj = new URL(url);
            return catboxDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`));
        } catch (error) {
            return false;
        }
    }
    
    extractVideoId(url) {
        if (!url) return 'unknown';
        
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            return filename.split('.')[0] || 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }
    
    getFileExtension(filename) {
        if (!filename || typeof filename !== 'string') return '';
        
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1) : '';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Progress callback handlers
    onUploadProgress(type, progress) {
        const event = new CustomEvent('catboxUploadProgress', {
            detail: {
                type: type,
                progress: progress,
                timestamp: new Date()
            }
        });
        
        document.dispatchEvent(event);
        console.log(`📊 ${type} upload progress: ${progress.toFixed(1)}%`);
    }
    
    // Video metadata extraction
    async extractVideoMetadata(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.muted = true;
            
            video.addEventListener('loadedmetadata', () => {
                const metadata = {
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    aspectRatio: video.videoWidth / video.videoHeight,
                    resolution: `${video.videoWidth}x${video.videoHeight}`,
                    quality: this.determineQualityFromResolution(video.videoWidth, video.videoHeight)
                };
                
                URL.revokeObjectURL(video.src);
                resolve(metadata);
            });
            
            video.addEventListener('error', (error) => {
                URL.revokeObjectURL(video.src);
                reject(error);
            });
            
            video.src = URL.createObjectURL(file);
        });
    }
    
    determineQualityFromResolution(width, height) {
        if (width >= 3840 && height >= 2160) return '4k';
        if (width >= 1920 && height >= 1080) return '1080p';
        if (width >= 1280 && height >= 720) return '720p';
        if (width >= 854 && height >= 480) return '480p';
        return '360p';
    }
    
    // CDN optimization
    optimizeUrl(url, options = {}) {
        if (!this.isValidCatboxUrl(url)) return url;
        
        try {
            const urlObj = new URL(url);
            
            // Add optimization parameters if supported
            if (options.quality) {
                urlObj.searchParams.set('q', options.quality);
            }
            
            if (options.format) {
                urlObj.searchParams.set('f', options.format);
            }
            
            if (options.width || options.height) {
                urlObj.searchParams.set('w', options.width || 'auto');
                urlObj.searchParams.set('h', options.height || 'auto');
            }
            
            return urlObj.toString();
        } catch (error) {
            return url;
        }
    }
    
    // Batch operations
    async uploadMultipleFiles(files, userHash = null, progressCallback = null) {
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                let result;
                
                if (this.isVideoFile(file)) {
                    result = await this.uploadVideo(file, userHash);
                } else if (this.isImageFile(file)) {
                    result = await this.uploadThumbnail(file, userHash);
                } else {
                    result = {
                        success: false,
                        error: 'Unsupported file type',
                        filename: file.name
                    };
                }
                
                results.push(result);
                
                if (progressCallback) {
                    progressCallback(i + 1, files.length, result);
                }
                
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    filename: file.name
                });
            }
        }
        
        return results;
    }
    
    isVideoFile(file) {
        const extension = this.getFileExtension(file.name).toLowerCase();
        return this.supportedVideoFormats.includes(extension);
    }
    
    isImageFile(file) {
        const extension = this.getFileExtension(file.name).toLowerCase();
        return this.supportedImageFormats.includes(extension);
    }
    
    // Caching methods
    getCachedUrl(originalUrl, quality) {
        const cacheKey = `catbox_${originalUrl}_${quality}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            try {
                const data = JSON.parse(cached);
                const age = Date.now() - data.timestamp;
                
                // Cache for 1 hour
                if (age < 3600000) {
                    return data.url;
                }
            } catch (error) {
                localStorage.removeItem(cacheKey);
            }
        }
        
        return null;
    }
    
    setCachedUrl(originalUrl, quality, optimizedUrl) {
        const cacheKey = `catbox_${originalUrl}_${quality}`;
        const data = {
            url: optimizedUrl,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (error) {
            console.log('Failed to cache URL:', error);
        }
    }
    
    // Analytics and monitoring
    trackUsage(action, data = {}) {
        const usage = JSON.parse(localStorage.getItem('catbox_usage') || '[]');
        
        usage.push({
            action,
            data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        // Keep only last 100 entries
        if (usage.length > 100) {
            usage.splice(0, usage.length - 100);
        }
        
        localStorage.setItem('catbox_usage', JSON.stringify(usage));
        
        console.log(`📈 Catbox usage tracked: ${action}`, data);
    }
    
    getUsageStats() {
        const usage = JSON.parse(localStorage.getItem('catbox_usage') || '[]');
        
        const stats = {
            total_actions: usage.length,
            uploads: usage.filter(u => u.action === 'upload').length,
            streams: usage.filter(u => u.action === 'stream').length,
            errors: usage.filter(u => u.action === 'error').length,
            last_activity: usage.length > 0 ? usage[usage.length - 1].timestamp : null
        };
        
        return stats;
    }
}

// Initialize global Catbox integration
window.catboxIntegration = new CatboxIntegration();

// Listen for upload progress events
document.addEventListener('catboxUploadProgress', (e) => {
    const { type, progress } = e.detail;
    
    // Update progress bars or UI elements
    const progressBar = document.getElementById(`${type}-progress`);
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('data-progress', progress.toFixed(1));
    }
    
    // Update progress text
    const progressText = document.getElementById(`${type}-progress-text`);
    if (progressText) {
        progressText.textContent = `${type} upload: ${progress.toFixed(1)}%`;
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CatboxIntegration;
}
