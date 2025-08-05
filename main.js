/**
 * @file main.js
 * @description Core JavaScript for Divyanshu Pandey's Professional Portfolio SPA.
 *              Handles routing, loading animations, theme toggling, interactive elements,
 *              form validation, and performance optimizations.
 */

// --- Global Utility Functions ---
window.utils = {
    /**
     * Smoothly scrolls to an element by its ID.
     * @param {string} elementId - The ID of the target element.
     */
    scrollTo: (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    },

    /**
     * Copies text to the clipboard.
     * @param {string} text - The text to copy.
     */
    copyToClipboard: (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard');
            window.utils.showNotification('Copied to clipboard!', 'info');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            window.utils.showNotification('Failed to copy text.', 'error');
        });
    },

    /**
     * Displays a transient notification message.
     * @param {string} message - The message to display.
     * @param {'info'|'success'|'error'} type - The type of notification.
     */
    showNotification: (message, type = 'info') => {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            console.warn('Notification container not found.');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notificationContainer.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            notification.addEventListener('animationend', () => {
                notification.remove();
            }, { once: true });
        }, 3000);
    }
};

// --- SPA Router Class ---
class SPARouter {
    constructor() {
        this.routes = {};
        this.currentRoute = 'home';
        this.isLoading = false;
        this.init();
    }

    /** Initializes the router by registering routes and setting up event listeners. */
    init() {
        this.registerRoute('home', 'home-page');
        this.registerRoute('about', 'about-page');
        this.registerRoute('skills', 'skills-page');
        this.registerRoute('projects', 'projects-page');
        this.registerRoute('blog', 'blog-page');
        this.registerRoute('education', 'education-page');
        this.registerRoute('contact', 'contact-page');

        this.setupEventListeners();

        // Load initial route based on URL hash or default to home
        const initialHash = window.location.hash.slice(1);
        this.loadRoute(this.routes[initialHash] ? initialHash : this.currentRoute, false, false);
    }

    /**
     * Registers a new route.
     * @param {string} path - The URL path (e.g., 'home', 'about').
     * @param {string} elementId - The ID of the corresponding page element.
     */
    registerRoute(path, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            this.routes[path] = { element, path };
        } else {
            console.error(`Element with ID "${elementId}" not found for route "${path}".`);
        }
    }

    /** Sets up event listeners for navigation links and browser history changes. */
    setupEventListeners() {
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.getAttribute('data-route');
                this.navigateTo(route);
            });
        });

        window.addEventListener('popstate', (e) => {
            const route = e.state?.route || 'home';
            this.loadRoute(route, false, false); // Don't push state again on popstate
        });
    }

    /**
     * Navigates to a specified route.
     * @param {string} route - The target route.
     */
    navigateTo(route) {
        if (this.routes[route] && !this.isLoading && this.currentRoute !== route) {
            this.loadRoute(route, true, true); // Push state and show loading
        } else if (this.currentRoute === route) {
            // If already on the route, just scroll to top and close mobile menu
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.closeMobileMenu();
        }
    }

    /** Shows the loading screen. */
    showLoader() {
        const loader = document.getElementById('loader');
        const appContainer = document.getElementById('appContainer');

        this.isLoading = true;
        loader.classList.remove('hidden');
        appContainer.classList.remove('loaded');

        // Reset and restart progress bar animation
        const progressBar = loader.querySelector('.loader-progress-bar');
        progressBar.style.animation = 'none';
        void progressBar.offsetWidth; // Trigger reflow
        progressBar.style.animation = 'progress 3s ease-in-out';
    }

    /** Hides the loading screen. */
    hideLoader() {
        const loader = document.getElementById('loader');
        const appContainer = document.getElementById('appContainer');

        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => {
                appContainer.classList.add('loaded');
                this.isLoading = false;
            }, 500); // Allow opacity transition to finish
        }, 3000); // Loader visible for 3 seconds
    }

    /**
     * Loads a specific route, optionally showing a loader and pushing to history.
     * @param {string} route - The route to load.
     * @param {boolean} pushState - Whether to push the route to browser history.
     * @param {boolean} showLoading - Whether to show the loading animation.
     */
    loadRoute(route, pushState = true, showLoading = false) {
        if (showLoading) {
            this.showLoader();
            setTimeout(() => {
                this.performRouteTransition(route, pushState);
                this.hideLoader();
            }, 100); // Small delay before transition to ensure loader is visible
        } else {
            this.performRouteTransition(route, pushState);
        }
    }

    /**
     * Performs the actual page transition logic.
     * @param {string} route - The target route.
     * @param {boolean} pushState - Whether to push the route to browser history.
     */
    performRouteTransition(route, pushState) {
        // Hide all pages
        Object.values(this.routes).forEach(routeObj => {
            routeObj.element.classList.remove('active');
        });

        // Show target page
        if (this.routes[route]) {
            this.routes[route].element.classList.add('active');
            this.currentRoute = route;

            // Update URL
            if (pushState) {
                history.pushState({ route }, '', `#${route}`);
            }

            this.updateNavigation(route);
            this.closeMobileMenu();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.updatePageTitle(route);
        } else {
            console.warn(`Route "${route}" not found. Redirecting to home.`);
            this.loadRoute('home', true, false);
        }
    }

    /**
     * Updates the active state of navigation links and route indicators.
     * @param {string} activeRoute - The currently active route.
     */
    updateNavigation(activeRoute) {
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-route') === activeRoute) {
                link.classList.add('active');
            }
        });

        document.querySelectorAll('.route-dot').forEach(dot => {
            dot.classList.remove('active');
            dot.setAttribute('aria-selected', 'false');
            dot.setAttribute('tabindex', '-1'); // Make non-active dots not focusable by tab
            if (dot.getAttribute('data-route') === activeRoute) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
                dot.setAttribute('tabindex', '0'); // Make active dot focusable
            }
        });
    }

    /**
     * Updates the browser page title based on the active route.
     * @param {string} route - The active route.
     */
    updatePageTitle(route) {
        const titles = {
            home: 'Divyanshu Pandey - Professional Portfolio',
            about: 'About - Divyanshu Pandey',
            skills: 'Skills - Divyanshu Pandey',
            projects: 'Projects - Divyanshu Pandey',
            blog: 'Blog - Divyanshu Pandey',
            education: 'Education - Divyanshu Pandey',
            contact: 'Contact - Divyanshu Pandey'
        };
        document.title = titles[route] || titles.home;
    }

    /** Closes the mobile navigation menu. */
    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.querySelector('i').classList.replace('ri-close-line', 'ri-menu-line');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    }
}

// --- Main Application Class ---
class App {
    constructor() {
        this.init();
    }

    /** Initializes the application. */
    init() {
        // Ensure DOM is fully loaded before starting the app
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startApp());
        } else {
            this.startApp();
        }
    }

    /** Starts the main application components. */
    startApp() {
        new LoadingScreen(); // Manages initial loading animation
        this.initResponsiveHandlers();
        this.initPerformanceOptimizations();
    }

    /** Sets up handlers for responsive behavior (resize, orientation change). */
    initResponsiveHandlers() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 250);
        });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
    }

    /** Handles logic triggered by window resize events. */
    handleResize() {
        // Update particles based on screen size
        if (window.pJSDom && window.pJSDom[0]) {
            const particleCount = window.innerWidth < 768 ? 25 : 50;
            window.pJSDom[0].pJS.particles.number.value = particleCount;
            window.pJSDom[0].pJS.fn.particlesRefresh();
        }

        // Close mobile menu if resized to desktop view
        if (window.innerWidth > 1030) {
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                mobileMenuBtn.querySelector('i').classList.replace('ri-close-line', 'ri-menu-line');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        }
    }

    /** Implements various performance optimization techniques. */
    initPerformanceOptimizations() {
        this.initLazyLoading();
        this.initOptimizedScrolling();
        // Critical CSS and font preloading are handled in HTML <head>
    }

    /** Sets up lazy loading for images using Intersection Observer. */
    initLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]'); // Select images with loading="lazy"
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // If using data-src, uncomment: img.src = img.dataset.src;
                    // img.removeAttribute('data-src');
                    img.onload = () => img.classList.add('loaded'); // Optional: add class for fade-in effect
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '0px 0px 100px 0px' }); // Load 100px before entering viewport

        images.forEach(img => imageObserver.observe(img));
    }

    /** Optimizes scroll event handling using requestAnimationFrame. */
    initOptimizedScrolling() {
        let isScrolling = false;
        const optimizedScrollHandler = () => {
            if (!isScrolling) {
                requestAnimationFrame(() => {
                    // Header scroll effect
                    const header = document.getElementById('header');
                    if (window.scrollY > 100) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }

                    // Back to top button
                    const backToTop = document.getElementById('backToTop');
                    if (window.scrollY > 500) {
                        backToTop.classList.add('visible');
                    } else {
                        backToTop.classList.remove('visible');
                    }
                    isScrolling = false;
                });
                isScrolling = true;
            }
        };
        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

        // Back to top button click handler
        document.getElementById('backToTop').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// --- Loading Screen Management ---
class LoadingScreen {
    constructor() {
        this.loader = document.getElementById('loader');
        this.appContainer = document.getElementById('appContainer');
        this.loadingTexts = [
            'Loading Portfolio...',
            'Initializing Components...',
            'Setting up Navigation...',
            'Finalizing Experience...',
            'Ready!'
        ];
        this.currentTextIndex = 0;
        this.init();
    }

    /** Initializes the loading screen animations and simulation. */
    init() {
        this.animateLoadingText();
        this.simulateLoading();
    }

    /** Animates the loading text messages. */
    animateLoadingText() {
        const loaderText = document.querySelector('.loader-text');
        const textInterval = setInterval(() => {
            if (this.currentTextIndex < this.loadingTexts.length - 1) {
                loaderText.textContent = this.loadingTexts[this.currentTextIndex];
                this.currentTextIndex++;
            } else {
                clearInterval(textInterval);
            }
        }, 600);
    }

    /** Simulates a loading delay before hiding the loader. */
    simulateLoading() {
        setTimeout(() => this.hideLoader(), 3000);
    }

    /** Hides the loading screen and initializes the main application. */
    hideLoader() {
        this.loader.classList.add('hidden');
        setTimeout(() => {
            this.appContainer.classList.add('loaded');
            this.initializeApp();
        }, 500); // Match CSS transition duration
    }

    /** Initializes core application components after loading. */
    initializeApp() {
        this.initParticles();
        window.router = new SPARouter(); // Initialize SPA router
        this.initComponents(); // Initialize general UI components
        this.initAdvancedFeatures(); // Initialize advanced interactive features
    }

    /** Initializes the particles.js background. */
    initParticles() {
        particlesJS('particles-js', {
            particles: {
                number: { value: window.innerWidth < 768 ? 30 : 50, density: { enable: true, value_area: 800 } },
                color: { value: '#0066ff' },
                shape: { type: 'circle' },
                opacity: { value: 0.3, random: false },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#0066ff', opacity: 0.2, width: 1 },
                move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
                modes: { grab: { distance: 140, line_linked: { opacity: 0.5 } }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        });
    }

    /** Initializes general UI components like mobile menu and scroll effects. */
    initComponents() {
        this.initMobileMenu();
        this.initScrollEffects(); // Already handled by App.initOptimizedScrolling, but can add more here
        this.initAnimations(); // General hover animations
        this.animateHeroTyping(); // Specific hero typing animation
    }

    /** Initializes advanced interactive features. */
    initAdvancedFeatures() {
        this.initThemeToggle();
        this.initSkillBars();
        this.initProjectFiltering();
        this.initTestimonialsCarousel();
        this.initFormValidation();
        this.initBlogContentLoading();
        this.initKeyboardNavigation();
        // Add other advanced feature initializers here
    }

    /** Sets up mobile menu toggle functionality. */
    initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');

        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenu.classList.toggle('active');
            mobileMenuBtn.querySelector('i').classList.replace(isExpanded ? 'ri-menu-line' : 'ri-close-line', isExpanded ? 'ri-close-line' : 'ri-menu-line');
            mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target) && mobileMenu.classList.contains('active')) {
                this.closeMobileMenu();
            }
        });
    }

    /** General scroll effects (header, back to top). */
    initScrollEffects() {
        // This is largely handled by App.initOptimizedScrolling now.
        // Any additional scroll-triggered animations can be added here.
    }

    /** Applies general hover animations to interactive elements. */
    initAnimations() {
        // Hover effects for buttons (handled by CSS now)
        // Hover effects for feature cards (handled by CSS now)
        // Hover effects for blog cards (handled by CSS now)
    }

    /** Animates the typing effect in the hero section. */
    animateHeroTyping() {
        const typingTarget = document.getElementById('typing-text');
        if (!typingTarget) return;

        const typingTexts = ["Divyanshu Pandey", 'Web Developer', 'Student & Coder'];
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const type = () => {
            const currentText = typingTexts[textIndex];
            typingTarget.textContent = isDeleting
                ? currentText.substring(0, charIndex--)
                : currentText.substring(0, charIndex++);

            if (!isDeleting && charIndex === currentText.length + 1) {
                setTimeout(() => isDeleting = true, 1000); // Pause at end of typing
            } else if (isDeleting && charIndex === -1) {
                isDeleting = false;
                textIndex = (textIndex + 1) % typingTexts.length;
                charIndex = 0;
            }

            const typingSpeed = isDeleting ? 60 : 100;
            setTimeout(type, typingSpeed);
        };

        setTimeout(type, 1000); // Start typing after a delay
    }

    /** Initializes the theme toggle functionality. */
    initThemeToggle() {
        const themeToggleBtn = document.getElementById('themeToggle');
        const currentTheme = localStorage.getItem('theme') || 'dark'; // Default to dark

        // Apply initial theme
        document.body.classList.toggle('light-mode', currentTheme === 'light');
        themeToggleBtn.querySelector('i').className = currentTheme === 'light' ? 'ri-moon-line' : 'ri-sun-line';
        themeToggleBtn.setAttribute('aria-label', `Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`);

        themeToggleBtn.addEventListener('click', () => {
            const isLightMode = document.body.classList.toggle('light-mode');
            const newTheme = isLightMode ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            themeToggleBtn.querySelector('i').className = isLightMode ? 'ri-moon-line' : 'ri-sun-line';
            themeToggleBtn.setAttribute('aria-label', `Switch to ${newTheme === 'light' ? 'dark' : 'light'} mode`);
        });
    }

    /** Initializes skill bar animations on scroll. */
    initSkillBars() {
        const skillBars = document.querySelectorAll('.skill-bar');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillLevel = entry.target.dataset.skillLevel;
                    entry.target.style.width = `${skillLevel}%`;
                    entry.target.parentElement.setAttribute('aria-valuenow', skillLevel); // Update ARIA value
                    observer.unobserve(entry.target); // Stop observing once animated
                }
            });
        }, { threshold: 0.5 }); // Trigger when 50% of element is visible

        skillBars.forEach(bar => observer.observe(bar));
    }

    /** Initializes project filtering functionality. */
    initProjectFiltering() {
        const filterButtons = document.querySelectorAll('.project-filters .filter-btn');
        const projectGrid = document.getElementById('projectGrid');
        const projectCards = document.querySelectorAll('.project-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state for buttons
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');

                const filter = button.dataset.filter;

                projectCards.forEach(card => {
                    const categories = card.dataset.category.split(' ');
                    if (filter === 'all' || categories.includes(filter)) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }

    /** Initializes the testimonials carousel. */
    initTestimonialsCarousel() {
        const slides = document.querySelectorAll('.testimonial-slide');
        const dots = document.querySelectorAll('.carousel-nav-dots .dot');
        let currentSlide = 0;
        let autoAdvanceInterval;

        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                slide.setAttribute('aria-hidden', 'true');
                dots[i].classList.remove('active');
                dots[i].setAttribute('aria-selected', 'false');
                dots[i].setAttribute('tabindex', '-1');
            });
            slides[index].classList.add('active');
            slides[index].setAttribute('aria-hidden', 'false');
            dots[index].classList.add('active');
            dots[index].setAttribute('aria-selected', 'true');
            dots[index].setAttribute('tabindex', '0');
        };

        const startAutoAdvance = () => {
            clearInterval(autoAdvanceInterval);
            autoAdvanceInterval = setInterval(() => {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            }, 5000); // Auto-advance every 5 seconds
        };

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                currentSlide = parseInt(e.target.dataset.slide);
                showSlide(currentSlide);
                startAutoAdvance(); // Reset auto-advance on manual interaction
            });
        });

        showSlide(currentSlide); // Initialize first slide
        startAutoAdvance(); // Start auto-advance
    }

    /** Initializes client-side form validation for the contact form. */
    initFormValidation() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;

        const inputs = [
            { id: 'contactName', errorId: 'nameError', validate: (val) => val.length > 0, msg: 'Full Name is required.' },
            { id: 'contactEmail', errorId: 'emailError', validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), msg: 'Please enter a valid email address.' },
            { id: 'contactSubject', errorId: 'subjectError', validate: (val) => val.length > 0, msg: 'Subject is required.' },
            { id: 'contactMessage', errorId: 'messageError', validate: (val) => val.length > 0, msg: 'Message cannot be empty.' }
        ];

        const validateInput = (inputElement, errorElement, validationFn, errorMessage) => {
            const isValid = validationFn(inputElement.value.trim());
            const formGroup = inputElement.closest('.form-group');

            if (!isValid) {
                formGroup.classList.add('invalid');
                errorElement.textContent = errorMessage;
                inputElement.setAttribute('aria-invalid', 'true');
            } else {
                formGroup.classList.remove('invalid');
                errorElement.textContent = '';
                inputElement.setAttribute('aria-invalid', 'false');
            }
            return isValid;
        };

        // Add real-time validation on input change/blur
        inputs.forEach(item => {
            const inputElement = document.getElementById(item.id);
            const errorElement = document.getElementById(item.errorId);
            inputElement.addEventListener('input', () => validateInput(inputElement, errorElement, item.validate, item.msg));
            inputElement.addEventListener('blur', () => validateInput(inputElement, errorElement, item.validate, item.msg));
        });

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let allValid = true;

            // Validate all fields on submit
            inputs.forEach(item => {
                const inputElement = document.getElementById(item.id);
                const errorElement = document.getElementById(item.errorId);
                if (!validateInput(inputElement, errorElement, item.validate, item.msg)) {
                    allValid = false;
                }
            });

            if (allValid) {
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                submitBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Sending...';
                submitBtn.disabled = true;
                submitBtn.setAttribute('aria-busy', 'true');

                try {
                    // Simulate API call (replace with actual fetch to your backend)
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Example: Integrate reCAPTCHA here if needed
                    // const token = await grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', { action: 'submit' });
                    // const response = await fetch('/api/contact', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify({
                    //         name: document.getElementById('contactName').value,
                    //         email: document.getElementById('contactEmail').value,
                    //         subject: document.getElementById('contactSubject').value,
                    //         message: document.getElementById('contactMessage').value,
                    //         recaptchaToken: token
                    //     })
                    // });
                    // if (!response.ok) throw new Error('Form submission failed.');

                    submitBtn.innerHTML = '<i class="ri-check-line"></i> Message Sent!';
                    submitBtn.style.background = 'var(--gradient-secondary)';
                    window.utils.showNotification('Message sent successfully!', 'success');
                    contactForm.reset(); // Clear form fields

                    // Reset validation states
                    inputs.forEach(item => {
                        document.getElementById(item.id).closest('.form-group').classList.remove('invalid');
                        document.getElementById(item.errorId).textContent = '';
                        document.getElementById(item.id).setAttribute('aria-invalid', 'false');
                    });

                } catch (error) {
                    console.error('Form submission error:', error);
                    submitBtn.innerHTML = '<i class="ri-error-warning-line"></i> Send Failed!';
                    submitBtn.style.background = 'var(--secondary)'; // Use error color
                    window.utils.showNotification('Failed to send message. Please try again.', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.setAttribute('aria-busy', 'false');
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.style.background = ''; // Reset background
                    }, 2000);
                }
            } else {
                window.utils.showNotification('Please correct the errors in the form.', 'error');
                // Focus on the first invalid field for better UX
                const firstInvalid = contactForm.querySelector('.form-group.invalid input, .form-group.invalid textarea');
                if (firstInvalid) firstInvalid.focus();
            }
        });
    }

    /** Handles dynamic loading and display of blog content in a modal. */
    initBlogContentLoading() {
        // In a real application, this data would be fetched from an API or Markdown files.
        const blogPostsData = {
            'js-tips': {
                title: '10 Essential JavaScript Tips for Beginners',
                category: 'JavaScript',
                date: 'Dec 15, 2024',
                readTime: '5 min read',
                content: `
                    <p>Discover the most important JavaScript concepts every beginner should master to become a proficient developer.</p>
                    <p>Here's a quick tip:</p>
                    <pre><code class="language-javascript">
// Use destructuring for cleaner code
const person = { name: 'Alice', age: 30 };
const { name, age } = person;
console.log(name, age); // Alice 30
                    </code></pre>
                    <p>And another one:</p>
                    <pre><code class="language-html">
&lt;!-- Semantic HTML is crucial --&gt;
&lt;header&gt;
  &lt;nav&gt;...&lt;/nav&gt;
&lt;/header&gt;
&lt;main&gt;
  &lt;section&gt;...&lt;/section&gt;
&lt;/main&gt;
&lt;footer&gt;...&lt;/footer&gt;
                    </code></pre>
                    <p>Remember to always write clean and readable code!</p>
                `
            },
            'react-hooks': {
                title: 'React Hooks: A Complete Guide',
                category: 'React',
                date: 'Dec 5, 2024',
                readTime: '12 min read',
                content: `
                    <p>Learn how to use React Hooks effectively to build modern, functional React components with state management.</p>
                    <p>The \`useState\` hook is fundamental:</p>
                    <pre><code class="language-javascript">
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // Initialize state

  return (
    &lt;div&gt;
      &lt;p&gt;Count: {count}&lt;/p&gt;
      &lt;button onClick={() => setCount(count + 1)}&gt;Increment&lt;/button&gt;
    &lt;/div&gt;
  );
}
                    </code></pre>
                    <p>And \`useEffect\` for side effects:</p>
                    <pre><code class="language-javascript">
import React, { useEffect, useState } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://api.example.com/data')
      .then(response => response.json())
      .then(json => setData(json));
  }, []); // Empty dependency array means run once on mount

  return (
    &lt;div&gt;
      {data ? &lt;pre&gt;{JSON.stringify(data, null, 2)}&lt;/pre&gt; : 'Loading...'}
    &lt;/div&gt;
  );
}
                    </code></pre>
                    <p>Hooks simplify stateful logic in functional components.</p>
                `
            }
        };

        document.querySelectorAll('.blog-read-more').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const blogId = e.target.dataset.blogId;
                const post = blogPostsData[blogId];

                if (post) {
                    const blogModal = document.createElement('div');
                    blogModal.className = 'blog-modal';
                    blogModal.setAttribute('role', 'dialog');
                    blogModal.setAttribute('aria-modal', 'true');
                    blogModal.setAttribute('aria-labelledby', 'blog-modal-title');

                    blogModal.innerHTML = `
                        <div class="blog-modal-content">
                            <button class="close-modal-btn" aria-label="Close blog post"><i class="ri-close-line"></i></button>
                            <h2 id="blog-modal-title">${post.title}</h2>
                            <div class="blog-meta">
                                <span class="blog-category">${post.category}</span>
                                <span><i class="ri-calendar-line"></i> ${post.date}</span>
                                <span><i class="ri-time-line"></i> ${post.readTime}</span>
                            </div>
                            <div class="blog-post-body">
                                ${post.content}
                            </div>
                        </div>
                    `;
                    document.body.appendChild(blogModal);
                    document.body.style.overflow = 'hidden'; // Prevent scrolling body when modal is open

                    // Highlight code blocks within the new modal content
                    Prism.highlightAllUnder(blogModal);

                    // Close modal functionality
                    const closeModal = () => {
                        blogModal.remove();
                        document.body.style.overflow = ''; // Restore body scrolling
                    };
                    blogModal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
                    blogModal.addEventListener('click', (e) => {
                        if (e.target === blogModal) closeModal(); // Close on outside click
                    });
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape') closeModal(); // Close on ESC key
                    }, { once: true }); // Only listen once to prevent multiple listeners
                } else {
                    window.utils.showNotification('Blog post not found.', 'error');
                }
            });
        });
    }

    /** Initializes keyboard navigation enhancements. */
    initKeyboardNavigation() {
        // Add keyboard-navigation class on Tab press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        // Remove keyboard-navigation class on mouse click
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }
}

// --- Initialize the Application ---
new App();

// --- Performance Monitoring (for development/debugging) ---
window.addEventListener('load', () => {
    setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
            console.log('🚀 Page Load Performance Metrics:');
            console.log(`  Total Load Time: ${Math.round(perfData.loadEventEnd - perfData.loadEventStart)}ms`);
            console.log(`  DOM Content Loaded: ${Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart)}ms`);
            const firstPaint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint');
            if (firstPaint) {
                console.log(`  First Paint: ${Math.round(firstPaint.startTime)}ms`);
            }
            const largestContentfulPaint = performance.getEntriesByType('largest-contentful-paint')[0];
            if (largestContentfulPaint) {
                console.log(`  Largest Contentful Paint: ${Math.round(largestContentfulPaint.startTime)}ms`);
            }
        }
    }, 1000);
});

// --- Visibility API for Performance Optimization ---
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause non-essential animations (e.g., particles.js)
        if (window.pJSDom && window.pJSDom[0]) {
            window.pJSDom[0].pJS.fn.vendors.pause();
        }
    } else {
        // Page is visible, resume animations
        if (window.pJSDom && window.pJSDom[0]) {
            window.pJSDom[0].pJS.fn.vendors.play();
        }
    }
});

console.log('✅ Professional Portfolio SPA loaded successfully!');
console.log('📱 Mobile-friendly features enabled');
console.log('⚡ Performance optimizations active');
console.log('🎨 Enhanced loader with 3-second transitions');
console.log('📝 Blog section with dynamic content and syntax highlighting');
console.log('🖼️ Real hero image implemented');
console.log('✨ Advanced features integrated: Theme Toggle, Skill Bars, Project Filters, Testimonials, Form Validation');
console.log('♿ Accessibility (ARIA, Keyboard Nav) considerations applied');
