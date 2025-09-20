// client/js/mentor-requests.js
document.addEventListener('DOMContentLoaded', () => {
    const requestsListContainer = document.getElementById('requests-list');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    const loadRequests = async () => {
        requestsListContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const response = await fetch(`http://localhost:3000/api/mentors/requests?mentor_email=${encodeURIComponent(loggedInUserEmail)}`);
            const requests = await response.json();

            if (requests.length > 0) {
                requestsListContainer.innerHTML = requests.map(req => `
                    <div class="card request-card">
                        <div class="request-card-header">
                            <img src="${req.profile_pic_url ? `http://localhost:3000/${req.profile_pic_url}` : createInitialsAvatar(req.mentee_name)}" alt="${req.mentee_name}" class="alumnus-pfp-round small">
                            <div>
                                <h4>Request from ${sanitizeHTML(req.mentee_name)}</h4>
                                <small>${new Date(req.created_at).toLocaleString()}</small>
                            </div>
                        </div>
                        <div class="request-card-body">
                            <p><strong>Message:</strong> ${sanitizeHTML(req.request_message) || 'No message provided.'}</p>
                        </div>
                        <div class="request-card-actions">
                            <button class="btn btn-success btn-sm respond-btn" data-id="${req.request_id}" data-action="accepted">Accept</button>
                            <button class="btn btn-danger btn-sm respond-btn" data-id="${req.request_id}" data-action="declined">Decline</button>
                        </div>
                    </div>
                `).join('');
            } else {
                requestsListContainer.innerHTML = `
                    <div class="empty-state card">
                        <i class="fas fa-inbox"></i>
                        <h3>No Pending Requests</h3>
                        <p>You don't have any pending mentorship requests at the moment.</p>
                    </div>`;
            }
        } catch (error) {
            console.error('Error fetching mentorship requests:', error);
            requestsListContainer.innerHTML = '<p class="info-message error">Failed to load requests.</p>';
        }
    };

    requestsListContainer.addEventListener('click', async (e) => {
        const target = e.target.closest('.respond-btn');
        if (target) {
            const requestId = target.dataset.id;
            const action = target.dataset.action;
            
            target.disabled = true;

            try {
                const response = await fetch(`http://localhost:3000/api/mentors/requests/${requestId}/respond`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action })
                });

                const result = await response.json();
                if (response.ok) {
                    showToast(result.message, 'success');
                    loadRequests(); // Refresh the list of requests
                } else {
                    showToast(result.message, 'error');
                    target.disabled = false;
                }
            } catch (error) {
                console.error('Error responding to request:', error);
                showToast('An error occurred. Please try again.', 'error');
                target.disabled = false;
            }
        }
    });

    loadRequests();
});