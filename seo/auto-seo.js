/**
 * Automatic SEO System for Xshiver Platform
 * Handles dynamic SEO optimization and real-time updates
 */

class AutoSEOSystem {
    constructor() {
        this.isEnabled = true;
        this.updateInterval = 60000; // 1 minute
        
        this.init();
    }
    
    init() {
        if (!this.isEnabled) return;
        
        console.log('🤖 Auto-SEO system starting...');
        
        // Initial SEO setup
        this.performInitialSetup();
        
        // Setup automatic updates
        this.setupAutomaticUpdates();
        
        // Monitor page changes
        this.setupPageMonitoring();
        
        console.log('✅ Auto-SEO system active');
    }
    
    performInitialSetup() {
        // Generate and inject all necessary SEO elements
        this.generatePageMetadata();
        this.injectStructuredData();
        this.optimizePageContent();
        this.setupSocialSharing();
    }
    
    generatePageMetadata() {
        const pageInfo = this.analyzeCurrentPage();
        
        // Auto-generate optimal title
        if (!document.title || document.title.length < 30) {
            document.title = this.generateOptimalTitle(pageInfo);
        }
        
        // Auto-generate meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc || metaDesc.content.length < 120) {
            const description = this.generateOptimalDescription(pageInfo);
            if (metaDesc) {
                metaDesc.content = description;
            } else {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                metaDesc.content = description;
                document.head.appendChild(metaDesc);
            }
        }
        
        // Auto-generate keywords
        const keywords = this.generateOptimalKeywords(pageInfo);
        let keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (!keywordsMeta) {
            keywordsMeta = document.createElement('meta');
            keywordsMeta.name = 'keywords';
            keywordsMeta.content = keywords;
            document.head.appendChild(keywordsMeta);
        }
    }
    
    analyzeCurrentPage() {
        const path = window.location.pathname;
        const content = document.body.textContent;
        const images = document.querySelectorAll('img').length;
        const videos = document.querySelectorAll('video').length;
        const h1 = document.querySelector('h1')?.textContent || '';
        
        return {
            path,
            contentLength: content.length,
            imageCount: images,
            videoCount: videos,
            primaryHeading: h1,
            wordCount: content.split(/\s+/).length,
            isVideoPage: path.includes('watch') || path.includes('video'),
            isBrowsePage: path.includes('browse'),
            isHomePage: path === '/' || path.endsWith('index.html')
        };
    }
    
    generateOptimalTitle(pageInfo) {
        if (pageInfo.isHomePage) {
            return 'Xshiver - Premium Adult Video Streaming Platform | HD Entertainment';
        } else if (pageInfo.isVideoPage) {
            const videoTitle = pageInfo.primaryHeading || 'Premium Adult Video';
            return `${videoTitle} - Watch HD Adult Content | Xshiver`;
        } else if (pageInfo.isBrowsePage) {
            return 'Browse Premium Adult Videos - HD Collection | Xshiver Platform';
        } else {
            const pageTitle = pageInfo.primaryHeading || 'Adult Entertainment';
            return `${pageTitle} | Xshiver - Premium Adult Platform`;
        }
    }
    
    generateOptimalDescription(pageInfo) {
        if (pageInfo.isHomePage) {
            return 'Experience premium adult entertainment with HD streaming, exclusive content, and advanced features on Xshiver platform. Join millions of users worldwide.';
        } else if (pageInfo.isVideoPage) {
            return 'Stream high-quality adult entertainment video with advanced player features, HD quality, and premium content on Xshiver platform.';
        } else if (pageInfo.isBrowsePage) {
            return 'Discover and browse extensive collection of premium adult video content with advanced filtering, categories, and HD streaming on Xshiver.';
        } else {
            return 'Premium adult video streaming platform with HD content, exclusive entertainment, and advanced features for mature audiences.';
        }
    }
    
    generateOptimalKeywords(pageInfo) {
        const baseKeywords = ['adult videos', 'streaming', 'premium content', 'HD videos', 'adult entertainment'];
        
        if (pageInfo.isVideoPage) {
            return [...baseKeywords, 'watch adult video', 'video player', 'HD streaming', 'adult content'].join(', ');
        } else if (pageInfo.isBrowsePage) {
            return [...baseKeywords, 'browse videos', 'video collection', 'adult categories', 'video search'].join(', ');
        } else {
            return [...baseKeywords, 'video platform', 'exclusive content', 'mature audience'].join(', ');
        }
    }
    
    injectStructuredData() {
        // Auto-inject appropriate structured data
        const pageType = this.getPageType();
        
        if (pageType === 'video') {
            this.injectVideoStructuredData();
        } else if (pageType === 'website') {
            this.injectWebsiteStructuredData();
        }
    }
    
    injectVideoStructuredData() {
        const videoData = this.extractVideoData();
        if (!videoData) return;
        
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": videoData.title,
            "description": videoData.description,
            "thumbnailUrl": videoData.thumbnail,
            "uploadDate": videoData.uploadDate || new Date().toISOString(),
            "duration": videoData.duration || "PT30M",
            "contentUrl": videoData.contentUrl,
            "embedUrl": window.location.href,
            "isFamilyFriendly": false,
            "contentRating": "adult"
        };
        
        this.insertStructuredData(structuredData, 'auto-video-data');
    }
    
    injectWebsiteStructuredData() {
        const websiteData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Xshiver",
            "url": window.location.origin,
            "description": "Premium adult video streaming platform",
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${window.location.origin}/pages/browse/search-results.html?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        };
        
        this.insertStructuredData(websiteData, 'auto-website-data');
    }
    
    extractVideoData() {
        const video = document.querySelector('video');
        const title = document.querySelector('h1')?.textContent || document.title;
        const description = document.querySelector('.video-description')?.textContent || 
                          document.querySelector('meta[name="description"]')?.content || '';
        
        if (!video && !title.toLowerCase().includes('video')) {
            return null;
        }
        
        return {
            title,
            description,
            thumbnail: video?.poster || document.querySelector('.video-thumbnail img')?.src,
            contentUrl: video?.src || video?.currentSrc,
            duration: video?.duration ? `PT${Math.round(video.duration)}S` : null
        };
    }
    
    insertStructuredData(data, id) {
        // Remove existing
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        
        // Insert new
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        script.textContent = JSON.stringify(data, null, 2);
        document.head.appendChild(script);
    }
    
    optimizePageContent() {
        // Auto-optimize images
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('alt')) {
                img.alt = this.generateImageAlt(img.src);
            }
            if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
            }
        });
        
        // Auto-optimize links
        document.querySelectorAll('a').forEach(link => {
            if (!link.hasAttribute('title') && link.textContent.trim()) {
                link.title = link.textContent.trim();
            }
        });
    }
    
    generateImageAlt(src) {
        const filename = src.split('/').pop().split('.')[0];
        return filename
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase()) + ' - Xshiver Platform';
    }
    
    setupSocialSharing() {
        // Add social sharing meta tags if missing
        const ogTags = [
            { property: 'og:title', content: document.title },
            { property: 'og:description', content: document.querySelector('meta[name="description"]')?.content },
            { property: 'og:url', content: window.location.href },
            { property: 'og:type', content: this.getPageType() },
            { property: 'og:site_name', content: 'Xshiver' }
        ];
        
        ogTags.forEach(tag => {
            if (tag.content && !document.querySelector(`meta[property="${tag.property}"]`)) {
                const meta = document.createElement('meta');
                meta.property = tag.property;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });
    }
    
    getPageType() {
        if (window.location.pathname.includes('watch') || document.querySelector('video')) {
            return 'video.other';
        }
        return 'website';
    }
    
    setupAutomaticUpdates() {
        // Periodically check and update SEO elements
        setInterval(() => {
            this.performMaintenanceTasks();
        }, this.updateInterval);
    }
    
    setupPageMonitoring() {
        // Monitor content changes
        const observer = new MutationObserver((mutations) => {
            let contentChanged = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    contentChanged = true;
                }
            });
            
            if (contentChanged) {
                setTimeout(() => this.optimizePageContent(), 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    performMaintenanceTasks() {
        // Re-optimize any new content
        this.optimizePageContent();
        
        // Update timestamps in structured data
        this.updateStructuredDataTimestamps();
        
        // Check for SEO issues
        this.performQuickAudit();
    }
    
    updateStructuredDataTimestamps() {
        const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
        
        structuredDataScripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'VideoObject' && !data.uploadDate) {
                    data.uploadDate = new Date().toISOString();
                    script.textContent = JSON.stringify(data, null, 2);
                }
            } catch (error) {
                // Ignore malformed JSON
            }
        });
    }
    
    performQuickAudit() {
        const issues = [];
        
        // Check essential elements
        if (!document.title || document.title.length < 30) {
            issues.push('Title too short');
        }
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc || metaDesc.content.length < 120) {
            issues.push('Meta description too short');
        }
        
        if (document.querySelectorAll('h1').length !== 1) {
            issues.push('H1 tag issue');
        }
        
        if (issues.length > 0) {
            console.warn('🔍 Auto-SEO detected issues:', issues);
        }
    }
    
    // Public API
    forceUpdate() {
        this.performInitialSetup();
        console.log('🔄 SEO force update completed');
    }
    
    disable() {
        this.isEnabled = false;
        console.log('⏸️ Auto-SEO disabled');
    }
    
    enable() {
        this.isEnabled = true;
        this.init();
        console.log('▶️ Auto-SEO enabled');
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.autoSEO = new AutoSEOSystem();
});
