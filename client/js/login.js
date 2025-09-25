// docs/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    if (!loginForm) {
        console.error("Error: The login form element with ID 'login-form' was not found.");
        return;
    }

    if (!messageDiv) {
        console.error("Error: The message element with ID 'message' was not found.");
    }

    // Check for email instead of token
    const userEmail = localStorage.getItem('loggedInUserEmail');
    if (userEmail) {
        window.location.href = 'dashboard.html';
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // --- Validation Checks ---
        if (!email || !password) {
            showToast('Please enter both email and password.', 'error');
            return;
        }

        if (messageDiv) {
            messageDiv.textContent = 'Logging in...';
            messageDiv.className = 'form-message info';
        }

        try {
            const data = await window.api.post('/users/login', { email, password });

            // Store other info in localStorage
            localStorage.setItem('loggedInUserEmail', data.email);
            localStorage.setItem('userRole', data.role);

            if (messageDiv) {
                messageDiv.textContent = 'Login successful!';
                messageDiv.className = 'form-message success';
            }

            if (data.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            if (messageDiv) {
                messageDiv.textContent = error.message || 'An error occurred. Please try again.';
                messageDiv.className = 'form-message error';
            }
            console.error('Login error:', error);
        }
    });
});