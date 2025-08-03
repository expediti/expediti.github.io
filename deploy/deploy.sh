#!/bin/bash

# Phase 7: Deployment Script for Xshiver Platform
# Optimizes and deploys to GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting Xshiver Platform Deployment..."

# Configuration
SOURCE_DIR="."
BUILD_DIR="dist"
GITHUB_REPO="yourusername/xshiver-platform"
GITHUB_PAGES_BRANCH="gh-pages"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
print_status "Checking dependencies..."

if ! command_exists node; then
    print_error "Node.js is required but not installed"
    exit 1
fi

if ! command_exists git; then
    print_error "Git is required but not installed"
    exit 1
fi

print_success "All dependencies are installed"

# Install build dependencies
print_status "Installing build dependencies..."
npm install --save-dev html-minifier-terser clean-css-cli uglify-js

# Clean previous build
print_status "Cleaning previous build..."
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
fi

# Run build optimization
print_status "Running build optimization..."
node deploy/build.js

if [ $? -ne 0 ]; then
    print_error "Build optimization failed"
    exit 1
fi

print_success "Build optimization completed"

# Verify build directory
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory not found"
    exit 1
fi

# Copy additional files for GitHub Pages
print_status "Preparing GitHub Pages deployment..."

# Create .nojekyll file to bypass Jekyll processing
touch "$BUILD_DIR/.nojekyll"

# Create CNAME file if custom domain is configured
if [ ! -z "$CUSTOM_DOMAIN" ]; then
    echo "$CUSTOM_DOMAIN" > "$BUILD_DIR/CNAME"
    print_status "CNAME file created for domain: $CUSTOM_DOMAIN"
fi

# Create 404 page for GitHub Pages
cat > "$BUILD_DIR/404.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - Xshiver</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: white;
            text-align: center;
            padding: 50px 20px;
            margin: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        h1 {
            font-size: 4rem;
            color: #4A90E2;
            margin: 0;
        }
        h2 {
            font-size: 2rem;
            margin: 20px 0;
        }
        p {
            font-size: 1.1rem;
            line-height: 1.6;
            margin: 20px 0;
        }
        .btn {
            display: inline-block;
            background: #4A90E2;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background 0.3s ease;
        }
        .btn:hover {
            background: #357ABD;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <a href="/xshiver-platform/" class="btn">Go Home</a>
    </div>
    
    <script>
        // Redirect logic for SPA-like behavior
        const path = window.location.pathname;
        if (path.includes('/video/')) {
            window.location.href = '/xshiver-platform/pages/watch/video.html';
        } else if (path.includes('/dashboard')) {
            window.location.href = '/xshiver-platform/pages/dashboard/index.html';
        }
    </script>
</body>
</html>
EOF

# Run final optimizations
print_status "Running final optimizations..."

# Compress CSS files
find "$BUILD_DIR" -name "*.css" -exec sh -c 'npx cleancss -o "$1" "$1"' _ {} \;

# Compress JavaScript files
find "$BUILD_DIR" -name "*.js" -exec sh -c 'npx uglifyjs "$1" -o "$1" -c -m' _ {} \;

print_success "Final optimizations completed"

# Generate deployment report
print_status "Generating deployment report..."

TOTAL_FILES=$(find "$BUILD_DIR" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
HTML_FILES=$(find "$BUILD_DIR" -name "*.html" | wc -l)
CSS_FILES=$(find "$BUILD_DIR" -name "*.css" | wc -l)
JS_FILES=$(find "$BUILD_DIR" -name "*.js" | wc -l)

cat > "$BUILD_DIR/deployment-report.md" << EOF
# Xshiver Platform Deployment Report

**Deployment Date:** $(date)
**Build Directory:** $BUILD_DIR
**Total Files:** $TOTAL_FILES
**Total Size:** $TOTAL_SIZE

## File Breakdown
- HTML Files: $HTML_FILES
- CSS Files: $CSS_FILES
- JavaScript Files: $JS_FILES

## Optimizations Applied
- ✅ HTML Minification
- ✅ CSS Minification & Optimization
- ✅ JavaScript Minification & Compression
- ✅ Image Optimization
- ✅ SEO Meta Tags Added
- ✅ Structured Data Implemented
- ✅ Service Worker Generated
- ✅ PWA Manifest Created
- ✅ Sitemap Generated
- ✅ Robots.txt Created

## GitHub Pages Configuration
- ✅ .nojekyll file created
- ✅ 404.html page created
- ✅ Custom domain configured (if applicable)

## Performance Features
- ✅ Lazy loading for images
- ✅ Critical CSS optimization
- ✅ Service worker caching
- ✅ Preconnect hints for external resources
- ✅ DNS prefetch for fonts

## SEO Features
- ✅ Meta tags optimization
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Schema.org structured data
- ✅ XML sitemap
- ✅ Breadcrumb navigation
- ✅ Optimized image alt texts

Ready for GitHub Pages deployment! 🚀
EOF

print_success "Deployment report generated"

# Deploy to GitHub Pages
print_status "Preparing GitHub Pages deployment..."

# Check if gh-pages branch exists locally
if git show-ref --verify --quiet refs/heads/$GITHUB_PAGES_BRANCH; then
    print_status "Switching to existing gh-pages branch"
    git stash push -m "Stashing changes before deployment"
    git checkout $GITHUB_PAGES_BRANCH
else
    print_status "Creating new gh-pages branch"
    git checkout --orphan $GITHUB_PAGES_BRANCH
fi

# Clear the working directory
git rm -rf . 2>/dev/null || true

# Copy build files
print_status "Copying build files..."
cp -r "$BUILD_DIR"/* .
cp "$BUILD_DIR"/.[!.]* . 2>/dev/null || true

# Add all files to git
git add .

# Commit changes
COMMIT_MESSAGE="Deploy Xshiver Platform - $(date)"
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
print_status "Pushing to GitHub Pages..."
git push origin $GITHUB_PAGES_BRANCH --force

if [ $? -eq 0 ]; then
    print_success "Successfully deployed to GitHub Pages!"
    print_status "Your site will be available at: https://$GITHUB_REPO.github.io/"
    
    # If custom domain is configured
    if [ ! -z "$CUSTOM_DOMAIN" ]; then
        print_status "Custom domain: https://$CUSTOM_DOMAIN"
    fi
else
    print_error "Failed to push to GitHub Pages"
    exit 1
fi

# Switch back to main branch
print_status "Switching back to main branch..."
git checkout main
git stash pop 2>/dev/null || true

print_success "Deployment completed successfully! 🎉"

# Display final instructions
echo ""
echo "📋 Post-Deployment Checklist:"
echo "1. Visit your GitHub repository settings"
echo "2. Go to Pages section"
echo "3. Ensure source is set to 'gh-pages' branch"
echo "4. Configure custom domain if needed"
echo "5. Enable HTTPS"
echo "6. Test your deployed site"
echo ""
echo "🔗 Your site: https://$GITHUB_REPO.github.io/"
echo ""
echo "Happy streaming! 🚀"
