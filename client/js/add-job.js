document.addEventListener('DOMContentLoaded', () => {
    const addJobForm = document.getElementById('add-job-form');
    const messageDiv = document.getElementById('message');
    const userRole = sessionStorage.getItem('userRole');

    // Role check to prevent non-admins from accessing the page
    if (userRole !== 'admin') {
        window.location.href = 'jobs.html';
        return;
    }

    if (addJobForm) {
        addJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const jobData = {
                title: document.getElementById('title').value,
                company: document.getElementById('company').value,
                location: document.getElementById('location').value,
                description: document.getElementById('description').value,
                contact_email: document.getElementById('contact-email').value,
                // Pass admin's email for authorization and notification trigger
                admin_email: sessionStorage.getItem('loggedInUserEmail')
            };

            try {
                const response = await fetch('http://localhost:3000/api/jobs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jobData)
                });
                const result = await response.json();
                
                if (response.ok) {
                    messageDiv.textContent = 'Job added successfully!';
                    messageDiv.className = 'form-message success';
                    addJobForm.reset();
                } else {
                    messageDiv.textContent = `Error: ${result.message}`;
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                console.error('Error adding job:', error);
                messageDiv.textContent = 'Failed to add job. Please try again.';
                messageDiv.className = 'form-message error';
            }
        });
    }
});