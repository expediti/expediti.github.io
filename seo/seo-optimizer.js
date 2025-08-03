/**
 * Phase 7: SEO Optimizer for Xshiver Platform
 * Enhances SEO through dynamic meta tags and structured data
 */

class XshiverSEOOptimizer {
    constructor() {
        this.config = {
            siteName: 'Xshiver',
            siteUrl: 'https://yourusername.github.io/xshiver-platform',
            defaultImage: '/assets/images/og-default.jpg',
            twitterHandle: '@XshiverPlatform',
            language: 'en',
            locale: 'en_US'
        };
        
        this.structuredData = {};
        this.breadcrumbs = [];
        
        this.init();
    }
    
    init() {
        console.log('🔍 SEO Optimizer initializing...');
        
        // Enhance existing meta tags
        this.enhanceMetaTags();
        
        // Add structured data
        this.addStructuredData();
        
        // Setup breadcrumbs
        this.setupBreadcrumbs();
        
        // Optimize images for SEO
        this.optimizeImages();
        
        // Setup internal linking
        this.enhanceInternalLinks();
        
        // Monitor and report SEO issues
        this.setupSEOMonitoring();
        
        console.log('✅ SEO Optimizer initialized');
    }
    
    enhanceMetaTags() {
        const pageData = this.getPageData();
        
        // Update or create essential meta tags
        this.setMetaTag('description', pageData.description);
        this.setMetaTag('keywords', pageData.keywords);
        this.setMetaTag('author', 'Xshiver Platform');
        this.setMetaTag('robots', pageData.robots || 'index, follow');
        
        // Open Graph tags
        this.setMetaProperty('og:title', pageData.title);
        this.setMetaProperty('og:description', pageData.description);
        this.setMetaProperty('og:image', pageData.image);
        this.setMetaProperty('og:url', window.location.href);
        this.setMetaProperty('og:type', pageData.type || 'website');
        this.setMetaProperty('og:site_name', this.config.siteName);
        this.setMetaProperty('og:locale', this.config.locale);
        
        // Twitter Card tags
        this.setMetaName('twitter:card', pageData.twitterCard || 'summary_large_image');
        this.setMetaName('twitter:site', this.config.twitterHandle);
        this.setMetaName('twitter:title', pageData.title);
        this.setMetaName('twitter:description', pageData.description);
        this.setMetaName('twitter:image', pageData.image);
        
        // Mobile optimization
        this.setMetaName('viewport', 'width=device-width, initial-scale=1.0');
        this.setMetaName('theme-color', '#4A90E2');
        
        // Adult content warnings (important for compliance)
        this.setMetaName('rating', 'adult');
        this.setMetaName('content-rating', 'mature');
        
        // Update page title
        if (pageData.title) {
            document.title = `${pageData.title} | ${this.config.siteName}`;
        }
    }
    
    getPageData() {
        const path = window.location.pathname;
        const page = this.getPageType(path);
        
        const pageData = {
            'home': {
                title: 'Premium Adult Video Streaming Platform',
                description: 'Experience the ultimate adult entertainment platform with HD streaming, exclusive content, and premium features.',
                keywords: 'adult videos, streaming, premium content, HD videos, entertainment, adult platform',
                image: `${this.config.siteUrl}/assets/images/og-homepage.jpg`,
                type: 'website',
                robots: 'index, follow'
            },
            'login': {
                title: 'Login - Access Your Account',
                description: 'Sign in to your Xshiver account to access premium adult content and exclusive features.',
                keywords: 'login, sign in, account access, adult streaming, premium membership',
                image: `${this.config.siteUrl}/assets/images/og-login.jpg`,
                robots: 'noindex, nofollow'
            },
            'register': {
                title: 'Create Account - Join Xshiver',
                description: 'Create your Xshiver account and gain access to premium adult entertainment content.',
                keywords: 'register, create account, sign up, adult platform, membership',
                image: `${this.config.siteUrl}/assets/images/og-register.jpg`,
                robots: 'noindex, nofollow'
            },
            'video': {
                title: 'Watch Premium Adult Videos',
                description: 'Stream high-quality adult videos with advanced player features and premium content.',
                keywords: 'watch videos, adult streaming, HD content, video player, premium videos',
                image: `${this.config.siteUrl}/assets/images/og-video.jpg`,
                type: 'video.other'
            },
            'dashboard': {
                title: 'User Dashboard - Manage Your Account',
                description: 'Access your personal dashboard to manage preferences, playlists, and account settings.',
                keywords: 'dashboard, account management, user profile, preferences, playlists',
                image: `${this.config.siteUrl}/assets/images/og-dashboard.jpg`,
                robots: 'noindex, nofollow'
            },
            'browse': {
                title: 'Browse Premium Adult Content',
                description: 'Discover and browse our extensive collection of premium adult video content.',
                keywords: 'browse videos, adult content, premium collection, video categories, streaming',
                image: `${this.config.siteUrl}/assets/images/og-browse.jpg`
            }
        };
        
        return pageData[page] || {
            title: 'Adult Video Streaming Platform',
            description: 'Premium adult video streaming platform with HD content and advanced features.',
            keywords: 'adult videos, streaming, entertainment, premium content',
            image: this.config.defaultImage
        };
    }
    
    getPageType(path) {
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('login')) return 'login';
        if (path.includes('register')) return 'register';
        if (path.includes('video') || path.includes('watch')) return 'video';
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('browse')) return 'browse';
        return 'default';
    }
    
    addStructuredData() {
        // Website structured data
        const websiteData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.config.siteName,
            "url": this.config.siteUrl,
            "description": "Premium adult video streaming platform with HD content and advanced features",
            "inLanguage": this.config.language,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${this.config.siteUrl}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        };
        
        this.insertStructuredData('website', websiteData);
        
        // Page-specific structured data
        const pageType = this.getPageType(window.location.pathname);
        
        if (pageType === 'video') {
            this.addVideoStructuredData();
        } else if (pageType === 'home') {
            this.addOrganizationStructuredData();
        }
        
        // Breadcrumb structured data
        this.addBreadcrumbStructuredData();
    }
    
    addVideoStructuredData() {
        // Get video data from page (you'd implement this based on your video data)
        const videoData = this.getVideoDataFromPage();
        
        if (videoData) {
            const videoStructuredData = {
                "@context": "https://schema.org",
                "@type": "VideoObject",
                "name": videoData.title,
                "description": videoData.description,
                "thumbnailUrl": videoData.thumbnail,
                "uploadDate": videoData.uploadDate,
                "duration": videoData.duration,
                "contentUrl": videoData.url,
                "embedUrl": videoData.embedUrl,
                "interactionStatistic": {
                    "@type": "InteractionCounter",
                    "interactionType": { "@type": "WatchAction" },
                    "userInteractionCount": videoData.views
                },
                "publisher": {
                    "@type": "Organization",
                    "name": this.config.siteName,
                    "url": this.config.siteUrl
                }
            };
            
            this.insertStructuredData('video', videoStructuredData);
        }
    }
    
    addOrganizationStructuredData() {
        const organizationData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.config.siteName,
            "url": this.config.siteUrl,
            "logo": `${this.config.siteUrl}/assets/images/logo.png`,
            "description": "Premium adult video streaming platform",
            "sameAs": [
                "https://twitter.com/XshiverPlatform",
                "https://www.facebook.com/XshiverPlatform"
            ]
        };
        
        this.insertStructuredData('organization', organizationData);
    }
    
    addBreadcrumbStructuredData() {
        const breadcrumbs = this.generateBreadcrumbs();
        
        if (breadcrumbs.length > 1) {
            const breadcrumbData = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": breadcrumb.name,
                    "item": breadcrumb.url
                }))
            };
            
            this.insertStructuredData('breadcrumb', breadcrumbData);
        }
    }
    
    setupBreadcrumbs() {
        const breadcrumbContainer = document.querySelector('.breadcrumbs');
        if (!breadcrumbContainer) return;
        
        const breadcrumbs = this.generateBreadcrumbs();
        
        const breadcrumbHTML = breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast) {
                return `<span class="breadcrumb-current">${breadcrumb.name}</span>`;
            } else {
                return `<a href="${breadcrumb.url}" class="breadcrumb-link">${breadcrumb.name}</a>`;
            }
        }).join(' <span class="breadcrumb-separator">›</span> ');
        
        breadcrumbContainer.innerHTML = breadcrumbHTML;
    }
    
    generateBreadcrumbs() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(segment => segment);
        const breadcrumbs = [{ name: 'Home', url: '/' }];
        
        let currentPath = '';
        
        segments.forEach(segment => {
            currentPath += '/' + segment;
            
            const name = this.getBreadcrumbName(segment);
            breadcrumbs.push({
                name: name,
                url: currentPath
            });
        });
        
        return breadcrumbs;
    }
    
    getBreadcrumbName(segment) {
        const names = {
            'pages': 'Pages',
            'auth': 'Authentication',
            'login': 'Login',
            'register': 'Register',
            'dashboard': 'Dashboard',
            'watch': 'Watch',
            'video': 'Video',
            'browse': 'Browse'
        };
        
        return names[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    }
    
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" if not present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Ensure alt text is present
            if (!img.hasAttribute('alt') || !img.alt.trim()) {
                const altText = this.generateAltText(img.src);
                img.setAttribute('alt', altText);
            }
            
            // Add structured data for important images
            if (img.classList.contains('content-image') || img.classList.contains('featured-image')) {
                this.addImageStructuredData(img);
            }
        });
    }
    
    generateAltText(src) {
        const filename = src.split('/').pop().split('.')[0];
        return filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    addImageStructuredData(img) {
        const imageData = {
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "url": img.src,
            "description": img.alt,
            "width": img.naturalWidth,
            "height": img.naturalHeight
        };
        
        this.insertStructuredData(`image-${Date.now()}`, imageData);
    }
    
    enhanceInternalLinks() {
        const links = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
        
        links.forEach(link => {
            // Add descriptive title if missing
            if (!link.hasAttribute('title') && link.textContent.trim()) {
                link.setAttribute('title', link.textContent.trim());
            }
            
            // Add rel attributes for SEO
            if (link.href.includes('login') || link.href.includes('register')) {
                link.setAttribute('rel', 'nofollow');
            }
        });
    }
    
    setupSEOMonitoring() {
        // Check for common SEO issues
        setTimeout(() => {
            this.auditSEO();
        }, 2000);
    }
    
    auditSEO() {
        const issues = [];
        
        // Check title length
        const title = document.title;
        if (!title) issues.push('Missing page title');
        else if (title.length < 30) issues.push('Title too short (< 30 characters)');
        else if (title.length > 60) issues.push('Title too long (> 60 characters)');
        
        // Check meta description
        const description = document.querySelector('meta[name="description"]');
        if (!description) issues.push('Missing meta description');
        else {
            const content = description.getAttribute('content');
            if (!content) issues.push('Empty meta description');
            else if (content.length < 120) issues.push('Meta description too short (< 120 characters)');
            else if (content.length > 160) issues.push('Meta description too long (> 160 characters)');
        }
        
        // Check headings structure
        const h1s = document.querySelectorAll('h1');
        if (h1s.length === 0) issues.push('Missing H1 heading');
        else if (h1s.length > 1) issues.push('Multiple H1 headings found');
        
        // Check images without alt text
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
        if (imagesWithoutAlt.length > 0) {
            issues.push(`${imagesWithoutAlt.length} images missing alt text`);
        }
        
        // Report issues
        if (issues.length > 0) {
            console.warn('🔍 SEO Issues Found:', issues);
            
            // Send to analytics
            if (window.gtag) {
                window.gtag('event', 'seo_issues', {
                    issues: issues.join(', '),
                    page: window.location.pathname
                });
            }
        } else {
            console.log('✅ No SEO issues found');
        }
        
        return issues;
    }
    
    // Utility methods
    setMetaTag(name, content) {
        this.setMetaAttribute('name', name, content);
    }
    
    setMetaProperty(property, content) {
        this.setMetaAttribute('property', property, content);
    }
    
    setMetaName(name, content) {
        this.setMetaAttribute('name', name, content);
    }
    
    setMetaAttribute(attribute, value, content) {
        let meta = document.querySelector(`meta[${attribute}="${value}"]`);
        
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, value);
            document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', content);
    }
    
    insertStructuredData(id, data) {
        // Remove existing structured data with the same ID
        const existing = document.querySelector(`script[data-structured-data="${id}"]`);
        if (existing) {
            existing.remove();
        }
        
        // Create new structured data script
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-structured-data', id);
        script.textContent = JSON.stringify(data, null, 2);
        
        document.head.appendChild(script);
        
        this.structuredData[id] = data;
    }
    
    getVideoDataFromPage() {
        // This would extract video data from your page
        // Implement based on how your video data is structured
        const videoElement = document.querySelector('video');
        const titleElement = document.querySelector('.video-title, h1');
        
        if (videoElement && titleElement) {
            return {
                title: titleElement.textContent.trim(),
                description: document.querySelector('.video-description')?.textContent?.trim() || '',
                thumbnail: videoElement.poster || '',
                url: videoElement.src || videoElement.currentSrc,
                embedUrl: window.location.href,
                duration: videoElement.duration ? `PT${Math.round(videoElement.duration)}S` : undefined,
                uploadDate: new Date().toISOString(),
                views: 0 // You'd get this from your data
            };
        }
        
        return null;
    }
    
    // Public API
    updatePageData(data) {
        this.enhanceMetaTags();
        this.addStructuredData();
    }
    
    getSEOScore() {
        const issues = this.auditSEO();
        const maxScore = 100;
        const deductionPerIssue = 10;
        
        return Math.max(0, maxScore - (issues.length * deductionPerIssue));
    }
    
    getStructuredData() {
        return this.structuredData;
    }
}

// Initialize SEO optimizer
window.xshiverSEO = new XshiverSEOOptimizer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XshiverSEOOptimizer;
}
