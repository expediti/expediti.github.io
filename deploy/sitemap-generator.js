/**
 * Phase 7: Sitemap Generator for Xshiver Platform
 * Generates XML sitemap for better SEO indexing
 */

const fs = require('fs').promises;
const path = require('path');

class XshiverSitemapGenerator {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://yourusername.github.io/xshiver-platform';
        this.sourceDir = options.sourceDir || './dist';
        this.outputFile = options.outputFile || 'sitemap.xml';
        
        this.pages = [];
        this.priorityMapping = {
            'index.html': { priority: '1.0', changefreq: 'weekly' },
            'login.html': { priority: '0.3', changefreq: 'monthly' },
            'register.html': { priority: '0.3', changefreq: 'monthly' },
            'dashboard': { priority: '0.7', changefreq: 'weekly' },
            'browse': { priority: '0.9', changefreq: 'daily' },
            'video': { priority: '0.8', changefreq: 'weekly' },
            'watch': { priority: '0.8', changefreq: 'weekly' }
        };
    }
    
    async generate() {
        console.log('🗺️ Generating sitemap...');
        
        try {
            // Find all HTML files
            await this.findPages(this.sourceDir);
            
            // Generate sitemap XML
            const sitemapXML = this.createSitemapXML();
            
            // Write to file
            const outputPath = path.join(this.sourceDir, this.outputFile);
            await fs.writeFile(outputPath, sitemapXML, 'utf8');
            
            console.log(`✅ Sitemap generated with ${this.pages.length} pages`);
            console.log(`📄 Saved to: ${outputPath}`);
            
            return sitemapXML;
            
        } catch (error) {
            console.error('❌ Error generating sitemap:', error);
            throw error;
        }
    }
    
    async findPages(dir, basePath = '') {
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                const relativePath = path.join(basePath, item.name);
                
                if (item.isDirectory()) {
                    // Skip certain directories
                    if (this.shouldSkipDirectory(item.name)) {
                        continue;
                    }
                    
                    await this.findPages(fullPath, relativePath);
                } else if (item.name.endsWith('.html')) {
                    // Skip certain files
                    if (this.shouldSkipFile(item.name)) {
                        continue;
                    }
                    
                    const pageInfo = await this.getPageInfo(fullPath, relativePath);
                    this.pages.push(pageInfo);
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not read directory ${dir}:`, error.message);
        }
    }
    
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules',
            '.git',
            'deploy',
            'optimization',
            'docs',
            '.vscode',
            'analytics'
        ];
        
        return skipDirs.includes(dirName);
    }
    
    shouldSkipFile(fileName) {
        const skipFiles = [
            '404.html',
            'test.html',
            'temp.html',
            'demo.html'
        ];
        
        return skipFiles.includes(fileName);
    }
    
    async getPageInfo(fullPath, relativePath) {
        const stats = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath, 'utf8');
        
        // Extract title from HTML
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        
        // Extract meta description
        const descMatch = content.match(/<meta[^>]*name=["|']description["|'][^>]*content=["|']([^"|']+)["|'][^>]*>/i);
        const description = descMatch ? descMatch[1].trim() : '';
        
        // Create URL from relative path
        const url = this.createUrl(relativePath);
        
        // Get priority and change frequency
        const pageData = this.getPageData(relativePath);
        
        return {
            url: url,
            relativePath: relativePath,
            lastmod: stats.mtime.toISOString().split('T')[0],
            priority: pageData.priority,
            changefreq: pageData.changefreq,
            title: title,
            description: description
        };
    }
    
    createUrl(relativePath) {
        // Convert Windows paths to forward slashes
        const urlPath = relativePath.replace(/\\/g, '/');
        
        // Remove leading slash if present
        const cleanPath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        
        // Handle index.html
        if (cleanPath === 'index.html') {
            return this.baseUrl + '/';
        }
        
        return `${this.baseUrl}/${cleanPath}`;
    }
    
    getPageData(relativePath) {
        // Convert Windows paths to forward slashes for comparison
        const normalizedPath = relativePath.replace(/\\/g, '/');
        
        // Check exact matches first
        for (const [key, data] of Object.entries(this.priorityMapping)) {
            if (normalizedPath.includes(key)) {
                return data;
            }
        }
        
        // Default values
        return {
            priority: '0.5',
            changefreq: 'monthly'
        };
    }
    
    createSitemapXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // Sort pages by priority (highest first)
        const sortedPages = this.pages.sort((a, b) => {
            return parseFloat(b.priority) - parseFloat(a.priority);
        });
        
        for (const page of sortedPages) {
            xml += '  <url>\n';
            xml += `    <loc>${this.escapeXml(page.url)}</loc>\n`;
            xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        }
        
        xml += '</urlset>';
        
        return xml;
    }
    
    escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }
    
    // Generate sitemap index for large sites
    async generateSitemapIndex(sitemaps) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        for (const sitemapUrl of sitemaps) {
            xml += '  <sitemap>\n';
            xml += `    <loc>${this.escapeXml(sitemapUrl)}</loc>\n`;
            xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
            xml += '  </sitemap>\n';
        }
        
        xml += '</sitemapindex>';
        
        const outputPath = path.join(this.sourceDir, 'sitemap-index.xml');
        await fs.writeFile(outputPath, xml, 'utf8');
        
        return xml;
    }
    
    // Validate sitemap
    validateSitemap(xml) {
        const issues = [];
        
        // Check for required elements
        if (!xml.includes('<?xml')) {
            issues.push('Missing XML declaration');
        }
        
        if (!xml.includes('<urlset')) {
            issues.push('Missing urlset element');
        }
        
        // Check URL count (Google limit is 50,000)
        const urlCount = (xml.match(/<url>/g) || []).length;
        if (urlCount > 50000) {
            issues.push(`Too many URLs (${urlCount}). Consider splitting into multiple sitemaps.`);
        }
        
        // Check file size (Google limit is 50MB uncompressed)
        const sizeInMB = Buffer.byteLength(xml, 'utf8') / (1024 * 1024);
        if (sizeInMB > 50) {
            issues.push(`Sitemap too large (${sizeInMB.toFixed(2)}MB). Consider compression or splitting.`);
        }
        
        return issues;
    }
    
    // Public methods
    async generateAndValidate() {
        const xml = await this.generate();
        const issues = this.validateSitemap(xml);
        
        if (issues.length > 0) {
            console.warn('⚠️ Sitemap validation issues:');
            issues.forEach(issue => console.warn(`   - ${issue}`));
        } else {
            console.log('✅ Sitemap validation passed');
        }
        
        return { xml, issues };
    }
    
    getStats() {
        const stats = {
            totalPages: this.pages.length,
            priorityDistribution: {},
            changefreqDistribution: {}
        };
        
        this.pages.forEach(page => {
            stats.priorityDistribution[page.priority] = 
                (stats.priorityDistribution[page.priority] || 0) + 1;
            
            stats.changefreqDistribution[page.changefreq] = 
                (stats.changefreqDistribution[page.changefreq] || 0) + 1;
        });
        
        return stats;
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new XshiverSitemapGenerator({
        baseUrl: process.argv[2] || 'https://yourusername.github.io/xshiver-platform',
        sourceDir: process.argv[3] || './dist'
    });
    
    generator.generateAndValidate()
        .then(({ xml, issues }) => {
            console.log('\n📊 Sitemap Statistics:');
            const stats = generator.getStats();
            console.log(`   Total Pages: ${stats.totalPages}`);
            console.log('   Priority Distribution:', stats.priorityDistribution);
            console.log('   Change Frequency Distribution:', stats.changefreqDistribution);
        })
        .catch(console.error);
}

module.exports = XshiverSitemapGenerator;
