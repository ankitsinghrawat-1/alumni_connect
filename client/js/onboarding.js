document.addEventListener('DOMContentLoaded', async () => {
    const onboardForm = document.getElementById('onboard-form');
    const messageDiv = document.getElementById('message');

    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    const userRole = sessionStorage.getItem('userRole');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }
    
    // Redirect admin users to their dashboard
    if (userRole === 'admin') {
        window.location.href = 'admin.html';
        return;
    }
    
    // Prefill the email field if it exists
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.value = loggedInUserEmail;
    }

    if (onboardForm) {
        onboardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const university = document.getElementById('university').value;
            const universityEmail = document.getElementById('university-email').value;
            const graduationYear = document.getElementById('graduation-year').value;
            const major = document.getElementById('major').value;
            const degree = document.getElementById('degree').value;
            const currentCompany = document.getElementById('current-company').value;
            const jobTitle = document.getElementById('job-title').value;
            const city = document.getElementById('city').value;
            const bio = document.getElementById('bio').value;
            const linkedin = document.getElementById('linkedin').value;

            try {
                const response = await fetch('http://localhost:3000/api/users/onboard', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: loggedInUserEmail,
                        university,
                        university_email: universityEmail,
                        graduation_year: graduationYear,
                        major,
                        degree,
                        current_company: currentCompany,
                        job_title: jobTitle,
                        city,
                        bio,
                        linkedin
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'form-message success';
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.className = 'form-message error';
                console.error('Onboarding error:', error);
            }
        });
    }
});