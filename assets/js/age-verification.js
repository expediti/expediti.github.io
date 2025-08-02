/**
 * Age Verification System for Xshiver Adult Video Platform
 * Handles 18+ age verification with localStorage persistence
 */

class AgeVerification {
    constructor() {
        this.storageKey = 'xshiver_age_verified';
        this.sessionKey = 'xshiver_session_verified';
        this.minAge = 18;
        this.init();
    }

    init() {
        // Check if user is already verified
        if (this.isVerified()) {
            this.showMainContent();
        } else {
            this.showAgeModal();
        }

        // Add event listeners
        this.bindEvents();
    }

    bindEvents() {
        // Prevent right-click on age verification modal
        document.getElementById('age-verification').addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Prevent viewing source during age verification
        document.addEventListener('keydown', (e) => {
            if (!this.isVerified()) {
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                    (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                    (e.ctrlKey && e.key === 'u')) {
                    e.preventDefault();
                    this.showWarning('Please verify your age first');
                }
            }
        });

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.isVerified()) {
                // User switched tabs during verification
                this.logAttempt('tab_switch');
            }
        });
    }

    isVerified() {
        // Check both localStorage (persistent) and sessionStorage (session-based)
        const persistentVerification = localStorage.getItem(this.storageKey);
        const sessionVerification = sessionStorage.getItem(this.sessionKey);
        
        if (persistentVerification) {
            const verificationData = JSON.parse(persistentVerification);
            const verificationDate = new Date(verificationData.timestamp);
            const now = new Date();
            const daysDifference = (now - verificationDate) / (1000 * 60 * 60 * 24);
            
            // Re-verify every 30 days
            if (daysDifference < 30) {
                return true;
            } else {
                // Expired verification
                localStorage.removeItem(this.storageKey);
                return false;
            }
        }
        
        return sessionVerification === 'true';
    }

    showAgeModal() {
        const modal = document.getElementById('age-verification');
        if (modal) {
            modal.classList.add('active');
            
            // Focus trap
            this.trapFocus(modal);
            
            // Add warning animation
            setTimeout(() => {
                const warning = modal.querySelector('.age-warning h2');
                if (warning) {
                    warning.style.animation = 'pulse 1s ease-in-out 3';
                }
            }, 1000);
        }
    }

    showMainContent() {
        const modal = document.getElementById('age-verification');
        const mainContent = document.getElementById('main-content');
        
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 500);
        }
        
        if (mainContent) {
            mainContent.classList.remove('hidden');
            setTimeout(() => {
                mainContent.classList.add('visible');
            }, 100);
        }
        
        // Initialize main site functionality
        this.initMainSite();
    }

    verifyAge(isAdult) {
        if (isAdult) {
            // User confirmed they are 18+
            this.setVerified();
            this.showMainContent();
            this.logAttempt('verified_adult');
            
            // Show welcome message
            setTimeout(() => {
                this.showNotification('Welcome to Xshiver! Enjoy premium adult entertainment.', 'success');
            }, 1000);
            
        } else {
            // User is under 18
            this.handleUnderageUser();
            this.logAttempt('underage_exit');
        }
    }

    setVerified() {
        const verificationData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: 'hidden', // IP tracking would require backend
            verified: true
        };
        
        // Set both persistent and session verification
        localStorage.setItem(this.storageKey, JSON.stringify(verificationData));
        sessionStorage.setItem(this.sessionKey, 'true');
    }

    handleUnderageUser() {
        // Redirect to appropriate site or show exit message
        const modal = document.getElementById('age-verification');
        if (modal) {
            modal.innerHTML = `
                <div class="age-content exit-content">
                    <div class="exit-message">
                        <h2 style="color: #ff4757;">⚠️ Access Restricted</h2>
                        <p>This website is for adults only (18+).</p>
                        <p>You will be redirected to a more appropriate site.</p>
                        <div class="redirect-countdown">
                            <span id="countdown">5</span> seconds...
                        </div>
                    </div>
                </div>
            `;
            
            // Countdown redirect
            let countdown = 5;
            const countdownElement = document.getElementById('countdown');
            const interval = setInterval(() => {
                countdown--;
                if (countdownElement) {
                    countdownElement.textContent = countdown;
                }
                
                if (countdown <= 0) {
                    clearInterval(interval);
                    // Redirect to family-friendly site
                    window.location.href = 'https://www.google.com';
                }
            }, 1000);
        }
    }

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
            
            // Escape key to focus on "I am under 18" button
            if (e.key === 'Escape') {
                document.querySelector('.btn-exit').focus();
            }
        });
        
        // Focus first element
        if (firstElement) {
            firstElement.focus();
        }
    }

    logAttempt(action) {
        // Log verification attempts (would typically send to analytics)
        const logData = {
            action: action,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            screenResolution: `${screen.width}x${screen.height}`
        };
        
        // Store in localStorage for now (would be sent to server in production)
        const logs = JSON.parse(localStorage.getItem('xshiver_verification_logs') || '[]');
        logs.push(logData);
        
        // Keep only last 50 logs
        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }
        
        localStorage.setItem('xshiver_verification_logs', JSON.stringify(logs));
        
        // Console log for development
        console.log('Age Verification Log:', logData);
    }

    showWarning(message) {
        // Create temporary warning notification
        const warning = document.createElement('div');
        warning.className = 'age-warning-notification';
        warning.innerHTML = `
            <div class="warning-content">
                <span>⚠️ ${message}</span>
            </div>
        `;
        
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff4757, #ff3742);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 20000;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, 3000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: '#2ed573',
            error: '#ff4757',
            info: '#4A90E2',
            warning: '#ffd700'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="notification-close">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 20000;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    initMainSite() {
        // Initialize main site functionality after age verification
        console.log('🎬 Xshiver: Age verification passed, initializing main site...');
        
        // Trigger custom event for other scripts to listen to
        document.dispatchEvent(new CustomEvent('xshiverAgeVerified', {
            detail: {
                timestamp: new Date().toISOString(),
                verified: true
            }
        }));
    }

    // Method to reset verification (for development/testing)
    resetVerification() {
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem('xshiver_verification_logs');
        location.reload();
    }
}

// Global function for age verification buttons
function verifyAge(isAdult) {
    if (window.ageVerification) {
        window.ageVerification.verifyAge(isAdult);
    }
}

// Initialize age verification when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ageVerification = new AgeVerification();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }
    
    .notification-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
    
    .exit-content {
        text-align: center;
        background: linear-gradient(135deg, #1a1a2e, #16213e) !important;
    }
    
    .redirect-countdown {
        font-size: 1.5rem;
        font-weight: bold;
        color: #ff4757;
        margin-top: 20px;
    }
    
    #countdown {
        font-size: 2rem;
        color: #ffd700;
    }
`;
document.head.appendChild(style);
