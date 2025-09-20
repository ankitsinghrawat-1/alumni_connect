document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('admin-login-form');
    const messageContainer = document.getElementById('message-container');

    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:3000/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('loggedInUserEmail', data.email);
                    sessionStorage.setItem('userRole', data.role);
                    
                    window.location.href = 'admin.html';
                } else {
                    messageContainer.textContent = data.message;
                    messageContainer.className = 'form-message error';
                }
            } catch (error) {
                messageContainer.textContent = 'An error occurred. Please try again.';
                messageContainer.className = 'form-message error';
                console.error('Admin login error:', error);
            }
        });
    }
});