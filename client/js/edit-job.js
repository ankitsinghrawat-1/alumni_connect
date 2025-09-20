document.addEventListener('DOMContentLoaded', () => {
    const editJobForm = document.getElementById('edit-job-form');
    const userRole = sessionStorage.getItem('userRole');
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');

    if (userRole !== 'admin' || !jobId) {
        window.location.href = 'index.html';
        return;
    }

    const fetchJobData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
            if (!response.ok) throw new Error('Job not found');
            const job = await response.json();
            
            document.getElementById('title').value = job.title;
            document.getElementById('description').value = job.description;
            document.getElementById('company').value = job.company;
            document.getElementById('location').value = job.location;
            document.getElementById('contact_email').value = job.contact_email;
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    editJobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const jobData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            company: document.getElementById('company').value,
            location: document.getElementById('location').value,
            contact_email: document.getElementById('contact_email').value,
        };

        try {
            const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
            const result = await response.json();
            if (response.ok) {
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'job-management.html', 1500);
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('An unexpected error occurred.', 'error');
        }
    });

    fetchJobData();
});