// Portfolio Script - Dynamically loads projects from GitHub API

// Theme Management
(function() {
    const THEME_KEY = 'cxnfu-theme';
    const DEFAULT_THEME = 'auto';
    
    // Initialize theme on page load
    function initTheme() {
        let savedTheme = localStorage.getItem(THEME_KEY);
        
        if (!savedTheme) {
            // Use system preference for first-time visitors
            savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'auto';
        }
        
        applyTheme(savedTheme);
    }
    
    function applyTheme(theme) {
        const root = document.documentElement;
        const isDarkMode = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDarkMode) {
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem(THEME_KEY, 'dark');
        } else if (theme === 'auto') {
            root.removeAttribute('data-theme');
            localStorage.setItem(THEME_KEY, 'auto');
        } else {
            root.setAttribute('data-theme', theme);
            localStorage.setItem(THEME_KEY, theme);
        }
    }
    
    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let currentTheme = localStorage.getItem(THEME_KEY) || 'auto';
            
            // Cycle through themes: auto -> dark -> light -> auto
            const themes = ['auto', 'dark', 'light'];
            const currentIndex = themes.indexOf(currentTheme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            
            applyTheme(nextTheme);
        });
    }
    
    // Listen for system theme changes (when in auto mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const currentTheme = localStorage.getItem(THEME_KEY);
        if (currentTheme === 'auto') {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    // Initialize on load
    initTheme();
})();

document.addEventListener('DOMContentLoaded', () => {
    // Wait for marked library to be loaded before loading projects
    waitForMarked().then(() => {
        loadProjects();
    });
    
    setupScrollReveal();
});

function waitForMarked() {
    return new Promise((resolve) => {
        if (typeof marked !== 'undefined') {
            resolve();
        } else {
            // Wait for script to load
            const checkInterval = setInterval(() => {
                if (typeof marked !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 5 seconds - proceed without marked
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('Marked library not loaded, using plain text');
                resolve();
            }, 5000);
        }
    });
}

async function loadProjects() {
    const grid = document.getElementById('projects-grid');
    
    if (!grid) return;
    
    try {
        // Fetch user's repositories from GitHub API
        const response = await fetch('https://api.github.com/users/cxnfu/repos?per_page=100');
        
        if (!response.ok) throw new Error(`Failed to fetch projects: ${response.status}`);
        
        const repos = await response.json();
        
        // Filter out forks and sort by stars (descending)
        const personalRepos = repos.filter(repo => !repo.fork).sort((a, b) => 
            (b.stargazers_count || 0) - (a.stargazers_count || 0)
        );

        if (personalRepos.length === 0) {
            grid.innerHTML = `
                <div class="no-projects">
                    <p>No projects found yet. Build something amazing!</p>
                </div>`;
            return;
        }

        // Clear grid and render projects
        grid.innerHTML = '';
        
        personalRepos.forEach(repo => {
            const card = createProjectCard(repo);
            grid.appendChild(card);
        });

        // Setup parallax for newly created cards
        setupParallaxForCards();

    } catch (error) {
        console.error('Error loading projects:', error);
        grid.innerHTML = `
            <div class="error-message">
                <p>⚠️ Error loading projects. Try refreshing the page.</p>
            </div>`;
    }
}

function createProjectCard(repo) {
    const card = document.createElement('article');
    card.className = 'project-card reveal';
    
    // Format description (GitHub API returns markdown)
    let description = repo.description || '';
    if (description && typeof marked !== 'undefined') {
        description = marked.parse(description);
    } else if (description) {
        description = escapeHtml(description);
    }

    card.innerHTML = `
        <h3 class="project-title">${escapeHtml(repo.name)}</h3>
        <p class="project-description">${description}</p>
        <div class="project-meta">
            ${repo.language ? `<span class="project-language">${repo.language}</span>` : ''}
            <span class="project-stars">⭐ ${repo.stargazers_count || 0}</span>
        </div>
    `;

    // Add click to open on GitHub
    card.addEventListener('click', () => {
        window.open(repo.html_url, '_blank');
    });

    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupParallaxForCards() {
    // Now query for cards that exist
    const projectCards = document.querySelectorAll('#projects-grid .project-card');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        projectCards.forEach((card) => {
            if (scrolled < 1200 && card.classList.contains('reveal')) {
                const cardTop = card.getBoundingClientRect().top + scrolled;
                if (cardTop > 600 && cardTop < 1400) {
                    card.style.transform = `translateY(${(cardTop - 800) * 0.2}px)`;
                } else {
                    card.style.transform = 'none';
                }
            }
        });
    });
}

function setupScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => observer.observe(el));
}

// Scroll progress bar
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return;
    
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    let progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);
    }
    progressBar.style.width = `${scrollPercent}%`;
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            
            // Update active nav link
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// Parallax effect on hero text
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroTitle = document.querySelector('.hero h1');
    
    if (scrolled < 800 && heroTitle) {
        heroTitle.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroTitle.style.opacity = Math.max(0, 1 - (scrolled / 800));
    }
});
