document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-mentor-form');
    const expertiseAreasInput = document.getElementById('expertise_areas');
    const messageDiv = document.getElementById('message');
    const unlistBtn = document.getElementById('unlist-mentor-btn');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Fetch current mentor profile to pre-fill the form
    const fetchMentorProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/mentors/profile?email=${encodeURIComponent(loggedInUserEmail)}`);
            if (response.ok) {
                const profile = await response.json();
                expertiseAreasInput.value = profile.expertise_areas;
            } else {
                showToast('Could not load your mentor profile.', 'error');
            }
        } catch (error) {
            console.error('Error fetching mentor profile:', error);
            showToast('An error occurred while loading your profile.', 'error');
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const expertise_areas = expertiseAreasInput.value;

        try {
            const response = await fetch('http://localhost:3000/api/mentors/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loggedInUserEmail, expertise_areas })
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'mentors.html', 2000);
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
            console.error('Error updating mentor profile:', error);
        }
    });

    unlistBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to unlist yourself as a mentor? This action cannot be undone.')) {
            try {
                const response = await fetch('http://localhost:3000/api/mentors/profile', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loggedInUserEmail })
                });

                const result = await response.json();
                
                if (response.ok) {
                    showToast('You have been successfully unlisted.', 'success');
                    setTimeout(() => window.location.href = 'mentors.html', 2000);
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                showToast('An error occurred. Please try again.', 'error');
                console.error('Error unlisting mentor:', error);
            }
        }
    });

    fetchMentorProfile();
});