document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality - fixed to prevent infinite loading
    const menuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeButton = document.getElementById('closeMobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    // Only add event listeners if elements exist
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeButton && mobileMenu) {
        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (mobileMenuOverlay && mobileMenu) {
        mobileMenuOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }
    
    // Close mobile menu when clicking on navigation links
    const mobileMenuLinks = document.querySelectorAll('#mobileMenu a');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // إضافة دعم RTL للجداول - مطلوب لبعض المتصفحات
    document.querySelectorAll('table').forEach(table => {
        table.style.direction = 'rtl';
    });
    
    // Prevent infinite scrolling issues
    let isLoading = false;
    
    // Add scroll event listener with throttling to prevent infinite loading
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(function() {
            // Only process scroll events if not already loading
            if (!isLoading) {
                // Handle scroll-based functionality here if needed
                // This prevents infinite loading loops
            }
        }, 100); // Throttle scroll events to every 100ms
    });
    
    // Fix for preventing infinite redirects
    const currentPath = window.location.pathname;
    
    // Prevent redirect loops
    if (currentPath === '/' || currentPath === '/index.html') {
        // Only redirect if not already on login or dashboard
        checkAuthAndRedirect();
    }
    
    async function checkAuthAndRedirect() {
        try {
            const response = await fetch('/api/current-user', {
                credentials: 'include'
            });
            
            if (response.ok) {
                // User is logged in, redirect to dashboard only if on index page
                if (currentPath === '/' || currentPath === '/index.html') {
                    window.location.href = '/dashboard.html';
                }
            } else {
                // User not logged in, redirect to login only if on index page
                if (currentPath === '/' || currentPath === '/index.html') {
                    window.location.href = '/login.html';
                }
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            // On error, redirect to login only if on index page
            if (currentPath === '/' || currentPath === '/index.html') {
                window.location.href = '/login.html';
            }
        }
    }
});

// Global logout function
function logout() {
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
    }).then(() => {
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    }).catch(error => {
        console.error('Logout error:', error);
        // Force redirect to login even if logout fails
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    });
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount || 0);
}

// Utility function to format dates
function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-EG');
}


// Global search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(this.value);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput ? searchInput.value : '';
            performSearch(query);
        });
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    // Real-time search for tables
    const tables = document.querySelectorAll('.data-table tbody');
    tables.forEach(tbody => {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (query === '' || text.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    
    // Search for cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (query === '' || text.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function performSearch(query) {
    if (!query.trim()) {
        showNotification('يرجى إدخال كلمة البحث', 'warning');
        return;
    }
    
    // Advanced search functionality
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('projects.html')) {
        searchProjects(query);
    } else if (currentPage.includes('transactions.html')) {
        searchTransactions(query);
    } else if (currentPage.includes('users.html')) {
        searchUsers(query);
    } else {
        // Global search - redirect to search results page
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
    }
}

function searchProjects(query) {
    // This would typically call an API endpoint
    showNotification(`البحث عن المشاريع: "${query}"`, 'info');
}

function searchTransactions(query) {
    // This would typically call an API endpoint
    showNotification(`البحث عن المعاملات: "${query}"`, 'info');
}

function searchUsers(query) {
    // This would typically call an API endpoint
    showNotification(`البحث عن المستخدمين: "${query}"`, 'info');
}

// Authentication check function
function checkAuth() {
    const currentPath = window.location.pathname;
    
    // Skip auth check for login page
    if (currentPath.includes('login.html')) {
        return;
    }
    
    fetch('/api/current-user', {
        credentials: 'include'
    }).then(response => {
        if (!response.ok) {
            // Not authenticated, redirect to login
            window.location.href = '/login.html';
        } else {
            return response.json();
        }
    }).then(user => {
        if (user) {
            // Update user display
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = user.username;
            }
        }
    }).catch(error => {
        console.error('Auth check error:', error);
        window.location.href = '/login.html';
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});

// User menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const userBtn = document.getElementById('user-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.classList.remove('show');
        });
    }
});

// Navigation toggle for mobile
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
});

