document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('admin-login-form');
    const messageContainer = document.getElementById('message-container');

    // Redirect if already logged in
    if (localStorage.getItem('userRole') === 'admin' && localStorage.getItem('loggedInUserEmail')) {
        window.location.href = 'admin.html';
        return;
    }

    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                // Use the consistent window.api wrapper for the login request
                const data = await window.api.post('/admin/login', { email, password });

                // Store user info in localStorage
                localStorage.setItem('loggedInUserEmail', data.email);
                localStorage.setItem('userRole', data.role);
                
                window.location.href = 'admin.html';

            } catch (error) {
                messageContainer.textContent = error.message || 'An error occurred. Please try again.';
                messageContainer.className = 'form-message error';
                console.error('Admin login error:', error);
            }
        });
    }
});