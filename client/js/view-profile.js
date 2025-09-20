document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    if (!userEmail) {
        document.querySelector('.profile-main-view').innerHTML = '<div class="info-message card">User not found.</div>';
        return;
    }

    // NEW: Function to fetch and render user's blog posts
    const fetchUserBlogs = async (email) => {
        const postsContainer = document.getElementById('user-blog-posts');
        try {
            const response = await fetch(`http://localhost:3000/api/blogs/user/${email}`);
            const blogs = await response.json();

            if (blogs.length > 0) {
                postsContainer.innerHTML = blogs.map(post => `
                    <div class="user-post-item">
                        <h4><a href="blog-post.html?id=${post.blog_id}">${sanitizeHTML(post.title)}</a></h4>
                        <p>${sanitizeHTML(post.content.substring(0, 150))}...</p>
                        <small>Posted on ${new Date(post.created_at).toLocaleDateString()}</small>
                    </div>
                `).join('');
            } else {
                postsContainer.innerHTML = '<p>This user has not posted any blogs yet.</p>';
            }
        } catch (error) {
            console.error('Error fetching user blogs:', error);
            postsContainer.innerHTML = '<p class="info-message error">Could not load blog posts.</p>';
        }
    };

    const fetchUserProfile = async (email) => {
        try {
            const response = await fetch(`http://localhost:3000/api/users/profile/${email}`);
            
            if (response.status === 403) {
                const privateData = await response.json();
                const badgeHTML = privateData.is_verified ? '<span class="verified-badge" title="Verified"><i class="fas fa-check-circle"></i> Verified</span>' : '';
                document.querySelector('.profile-container-view').innerHTML = `
                    <div class="profile-header-view">
                        <img class="profile-pic-view" src="${privateData.profile_pic_url ? `http://localhost:3000/${privateData.profile_pic_url}` : createInitialsAvatar(privateData.full_name)}" alt="Profile Picture" onerror="this.onerror=null; this.src=createInitialsAvatar('${privateData.full_name.replace(/'/g, "\\'")}');">
                        <h2>${privateData.full_name} ${badgeHTML}</h2>
                        <p class="info-message"><i class="fas fa-lock"></i> This profile is private.</p>
                    </div>
                `;
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            const user = await response.json();
            
            document.getElementById('profile-name-view').textContent = user.full_name || 'N/A';
            
            const badgeContainer = document.getElementById('verified-badge-container');
            if (user.is_verified) {
                badgeContainer.innerHTML = '<span class="verified-badge" title="Verified"><i class="fas fa-check-circle"></i> Verified</span>';
            } else {
                badgeContainer.innerHTML = '';
            }

            document.getElementById('profile-subheader').textContent = `${user.job_title || 'N/A'} at ${user.current_company || 'N/A'}`;
            document.getElementById('bio-view').textContent = user.bio || 'No bio available.';
            document.getElementById('university-view').textContent = user.university || 'N/A';
            document.getElementById('graduation-year-view').textContent = user.graduation_year || 'N/A';
            document.getElementById('degree-view').textContent = user.degree || 'N/A';
            document.getElementById('major-view').textContent = user.major || 'N/A';
            document.getElementById('current-company-view').textContent = user.current_company || 'N/A';
            document.getElementById('job-title-view').textContent = user.job_title || 'N/A';
            document.getElementById('city-view').textContent = user.city || 'N/A';
            
            const linkedinLink = document.getElementById('linkedin-view');
            if (user.linkedin) {
                linkedinLink.href = user.linkedin;
                linkedinLink.textContent = user.linkedin;
            } else {
                linkedinLink.textContent = 'N/A';
            }
            
            document.getElementById('email-view').textContent = user.university_email || 'N/A';

            const profilePic = document.getElementById('profile-pic-view');
            profilePic.src = user.profile_pic_url 
                ? `http://localhost:3000/${user.profile_pic_url}` 
                : createInitialsAvatar(user.full_name);

            profilePic.onerror = () => {
                profilePic.onerror = null;
                profilePic.src = createInitialsAvatar(user.full_name);
            };

            // Call the new function to fetch blogs
            fetchUserBlogs(email);

        } catch (error) {
            console.error('Error fetching user profile:', error);
            document.querySelector('.profile-main-view').innerHTML = `<div class="info-message card error">Could not load profile.</div>`;
        }
    };

    fetchUserProfile(userEmail);

    const sendMessageBtn = document.getElementById('send-message-btn');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', async () => {
            const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
            if (!loggedInUserEmail) {
                showToast('Please log in to send a message.', 'info');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender_email: loggedInUserEmail,
                        receiver_email: userEmail,
                        content: `Hello!`
                    })
                });

                if (response.ok) {
                    window.location.href = 'messages.html';
                } else {
                    const result = await response.json();
                    showToast(`Error: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Error starting conversation:', error);
                showToast('Could not start a conversation.', 'error');
            }
        });
    }
});