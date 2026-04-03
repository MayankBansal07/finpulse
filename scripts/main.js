/**
 * FinPulse CA Services - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    const REMOTE_API_BASE = 'https://finpulse-backend-v2.onrender.com/api';
    const LOCAL_API_PORTS = ['5000', '5005'];
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const probeHealth = async (origin) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);

        try {
            const response = await fetch(`${origin}/health`, { signal: controller.signal });
            return response.ok;
        } catch (error) {
            return false;
        } finally {
            clearTimeout(timer);
        }
    };

    const resolveApiBase = async () => {
        if (!isLocalHost) {
            return REMOTE_API_BASE;
        }

        for (const port of LOCAL_API_PORTS) {
            const origin = `${window.location.protocol}//${window.location.hostname}:${port}`;
            const healthy = await probeHealth(origin);
            if (healthy) {
                return `${origin}/api`;
            }
        }

        return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    };

    const apiBasePromise = resolveApiBase();
    const apiFetch = async (path, options = {}) => {
        const base = await apiBasePromise;
        return fetch(`${base}${path}`, options);
    };

    // --- Core UI Elements ---
    const header = document.querySelector('.navbar');
    const faders = document.querySelectorAll('.fade-in');
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    // --- Sticky Header ---
    const isHomePage = document.querySelector('.hero') !== null;

    if (!isHomePage && header) {
        header.classList.add('scrolled');
    }

    window.addEventListener('scroll', () => {
        if (!header) return;
        if (!isHomePage) return; // Keep it solidly styled on inner pages

        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Section Animations ---
    const appearOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('appear');
            observer.unobserve(entry.target);
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // --- Login Overlay Logic ---
    const loginBtn = document.getElementById('loginBtn');
    const loginOverlay = document.getElementById('loginOverlay');
    const closeLoginBtn = document.getElementById('closeLoginBtn');

    if (loginBtn && loginOverlay) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    }

    if (closeLoginBtn && loginOverlay) {
        closeLoginBtn.addEventListener('click', () => {
            loginOverlay.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        });
    }

    // Tool Hub specific logic (if any needed in future)
    // The tools are now on dedicated pages with their own scripts.

    // --- CTA Buttons ---
    const bookConsultationCta = document.getElementById('bookConsultationCta');
    if (bookConsultationCta) {
        bookConsultationCta.addEventListener('click', (e) => {
            e.preventDefault();
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                window.scrollTo({
                    top: contactSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'var(--secondary)';
                navLinks.style.padding = '2rem';
                navLinks.style.borderBottom = '1px solid var(--border-glass)';
            }
        });
    }

    // --- Smooth Scroll for Nav Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // Allow login to bypass scroll if it's not a real anchor
            if (this.id === 'loginBtn' || this.classList.contains('nav-login')) return;

            try {
                const target = document.querySelector(targetId);
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            } catch (e) { }
        });
    });

    // --- Contact Form Handling ---
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            btn.innerHTML = 'Sending...';
            btn.disabled = true;

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                service: document.getElementById('service').value,
                message: document.getElementById('message').value
            };

            apiFetch('/contact', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
                .then(async response => {
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Error occurred');
                    return data;
                })
                .then(() => {
                    formStatus.style.color = 'var(--primary)';
                    formStatus.textContent = 'Message sent! We will contact you soon.';
                    contactForm.reset();
                    setTimeout(() => formStatus.textContent = '', 5000);
                })
                .catch(err => {
                    formStatus.style.color = '#ff4444';
                    formStatus.textContent = err.message || 'Failed to send message.';
                })
                .finally(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                });
        });
    }
});
