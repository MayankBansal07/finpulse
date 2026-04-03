/**
 * EMI Calculator Logic & Amortization Schedule
 */

document.addEventListener('DOMContentLoaded', () => {
    const loanAmountInput = document.getElementById('emiLoanAmount');
    const interestRateInput = document.getElementById('emiInterestRate');
    const tenureInput = document.getElementById('emiTenure');
    
    const emiMonthly = document.getElementById('emiMonthly');
    const emiTotalInterest = document.getElementById('emiTotalInterest');
    const emiTotalPayment = document.getElementById('emiTotalPayment');
    const amortizationBody = document.getElementById('amortizationBody');

    const calculateEMI = () => {
        const p = parseFloat(loanAmountInput.value) || 0;
        const r = (parseFloat(interestRateInput.value) / 12) / 100;
        const n = (parseFloat(tenureInput.value) || 0) * 12;

        if (p === 0 || r === 0 || n === 0) return;

        // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - p;

        // Update Summary
        emiMonthly.textContent = `₹${Math.round(emi).toLocaleString('en-IN')}`;
        emiTotalInterest.textContent = `₹${Math.round(totalInterest).toLocaleString('en-IN')}`;
        emiTotalPayment.textContent = `₹${Math.round(totalPayment).toLocaleString('en-IN')}`;

        // Generate Amortization Schedule
        amortizationBody.innerHTML = '';
        let balance = p;
        for (let i = 1; i <= n; i++) {
            const interest = balance * r;
            const principal = emi - interest;
            balance -= principal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Month ${i}</td>
                <td>₹${Math.round(principal).toLocaleString('en-IN')}</td>
                <td>₹${Math.round(interest).toLocaleString('en-IN')}</td>
                <td>₹${Math.round(emi).toLocaleString('en-IN')}</td>
                <td>₹${Math.max(0, Math.round(balance)).toLocaleString('en-IN')}</td>
            `;
            amortizationBody.appendChild(tr);
            
            // Just show first 24 months + last 12 for brevity if needed, but here we show all with scroll
        }
    };

    [loanAmountInput, interestRateInput, tenureInput].forEach(el => {
        el.addEventListener('input', calculateEMI);
    });

    calculateEMI();
});
