document.addEventListener('DOMContentLoaded', async () => {
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

    document.getElementById('adminWelcome').innerHTML = `Welcome back, <strong>${user.name}</strong>`;

    // Logout
    document.getElementById('logoutAdminBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // --- FETCH CONSULTATIONS ---
    const loadConsultations = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/consultations`, { headers });
            if(res.status === 401) {
                alert("Session expired"); localStorage.clear(); window.location.href='index.html'; return;
            }
            const data = await res.json();
            
            const tbody = document.getElementById('consultationsTableBody');
            tbody.innerHTML = '';
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No consultations yet.</td></tr>';
            }

            data.forEach(c => {
                const tr = document.createElement('tr');
                const date = new Date(c.createdAt).toLocaleDateString();
                const statusClass = c.status === 'New' ? 'new' : ''; // add other style logic
                
                tr.innerHTML = `
                    <td>${date}</td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.email}</td>
                    <td>${c.phone || '-'}</td>
                    <td>${c.service || '-'}</td>
                    <td style="max-width: 250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.message}">${c.message || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${c.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading consultations:", error);
        }
    };

    // --- FETCH CLIENTS ---
    const loadClients = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/clients`, { headers });
            const data = await res.json();
            
            const tbody = document.getElementById('clientsTableBody');
            tbody.innerHTML = '';

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No clients created yet.</td></tr>';
            }

            data.forEach(client => {
                const tr = document.createElement('tr');
                const date = new Date(client.createdAt).toLocaleDateString();
                const roleClass = 'client';
                
                tr.innerHTML = `
                    <td>${date}</td>
                    <td><strong>${client.name}</strong></td>
                    <td>${client.email}</td>
                    <td>${client.phone || '-'}</td>
                    <td><span class="status-badge ${roleClass}">${client.role}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading clients:", error);
        }
    };

    // --- CREATE NEW CLIENT ---
    document.getElementById('createClientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('newClientName').value;
        const email = document.getElementById('newClientEmail').value;
        const phone = document.getElementById('newClientPhone').value;
        const password = document.getElementById('newClientPassword').value;
        
        try {
            const res = await fetch(`${API_URL}/admin/clients`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, email, phone, password })
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            
            alert(`Successfully created client: ${data.name}`);
            document.getElementById('createClientForm').reset();
            loadClients(); // Reload
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // Initialize View
    lucide.createIcons();
    await loadConsultations();
    await loadClients();
});
