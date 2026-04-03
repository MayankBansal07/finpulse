/**
 * Financial Health Check Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const savingsInput = document.getElementById('healthSavings');
    const debtInput = document.getElementById('healthDebt');
    const insuranceInput = document.getElementById('healthInsurance');
    const investmentInput = document.getElementById('healthInvestment');
    
    const savingsDisplay = document.getElementById('savingsDisplay');
    const debtDisplay = document.getElementById('debtDisplay');
    const insuranceDisplay = document.getElementById('insuranceDisplay');
    const investmentDisplay = document.getElementById('investmentDisplay');
    
    const scoreDisplay = document.getElementById('healthScoreDisplay');
    const scoreLabel = document.getElementById('healthScoreLabel');
    const adviceDisplay = document.getElementById('healthAdvice');

    const calculateHealth = () => {
        const s = parseInt(savingsInput.value);
        const d = parseInt(debtInput.value);
        const i = parseInt(insuranceInput.value);
        const v = parseInt(investmentInput.value);

        // Update displays
        savingsDisplay.textContent = `${s}%`;
        debtDisplay.textContent = `${d}%`;
        insuranceDisplay.textContent = `${i}%`;
        investmentDisplay.textContent = `${v}%`;

        // Weighted Calculation
        const score = Math.round((s * 0.4) + ((100 - d) * 0.3) + (i * 0.15) + (v * 0.15));
        scoreDisplay.textContent = `${score}/100`;

        // Update Label & Colors
        let label = 'Needs Improvement';
        let color = '#ef4444';
        let advice = 'You are in a risky position. Focus on building an emergency fund and clearing high-interest debt.';

        if (score > 85) {
            label = 'Excellent';
            color = '#10b981';
            advice = 'You have a stellar financial profile! Keep maintaining these habits and consider long-term wealth growth.';
        } else if (score >= 70) {
            label = 'Very Good';
            color = '#3b82f6';
            advice = 'Your financial health is strong. Minor tweaks in investment diversification could put you in the top tier.';
        } else if (score >= 50) {
            label = 'Good';
            color = '#f59e0b';
            advice = "You're on the right track! Start prioritizing debt reduction to increase your financial stability.";
        } else if (score >= 30) {
            label = 'Fair';
            color = '#f97316';
            advice = 'Your financial health is stable but requires attention in some areas. Focus on boosting your savings rate.';
        }

        scoreDisplay.style.color = color;
        scoreLabel.style.color = color;
        scoreLabel.textContent = label;
        adviceDisplay.textContent = advice;
    };

    [savingsInput, debtInput, insuranceInput, investmentInput].forEach(el => {
        if (el) el.addEventListener('input', calculateHealth);
    });

    calculateHealth();
});
