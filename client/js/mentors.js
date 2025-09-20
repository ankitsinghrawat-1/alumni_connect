// client/js/mentors.js
document.addEventListener('DOMContentLoaded', async () => {
    const mentorsListContainer = document.getElementById('mentors-list');
    const mentorActionArea = document.getElementById('mentor-action-area');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    
    // Modal elements
    const modal = document.getElementById('request-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const requestForm = document.getElementById('request-form');
    const mentorIdInput = document.getElementById('mentor-id-input');
    const requestMessageInput = document.getElementById('request-message');

    const checkMentorStatus = async () => {
        if (!loggedInUserEmail || !mentorActionArea) return;
        try {
            const response = await fetch(`http://localhost:3000/api/mentors/status?email=${encodeURIComponent(loggedInUserEmail)}`);
            const data = await response.json();
            if (data.isMentor) {
                mentorActionArea.innerHTML = `
                    <a href="mentor-requests.html" class="btn btn-primary"><i class="fas fa-inbox"></i> View Requests</a>
                    <a href="edit-mentor.html" class="btn btn-secondary"><i class="fas fa-edit"></i> Edit Profile</a>
                `;
            } else {
                mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
            }
        } catch (error) {
            console.error('Error checking mentor status:', error);
        }
    };

    const fetchAndRenderMentors = async () => {
        mentorsListContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const response = await fetch('http://localhost:3000/api/mentors');
            const mentors = await response.json();
            mentorsListContainer.innerHTML = '';

            if (mentors.length > 0) {
                mentors.forEach(mentor => {
                    // Don't show the logged-in user in the mentor list
                    if (mentor.email === loggedInUserEmail) return;

                    const mentorItem = document.createElement('div');
                    mentorItem.classList.add('alumnus-list-item');
                    const profilePicUrl = mentor.profile_pic_url ? `http://localhost:3000/${mentor.profile_pic_url}` : createInitialsAvatar(mentor.full_name);

                    mentorItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${sanitizeHTML(mentor.full_name)}" class="alumnus-pfp-round">
                        <div class="alumnus-details">
                            <h3>${sanitizeHTML(mentor.full_name)} ${mentor.verification_status === 'verified' ? '<span class="verified-badge-sm" title="Verified"><i class="fas fa-check-circle"></i></span>' : ''}</h3>
                            <p><i class="fas fa-briefcase"></i> ${sanitizeHTML(mentor.job_title || 'N/A')} at ${sanitizeHTML(mentor.current_company || 'N/A')}</p>
                            <p><i class="fas fa-star"></i> <strong>Expertise:</strong> ${sanitizeHTML(mentor.expertise_areas || 'N/A')}</p>
                            <button class="btn btn-primary request-mentor-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}">Request Mentorship</button>
                        </div>
                    `;
                    mentorsListContainer.appendChild(mentorItem);
                });
            } else {
                mentorsListContainer.innerHTML = `<div class="empty-state card"><i class="fas fa-users"></i><h3>No Mentors Available</h3><p>Be the first to help guide fellow alumni. Register to become a mentor!</p></div>`;
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
            mentorsListContainer.innerHTML = '<p class="info-message error">Failed to load mentors.</p>';
        }
    };

    // --- Modal Logic ---
    function openModal(mentorId, mentorName) {
        modal.style.display = 'block';
        mentorIdInput.value = mentorId;
        document.getElementById('modal-title').textContent = `Send Mentorship Request to ${mentorName}`;
    }

    function closeModal() {
        modal.style.display = 'none';
        requestForm.reset();
    }

    closeModalBtn.onclick = closeModal;
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    mentorsListContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.request-mentor-btn');
        if (target) {
            if (!loggedInUserEmail) {
                showToast('Please log in to request mentorship.', 'info');
                return;
            }
            const mentorId = target.dataset.id;
            const mentorName = target.dataset.name;
            openModal(mentorId, mentorName);
        }
    });

    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mentorId = mentorIdInput.value;
        const message = requestMessageInput.value;

        const submitBtn = document.getElementById('modal-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('http://localhost:3000/api/mentors/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mentor_id: mentorId,
                    mentee_email: loggedInUserEmail,
                    message: message
                })
            });
            const result = await response.json();
            if (response.ok) {
                showToast(result.message, 'success');
                closeModal();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Request';
        }
    });

    checkMentorStatus();
    fetchAndRenderMentors();
});