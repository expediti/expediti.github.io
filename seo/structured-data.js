/**
 * Structured Data Implementation for Xshiver Video Pages
 * Optimizes video content for Google search results
 */

class XshiverStructuredData {
    constructor() {
        this.baseUrl = 'https://yourusername.github.io/xshiver-platform';
    }

    // Generate VideoObject structured data
    generateVideoStructuredData(videoData) {
        return {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": videoData.title,
            "description": videoData.description,
            "thumbnailUrl": [
                `${this.baseUrl}/assets/images/thumbnails/video-${videoData.id}-thumb-1x1.jpg`,
                `${this.baseUrl}/assets/images/thumbnails/video-${videoData.id}-thumb-4x3.jpg`,
                `${this.baseUrl}/assets/images/thumbnails/video-${videoData.id}-thumb-16x9.jpg`
            ],
            "uploadDate": videoData.uploadDate,
            "duration": `PT${Math.floor(videoData.duration / 60)}M${videoData.duration % 60}S`,
            "contentUrl": `${this.baseUrl}/assets/videos/content-${videoData.id}.mp4`,
            "embedUrl": `${this.baseUrl}/pages/watch/video.html?id=${videoData.id}`,
            "interactionStatistic": {
                "@type": "InteractionCounter",
                "interactionType": { "@type": "WatchAction" },
                "userInteractionCount": videoData.viewCount
            },
            "publisher": {
                "@type": "Organization",
                "name": "Xshiver",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${this.baseUrl}/assets/images/logo.png`,
                    "width": 200,
                    "height": 60
                }
            },
            "isFamilyFriendly": false,
            "contentRating": "adult",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": videoData.rating,
                "bestRating": 5,
                "ratingCount": videoData.ratingCount || 100
            }
        };
    }

    // Generate WebSite structured data
    generateWebsiteStructuredData() {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Xshiver",
            "alternateName": "Xshiver Adult Video Platform",
            "url": this.baseUrl,
            "description": "Premium adult video streaming platform with HD content and advanced features",
            "inLanguage": "en",
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${this.baseUrl}/pages/browse/search-results.html?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Xshiver",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${this.baseUrl}/assets/images/logo.png`
                }
            }
        };
    }

    // Generate Organization structured data
    generateOrganizationStructuredData() {
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Xshiver",
            "url": this.baseUrl,
            "logo": `${this.baseUrl}/assets/images/logo.png`,
            "description": "Premium adult entertainment streaming platform",
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-555-0123",
                "contactType": "Customer Service",
                "availableLanguage": ["English"]
            },
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "US"
            }
        };
    }

    // Generate BreadcrumbList structured data
    generateBreadcrumbStructuredData(breadcrumbs) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": breadcrumb.name,
                "item": breadcrumb.url
            }))
        };
    }

    // Insert structured data into page
    insertStructuredData(data, id = null) {
        const scriptId = id || 'structured-data-' + Date.now();
        
        // Remove existing structured data with same ID
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
            existingScript.remove();
        }

        // Create new script tag
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = scriptId;
        script.textContent = JSON.stringify(data, null, 2);
        
        document.head.appendChild(script);
    }

    // Auto-generate structured data for current page
    autoGenerateStructuredData() {
        // Website structured data (for all pages)
        this.insertStructuredData(this.generateWebsiteStructuredData(), 'website-data');

        // Organization structured data (for homepage)
        if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
            this.insertStructuredData(this.generateOrganizationStructuredData(), 'organization-data');
        }

        // Video structured data (for video pages)
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        
        if (videoId && window.location.pathname.includes('watch')) {
            const videoData = this.getVideoData(videoId);
            if (videoData) {
                this.insertStructuredData(this.generateVideoStructuredData(videoData), 'video-data');
            }
        }

        // Breadcrumb structured data
        const breadcrumbs = this.generateBreadcrumbs();
        if (breadcrumbs.length > 1) {
            this.insertStructuredData(this.generateBreadcrumbStructuredData(breadcrumbs), 'breadcrumb-data');
        }
    }

    // Generate breadcrumbs based on current page
    generateBreadcrumbs() {
        const path = window.location.pathname;
        const breadcrumbs = [{ name: 'Home', url: this.baseUrl + '/' }];

        if (path.includes('browse')) {
            breadcrumbs.push({ name: 'Browse', url: this.baseUrl + '/pages/browse/index.html' });
            
            if (path.includes('categories')) {
                breadcrumbs.push({ name: 'Categories', url: this.baseUrl + '/pages/browse/categories.html' });
            }
        }

        if (path.includes('watch')) {
            breadcrumbs.push({ name: 'Browse', url: this.baseUrl + '/pages/browse/index.html' });
            breadcrumbs.push({ name: 'Watch', url: window.location.href });
        }

        return breadcrumbs;
    }

    // Get video data (mock function - replace with actual data fetching)
    getVideoData(videoId) {
        const sampleData = {
            '1': {
                id: 1,
                title: 'Premium Adult Entertainment - Exclusive HD Content',
                description: 'High-quality adult entertainment video featuring professional production and stunning visuals.',
                duration: 1800,
                rating: 4.8,
                ratingCount: 150,
                viewCount: 125000,
                uploadDate: '2025-08-01T10:00:00+05:30'
            },
            '2': {
                id: 2,
                title: 'Featured Adult Video - Professional Production',
                description: 'Featured adult entertainment content with professional cinematography.',
                duration: 2400,
                rating: 4.9,
                ratingCount: 200,
                viewCount: 89000,
                uploadDate: '2025-08-02T15:30:00+05:30'
            }
        };

        return sampleData[videoId];
    }
}

// Auto-initialize structured data
document.addEventListener('DOMContentLoaded', () => {
    const structuredData = new XshiverStructuredData();
    structuredData.autoGenerateStructuredData();
});

window.XshiverStructuredData = XshiverStructuredData;
