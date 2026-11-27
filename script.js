// Portfolio Script - Dynamically loads projects from GitHub API

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupScrollReveal();
});

async function loadProjects() {
    const grid = document.getElementById('projects-grid');
    const spinner = grid.querySelector('.loading-spinner');

    try {
        // Fetch user's repositories from GitHub API
        const response = await fetch('https://api.github.com/users/cxnfu/repos?per_page=100');
        
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const repos = await response.json();
        
        // Filter out forks and sort by stars (descending)
        const personalRepos = repos.filter(repo => !repo.fork).sort((a, b) => 
            (b.stargazers_count || 0) - (a.stargazers_count || 0)
        );

        if (personalRepos.length === 0) {
            grid.innerHTML = `
                <div class="no-projects">
                    <p>No se encontraron proyectos personales. ¡Agrega algo genial!</p>
                </div>`;
            return;
        }

        // Clear spinner and render projects
        grid.innerHTML = '';
        
        personalRepos.forEach(repo => {
            const card = createProjectCard(repo);
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading projects:', error);
        grid.innerHTML = `
            <div class="error-message">
                <p>⚠️ Error al cargar proyectos. Intenta recargar la página.</p>
            </div>`;
    } finally {
        spinner.style.display = 'none';
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

    const languageColor = getLanguageColor(repo.language);

    card.innerHTML = `
        <h3 class="project-title">${escapeHtml(repo.name)}</h3>
        <p class="project-description">${description}</p>
        <div class="project-meta">
            ${repo.language ? `<span class="project-language" style="color: ${languageColor}">${repo.language}</span>` : ''}
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

function getLanguageColor(lang) {
    const colors = {
        'JavaScript': '#f7df1e',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'Rust': '#dea584',
        'Go': '#00add8',
        'C++': '#f34b7d',
        'CSS': '#563d7c',
        'HTML': '#e34c26',
        'Dart': '#00b4ab',
        'Swift': '#ffac40',
        'Kotlin': '#7f52ff'
    };
    return colors[lang] || '#a1a1aa';
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
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    const progressBar = document.querySelector('.scroll-progress');
    if (progressBar) {
        progressBar.style.width = `${scrollPercent}%`;
    }
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

// Add scroll reveal to project cards after load
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('#projects-grid .project-card');
    projectCards.forEach(card => card.classList.add('reveal'));
});