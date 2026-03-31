/**
 * FinPulse Auth Logic (Custom Backend via Render & MongoDB)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Dynamically set API URL based on environment
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000/api' 
        : 'https://finpulse-backend-v2.onrender.com/api';

    // UI Elements
    const loginBtn = document.getElementById('loginBtn');
    const loginOverlay = document.getElementById('loginOverlay');
    const closeLoginBtn = document.getElementById('closeLoginBtn');
    const exactLoginForm = document.getElementById('exact-login-form');
    
    // Check if user is already logged in
    const checkAuthState = () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                updateUIForLoggedInUser(user);
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
    };

    // Open Modal
    if (loginBtn && loginOverlay) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close Modal
    if (closeLoginBtn && loginOverlay) {
        closeLoginBtn.addEventListener('click', () => {
            loginOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    // Login Form Submission
    if (exactLoginForm) {
        // Toggle Password Visibility (using delegation to handle Lucide icon replacement)
        exactLoginForm.addEventListener('click', (e) => {
            const eyeIcon = e.target.closest('.input-action-icon');
            if (eyeIcon) {
                const passwordInput = exactLoginForm.querySelector('input[placeholder="••••••••"]');
                if (passwordInput) {
                    const isPassword = passwordInput.getAttribute('type') === 'password';
                    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                    
                    // Toggle Lucide icon attribute
                    const newIconName = isPassword ? 'eye-off' : 'eye';
                    
                    // If the eyeIcon itself is an <i> or <svg>, update it
                    eyeIcon.setAttribute('data-lucide', newIconName);
                    
                    // Refresh Lucide icons
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }
            }
        });

        // Inject role toggle and update email label
        const titleSec = document.querySelector('.login-card-subtitle');
        let selectedRole = 'client';
        if (titleSec && !document.getElementById('btnRoleClient')) {
            const toggleHtml = `
            <div style="display:flex; gap:10px; margin-bottom:15px; justify-content:center;">
                <button type="button" id="btnRoleClient" style="flex:1; padding:8px; border-radius:6px; background:var(--primary); color:white; border:none; cursor:pointer;">Client Login</button>
                <button type="button" id="btnRoleAdmin" style="flex:1; padding:8px; border-radius:6px; background:#f1f5f9; color:#475569; border:none; cursor:pointer;">Admin Login</button>
            </div>
            `;
            titleSec.insertAdjacentHTML('afterend', toggleHtml);
            
            const btnC = document.getElementById('btnRoleClient');
            const btnA = document.getElementById('btnRoleAdmin');
            const emailLabel = exactLoginForm.querySelector('label');
            const emailInput = exactLoginForm.querySelector('input');
            
            btnC.addEventListener('click', () => {
                selectedRole = 'client';
                btnC.style.background = 'var(--primary)'; btnC.style.color = 'white';
                btnA.style.background = '#f1f5f9'; btnA.style.color = '#475569';
                if(emailLabel) emailLabel.textContent = 'Email or Client ID (FNC-XXXX)';
                if(emailInput) { emailInput.type = 'text'; emailInput.placeholder = 'you@example.com or FNC-1234'; }
            });
            btnA.addEventListener('click', () => {
                selectedRole = 'admin';
                btnA.style.background = 'var(--primary)'; btnA.style.color = 'white';
                btnC.style.background = '#f1f5f9'; btnC.style.color = '#475569';
                if(emailLabel) emailLabel.textContent = 'Admin Email';
                if(emailInput) { emailInput.type = 'email'; emailInput.placeholder = 'admin@finpulse.com'; }
            });
            btnC.click();
        }

        // Cleanup Google Login and Divider
        const googleBtn = exactLoginForm.parentElement.querySelector('.btn-google');
        if (googleBtn) googleBtn.remove();
        const loginDivider = exactLoginForm.parentElement.querySelector('.login-divider');
        if (loginDivider) loginDivider.remove();

        // Update Signup Prompt to Register Here
        const signupPrompt = exactLoginForm.parentElement.querySelector('.signup-prompt');
        if (signupPrompt) {
            signupPrompt.innerHTML = `Don't have an account? <a href="index.html#contact" id="registerLink">Register here</a>`;
            const rl = document.getElementById('registerLink');
            if(rl) {
                rl.addEventListener('click', () => {
                    loginOverlay.classList.add('hidden');
                    document.body.style.overflow = '';
                });
            }
        }

        exactLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInputVal = exactLoginForm.querySelector('input').value;
            const currentPasswordInput = exactLoginForm.querySelector('input[type="password"], input[type="text"]:not([placeholder*="FNC"])').value;
            const submitBtn = exactLoginForm.querySelector('button[type="submit"]');
            
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Signing in...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInputVal, password: currentPasswordInput, role: selectedRole })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }

                // Success! Store token and user
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role
                }));

                // Reset modal and update UI
                loginOverlay.classList.add('hidden');
                document.body.style.overflow = '';
                exactLoginForm.reset();
                
                updateUIForLoggedInUser({ name: data.name, role: data.role });

                // Redirect admins to dashboard
                if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    alert(`Welcome back, ${data.name}! Your client profile is ready.`);
                }

            } catch (error) {
                alert(error.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // UI Updates
    const updateUIForLoggedInUser = (user) => {
        if (loginBtn) {
            // Replace Login button with User Profile / Dashboard button
            loginBtn.textContent = user.role === 'admin' ? 'Admin Dashboard' : `Hi, ${user.name.split(' ')[0]}`;
            loginBtn.classList.add('btn-primary');
            loginBtn.classList.remove('btn-ghost');
            
            // Override click to go to dashboard or logout
            const clone = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(clone, loginBtn);
            
            clone.addEventListener('click', () => {
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    if(confirm("Do you want to logout?")) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.reload();
                    }
                }
            });
        }
    };

    // Run auth check on load
    checkAuthState();
});
