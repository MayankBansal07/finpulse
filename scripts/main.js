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
    const input80C = document.getElementById('input80C');
    const inputDeductionOther = document.getElementById('inputDeductionOther');
    const resBaseTax = document.getElementById('resBaseTax');
    const resSurcharge = document.getElementById('resSurcharge');
    const resCess = document.getElementById('resCess');
    const savingsAmount = document.getElementById('savingsAmount');
    const savingsPanel = document.getElementById('savingsPanel');

    const calculateTaxForRegime = (income, regime, ded80c = 0, dedOther = 0) => {
        let tax = 0;
        let baseTax = 0;
        let surcharge = 0;

        if (regime === 'new') {
            const taxable = Math.max(0, income - 75000); // Standard Deduction
            if (taxable > 400000) {
                if (taxable <= 800000) baseTax = (taxable - 400000) * 0.05;
                else if (taxable <= 1200000) baseTax = 20000 + (taxable - 800000) * 0.10;
                else if (taxable <= 1600000) baseTax = 60000 + (taxable - 1200000) * 0.15;
                else if (taxable <= 2000000) baseTax = 120000 + (taxable - 1600000) * 0.20;
                else if (taxable <= 2400000) baseTax = 200000 + (taxable - 2000000) * 0.25;
                else baseTax = 300000 + (taxable - 2400000) * 0.30;
            }

            // Rebate 87A with Marginal Relief
            if (taxable <= 1200000) {
                tax = 0;
            } else {
                const excessLimit = income - 1275000;
                tax = (baseTax > excessLimit && excessLimit > 0) ? excessLimit : baseTax;
            }
        } else {
            // Old Regime
            const taxable = Math.max(0, income - 50000 - ded80c - dedOther);
            if (taxable > 250000) {
                if (taxable <= 500000) baseTax = (taxable - 250000) * 0.05;
                else if (taxable <= 1000000) baseTax = 12500 + (taxable - 500000) * 0.20;
                else baseTax = 112500 + (taxable - 1000000) * 0.30;
            }

            // Rebate 87A with Marginal Relief
            if (taxable <= 500000) {
                tax = 0;
            } else {
                const threshold = 550000 + ded80c + dedOther;
                const excessLimit = income - threshold;
                tax = (baseTax > excessLimit && excessLimit > 0) ? excessLimit : baseTax;
            }
        }

        // Surcharge Logic
        if (income > 20000000) { // > 2Cr
            surcharge = tax * 0.25;
            // Marginal relief on 2Cr surcharge
            const taxAt2Cr = calculateTaxForRegime(20000000, regime, ded80c, dedOther).rawBase;
            const surchargeAt2Cr = taxAt2Cr * 0.15;
            const diffIncome = income - 20000000;
            const diffTax = (tax + surcharge) - (taxAt2Cr + surchargeAt2Cr);
            if (diffTax > diffIncome) surcharge = (taxAt2Cr + surchargeAt2Cr + diffIncome) - tax;
        } else if (income > 10000000) { // > 1Cr
            surcharge = tax * 0.15;
            const taxAt1Cr = calculateTaxForRegime(10000000, regime, ded80c, dedOther).rawBase;
            const surchargeAt1Cr = taxAt1Cr * 0.10;
            const diffIncome = income - 10000000;
            const diffTax = (tax + surcharge) - (taxAt1Cr + surchargeAt1Cr);
            if (diffTax > diffIncome) surcharge = (taxAt1Cr + surchargeAt1Cr + diffIncome) - tax;
        } else if (income > 5000000) { // > 50L
            surcharge = tax * 0.10;
            const taxAt50L = calculateTaxForRegime(5000000, regime, ded80c, dedOther).rawBase;
            const diffIncome = income - 5000000;
            const diffTax = (tax + surcharge) - taxAt50L;
            if (diffTax > diffIncome) surcharge = (taxAt50L + diffIncome) - tax;
        }

        const cess = (tax + surcharge) * 0.04;
        return { 
            total: Math.round(tax + surcharge + cess), 
            rawBase: tax, 
            rawSurcharge: surcharge, 
            rawCess: cess 
        };
    };

    const calculateTax = () => {
        if (!incomeSlider) return;
        const income = parseInt(incomeSlider.value);
        const ded80c = Math.min(150000, parseInt(input80C.value) || 0);
        const dedOther = parseInt(inputDeductionOther.value) || 0;

        incomeDisplay.textContent = `₹${income.toLocaleString('en-IN')}`;
        
        const currentRegime = document.querySelector('.regime-toggle .active').dataset.regime;
        const newRes = calculateTaxForRegime(income, 'new');
        const oldRes = calculateTaxForRegime(income, 'old', ded80c, dedOther);

        const activeRes = currentRegime === 'new' ? newRes : oldRes;

        // UI Updates
        taxValueDisplay.textContent = `₹${activeRes.total.toLocaleString('en-IN')}`;
        resBaseTax.textContent = `₹${activeRes.rawBase.toLocaleString('en-IN')}`;
        resSurcharge.textContent = `₹${Math.round(activeRes.rawSurcharge).toLocaleString('en-IN')}`;
        resCess.textContent = `₹${Math.round(activeRes.rawCess).toLocaleString('en-IN')}`;

        // Savings Comparison
        const savings = Math.abs(newRes.total - oldRes.total);
        const betterRegime = newRes.total < oldRes.total ? 'New Regime' : 'Old Regime';
        
        if (savings === 0) {
            savingsPanel.style.display = 'none';
        } else {
            savingsPanel.style.display = 'block';
            savingsPanel.style.background = betterRegime === 'New Regime' ? '#ecfdf5' : '#eff6ff';
            savingsPanel.style.borderColor = betterRegime === 'New Regime' ? '#10b981' : '#3b82f6';
            savingsPanel.querySelector('span').style.color = betterRegime === 'New Regime' ? '#065f46' : '#1e40af';
            savingsPanel.querySelector('span').innerHTML = `
                <i data-lucide="sparkles" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
                You save <strong>₹${savings.toLocaleString('en-IN')}</strong> with the ${betterRegime}!
            `;
            lucide.createIcons();
        }
    };

    if (incomeSlider) {
        incomeSlider.addEventListener('input', calculateTax);
        input80C.addEventListener('input', calculateTax);
        inputDeductionOther.addEventListener('input', calculateTax);
        
        regimeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                regimeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                calculateTax();
            });
        });

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
                if (ui) ui.style.display = 'none';
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

            const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5005/api'
                : 'https://finpulse-backend-v2.onrender.com/api';

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
