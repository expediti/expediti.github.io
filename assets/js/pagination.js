/**
 * Advanced Pagination System for Xshiver
 * Handles pagination across categories, search results, and video listings
 */

class PaginationSystem {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
        this.itemsPerPage = 20;
        this.maxVisiblePages = 7;
        this.paginationContainer = null;
        
        this.callbacks = {
            onPageChange: null,
            onItemsPerPageChange: null
        };
        
        this.init();
    }
    
    init() {
        console.log('📄 Pagination System initialized');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for pagination container changes
        document.addEventListener('DOMContentLoaded', () => {
            this.detectPaginationContainers();
        });
        
        // Handle per-page changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'per-page' || e.target.classList.contains('per-page-select')) {
                this.handleItemsPerPageChange(e.target.value);
            }
        });
    }
    
    detectPaginationContainers() {
        const containers = document.querySelectorAll('.pagination-container, #pagination-container, #search-pagination');
        containers.forEach(container => {
            this.bindPaginationEvents(container);
        });
    }
    
    bindPaginationEvents(container) {
        container.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (e.target.classList.contains('pagination-prev')) {
                this.previousPage();
            } else if (e.target.classList.contains('pagination-next')) {
                this.nextPage();
            } else if (e.target.classList.contains('pagination-number')) {
                const page = parseInt(e.target.dataset.page || e.target.textContent);
                this.goToPage(page);
            } else if (e.target.classList.contains('pagination-first')) {
                this.goToPage(1);
            } else if (e.target.classList.contains('pagination-last')) {
                this.goToPage(this.totalPages);
            }
        });
    }
    
    // Main pagination methods
    setup(totalItems, itemsPerPage = 20, currentPage = 1) {
        this.totalItems = totalItems;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = currentPage;
        this.totalPages = Math.ceil(totalItems / itemsPerPage);
        
        this.render();
        this.updateInfo();
        
        console.log(`📄 Pagination setup: ${totalItems} items, ${this.totalPages} pages`);
    }
    
    render(containerId = null) {
        const containers = containerId ? 
            [document.getElementById(containerId)] : 
            document.querySelectorAll('.pagination-container, #pagination-container, #search-pagination');
        
        containers.forEach(container => {
            if (container) {
                container.innerHTML = this.generatePaginationHTML();
            }
        });
    }
    
    generatePaginationHTML() {
        if (this.totalPages <= 1) {
            return '';
        }
        
        let html = '<nav class="pagination" aria-label="Pagination Navigation">';
        
        // Previous button
        html += `
            <button class="pagination-btn pagination-prev ${this.currentPage <= 1 ? 'disabled' : ''}" 
                    ${this.currentPage <= 1 ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Previous
            </button>
        `;
        
        // Page numbers container
        html += '<div class="pagination-numbers">';
        html += this.generatePageNumbers();
        html += '</div>';
        
        // Next button
        html += `
            <button class="pagination-btn pagination-next ${this.currentPage >= this.totalPages ? 'disabled' : ''}"
                    ${this.currentPage >= this.totalPages ? 'disabled' : ''}>
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
            </button>
        `;
        
        html += '</nav>';
        
        return html;
    }
    
    generatePageNumbers() {
        let html = '';
        const current = this.currentPage;
        const total = this.totalPages;
        const maxVisible = this.maxVisiblePages;
        
        // Calculate start and end pages
        let startPage, endPage;
        
        if (total <= maxVisible) {
            startPage = 1;
            endPage = total;
        } else {
            const maxPagesBeforeCurrentPage = Math.floor(maxVisible / 2);
            const maxPagesAfterCurrentPage = Math.ceil(maxVisible / 2) - 1;
            
            if (current <= maxPagesBeforeCurrentPage) {
                startPage = 1;
                endPage = maxVisible;
            } else if (current + maxPagesAfterCurrentPage >= total) {
                startPage = total - maxVisible + 1;
                endPage = total;
            } else {
                startPage = current - maxPagesBeforeCurrentPage;
                endPage = current + maxPagesAfterCurrentPage;
            }
        }
        
        // First page + ellipsis
        if (startPage > 1) {
            html += this.createPageButton(1, current === 1);
            
            if (startPage > 2) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            html += this.createPageButton(i, current === i);
        }
        
        // Ellipsis + last page
        if (endPage < total) {
            if (endPage < total - 1) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            
            html += this.createPageButton(total, current === total);
        }
        
        return html;
    }
    
    createPageButton(page, isActive = false) {
        return `
            <button class="pagination-number ${isActive ? 'active' : ''}" 
                    data-page="${page}"
                    aria-label="Go to page ${page}"
                    ${isActive ? 'aria-current="page"' : ''}>
                ${page}
            </button>
        `;
    }
    
    updateInfo() {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        
        // Update pagination info elements
        const infoElements = document.querySelectorAll('.pagination-info, .results-info');
        infoElements.forEach(element => {
            element.innerHTML = `
                Showing <strong>${this.formatNumber(start)}-${this.formatNumber(end)}</strong> 
                of <strong>${this.formatNumber(this.totalItems)}</strong> results
            `;
        });
        
        // Update individual info elements
        this.updateInfoElement('showing-start', start);
        this.updateInfoElement('showing-end', end);
        this.updateInfoElement('total-results', this.totalItems);
        this.updateInfoElement('current-page', this.currentPage);
        this.updateInfoElement('total-pages', this.totalPages);
    }
    
    updateInfoElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = this.formatNumber(value);
        }
    }
    
    // Navigation methods
    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) {
            return;
        }
        
        const previousPage = this.currentPage;
        this.currentPage = page;
        
        this.render();
        this.updateInfo();
        this.scrollToTop();
        
        // Trigger callback
        if (this.callbacks.onPageChange) {
            this.callbacks.onPageChange(page, previousPage);
        }
        
        // Update URL
        this.updateURL();
        
        console.log(`📄 Page changed: ${previousPage} → ${page}`);
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }
    
    firstPage() {
        this.goToPage(1);
    }
    
    lastPage() {
        this.goToPage(this.totalPages);
    }
    
    handleItemsPerPageChange(newItemsPerPage) {
        const oldItemsPerPage = this.itemsPerPage;
        this.itemsPerPage = parseInt(newItemsPerPage);
        
        // Recalculate pages
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        // Adjust current page to maintain position
        const currentItem = (this.currentPage - 1) * oldItemsPerPage + 1;
        this.currentPage = Math.ceil(currentItem / this.itemsPerPage);
        
        this.render();
        this.updateInfo();
        
        // Trigger callback
        if (this.callbacks.onItemsPerPageChange) {
            this.callbacks.onItemsPerPageChange(this.itemsPerPage, oldItemsPerPage);
        }
        
        console.log(`📄 Items per page changed: ${oldItemsPerPage} → ${this.itemsPerPage}`);
    }
    
    // Utility methods
    scrollToTop() {
        const targetElement = document.querySelector('.search-results, .category-content, .videos-section');
        
        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } else {
            window.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
            });
        }
    }
    
    updateURL() {
        const url = new URL(window.location);
        
        if (this.currentPage > 1) {
            url.searchParams.set('page', this.currentPage);
        } else {
            url.searchParams.delete('page');
        }
        
        if (this.itemsPerPage !== 20) {
            url.searchParams.set('per_page', this.itemsPerPage);
        } else {
            url.searchParams.delete('per_page');
        }
        
        // Update URL without page reload
        window.history.replaceState({}, '', url);
    }
    
    formatNumber(num) {
        return num.toLocaleString();
    }
    
    // Callback management
    onPageChange(callback) {
        this.callbacks.onPageChange = callback;
    }
    
    onItemsPerPageChange(callback) {
        this.callbacks.onItemsPerPageChange = callback;
    }
    
    // Advanced features
    setupInfiniteScroll(loadMoreCallback, threshold = 200) {
        let isLoading = false;
        
        const handleScroll = () => {
            if (isLoading) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            if (scrollTop + windowHeight >= documentHeight - threshold) {
                if (this.currentPage < this.totalPages) {
                    isLoading = true;
                    
                    loadMoreCallback().then(() => {
                        this.nextPage();
                        isLoading = false;
                    }).catch(() => {
                        isLoading = false;
                    });
                }
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        
        // Return cleanup function
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Only handle if no input element is focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousPage();
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextPage();
                    break;
                    
                case 'Home':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.firstPage();
                    }
                    break;
                    
                case 'End':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.lastPage();
                    }
                    break;
            }
        });
    }
    
    // Mobile swipe support
    setupSwipeNavigation() {
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Only handle horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next page
                    this.nextPage();
                } else {
                    // Swipe right - previous page
                    this.previousPage();
                }
            }
            
            startX = 0;
            startY = 0;
        });
    }
    
    // State management
    getState() {
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            totalItems: this.totalItems,
            itemsPerPage: this.itemsPerPage
        };
    }
    
    setState(state) {
        this.currentPage = state.currentPage || 1;
        this.totalPages = state.totalPages || 1;
        this.totalItems = state.totalItems || 0;
        this.itemsPerPage = state.itemsPerPage || 20;
        
        this.render();
        this.updateInfo();
    }
    
    // Analytics
    getAnalytics() {
        return {
            averagePageViews: this.calculateAveragePageViews(),
            bounceRate: this.calculateBounceRate(),
            popularPages: this.getPopularPages()
        };
    }
    
    calculateAveragePageViews() {
        // This would track actual usage in a real implementation
        return 2.3; // Placeholder
    }
    
    calculateBounceRate() {
        // Percentage of users who only view one page
        return 0.45; // Placeholder
    }
    
    getPopularPages() {
        // Most visited page numbers
        return [1, 2, 3]; // Placeholder
    }
    
    // Cleanup
    destroy() {
        // Remove event listeners and clean up
        this.callbacks = {
            onPageChange: null,
            onItemsPerPageChange: null
        };
        
        console.log('📄 Pagination system destroyed');
    }
}

// Global pagination instance
window.paginationSystem = new PaginationSystem();

// Convenience functions for global use
function goToPage(page) {
    if (window.paginationSystem) {
        window.paginationSystem.goToPage(page);
    }
}

function nextPage() {
    if (window.paginationSystem) {
        window.paginationSystem.nextPage();
    }
}

function previousPage() {
    if (window.paginationSystem) {
        window.paginationSystem.previousPage();
    }
}

function changeItemsPerPage(itemsPerPage) {
    if (window.paginationSystem) {
        window.paginationSystem.handleItemsPerPageChange(itemsPerPage);
    }
}

// Initialize pagination based on URL parameters
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    const perPage = parseInt(urlParams.get('per_page')) || 20;
    
    if (window.paginationSystem) {
        window.paginationSystem.currentPage = page;
        window.paginationSystem.itemsPerPage = perPage;
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaginationSystem;
}
