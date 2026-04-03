/**
 * professional Tax Calculator Logic for FY 2026-27 (AY 2027-28)
 * Replicating ClearTax functionality & accuracy
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Step Navigation Logic ---
    const steps = document.querySelectorAll('.wizard-step');
    const stepItems = document.querySelectorAll('.step-item');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    let currentStep = 1;

    const updateUI = () => {
        // Show/Hide Steps
        steps.forEach((step, index) => {
            step.classList.toggle('active', (index + 1) === currentStep);
        });

        // Update Stepper
        stepItems.forEach((item, index) => {
            const stepNum = index + 1;
            item.classList.toggle('active', stepNum === currentStep);
            item.classList.toggle('completed', stepNum < currentStep);
        });

        // Update Buttons
        prevBtn.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
        
        if (currentStep === 4) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-flex';
            calculateFullTax();
        } else {
            nextBtn.style.display = 'inline-flex';
            submitBtn.style.display = 'none';
            nextBtn.innerHTML = (currentStep === 3) ? 'Calculate Tax <i data-lucide="chevron-right"></i>' : 'Go to Next Step <i data-lucide="chevron-right"></i>';
            if (window.lucide) lucide.createIcons();
        }
    };

    nextBtn.addEventListener('click', () => {
        if (currentStep < 4) {
            currentStep++;
            updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    });

    // --- Calculation Logic ---
    const calculateFullTax = () => {
        // Inputs
        const incomeSalary = parseFloat(document.getElementById('incomeSalary').value) || 0;
        const incomeOther = parseFloat(document.getElementById('incomeOther').value) || 0;
        const incomeRental = parseFloat(document.getElementById('incomeRental').value) || 0;
        const incomeCrypto = parseFloat(document.getElementById('incomeCrypto').value) || 0;

        const ded80C = Math.min(150000, parseFloat(document.getElementById('ded80C').value) || 0);
        const dedHomeLoan = Math.min(200000, parseFloat(document.getElementById('dedHomeLoan').value) || 0);
        const ded80D = parseFloat(document.getElementById('ded80D').value) || 0;
        const dedNPS = parseFloat(document.getElementById('dedNPS').value) || 0;

        // Rental Income Head (30% flat deduction for maintenance u/s 24)
        const housePropertyHead = incomeRental * 0.7;

        // --- NEW REGIME CALCULATION ---
        const newStdDeduc = 75000;
        const newSalaryHead = Math.max(0, incomeSalary - newStdDeduc);
        
        // GTI in New Regime (mostly restricted deductions)
        const newGTI = newSalaryHead + housePropertyHead + incomeOther;
        const newTaxableForSlabs = newGTI;
        
        // Slabs FY 26-27 (New)
        const computeNewSlabs = (taxable) => {
            let tax = 0;
            if (taxable > 400000) {
                if (taxable <= 800000) tax = (taxable - 400000) * 0.05;
                else if (taxable <= 1200000) tax = 20000 + (taxable - 800000) * 0.10;
                else if (taxable <= 1600000) tax = 60000 + (taxable - 1200000) * 0.15;
                else if (taxable <= 2000000) tax = 120000 + (taxable - 1600000) * 0.20;
                else if (taxable <= 2400000) tax = 200000 + (taxable - 2000000) * 0.25;
                else tax = 300000 + (taxable - 2400000) * 0.30;
            }
            return tax;
        };

        let slabTaxNew = computeNewSlabs(newTaxableForSlabs);
        let cryptoTaxNew = incomeCrypto * 0.30;
        let tempBaseTaxNew = slabTaxNew + cryptoTaxNew;
        
        let newBaseTax = 0;
        // Rebate 87A Marginal Relief (Applies only to slabs, not crypto typically, but 87A exists)
        if (newTaxableForSlabs <= 1200000) {
            newBaseTax = cryptoTaxNew; // Rebate covers slab tax up to 12L
        } else {
            const thresholdIncome = 1275000;
            const excessIncome = (newTaxableForSlabs + incomeCrypto) - thresholdIncome;
            let marginalTax = (slabTaxNew > excessIncome && excessIncome > 0) ? excessIncome : slabTaxNew;
            newBaseTax = marginalTax + cryptoTaxNew;
        }

        // Surcharge New Regime
        const totalIncomeNew = newTaxableForSlabs + incomeCrypto;
        let newSurcharge = 0;
        if (totalIncomeNew > 20000000) newSurcharge = newBaseTax * 0.25;
        else if (totalIncomeNew > 10000000) newSurcharge = newBaseTax * 0.15;
        else if (totalIncomeNew > 5000000) newSurcharge = newBaseTax * 0.10;

        const newCess = (newBaseTax + newSurcharge) * 0.04;
        const newTotal = newBaseTax + newSurcharge + newCess;

        // --- OLD REGIME CALCULATION ---
        const oldStdDeduc = 50000;
        const oldSalaryHead = Math.max(0, incomeSalary - oldStdDeduc);
        
        // Home Loan Interest u/s 24b reduces House Property income
        const oldHousePropertyHead = housePropertyHead - dedHomeLoan;
        
        const oldGTI = oldSalaryHead + oldHousePropertyHead + incomeOther;
        const oldTotalDeductions = ded80C + ded80D + dedNPS;
        const oldTaxableForSlabs = Math.max(0, oldGTI - oldTotalDeductions);
        
        const computeOldSlabs = (taxable) => {
            let tax = 0;
            if (taxable > 250000) {
                if (taxable <= 500000) tax = (taxable - 250000) * 0.05;
                else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
                else tax = 112500 + (taxable - 1000000) * 0.30;
            }
            return tax;
        };

        let slabTaxOld = computeOldSlabs(oldTaxableForSlabs);
        let cryptoTaxOld = incomeCrypto * 0.30;
        let tempBaseTaxOld = slabTaxOld + cryptoTaxOld;
        let oldBaseTax = 0;

        if (oldTaxableForSlabs <= 500000) {
            oldBaseTax = cryptoTaxOld;
        } else {
            const threshold = 550000 + oldTotalDeductions;
            const excess = (oldTaxableForSlabs + incomeCrypto) - threshold;
            let marginalTaxOld = (slabTaxOld > excess && excess > 0) ? excess : slabTaxOld;
            oldBaseTax = marginalTaxOld + cryptoTaxOld;
        }

        // Surcharge Old Regime
        const totalIncomeOld = oldTaxableForSlabs + incomeCrypto;
        let oldSurcharge = 0;
        if (totalIncomeOld > 20000000) oldSurcharge = oldBaseTax * 0.25;
        else if (totalIncomeOld > 10000000) oldSurcharge = oldBaseTax * 0.15;
        else if (totalIncomeOld > 5000000) oldSurcharge = oldBaseTax * 0.10;

        const oldCess = (oldBaseTax + oldSurcharge) * 0.04;
        const oldTotal = oldBaseTax + oldSurcharge + oldCess;


        // --- UI UPDATES ---
        const totalGrossDisplay = incomeSalary + incomeOther + incomeRental + incomeCrypto;
        
        document.getElementById('resOldGross').textContent = `₹${totalGrossDisplay.toLocaleString('en-IN')}`;
        document.getElementById('resNewGross').textContent = `₹${totalGrossDisplay.toLocaleString('en-IN')}`;
        
        document.getElementById('resOldExempt').textContent = "₹0";
        document.getElementById('resNewExempt').textContent = "₹0";
        
        document.getElementById('resOldStdDeduc').textContent = `₹${oldStdDeduc.toLocaleString('en-IN')}`;
        document.getElementById('resNewStdDeduc').textContent = `₹${newStdDeduc.toLocaleString('en-IN')}`;
        
        document.getElementById('resOldVIA').textContent = `₹${oldTotalDeductions.toLocaleString('en-IN')}`;
        document.getElementById('resNewVIA').textContent = "₹0";

        
        document.getElementById('resOldTaxable').textContent = `₹${Math.round(totalIncomeOld).toLocaleString('en-IN')}`;
        document.getElementById('resNewTaxable').textContent = `₹${Math.round(totalIncomeNew).toLocaleString('en-IN')}`;
        
        document.getElementById('resOldBaseTax').textContent = `₹${Math.round(oldBaseTax).toLocaleString('en-IN')}`;
        document.getElementById('resNewBaseTax').textContent = `₹${Math.round(newBaseTax).toLocaleString('en-IN')}`;
        
        document.getElementById('resOldCess').textContent = `₹${Math.round(oldCess).toLocaleString('en-IN')}`;
        document.getElementById('resNewCess').textContent = `₹${Math.round(newCess).toLocaleString('en-IN')}`;
        
        document.getElementById('resOldTotal').textContent = `₹${Math.round(oldTotal).toLocaleString('en-IN')}`;
        document.getElementById('resNewTotal').textContent = `₹${Math.round(newTotal).toLocaleString('en-IN')}`;


        // Recommendation
        const banner = document.getElementById('bestRegimeBanner');
        const savingsText = banner.querySelector('p');
        const savings = Math.abs(newTotal - oldTotal);
        const better = newTotal < oldTotal ? 'New Regime' : 'Old Regime';
        
        banner.querySelector('h4').textContent = `Recommended: ${better}`;
        savingsText.innerHTML = `You save <strong>₹${Math.round(savings).toLocaleString('en-IN')}</strong> over the ${better === 'New Regime' ? 'Old' : 'New'} Regime.`;
        banner.style.background = better === 'New Regime' ? '#ecfdf5' : '#eff6ff';
        banner.style.borderColor = better === 'New Regime' ? '#10b981' : '#3b82f6';
        
        if (window.lucide) lucide.createIcons();
    };

    // --- Final Report (PDF) Generation ---
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
    });

    // Initial setup
    updateUI();
});

