document.addEventListener('DOMContentLoaded', () => {
    const applyForm = document.getElementById('apply-form');
    const messageDiv = document.getElementById('message');
    const jobTitleHeader = document.getElementById('job-title-header');
    
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id');
    const jobTitle = urlParams.get('title');

    if (!jobId || !jobTitle) {
        document.querySelector('.form-container').innerHTML = '<h2>Invalid Job Link</h2><p>This job application link is missing required information.</p>';
        return;
    }

    jobTitleHeader.textContent = `Apply for: ${jobTitle}`;

    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    if (loggedInUserEmail) {
        document.getElementById('email').value = loggedInUserEmail;
    }

    applyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('full_name', document.getElementById('full_name').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('cover_letter', document.getElementById('cover_letter').value);
        formData.append('resume', document.getElementById('resume').files[0]);

        messageDiv.textContent = 'Submitting...';
        messageDiv.className = 'form-message info';

        try {
            // Now using the unified window.api.post for FormData
            const result = await window.api.post(`/jobs/${jobId}/apply`, formData);
            
            messageDiv.textContent = result.message;
            messageDiv.className = 'form-message success';
            applyForm.reset();

        } catch (error) {
            console.error('Application submission error:', error);
            // The error message from the server is now passed automatically
            messageDiv.textContent = error.message || 'An unexpected error occurred. Please try again.';
            messageDiv.className = 'form-message error';
        }
    });
});