/**
 * Complete SEO Manager for Xshiver Platform
 * Handles all SEO optimizations for rapid Google ranking
 */

class XshiverSEOManager {
    constructor() {
        this.baseUrl = 'https://yourusername.github.io/xshiver-platform';
        this.siteName = 'Xshiver';
        this.defaultImage = this.baseUrl + '/assets/images/og-default.jpg';
        
        this.init();
    }

    init() {
        // Auto-optimize current page
        this.optimizeCurrentPage();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('✅ SEO Manager initialized');
    }

    optimizeCurrentPage() {
        const pageType = this.detectPageType();
        const seoData = this.getPageSEOData(pageType);
        
        // Update meta tags
        this.updateMetaTags(seoData);
        
        // Add structured data
        this.addStructuredData(pageType);
        
        // Optimize images
        this.optimizeImages();
        
        // Setup internal linking
        this.setupInternalLinking();
    }

    detectPageType() {
        const path = window.location.pathname;
        const search = window.location.search;
        
        if (path === '/' || path.endsWith('index.html')) {
            return 'homepage';
        } else if (path.includes('watch') && search.includes('id=')) {
            return 'video';
        } else if (path.includes('browse')) {
            return 'browse';
        } else if (path.includes('categories')) {
            return 'category';
        } else if (path.includes('legal')) {
            return 'legal';
        } else if (path.includes('subscription')) {
            return 'subscription';
        }
        
        return 'page';
    }

    getPageSEOData(pageType) {
        const seoData = {
            homepage: {
                title: 'Xshiver - Premium Adult Video Streaming Platform | HD Entertainment',
                description: 'Experience premium adult entertainment with HD streaming, exclusive content, and advanced features. Join millions of users on Xshiver platform.',
                keywords: 'adult videos, streaming, premium content, HD videos, adult entertainment, video platform, exclusive content',
                image: this.baseUrl + '/assets/images/og-homepage.jpg',
                type: 'website'
            },
            video: {
                title: 'Watch Premium Adult Video - HD Entertainment | Xshiver',
                description: 'Stream high-quality adult entertainment video with advanced player features and premium content on Xshiver platform.',
                keywords: 'watch adult video, streaming, HD video, adult entertainment, premium video content',
                image: this.baseUrl + '/assets/images/og-video.jpg',
                type: 'video.other'
            },
            browse: {
                title: 'Browse Premium Adult Videos - HD Collection | Xshiver',
                description: 'Discover and browse extensive collection of premium adult video content with advanced filtering and categories.',
                keywords: 'browse adult videos, video collection, adult content, premium videos, HD streaming',
                image: this.baseUrl + '/assets/images/og-browse.jpg',
                type: 'website'
            },
            category: {
                title: 'Adult Video Categories - Premium Content | Xshiver',
                description: 'Explore different categories of premium adult entertainment videos organized for easy browsing and discovery.',
                keywords: 'adult video categories, premium content, video genres, adult entertainment',
                image: this.baseUrl + '/assets/images/og-categories.jpg',
                type: 'website'
            },
            legal: {
                title: 'Legal Information - Terms & Privacy | Xshiver',
                description: 'Read our terms of service, privacy policy, and legal information for Xshiver adult entertainment platform.',
                keywords: 'terms of service, privacy policy, legal information, adult content policies',
                image: this.defaultImage,
                type: 'website'
            },
            subscription: {
                title: 'Premium Plans - Upgrade Your Experience | Xshiver',
                description: 'Upgrade to premium subscription plans for unlimited access, HD streaming, and exclusive content on Xshiver.',
                keywords: 'premium subscription, upgrade plans, unlimited access, premium features',
                image: this.baseUrl + '/assets/images/og-subscription.jpg',
                type: 'website'
            }
        };

        return seoData[pageType] || {
            title: 'Adult Video Platform | Xshiver',
            description: 'Premium adult video streaming platform with HD content and advanced features.',
            keywords: 'adult videos, streaming, entertainment',
            image: this.defaultImage,
            type: 'website'
        };
    }

    updateMetaTags(seoData) {
        // Update title
        document.title = seoData.title;

        // Basic meta tags
        this.setMetaTag('description', seoData.description);
        this.setMetaTag('keywords', seoData.keywords);
        this.setMetaTag('author', 'Xshiver Platform');
        this.setMetaTag('robots', 'index, follow, max-image-preview:large');
        
        // Adult content warnings
        this.setMetaTag('rating', 'adult');
        this.setMetaTag('content-rating', 'mature');
        
        // Open Graph tags
        this.setMetaProperty('og:title', seoData.title);
        this.setMetaProperty('og:description', seoData.description);
        this.setMetaProperty('og:image', seoData.image);
        this.setMetaProperty('og:url', window.location.href);
        this.setMetaProperty('og:type', seoData.type);
        this.setMetaProperty('og:site_name', this.siteName);
        this.setMetaProperty('og:locale', 'en_US');
        
        // Twitter Card tags
        this.setMetaName('twitter:card', 'summary_large_image');
        this.setMetaName('twitter:title', seoData.title);
        this.setMetaName('twitter:description', seoData.description);
        this.setMetaName('twitter:image', seoData.image);
        
        // Additional SEO meta tags
        this.setMetaName('viewport', 'width=device-width, initial-scale=1.0');
        this.setMetaName('theme-color', '#4A90E2');
        this.setMetaProperty('article:publisher', this.baseUrl);
        
        // Canonical URL
        this.setLinkTag('canonical', window.location.href.split('?')[0]);
        
        // Preconnect to external domains for performance
        this.setLinkTag('preconnect', 'https://fonts.googleapis.com', null, true);
        this.setLinkTag('preconnect', 'https://fonts.gstatic.com', 'crossorigin', true);
    }

    addStructuredData(pageType) {
        if (window.XshiverStructuredData) {
            const structuredData = new window.XshiverStructuredData();
            structuredData.autoGenerateStructuredData();
        }
    }

    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add lazy loading
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Ensure alt text exists
            if (!img.hasAttribute('alt') || !img.alt.trim()) {
                const altText = this.generateAltText(img.src, img.title || '');
                img.setAttribute('alt', altText);
            }
            
            // Add SEO-friendly attributes
            if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
                img.onload = function() {
                    this.setAttribute('width', this.naturalWidth);
                    this.setAttribute('height', this.naturalHeight);
                };
            }
        });
    }

    setupInternalLinking() {
        // Enhance internal links with SEO attributes
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
        
        internalLinks.forEach(link => {
            // Add title attributes for better UX and SEO
            if (!link.hasAttribute('title') && link.textContent.trim()) {
                link.setAttribute('title', link.textContent.trim());
            }
            
            // Add rel attributes for better SEO
            if (link.href.includes('legal') || link.href.includes('terms') || link.href.includes('privacy')) {
                link.setAttribute('rel', 'nofollow');
            }
        });
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals for SEO
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'largest-contentful-paint') {
                        console.log('LCP:', entry.startTime);
                        // Track LCP for SEO optimization
                        this.trackPerformanceMetric('lcp', entry.startTime);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    trackPerformanceMetric(metric, value) {
        // Send performance data to analytics
        if (window.gtag) {
            gtag('event', 'core_web_vitals', {
                metric_name: metric,
                metric_value: Math.round(value)
            });
        }
    }

    generateAltText(src, title) {
        if (title) return title;
        
        const filename = src.split('/').pop().split('.')[0];
        return filename
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            + ' - Xshiver Platform';
    }

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

    setLinkTag(rel, href, crossorigin = null, preconnect = false) {
        let link = document.querySelector(`link[rel="${rel}"]${href ? `[href="${href}"]` : ''}`);
        
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', rel);
            if (href) link.setAttribute('href', href);
            if (crossorigin) link.setAttribute('crossorigin', crossorigin);
            document.head.appendChild(link);
        }
    }

    // Public methods for dynamic SEO updates
    updatePageSEO(title, description, keywords, image = null) {
        const seoData = {
            title,
            description,
            keywords,
            image: image || this.defaultImage,
            type: 'website'
        };
        
        this.updateMetaTags(seoData);
    }

    // SEO audit function
    auditCurrentPage() {
        const issues = [];
        
        // Check title
        if (!document.title || document.title.length < 30 || document.title.length > 60) {
            issues.push(`Title length issue: ${document.title?.length || 0} characters`);
        }
        
        // Check meta description
        const description = document.querySelector('meta[name="description"]');
        if (!description || !description.content || description.content.length < 120 || description.content.length > 160) {
            issues.push(`Meta description issue: ${description?.content?.length || 0} characters`);
        }
        
        // Check H1
        const h1Tags = document.querySelectorAll('h1');
        if (h1Tags.length === 0) {
            issues.push('Missing H1 tag');
        } else if (h1Tags.length > 1) {
            issues.push('Multiple H1 tags found');
        }
        
        // Check images without alt text
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
        if (imagesWithoutAlt.length > 0) {
            issues.push(`${imagesWithoutAlt.length} images missing alt text`);
        }
        
        console.log('SEO Audit Results:', issues.length === 0 ? 'No issues found' : issues);
        return issues;
    }
}

// Auto-initialize SEO Manager
document.addEventListener('DOMContentLoaded', () => {
    window.xshiverSEO = new XshiverSEOManager();
});
