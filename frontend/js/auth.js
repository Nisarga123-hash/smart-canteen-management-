const API = 'http://localhost:5000/api';

// STUDENT LOGIN
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        document.getElementById('loginMessage').textContent =
            data.message;

        if (response.ok && data.success) {
            window.location.href = 'menu.html';
        }

    } catch (error) {
        document.getElementById('loginMessage').textContent =
            'Cannot connect to server. Start your backend first.';
    }
});

// STUDENT REGISTRATION
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password })
        });

        const data = await response.json();

        document.getElementById('registerMessage').textContent =
            data.message;

        if (response.ok && data.success) {
            document.getElementById('registerForm').reset();
        }

    } catch (error) {
        document.getElementById('registerMessage').textContent =
            'Cannot connect to server.';
    }
});