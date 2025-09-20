document.addEventListener('DOMContentLoaded', async () => {
    const campaignsGrid = document.getElementById('campaigns-grid');

    const fetchCampaigns = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/campaigns');
            const campaigns = await response.json();

            campaignsGrid.innerHTML = ''; // Clear existing content

            if (campaigns.length > 0) {
                campaigns.forEach(campaign => {
                    const campaignCard = document.createElement('div');
                    campaignCard.classList.add('campaign-card', 'card');

                    const progress = (campaign.current_amount / campaign.goal_amount) * 100;
                    const imageUrl = campaign.image_url || 'https://via.placeholder.com/400x200?text=Alumni+Cause';

                    campaignCard.innerHTML = `
                        <img src="${imageUrl}" alt="${campaign.title}" class="campaign-image">
                        <div class="campaign-content">
                            <h3>${campaign.title}</h3>
                            <p>${campaign.description.substring(0, 120)}...</p>
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${progress.toFixed(2)}%;"></div>
                            </div>
                            <div class="campaign-stats">
                                <span><b>$${parseFloat(campaign.current_amount).toLocaleString()}</b> raised</span>
                                <span>Goal: $${parseFloat(campaign.goal_amount).toLocaleString()}</span>
                            </div>
                            <a href="#" class="btn btn-primary campaign-cta">Donate Now</a>
                        </div>
                    `;
                    campaignsGrid.appendChild(campaignCard);
                });
            } else {
                campaignsGrid.innerHTML = '<p class="info-message">No active campaigns at this time.</p>';
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            campaignsGrid.innerHTML = '<p class="info-message error">Failed to load campaigns. Please try again later.</p>';
        }
    };

    fetchCampaigns();
});