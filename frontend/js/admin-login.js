const API = 'http://localhost:5000/api';

document.getElementById('adminLoginForm')
    .addEventListener('submit', async (e) => {

        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const message = document.getElementById('message');

        try {
            const response = await fetch(`${API}/admin/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            message.textContent = data.message;

            if (response.ok && data.success) {
                window.location.href = 'admin-dashboard.html';
            }

        } catch (error) {
            message.textContent = 'Unable to connect to server.';
        }
    });