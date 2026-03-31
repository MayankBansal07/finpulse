document.addEventListener('DOMContentLoaded', async () => {
    // Icons initialization
    lucide.createIcons();

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000/api' 
        : 'https://finpulse-backend-v2.onrender.com/api';
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Authentication Guard
    if (!token || !userStr) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
        alert("Access Denied: Admins Only");
        window.location.href = 'index.html';
        return;
    }

    // Initialize UI
    document.getElementById('userAvatar').textContent = user.name ? user.name.charAt(0).toUpperCase() : 'A';
    document.getElementById('userEmailDisplay').textContent = user.email;

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, role: user.role })
            });
        } catch(e) { console.error('Logout log failed', e); }
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Tabs Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            const tabId = e.currentTarget.getAttribute('data-tab');
            e.currentTarget.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Set Title
            const tabTexts = {
                'overview': 'Admin Dashboard',
                'manage-blogs': 'Manage Blogs',
                'manage-clients': 'Manage Clients',
                'activities': 'User Activities'
            };
            document.getElementById('pageTitle').textContent = tabTexts[tabId] || 'Admin Dashboard';

            // Refresh data based on tab if needed, but we'll fetch all on load for simplicity
            if(tabId === 'activities') loadActivities();
            if(tabId === 'overview') loadStats();
        });
    });

    // Toggle Forms
    const toggleDisplay = (id, show) => {
        document.getElementById(id).style.display = show ? 'block' : 'none';
    };

    document.getElementById('btnNewBlog').addEventListener('click', () => toggleDisplay('newBlogPanel', true));
    document.getElementById('btnCancelBlog').addEventListener('click', () => toggleDisplay('newBlogPanel', false));
    
    document.getElementById('btnGenerateClient').addEventListener('click', () => toggleDisplay('newClientPanel', true));
    document.getElementById('btnCancelClient').addEventListener('click', () => toggleDisplay('newClientPanel', false));

    // Blog Image Upload Preview
    let uploadedImageBase64 = null;
    document.getElementById('blogImageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedImageBase64 = event.target.result;
                const preview = document.getElementById('imagePreview');
                preview.src = uploadedImageBase64;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Data Loaders
    const loadStats = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/stats`, { headers });
            if (res.ok) {
                const data = await res.json();
                document.getElementById('statClients').textContent = data.totalClients || 0;
                document.getElementById('statAdmins').textContent = data.totalAdmins || 0;
                document.getElementById('statBlogs').textContent = data.publishedBlogs || 0;
            }
        } catch(e) { console.error('Error loading stats:', e); }
    };

    const loadBlogs = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/blogs`, { headers });
            const data = await res.json();
            const tbody = document.getElementById('blogsTableBody');
            tbody.innerHTML = '';

            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3">No blogs found.</td></tr>';
                return;
            }

            data.forEach(blog => {
                const tr = document.createElement('tr');
                const date = new Date(blog.createdAt).toLocaleDateString();
                tr.innerHTML = `
                    <td style="font-weight: 500;">${blog.title}</td>
                    <td>${date}</td>
                    <td><button class="action-btn delete" onclick="deleteBlog('${blog._id}')"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button></td>
                `;
                tbody.appendChild(tr);
            });
            lucide.createIcons();
            loadStats(); // update dashboard numbers
        } catch(e) { console.error('Error loading blogs:', e); }
    };

    const loadClients = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/clients`, { headers });
            const data = await res.json();
            const tbody = document.getElementById('clientsTableBody');
            tbody.innerHTML = '';

            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No clients found.</td></tr>';
                return;
            }

            data.forEach(client => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 500;">${client.name}</td>
                    <td style="color: #4f46e5; font-weight: 600;">${client.clientId || 'FNC-XXXX'}</td>
                    <td>${client.email}</td>
                    <td><span class="pill" style="color:#22c55e; border:1px solid #22c55e; cursor:pointer;" onclick="editClientPass('${client._id}')">Edit Pass</span></td>
                `;
                tbody.appendChild(tr);
            });
            loadStats();
        } catch(e) { console.error('Error loading clients:', e); }
    };

    const loadActivities = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/activities`, { headers });
            const data = await res.json();
            const tbody = document.getElementById('activitiesTableBody');
            tbody.innerHTML = '';

            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No recent activities.</td></tr>';
                return;
            }

            data.forEach(act => {
                const tr = document.createElement('tr');
                const date = new Date(act.createdAt).toLocaleString();
                const roleClass = act.role === 'admin' ? 'admin' : 'client';
                const actionClass = act.action.toLowerCase() === 'login' ? 'login' : 'logout';
                const actionPillClass = act.action.toLowerCase().includes('login') ? 'login' : 
                                       (act.action.toLowerCase().includes('logout') ? 'logout' : 'client'); // default fallback

                tr.innerHTML = `
                    <td>${act.userEmail}</td>
                    <td><span class="pill ${roleClass}">${act.role.charAt(0).toUpperCase() + act.role.slice(1)}</span></td>
                    <td><span class="pill ${actionPillClass}">${act.action}</span></td>
                    <td style="color:var(--text-light); font-size: 0.75rem;">${date}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) { console.error('Error loading activities:', e); }
    };

    // Submissions
    document.getElementById('createBlogForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('blogTitle').value;
        const content = document.getElementById('blogContent').value;
        if (!uploadedImageBase64) {
            alert('Please select an image');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/admin/blogs`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ title, content, image: uploadedImageBase64 })
            });

            if(res.ok) {
                document.getElementById('createBlogForm').reset();
                document.getElementById('imagePreview').style.display = 'none';
                uploadedImageBase64 = null;
                toggleDisplay('newBlogPanel', false);
                loadBlogs();
            } else {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            }
        } catch(e) { alert(`Error: ${e.message}`); }
    });

    document.getElementById('createClientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('clientName').value;
        const email = document.getElementById('clientEmail').value;
        const password = document.getElementById('clientPassword').value;

        try {
            const res = await fetch(`${API_URL}/admin/clients`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, email, password })
            });

            if(res.ok) {
                document.getElementById('createClientForm').reset();
                toggleDisplay('newClientPanel', false);
                loadClients();
            } else {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            }
        } catch(e) { alert(`Error: ${e.message}`); }
    });

    // Global Action functions
    window.deleteBlog = async (id) => {
        if(!confirm('Are you sure you want to delete this blog?')) return;
        try {
            await fetch(`${API_URL}/admin/blogs/${id}`, { method: 'DELETE', headers });
            loadBlogs();
        } catch(e) { console.error(e); }
    };

    window.editClientPass = async (id) => {
        const newPassword = prompt('Enter new password for this client:');
        if(!newPassword) return;
        
        try {
            const res = await fetch(`${API_URL}/admin/clients/${id}/password`, { 
                method: 'PUT', 
                headers,
                body: JSON.stringify({ password: newPassword })
            });
            
            if(res.ok) {
                alert('Password updated successfully');
                loadActivities(); // refresh activities since we log this
            } else {
                alert('Failed to update password');
            }
        } catch(e) { console.error(e); }
    };

    // Initial Load
    await loadStats();
    await loadBlogs();
    await loadClients();
    await loadActivities();

});
