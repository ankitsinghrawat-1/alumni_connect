document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('become-mentor-form');
    const messageDiv = document.getElementById('message');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const expertise_areas = document.getElementById('expertise_areas').value;

        try {
            const response = await fetch('http://localhost:3000/api/mentors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loggedInUserEmail, expertise_areas })
            });

            const result = await response.json();
            messageDiv.textContent = result.message;

            if (response.ok) {
                messageDiv.className = 'form-message success';
                setTimeout(() => window.location.href = 'mentors.html', 2000);
            } else {
                messageDiv.className = 'form-message error';
            }
        } catch (error) {
            messageDiv.className = 'form-message error';
            messageDiv.textContent = 'An error occurred. Please try again.';
            console.error('Error registering as mentor:', error);
        }
    });
});