/**
 * FinPulse CA Services - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

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

    // --- Tax Calculator Logic ---
    const incomeSlider = document.getElementById('incomeSlider');
    const incomeDisplay = document.getElementById('incomeDisplay');
    const taxValueDisplay = document.getElementById('taxResultValue');
    const regimeBtns = document.querySelectorAll('.toggle-btn');
    
    let currentRegime = 'new';

    const calculateTax = () => {
        const income = parseInt(incomeSlider.value);
        incomeDisplay.textContent = `₹${income.toLocaleString('en-IN')}`;
        
        let tax = 0;
        if (currentRegime === 'new') {
            // Simplified FY 2024-25 New Regime
            if (income <= 700000) tax = 0;
            else if (income <= 900000) tax = (income - 300000) * 0.05 + 15000;
            else if (income <= 1200000) tax = (income - 900000) * 0.10 + 45000;
            else if (income <= 1500000) tax = (income - 1200000) * 0.15 + 90000;
            else tax = (income - 1500000) * 0.20 + 150000;
        } else {
            // Simplified Old Regime (Assuming 1.5L 80C deduction)
            const taxable = Math.max(0, income - 150000);
            if (taxable <= 250000) tax = 0;
            else if (taxable <= 500000) tax = (taxable - 250000) * 0.05;
            else if (taxable <= 1000000) tax = (taxable - 500000) * 0.20 + 12500;
            else tax = (taxable - 1000000) * 0.30 + 112500;
        }

        taxValueDisplay.textContent = `₹${Math.round(tax).toLocaleString('en-IN')}`;
    };

    if (incomeSlider) {
        incomeSlider.addEventListener('input', calculateTax);
        
        regimeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                regimeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentRegime = btn.getAttribute('data-regime');
                calculateTax();
            });
        });

        // Initialize display
        calculateTax();
    }

    // --- EMI Calculator Logic ---
    const emiLoanAmount = document.getElementById('emiLoanAmount');
    const emiInterestRate = document.getElementById('emiInterestRate');
    const emiTenure = document.getElementById('emiTenure');
    const loanAmountDisplay = document.getElementById('loanAmountDisplay');
    const interestRateDisplay = document.getElementById('interestRateDisplay');
    const tenureDisplay = document.getElementById('tenureDisplay');
    const emiMonthly = document.getElementById('emiMonthly');
    const emiTotalInterest = document.getElementById('emiTotalInterest');
    const emiTotalPayment = document.getElementById('emiTotalPayment');

    const calculateEMI = () => {
        if (!emiLoanAmount) return;
        
        const p = parseFloat(emiLoanAmount.value);
        const r = (parseFloat(emiInterestRate.value) / 12) / 100;
        const n = parseFloat(emiTenure.value) * 12;

        loanAmountDisplay.textContent = `₹${p.toLocaleString('en-IN')}`;
        interestRateDisplay.textContent = `${emiInterestRate.value}%`;
        tenureDisplay.textContent = `${emiTenure.value} years`;

        let emi = 0;
        if (r > 0) {
            emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        } else {
            emi = p / n;
        }
        
        const totalPayment = emi * n;
        const totalInterest = totalPayment - p;

        emiMonthly.textContent = `₹${Math.round(emi).toLocaleString('en-IN')}`;
        emiTotalInterest.textContent = `₹${Math.round(totalInterest).toLocaleString('en-IN')}`;
        emiTotalPayment.textContent = `₹${Math.round(totalPayment).toLocaleString('en-IN')}`;
    };

    if (emiLoanAmount) {
        emiLoanAmount.addEventListener('input', calculateEMI);
        emiInterestRate.addEventListener('input', calculateEMI);
        emiTenure.addEventListener('input', calculateEMI);
        calculateEMI();
    }

    // --- Financial Health Logic ---
    const healthSavings = document.getElementById('healthSavings');
    const healthDebt = document.getElementById('healthDebt');
    const healthInsurance = document.getElementById('healthInsurance');
    const healthInvestment = document.getElementById('healthInvestment');
    const savingsDisplay = document.getElementById('savingsDisplay');
    const debtDisplay = document.getElementById('debtDisplay');
    const insuranceDisplay = document.getElementById('insuranceDisplay');
    const investmentDisplay = document.getElementById('investmentDisplay');
    const healthScoreDisplay = document.getElementById('healthScoreDisplay');
    const healthScoreLabel = document.getElementById('healthScoreLabel');

    const calculateHealth = () => {
        if (!healthSavings) return;
        
        const s = parseInt(healthSavings.value);
        const d = parseInt(healthDebt.value);
        const i = parseInt(healthInsurance.value);
        const v = parseInt(healthInvestment.value);

        savingsDisplay.textContent = `${s}%`;
        debtDisplay.textContent = `${d}%`;
        insuranceDisplay.textContent = `${i}%`;
        investmentDisplay.textContent = `${v}%`;

        let score = (s * 0.4) + ((100 - d) * 0.3) + (i * 0.15) + (v * 0.15);
        score = Math.min(100, Math.max(0, Math.round(score)));

        healthScoreDisplay.textContent = `${score}/100`;
        
        let label = 'Needs Improvement';
        let color = '#ef4444'; // red
        if (score > 80) { label = 'Excellent'; color = '#2ecc71'; }
        else if (score >= 60) { label = 'Good'; color = '#3b82f6'; }
        else if (score >= 40) { label = 'Fair'; color = '#f59e0b'; }

        healthScoreDisplay.style.color = color;
        healthScoreLabel.style.color = color;
        healthScoreLabel.textContent = label;
    };

    if (healthSavings) {
        healthSavings.addEventListener('input', calculateHealth);
        healthDebt.addEventListener('input', calculateHealth);
        healthInsurance.addEventListener('input', calculateHealth);
        healthInvestment.addEventListener('input', calculateHealth);
        calculateHealth();
    }

    // --- Tool Selection Sidebar ---
    const toolItems = document.querySelectorAll('.tool-list-item');
    const toolUIs = {
        'Tax Calculator': document.getElementById('ui-tax'),
        'EMI Calculator': document.getElementById('ui-emi'),
        'Financial Health Check': document.getElementById('ui-health')
    };

    toolItems.forEach(item => {
        item.addEventListener('click', () => {
            toolItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const toolTitle = item.querySelector('h3').textContent;
            
            Object.values(toolUIs).forEach(ui => {
                if(ui) ui.style.display = 'none';
            });
            
            if (toolUIs[toolTitle]) {
                toolUIs[toolTitle].style.display = 'block';
            }
        });
    });

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
            } catch(e) {}
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

            const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:5000' 
                : 'https://finpulse-backend-v2.onrender.com';

            fetch(`${API_BASE}/contact`, {
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
