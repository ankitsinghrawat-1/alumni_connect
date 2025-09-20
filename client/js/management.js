document.addEventListener('DOMContentLoaded', () => {
    const pageType = document.body.dataset.page;
    const listContainer = document.getElementById('management-list');

    if (!pageType || !listContainer) {
        console.error('Page type or list container not found.');
        return;
    }

    const apiConfig = {
        users: { url: 'admin/users', type: 'user' },
        events: { url: 'events', type: 'event' },
        jobs: { url: 'jobs', type: 'job' },
        campaigns: { url: 'campaigns', type: 'campaign' },
        blogs: { url: 'blogs', type: 'blog' },
        applications: { url: 'admin/applications', type: 'application' }
    };

    const renderers = {
        users: (item) => `
            <tr>
                <td>${item.full_name} ${item.is_verified ? '<span class="verified-badge-sm" title="Verified"><i class="fas fa-check-circle"></i></span>' : ''}</td>
                <td>${item.email}</td>
                <td><span class="role-badge">${item.role}</span></td>
                <td>
                    <button class="btn ${item.is_verified ? 'btn-secondary' : 'btn-primary'} btn-sm verify-btn" data-id="${item.user_id}" data-verified="${item.is_verified ? '1' : '0'}">
                        ${item.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.user_id}" data-type="user">Delete</button>
                </td>
            </tr>`,
        events: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.location}</td>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>
                    <a href="edit-event.html?id=${item.event_id}" class="btn btn-secondary btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.event_id}" data-type="event">Delete</button>
                </td>
            </tr>`,
        jobs: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.company}</td>
                <td>${item.location}</td>
                <td>
                    <a href="edit-job.html?id=${item.job_id}" class="btn btn-secondary btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.job_id}" data-type="job">Delete</button>
                </td>
            </tr>`,
        campaigns: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>$${parseFloat(item.goal_amount).toLocaleString()}</td>
                <td>${new Date(item.end_date).toLocaleDateString()}</td>
                <td>
                    <a href="edit-campaign.html?id=${item.campaign_id}" class="btn btn-secondary btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.campaign_id}" data-type="campaign">Delete</button>
                </td>
            </tr>`,
        blogs: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.author}</td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td>
                    <a href="edit-blog.html?id=${item.blog_id}" class="btn btn-secondary btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.blog_id}" data-type="blog">Delete</button>
                </td>
            </tr>`,
        applications: (item) => `
            <tr>
                <td>${item.full_name}</td>
                <td>${item.job_title}</td>
                <td>${new Date(item.application_date).toLocaleDateString()}</td>
                <td><span class="status-badge status-${item.status}">${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span></td>
                <td>
                    <a href="http://localhost:3000/${item.resume_path}" target="_blank" class="btn btn-secondary btn-sm">View Resume</a>
                    ${item.status === 'pending' ? `
                        <button class="btn btn-success btn-sm decision-btn" data-id="${item.application_id}" data-decision="accepted">Accept</button>
                        <button class="btn btn-danger btn-sm decision-btn" data-id="${item.application_id}" data-decision="rejected">Reject</button>
                    ` : ''}
                </td>
            </tr>`
    };

    const loadData = async () => {
        const config = apiConfig[pageType];
        if (!config) return;

        try {
            const response = await fetch(`http://localhost:3000/api/${config.url}`);
            const items = await response.json();
            
            if (items.length > 0) {
                listContainer.innerHTML = items.map(renderers[pageType]).join('');
            } else {
                listContainer.innerHTML = '<tr><td colspan="5" class="info-message">No items to display.</td></tr>';
            }
        } catch (error) {
            console.error(`Error fetching ${pageType}:`, error);
            listContainer.innerHTML = `<tr><td colspan="5" class="info-message error">Failed to load items.</td></tr>`;
        }
    };

    listContainer.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        
        if (target.classList.contains('delete-btn')) {
            const type = target.dataset.type;
            const configKey = type + 's';
            const config = apiConfig[configKey];

            if (confirm(`Are you sure you want to delete this ${type}?`)) {
                try {
                    let deleteUrl;
                    if (type === 'user') {
                        deleteUrl = `http://localhost:3000/api/admin/users/${id}`;
                    } else {
                        deleteUrl = `http://localhost:3000/api/${config.url}/${id}`;
                    }
                    
                    const response = await fetch(deleteUrl, { 
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: sessionStorage.getItem('loggedInUserEmail') })
                    });

                    if (response.ok) {
                        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`, 'success');
                        loadData();
                    } else {
                        const result = await response.json();
                        showToast(`Error: ${result.message}`, 'error');
                    }
                } catch (error) {
                    console.error(`Error deleting ${type}:`, error);
                    showToast(`An error occurred while deleting the ${type}.`, 'error');
                }
            }
        }

        if (target.classList.contains('verify-btn')) {
            const isVerified = target.dataset.verified === '1';
            try {
                const response = await fetch(`http://localhost:3000/api/admin/users/${id}/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_verified: !isVerified })
                });

                if (response.ok) {
                    showToast('User verification status updated.', 'success');
                    loadData();
                } else {
                    const result = await response.json();
                    showToast(`Error: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Error updating verification status:', error);
                showToast('An error occurred.', 'error');
            }
        }
        
        if (target.classList.contains('decision-btn')) {
            const decision = target.dataset.decision;
            openDecisionModal(id, decision);
        }
    });

    const modal = document.getElementById('decision-modal');
    if (modal) {
        const modalTitle = document.getElementById('modal-title');
        const modalSubmitBtn = document.getElementById('modal-submit-btn');
        const decisionForm = document.getElementById('decision-form');
        const applicationIdInput = document.getElementById('application-id-input');
        const decisionStatusInput = document.getElementById('decision-status-input');
        const adminNotesInput = document.getElementById('admin-notes');
        const closeBtn = document.querySelector('.close-btn');

        function openDecisionModal(id, decision) {
            applicationIdInput.value = id;
            decisionStatusInput.value = decision;
            modalTitle.textContent = `Confirm ${decision.charAt(0).toUpperCase() + decision.slice(1)} Application`;
            modalSubmitBtn.textContent = `Confirm ${decision.charAt(0).toUpperCase() + decision.slice(1)}`;
            modalSubmitBtn.className = `btn btn-full-width ${decision === 'accepted' ? 'btn-success' : 'btn-danger'}`;
            modal.style.display = 'block';
        }

        function closeDecisionModal() {
            modal.style.display = 'none';
            decisionForm.reset();
        }

        closeBtn.onclick = closeDecisionModal;
        window.onclick = function(event) {
            if (event.target == modal) {
                closeDecisionModal();
            }
        }

        decisionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = applicationIdInput.value;
            const status = decisionStatusInput.value;
            const admin_notes = adminNotesInput.value;

            try {
                const response = await fetch(`http://localhost:3000/api/admin/applications/${id}/process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status, admin_notes })
                });

                const result = await response.json();
                if (response.ok) {
                    showToast(result.message, 'success');
                    closeDecisionModal();
                    loadData();
                } else {
                    showToast(`Error: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Error processing application:', error);
                showToast('An error occurred.', 'error');
            }
        });
    }

    loadData();
});