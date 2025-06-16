// Simple Visit Tracking System
class VisitTracker {
    constructor() {
        this.storageKey = 'arkham_visit_data';
        this.sessionKey = 'arkham_session';
        this.init();
    }

    init() {
        this.trackVisit();
        this.updateStats();
    }

    // Generate a simple browser fingerprint
    generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    trackVisit() {
        const now = new Date();
        const today = now.toDateString();
        const fingerprint = this.generateFingerprint();
        
        // Get existing data
        let data = this.getData();
        
        // Check if this is a new session (no session storage or expired)
        const isNewSession = !sessionStorage.getItem(this.sessionKey) || 
                            (Date.now() - parseInt(sessionStorage.getItem(this.sessionKey)) > 30 * 60 * 1000); // 30 minutes
        
        let sessionId = sessionStorage.getItem(this.sessionKey + '_id');
        if (isNewSession || !sessionId) {
            sessionId = fingerprint + '_' + Date.now();
            sessionStorage.setItem(this.sessionKey, Date.now().toString());
            sessionStorage.setItem(this.sessionKey + '_id', sessionId);
            data.sessions++;
        }
        
        // Track page view
        data.pageViews++;
        data.lastVisit = now.toISOString();
        
        // Track daily visits
        if (!data.dailyVisits[today]) {
            data.dailyVisits[today] = 0;
        }
        data.dailyVisits[today]++;
        
        // Track unique visitors (simplified)
        if (!data.uniqueVisitors.includes(fingerprint)) {
            data.uniqueVisitors.push(fingerprint);
        }
        
        // Keep only last 30 days of daily data
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        Object.keys(data.dailyVisits).forEach(date => {
            if (new Date(date) < thirtyDaysAgo) {
                delete data.dailyVisits[date];
            }
        });
        
        this.saveData(data);
        
        // Send data to server (non-blocking)
        this.sendToServer({
            fingerprint,
            timestamp: now.toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            page: window.location.pathname,
            sessionId
        });
    }

    getData() {
        const defaultData = {
            pageViews: 0,
            sessions: 0,
            uniqueVisitors: [],
            dailyVisits: {},
            firstVisit: new Date().toISOString(),
            lastVisit: new Date().toISOString()
        };
        
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
        } catch (e) {
            return defaultData;
        }
    }

    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save visit data:', e);
        }
    }

    updateStats() {
        // This could be used to update any stats display on the page
        const data = this.getData();
        
        // Dispatch custom event with stats
        window.dispatchEvent(new CustomEvent('visitStatsUpdated', {
            detail: {
                pageViews: data.pageViews,
                sessions: data.sessions,
                uniqueVisitors: data.uniqueVisitors.length,
                dailyVisits: data.dailyVisits
            }
        }));
    }

    // Method to get stats for display
    getStats() {
        const data = this.getData();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        return {
            totalPageViews: data.pageViews,
            totalSessions: data.sessions,
            uniqueVisitors: data.uniqueVisitors.length,
            todayVisits: data.dailyVisits[today] || 0,
            yesterdayVisits: data.dailyVisits[yesterday] || 0,
            firstVisit: data.firstVisit,
            lastVisit: data.lastVisit,
            dailyVisits: data.dailyVisits
        };
    }

    // Method to export data (useful for analysis)
    exportData() {
        return this.getData();
    }

    // Method to clear all data
    clearData() {
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.sessionKey);
        sessionStorage.removeItem(this.sessionKey + '_id');
    }

    // Send data to server (non-blocking)
    async sendToServer(data) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            // Silently fail - don't break the user experience
            console.debug('Analytics tracking failed:', error);
        }
    }

    // Fetch server-side analytics (for admin dashboard)
    async fetchServerStats(range = 30) {
        try {
            const response = await fetch(`/api/analytics?range=${range}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.debug('Failed to fetch server stats:', error);
        }
        return null;
    }
}

// Initialize visit tracking
const visitTracker = new VisitTracker();

// Make it globally available for debugging
window.visitTracker = visitTracker;

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background opacity on scroll
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.problem-item, .feature, .service-card, .audience-item, .process-step, .highlight-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Stats counter animation
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stat = entry.target;
                const finalValue = stat.textContent;
                
                // Extract number from text (e.g., "70%+" -> 70)
                const numMatch = finalValue.match(/\d+/);
                if (numMatch) {
                    const finalNum = parseInt(numMatch[0]);
                    animateCounter(stat, 0, finalNum, finalValue);
                }
                
                statsObserver.unobserve(stat);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => {
        statsObserver.observe(stat);
    });

    function animateCounter(element, start, end, finalText) {
        const duration = 2000;
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                element.textContent = finalText;
                clearInterval(timer);
            } else {
                const currentInt = Math.floor(current);
                if (finalText.includes('%')) {
                    element.textContent = currentInt + '%' + (finalText.includes('+') ? '+' : '');
                } else if (finalText.includes('days')) {
                    element.textContent = currentInt + ' days';
                } else {
                    element.textContent = currentInt;
                }
            }
        }, 16);
    }

    // Mobile menu toggle (for future enhancement)
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Form handling for contact (if forms are added later)
    const contactForms = document.querySelectorAll('form');
    
    contactForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Add form submission logic here
            const formData = new FormData(form);
            
            // Show success message
            showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
        });
    });

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            border: 1px solid var(--accent-teal);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.5;
        
        if (hero) {
            hero.style.transform = `translateY(${parallax}px)`;
        }
    });

    // Service card hover effects
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Copy email functionality
    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    
    emailLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const email = this.href.replace('mailto:', '');
            
            // Try to copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(email).then(() => {
                    showNotification('Email address copied to clipboard!', 'success');
                }).catch(() => {
                    // Fallback - just open email client
                });
            }
        });
    });

    // Lazy loading for images (if any are added later)
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });

    // Keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        // Escape key to close any open modals or menus
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.active, .menu.active');
            activeModals.forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Performance optimization: Throttle scroll events
    let ticking = false;
    
    function updateOnScroll() {
        // Navbar background update
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    });

    // Add CSS class for scrolled navbar
    const style = document.createElement('style');
    style.textContent = `
        .navbar.scrolled {
            background: rgba(10, 10, 10, 0.98) !important;
            backdrop-filter: blur(15px);
        }
    `;
    document.head.appendChild(style);
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for potential use in other scripts
window.ArkhamSecurityLabs = {
    showNotification: function(message, type) {
        // This function is defined in the DOMContentLoaded event listener above
        // Making it available globally if needed
    },
    debounce,
    throttle
};
