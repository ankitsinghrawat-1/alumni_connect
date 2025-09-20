document.addEventListener('DOMContentLoaded', async () => {
    const mentorsListContainer = document.getElementById('mentors-list');
    const loadingMessage = document.getElementById('loading-message');
    const noResultsMessage = document.getElementById('no-results-message');
    const mentorActionArea = document.getElementById('mentor-action-area');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    const checkMentorStatus = async () => {
        if (!loggedInUserEmail || !mentorActionArea) return;

        try {
            const response = await fetch(`http://localhost:3000/api/mentors/status?email=${encodeURIComponent(loggedInUserEmail)}`);
            const data = await response.json();

            if (data.isMentor) {
                mentorActionArea.innerHTML = `<a href="edit-mentor.html" class="btn btn-secondary"><i class="fas fa-edit"></i> Edit Mentor Profile</a>`;
            } else {
                mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
            }
        } catch (error) {
            console.error('Error checking mentor status:', error);
            mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
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
                    const mentorItem = document.createElement('div');
                    mentorItem.classList.add('alumnus-list-item');
                    
                    const profilePicUrl = mentor.profile_pic_url 
                        ? `http://localhost:3000/${mentor.profile_pic_url}` 
                        : createInitialsAvatar(mentor.full_name);

                    mentorItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${sanitizeHTML(mentor.full_name)}" class="alumnus-pfp-round">
                        <div class="alumnus-details">
                            <h3>${sanitizeHTML(mentor.full_name)}</h3>
                            <p><i class="fas fa-briefcase"></i> ${sanitizeHTML(mentor.job_title || 'N/A')} at ${sanitizeHTML(mentor.current_company || 'N/A')}</p>
                            <p><i class="fas fa-star"></i> <strong>Expertise:</strong> ${sanitizeHTML(mentor.expertise_areas || 'N/A')}</p>
                            <a href="view-profile.html?email=${mentor.email}" class="btn btn-secondary">View Profile</a>
                        </div>
                    `;
                    mentorsListContainer.appendChild(mentorItem);
                });
            } else {
                mentorsListContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Mentors Available</h3>
                        <p>Be the first to help guide fellow alumni. Register to become a mentor!</p>
                    </div>`;
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
            mentorsListContainer.innerHTML = '<p class="info-message error">Failed to load mentors.</p>';
        }
    };

    checkMentorStatus();
    fetchAndRenderMentors();
});