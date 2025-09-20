document.addEventListener('DOMContentLoaded', () => {
    const addCampaignForm = document.getElementById('add-campaign-form');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    const userRole = sessionStorage.getItem('userRole');

    if (userRole !== 'admin') {
        window.location.href = 'index.html'; // Redirect non-admins
        return;
    }

    addCampaignForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const campaignData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            goal_amount: document.getElementById('goal_amount').value,
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            image_url: document.getElementById('image_url').value,
            admin_email: loggedInUserEmail
        };

        try {
            const response = await fetch('http://localhost:3000/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData)
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, 'success');
                addCampaignForm.reset();
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            showToast('An unexpected error occurred. Please try again.', 'error');
        }
    });
});