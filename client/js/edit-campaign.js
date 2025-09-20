document.addEventListener('DOMContentLoaded', () => {
    const editCampaignForm = document.getElementById('edit-campaign-form');
    const userRole = sessionStorage.getItem('userRole');
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get('id');

    if (userRole !== 'admin' || !campaignId) {
        window.location.href = 'index.html'; // Redirect non-admins or if no ID
        return;
    }

    // Fetch existing campaign data to populate the form
    const fetchCampaignData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}`);
            if (!response.ok) {
                throw new Error('Campaign not found');
            }
            const campaign = await response.json();
            
            document.getElementById('title').value = campaign.title;
            document.getElementById('description').value = campaign.description;
            document.getElementById('goal_amount').value = campaign.goal_amount;
            document.getElementById('image_url').value = campaign.image_url;
            // Dates need to be formatted as YYYY-MM-DD for the input field
            document.getElementById('start_date').value = new Date(campaign.start_date).toISOString().split('T')[0];
            document.getElementById('end_date').value = new Date(campaign.end_date).toISOString().split('T')[0];
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    editCampaignForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const campaignData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            goal_amount: document.getElementById('goal_amount').value,
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            image_url: document.getElementById('image_url').value
        };

        try {
            const response = await fetch(`http://localhost:3000/api/campaigns/${campaignId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData)
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'campaign-management.html', 1500);
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error updating campaign:', error);
            showToast('An unexpected error occurred. Please try again.', 'error');
        }
    });

    fetchCampaignData();
});