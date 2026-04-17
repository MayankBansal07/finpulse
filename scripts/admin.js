document.addEventListener('DOMContentLoaded', async () => {
    // Icons initialization
    lucide.createIcons();

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

    if (user.email === 'admin@finpulse.works') {
        document.body.classList.add('master-admin-theme');
        const navManageAdmins = document.getElementById('navManageAdmins');
        if (navManageAdmins) navManageAdmins.style.display = 'flex';
    } else {
        // Sub-admin logic
        const restrictedNavs = ['navOverview', 'navClients', 'navActivities'];
        restrictedNavs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Default to blogs tab
        document.getElementById('overview').classList.remove('active');
        document.getElementById('manage-blogs').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Manage Blogs';
        const navBlogs = document.getElementById('navBlogs');
        if (navBlogs) navBlogs.classList.add('active');
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await apiFetch('/auth/logout', {
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
                'manage-admins': 'Manage Admin Users',
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
    
    document.getElementById('btnCancelSupport').addEventListener('click', () => toggleDisplay('supportPanel', false));

    const btnNewAdmin = document.getElementById('btnNewAdmin');
    if (btnNewAdmin) btnNewAdmin.addEventListener('click', () => toggleDisplay('newAdminPanel', true));
    const btnCancelAdmin = document.getElementById('btnCancelAdmin');
    if (btnCancelAdmin) btnCancelAdmin.addEventListener('click', () => toggleDisplay('newAdminPanel', false));

    // Blog Image Upload Preview
    let uploadedImageBase64 = null;
    document.getElementById('blogImageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedImageBase64 = event.target.result;
                const preview = document.getElementById('imagePreview');
                const placeholder = document.getElementById('uploadPlaceholder');
                preview.src = uploadedImageBase64;
                preview.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Data Loaders
    const loadStats = async () => {
        if (user.email !== 'admin@finpulse.works') return;
        try {
            const res = await apiFetch('/admin/stats', { headers });
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
            const res = await apiFetch('/admin/blogs', { headers });
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
            const res = await apiFetch('/admin/clients', { headers });
            const data = await res.json();
            const tbody = document.getElementById('clientsTableBody');
            tbody.innerHTML = '';

            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No clients found.</td></tr>';
                return;
            }

            data.forEach(client => {
                const tr = document.createElement('tr');
                const support = client.assignedSupport ? `${client.assignedSupport.name}` : '<span style="color:#94a3b8; font-style:italic;">None Assigned</span>';
                
                tr.innerHTML = `
                    <td style="font-weight: 500;">${client.name}</td>
                    <td style="color: #4f46e5; font-weight: 600;">${client.clientId || 'FNC-XXXX'}</td>
                    <td>${support}</td>
                    <td>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="pill" style="color:#22c55e; border:1px solid #22c55e; background:none; cursor:pointer;" onclick="openSupportModal('${client._id}', '${client.assignedSupport?.name || ''}', '${client.assignedSupport?.phone || ''}', '${client.assignedSupport?.email || ''}')">Support</button>
                            <button class="pill" style="color:#64748b; border:1px solid #e2e8f0; background:none; cursor:pointer;" onclick="editClientPass('${client._id}')">Pass</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            loadStats();
        } catch(e) { console.error('Error loading clients:', e); }
    };

    const loadActivities = async () => {
        try {
            const res = await apiFetch('/admin/activities', { headers });
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

    const loadSubAdmins = async () => {
        if (user.email !== 'admin@finpulse.works') return;
        try {
            const res = await apiFetch('/admin/subadmins', { headers });
            const data = await res.json();
            const tbody = document.getElementById('adminsTableBody');
            if(!tbody) return;
            tbody.innerHTML = '';

            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No sub-admins found.</td></tr>';
                return;
            }

            data.forEach(adminData => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 500;">${adminData.name}</td>
                    <td>${adminData.email}</td>
                    <td>${adminData.phone || 'N/A'}</td>
                    <td>${adminData.panNumber || 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });
            loadStats();
        } catch(e) { console.error('Error loading admins:', e); }
    };

    // Submissions
    document.getElementById('createBlogForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('blogTitle').value;
        const content = document.getElementById('blogContent').value;
        const authorSignature = document.getElementById('blogSignature') ? document.getElementById('blogSignature').value : '';
        if (!uploadedImageBase64) {
            alert('Please select an image');
            return;
        }

        try {
            const res = await apiFetch('/admin/blogs', {
                method: 'POST',
                headers,
                body: JSON.stringify({ title, content, image: uploadedImageBase64, authorSignature })
            });

            if(res.ok) {
                document.getElementById('createBlogForm').reset();
                document.getElementById('imagePreview').style.display = 'none';
                const placeholder = document.getElementById('uploadPlaceholder');
                if (placeholder) placeholder.style.display = 'block';
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
            const res = await apiFetch('/admin/clients', {
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

    document.getElementById('assignSupportForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('supportClientId').value;
        const name = document.getElementById('supportName').value;
        const phone = document.getElementById('supportPhone').value;
        const email = document.getElementById('supportEmail').value;

        try {
            const res = await apiFetch(`/admin/clients/${id}/support`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ name, phone, email })
            });

            const contentType = res.headers.get("content-type");
            if (res.ok) {
                document.getElementById('assignSupportForm').reset();
                toggleDisplay('supportPanel', false);
                loadClients();
                alert('Support assigned successfully!');
            } else if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                alert(`Error: ${data.message}`);
            } else {
                const text = await res.text();
                console.error("Server returned non-JSON error:", text);
                alert('Failed to update support. If you just applied changes, please restart the backend server (node server.js).');
            }
        } catch(e) { 
            console.error(e);
            alert(`Network Error: ${e.message}`); 
        }
    });

    const createAdminForm = document.getElementById('createAdminForm');
    if (createAdminForm) {
        createAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('adminName').value;
            const panNumber = document.getElementById('adminPan').value;
            const phone = document.getElementById('adminMobile').value;
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;

            try {
                const res = await apiFetch('/admin/subadmins', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ name, panNumber, phone, email, password })
                });

                if(res.ok) {
                    createAdminForm.reset();
                    toggleDisplay('newAdminPanel', false);
                    loadSubAdmins();
                } else {
                    const data = await res.json();
                    alert(`Error: ${data.message}`);
                }
            } catch(e) { alert(`Error: ${e.message}`); }
        });
    }

    // Global Action functions
    window.openSupportModal = (id, name, phone, email) => {
        document.getElementById('supportClientId').value = id;
        document.getElementById('supportName').value = name || '';
        document.getElementById('supportPhone').value = phone || '';
        document.getElementById('supportEmail').value = email || '';
        toggleDisplay('supportPanel', true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteBlog = async (id) => {
        if(!confirm('Are you sure you want to delete this blog?')) return;
        try {
            await apiFetch(`/admin/blogs/${id}`, { method: 'DELETE', headers });
            loadBlogs();
        } catch(e) { console.error(e); }
    };

    window.editClientPass = async (id) => {
        const newPassword = prompt('Enter new password for this client:');
        if(!newPassword) return;
        
        try {
            const res = await apiFetch(`/admin/clients/${id}/password`, { 
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
    if (user.email === 'admin@finpulse.works') {
        document.body.classList.add('master-admin-theme');
        loadClients();
        loadActivities();
        loadStats();
        loadSubAdmins();
    } else {
        document.querySelectorAll('.restricted').forEach(el => el.style.display = 'none');
    }
    loadBlogs();

});
