/**
 * Advanced SEO Sitemap Generator for Xshiver Platform
 * Generates optimized sitemaps for rapid Google ranking
 */

class XshiverSitemapGenerator {
    constructor() {
        this.baseUrl = 'https://yourusername.github.io/xshiver-platform';
        this.lastModified = new Date().toISOString();
        this.videoCategories = ['premium', 'featured', 'popular', 'trending', 'new', 'hd'];
        this.supportedVideoFormats = ['mp4', 'webm', 'ogg'];
        this.supportedImageFormats = ['jpg', 'jpeg', 'png', 'webp'];
    }

    // Generate master sitemap index
    generateMasterSitemap() {
        const sitemaps = [
            { loc: 'sitemap-pages.xml', lastmod: this.lastModified },
            { loc: 'sitemap-videos.xml', lastmod: this.lastModified },
            { loc: 'sitemap-images.xml', lastmod: this.lastModified },
            { loc: 'sitemap-categories.xml', lastmod: this.lastModified }
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        sitemaps.forEach(sitemap => {
            xml += '    <sitemap>\n';
            xml += `        <loc>${this.baseUrl}/${sitemap.loc}</loc>\n`;
            xml += `        <lastmod>${sitemap.lastmod}</lastmod>\n`;
            xml += '    </sitemap>\n';
        });
        
        xml += '</sitemapindex>';
        return xml;
    }

    // Generate pages sitemap
    generatePagesSitemap() {
        const pages = [
            { url: '/', priority: '1.0', changefreq: 'weekly' },
            { url: '/pages/browse/index.html', priority: '0.9', changefreq: 'daily' },
            { url: '/pages/browse/categories.html', priority: '0.8', changefreq: 'weekly' },
            { url: '/pages/browse/search-results.html', priority: '0.7', changefreq: 'daily' },
            { url: '/pages/legal/terms.html', priority: '0.6', changefreq: 'monthly' },
            { url: '/pages/legal/privacy.html', priority: '0.6', changefreq: 'monthly' },
            { url: '/pages/legal/dmca.html', priority: '0.5', changefreq: 'monthly' },
            { url: '/pages/subscription/plans.html', priority: '0.8', changefreq: 'weekly' },
            { url: '/pages/support/contact.html', priority: '0.5', changefreq: 'monthly' },
            { url: '/pages/support/help.html', priority: '0.5', changefreq: 'monthly' }
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        pages.forEach(page => {
            xml += '    <url>\n';
            xml += `        <loc>${this.baseUrl}${page.url}</loc>\n`;
            xml += `        <lastmod>${this.lastModified}</lastmod>\n`;
            xml += `        <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `        <priority>${page.priority}</priority>\n`;
            xml += '    </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    // Generate video sitemap with SEO optimization
    generateVideoSitemap(videos = []) {
        if (videos.length === 0) {
            videos = this.getSampleVideoData();
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
        xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';
        
        videos.forEach(video => {
            xml += '    <url>\n';
            xml += `        <loc>${this.baseUrl}/pages/watch/video.html?id=${video.id}</loc>\n`;
            xml += '        <video:video>\n';
            xml += `            <video:thumbnail_loc>${this.baseUrl}/assets/images/thumbnails/video-${video.id}-thumb.jpg</video:thumbnail_loc>\n`;
            xml += `            <video:title><![CDATA[${video.title}]]></video:title>\n`;
            xml += `            <video:description><![CDATA[${video.description}]]></video:description>\n`;
            xml += `            <video:content_loc>${this.baseUrl}/assets/videos/content-${video.id}.mp4</video:content_loc>\n`;
            xml += `            <video:player_loc>${this.baseUrl}/pages/watch/video.html?id=${video.id}</video:player_loc>\n`;
            xml += `            <video:duration>${video.duration}</video:duration>\n`;
            xml += `            <video:rating>${video.rating}</video:rating>\n`;
            xml += `            <video:view_count>${video.views}</video:view_count>\n`;
            xml += `            <video:publication_date>${video.publishDate}</video:publication_date>\n`;
            xml += `            <video:family_friendly>no</video:family_friendly>\n`;
            xml += `            <video:category>${video.category}</video:category>\n`;
            
            video.tags.forEach(tag => {
                xml += `            <video:tag>${tag}</video:tag>\n`;
            });
            
            xml += '        </video:video>\n';
            xml += '    </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    // Generate image sitemap for SEO
    generateImageSitemap() {
        const imagePages = [
            {
                url: '/',
                images: [
                    { src: '/assets/images/logo.png', caption: 'Xshiver Adult Video Streaming Platform Logo', title: 'Xshiver Logo' },
                    { src: '/assets/images/hero-image.jpg', caption: 'Premium adult entertainment platform hero image', title: 'Platform Hero' },
                    { src: '/assets/images/featured-1.jpg', caption: 'Featured adult content thumbnail', title: 'Featured Content' }
                ]
            },
            {
                url: '/pages/browse/index.html',
                images: [
                    { src: '/assets/images/browse-banner.jpg', caption: 'Browse adult videos banner', title: 'Browse Banner' },
                    { src: '/assets/images/category-icons/premium.png', caption: 'Premium category icon', title: 'Premium Icon' }
                ]
            }
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
        xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
        
        imagePages.forEach(page => {
            xml += '    <url>\n';
            xml += `        <loc>${this.baseUrl}${page.url}</loc>\n`;
            
            page.images.forEach(image => {
                xml += '        <image:image>\n';
                xml += `            <image:loc>${this.baseUrl}${image.src}</image:loc>\n`;
                xml += `            <image:caption><![CDATA[${image.caption}]]></image:caption>\n`;
                xml += `            <image:title><![CDATA[${image.title}]]></image:title>\n`;
                xml += '        </image:image>\n';
            });
            
            xml += '    </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    // Generate category sitemap
    generateCategoriesSitemap() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        this.videoCategories.forEach((category, index) => {
            const priority = index < 3 ? '0.9' : '0.7';
            const changefreq = ['trending', 'new'].includes(category) ? 'hourly' : 'daily';
            
            xml += '    <url>\n';
            xml += `        <loc>${this.baseUrl}/pages/browse/categories.html?cat=${category}</loc>\n`;
            xml += `        <lastmod>${this.lastModified}</lastmod>\n`;
            xml += `        <changefreq>${changefreq}</changefreq>\n`;
            xml += `        <priority>${priority}</priority>\n`;
            xml += '    </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    // Sample video data for sitemap generation
    getSampleVideoData() {
        return [
            {
                id: 1,
                title: 'Premium Adult Entertainment - Exclusive HD Content',
                description: 'High-quality adult entertainment video featuring professional production and stunning visuals.',
                duration: 1800,
                rating: 4.8,
                views: 125000,
                publishDate: '2025-08-01T10:00:00+05:30',
                category: 'Premium Content',
                tags: ['adult', 'premium', 'hd', 'exclusive']
            },
            {
                id: 2,
                title: 'Featured Adult Video - Professional Production',
                description: 'Featured adult entertainment content with professional cinematography.',
                duration: 2400,
                rating: 4.9,
                views: 89000,
                publishDate: '2025-08-02T15:30:00+05:30',
                category: 'Featured Content',
                tags: ['adult', 'featured', 'professional']
            },
            {
                id: 3,
                title: 'Popular Adult Entertainment - Trending Content',
                description: 'Currently trending adult entertainment video with high engagement.',
                duration: 1200,
                rating: 4.7,
                views: 256000,
                publishDate: '2025-08-03T12:00:00+05:30',
                category: 'Popular Content',
                tags: ['adult', 'popular', 'trending']
            }
        ];
    }

    // Generate all sitemaps at once
    generateAllSitemaps() {
        return {
            'sitemap.xml': this.generateMasterSitemap(),
            'sitemap-pages.xml': this.generatePagesSitemap(),
            'sitemap-videos.xml': this.generateVideoSitemap(),
            'sitemap-images.xml': this.generateImageSitemap(),
            'sitemap-categories.xml': this.generateCategoriesSitemap()
        };
    }

    // Submit sitemaps to Google
    async submitToGoogle(sitemapUrl) {
        const submitUrl = `http://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
        
        try {
            const response = await fetch(submitUrl);
            console.log('Sitemap submitted to Google:', response.status === 200 ? 'Success' : 'Failed');
        } catch (error) {
            console.error('Error submitting sitemap:', error);
        }
    }
}

// Initialize and export
window.XshiverSitemapGenerator = XshiverSitemapGenerator;
