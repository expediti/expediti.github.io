/**
 * Phase 7: Build Optimization Script for Xshiver Platform
 * Optimizes HTML, CSS, and JavaScript for production deployment
 */

const fs = require('fs').promises;
const path = require('path');
const { minify } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const UglifyJS = require('uglify-js');

class XshiverBuildOptimizer {
    constructor() {
        this.sourceDir = '../';
        this.buildDir = '../dist';
        this.config = {
            html: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true
            },
            css: {
                level: 2,
                returnPromise: true
            },
            js: {
                compress: {
                    drop_console: true,
                    drop_debugger: true
                },
                mangle: true
            }
        };
        
        console.log('🚀 Xshiver Build Optimizer initialized');
    }
    
    async build() {
        console.log('🔨 Starting build process...');
        
        try {
            // Clean build directory
            await this.cleanBuildDir();
            
            // Create build directory structure
            await this.createBuildStructure();
            
            // Process HTML files
            await this.processHTMLFiles();
            
            // Process CSS files
            await this.processCSSFiles();
            
            // Process JavaScript files
            await this.processJSFiles();
            
            // Copy and optimize images
            await this.processImages();
            
            // Generate service worker
            await this.generateServiceWorker();
            
            // Generate sitemap
            await this.generateSitemap();
            
            // Create robots.txt
            await this.createRobotsTxt();
            
            // Generate performance report
            await this.generatePerformanceReport();
            
            console.log('✅ Build process completed successfully!');
            
        } catch (error) {
            console.error('❌ Build process failed:', error);
            throw error;
        }
    }
    
    async cleanBuildDir() {
        console.log('🧹 Cleaning build directory...');
        
        try {
            await fs.rmdir(this.buildDir, { recursive: true });
        } catch (error) {
            // Directory doesn't exist, which is fine
        }
        
        await fs.mkdir(this.buildDir, { recursive: true });
    }
    
    async createBuildStructure() {
        console.log('📁 Creating build structure...');
        
        const directories = [
            'pages',
            'assets/css',
            'assets/js',
            'assets/images',
            'assets/fonts',
            'components'
        ];
        
        for (const dir of directories) {
            await fs.mkdir(path.join(this.buildDir, dir), { recursive: true });
        }
    }
    
    async processHTMLFiles() {
        console.log('📄 Processing HTML files...');
        
        const htmlFiles = await this.findFiles(this.sourceDir, '.html');
        
        for (const file of htmlFiles) {
            const content = await fs.readFile(file, 'utf8');
            
            // Add SEO meta tags
            const optimizedContent = await this.optimizeHTML(content, file);
            
            // Minify HTML
            const minifiedContent = await minify(optimizedContent, this.config.html);
            
            // Write to build directory
            const relativePath = path.relative(this.sourceDir, file);
            const outputPath = path.join(this.buildDir, relativePath);
            
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, minifiedContent);
            
            console.log(`   ✓ Processed: ${relativePath}`);
        }
    }
    
    async optimizeHTML(content, filePath) {
        // Add critical SEO meta tags
        const fileName = path.basename(filePath, '.html');
        const seoData = this.getSEOData(fileName);
        
        // Insert meta tags after <head>
        const metaTags = this.generateMetaTags(seoData);
        
        if (content.includes('<head>')) {
            content = content.replace(
                '<head>',
                `<head>\n    ${metaTags}`
            );
        }
        
        // Add structured data
        const structuredData = this.generateStructuredData(seoData);
        if (structuredData) {
            content = content.replace(
                '</head>',
                `    ${structuredData}\n</head>`
            );
        }
        
        // Optimize images with lazy loading
        content = content.replace(
            /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
            '<img$1src="$2" loading="lazy"$3>'
        );
        
        return content;
    }
    
    generateMetaTags(seoData) {
        return `
    <!-- SEO Meta Tags -->
    <meta name="description" content="${seoData.description}">
    <meta name="keywords" content="${seoData.keywords}">
    <meta name="author" content="Xshiver">
    <meta name="robots" content="index, follow">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${seoData.title}">
    <meta property="og:description" content="${seoData.description}">
    <meta property="og:image" content="${seoData.image}">
    <meta property="og:url" content="${seoData.url}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Xshiver">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${seoData.title}">
    <meta name="twitter:description" content="${seoData.description}">
    <meta name="twitter:image" content="${seoData.image}">
    
    <!-- Performance Optimization -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#4A90E2">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">`;
    }
    
    getSEOData(fileName) {
        const seoMapping = {
            'index': {
                title: 'Xshiver - Premium Adult Video Streaming Platform',
                description: 'Experience the ultimate adult entertainment platform with HD streaming, exclusive content, and premium features.',
                keywords: 'adult videos, streaming, premium content, HD videos, entertainment',
                image: '/assets/images/og-homepage.jpg',
                url: 'https://yourusername.github.io/xshiver-platform/'
            },
            'login': {
                title: 'Login - Xshiver Platform',
                description: 'Sign in to your Xshiver account to access premium adult content and exclusive features.',
                keywords: 'login, sign in, account, adult streaming',
                image: '/assets/images/og-login.jpg',
                url: 'https://yourusername.github.io/xshiver-platform/pages/auth/login.html'
            },
            'video': {
                title: 'Watch Videos - Xshiver Platform',
                description: 'Stream high-quality adult videos with advanced player features and premium content.',
                keywords: 'watch videos, streaming, adult content, video player',
                image: '/assets/images/og-video.jpg',
                url: 'https://yourusername.github.io/xshiver-platform/pages/watch/video.html'
            }
        };
        
        return seoMapping[fileName] || {
            title: 'Xshiver - Adult Video Platform',
            description: 'Premium adult video streaming platform with HD content and advanced features.',
            keywords: 'adult videos, streaming, entertainment',
            image: '/assets/images/og-default.jpg',
            url: 'https://yourusername.github.io/xshiver-platform/'
        };
    }
    
    generateStructuredData(seoData) {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Xshiver",
            "description": seoData.description,
            "url": seoData.url,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://yourusername.github.io/xshiver-platform/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
            }
        };
        
        return `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n</script>`;
    }
    
    async processCSSFiles() {
        console.log('🎨 Processing CSS files...');
        
        const cssFiles = await this.findFiles(path.join(this.sourceDir, 'assets/css'), '.css');
        
        for (const file of cssFiles) {
            const content = await fs.readFile(file, 'utf8');
            
            // Optimize and minify CSS
            const result = await new CleanCSS(this.config.css).minify(content);
            
            if (result.errors.length > 0) {
                console.warn(`   ⚠️ CSS warnings in ${file}:`, result.errors);
            }
            
            // Write to build directory
            const relativePath = path.relative(this.sourceDir, file);
            const outputPath = path.join(this.buildDir, relativePath);
            
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, result.styles);
            
            console.log(`   ✓ Processed: ${relativePath} (${this.getCompressionRatio(content, result.styles)}% smaller)`);
        }
    }
    
    async processJSFiles() {
        console.log('⚡ Processing JavaScript files...');
        
        const jsFiles = await this.findFiles(path.join(this.sourceDir, 'assets/js'), '.js');
        
        for (const file of jsFiles) {
            const content = await fs.readFile(file, 'utf8');
            
            // Minify JavaScript
            const result = UglifyJS.minify(content, this.config.js);
            
            if (result.error) {
                console.error(`   ❌ Error minifying ${file}:`, result.error);
                continue;
            }
            
            // Write to build directory
            const relativePath = path.relative(this.sourceDir, file);
            const outputPath = path.join(this.buildDir, relativePath);
            
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, result.code);
            
            console.log(`   ✓ Processed: ${relativePath} (${this.getCompressionRatio(content, result.code)}% smaller)`);
        }
    }
    
    async processImages() {
        console.log('🖼️ Processing images...');
        
        const imageFiles = await this.findFiles(path.join(this.sourceDir, 'assets/images'), /\.(jpg|jpeg|png|gif|svg|webp)$/);
        
        for (const file of imageFiles) {
            // Copy images (could add compression here with sharp/imagemin)
            const relativePath = path.relative(this.sourceDir, file);
            const outputPath = path.join(this.buildDir, relativePath);
            
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.copyFile(file, outputPath);
            
            console.log(`   ✓ Copied: ${relativePath}`);
        }
    }
    
    async generateServiceWorker() {
        console.log('⚙️ Generating service worker...');
        
        const serviceWorkerContent = `
// Xshiver Platform Service Worker - Phase 7
const CACHE_NAME = 'xshiver-cache-v1.0.0';
const urlsToCache = [
    '/',
    '/assets/css/main.css',
    '/assets/js/main.js',
    '/assets/images/logo.png',
    '/pages/auth/login.html',
    '/pages/watch/video.html',
    '/pages/dashboard/index.html'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
`;
        
        await fs.writeFile(path.join(this.buildDir, 'sw.js'), serviceWorkerContent);
    }
    
    async generateSitemap() {
        console.log('🗺️ Generating sitemap...');
        
        const baseUrl = 'https://yourusername.github.io/xshiver-platform';
        const htmlFiles = await this.findFiles(this.buildDir, '.html');
        
        let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        
        for (const file of htmlFiles) {
            const relativePath = path.relative(this.buildDir, file);
            const url = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;
            const lastmod = new Date().toISOString().split('T')[0];
            
            // Determine priority based on file
            let priority = '0.5';
            let changefreq = 'monthly';
            
            if (relativePath === 'index.html') {
                priority = '1.0';
                changefreq = 'weekly';
            } else if (relativePath.includes('auth') || relativePath.includes('dashboard')) {
                priority = '0.8';
                changefreq = 'monthly';
            }
            
            sitemapContent += `
    <url>
        <loc>${url}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>`;
        }
        
        sitemapContent += `
</urlset>`;
        
        await fs.writeFile(path.join(this.buildDir, 'sitemap.xml'), sitemapContent);
    }
    
    async createRobotsTxt() {
        console.log('🤖 Creating robots.txt...');
        
        const robotsContent = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://yourusername.github.io/xshiver-platform/sitemap.xml

# Disallow sensitive areas (for adult content compliance)
Disallow: /admin/
Disallow: /api/
Disallow: /*.json$
Disallow: /assets/data/

# Adult content warning
User-agent: *
Crawl-delay: 10`;
        
        await fs.writeFile(path.join(this.buildDir, 'robots.txt'), robotsContent);
    }
    
    async generatePerformanceReport() {
        console.log('📊 Generating performance report...');
        
        const report = {
            buildTime: new Date().toISOString(),
            optimization: {
                htmlFiles: await this.countFiles(this.buildDir, '.html'),
                cssFiles: await this.countFiles(this.buildDir, '.css'),
                jsFiles: await this.countFiles(this.buildDir, '.js'),
                imageFiles: await this.countFiles(this.buildDir, /\.(jpg|jpeg|png|gif|svg|webp)$/)
            },
            features: [
                '✅ HTML Minification',
                '✅ CSS Optimization & Minification',
                '✅ JavaScript Minification',
                '✅ SEO Meta Tags Added',
                '✅ Structured Data Implemented',
                '✅ Service Worker Generated',
                '✅ Sitemap Created',
                '✅ Robots.txt Generated',
                '✅ Image Lazy Loading',
                '✅ PWA Manifest Support'
            ]
        };
        
        await fs.writeFile(
            path.join(this.buildDir, 'build-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('📋 Build Report Generated:');
        console.log(`   HTML Files: ${report.optimization.htmlFiles}`);
        console.log(`   CSS Files: ${report.optimization.cssFiles}`);
        console.log(`   JS Files: ${report.optimization.jsFiles}`);
        console.log(`   Images: ${report.optimization.imageFiles}`);
    }
    
    // Utility methods
    async findFiles(dir, extension) {
        const files = [];
        
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    const subFiles = await this.findFiles(fullPath, extension);
                    files.push(...subFiles);
                } else if (typeof extension === 'string' && item.name.endsWith(extension)) {
                    files.push(fullPath);
                } else if (extension instanceof RegExp && extension.test(item.name)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't be read
        }
        
        return files;
    }
    
    async countFiles(dir, extension) {
        const files = await this.findFiles(dir, extension);
        return files.length;
    }
    
    getCompressionRatio(original, compressed) {
        const originalSize = original.length;
        const compressedSize = compressed.length;
        const ratio = Math.round(((originalSize - compressedSize) / originalSize) * 100);
        return ratio;
    }
}

// Run build if called directly
if (require.main === module) {
    const optimizer = new XshiverBuildOptimizer();
    optimizer.build().catch(console.error);
}

module.exports = XshiverBuildOptimizer;
