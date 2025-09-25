// client/js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('loggedInUserEmail');
    const userRole = localStorage.getItem('userRole');

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // --- Dashboard v2 Elements ---
    const welcomeName = document.getElementById('welcome-name');
    const eventsRsvpdStat = document.getElementById('events-rsvpd-stat');
    const blogsPostedStat = document.getElementById('blogs-posted-stat');
    const applicationsStat = document.getElementById('applications-stat');
    const progressCircle = document.getElementById('profile-progress-circle');
    const progressText = document.getElementById('profile-progress-text');
    const myEventsList = document.getElementById('my-events-list');
    const myApplicationsList = document.getElementById('my-applications-list');
    const alumniSpotlightContainer = document.getElementById('alumni-spotlight-container');

    const fetchUserProfileAndProgress = async () => {
        try {
            const user = await window.api.get('/users/profile');
            
            welcomeName.textContent = `Welcome back, ${user.full_name.split(' ')[0]}!`;
            
            const fields = ['bio', 'current_company', 'job_title', 'city', 'linkedin', 'university', 'major', 'graduation_year', 'degree', 'skills', 'industry'];
            const totalFields = fields.length;
            let completedFields = 0;
            fields.forEach(field => {
                if (user[field]) completedFields++;
            });
            const percentage = Math.round((completedFields / totalFields) * 100);
            
            const radius = progressCircle.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
            const offset = circumference - (percentage / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
            progressText.textContent = `${percentage}%`;

        } catch (error) {
            console.error('Error fetching user profile:', error);
            welcomeName.textContent = 'Welcome back!';
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const stats = await window.api.get('/users/dashboard/stats');
            eventsRsvpdStat.textContent = stats.eventsRsvpd;
            blogsPostedStat.textContent = stats.blogsPosted;
            applicationsStat.textContent = stats.applicationsSubmitted;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchMyRsvps = async () => {
        try {
            const rsvpEventIds = await window.api.get('/events/user/rsvps');
            if (rsvpEventIds && rsvpEventIds.length > 0) {
                const events = await window.api.post('/events/by-ids', { event_ids: rsvpEventIds });
                myEventsList.innerHTML = events.map(event => `
                    <li>
                        <a href="event-details.html?id=${event.event_id}">
                            <strong>${sanitizeHTML(event.title)}</strong>
                            <span>${new Date(event.date).toLocaleDateString()} - ${sanitizeHTML(event.location)}</span>
                        </a>
                    </li>
                `).join('');
            } else {
                myEventsList.innerHTML = '<li class="empty-item">You have not RSVP\'d to any upcoming events yet. <a href="events.html">Find an event!</a></li>';
            }
        } catch (error) {
            console.error('Error fetching your RSVP\'d events:', error);
            myEventsList.innerHTML = '<li class="empty-item error">Could not load your events.</li>';
        }
    };

    const fetchMyApplications = async () => {
        try {
            const applications = await window.api.get('/jobs/my-applications');
            if (applications && applications.length > 0) {
                myApplicationsList.innerHTML = applications.map(app => `
                    <li>
                        <a>
                            <strong>${sanitizeHTML(app.title)}</strong>
                            <span class="app-company">${sanitizeHTML(app.company)}</span>
                            <span class="status-badge status-${app.status}">${sanitizeHTML(app.status)}</span>
                        </a>
                    </li>
                `).join('');
            } else {
                myApplicationsList.innerHTML = '<li class="empty-item">You have not applied to any jobs recently. <a href="jobs.html">Find an opportunity!</a></li>';
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            myApplicationsList.innerHTML = '<li class="empty-item error">Could not load your applications.</li>';
        }
    };
    
    const fetchAlumniSpotlight = async () => {
        try {
            const alumni = await window.api.get(`/users/directory?limit=1`);
            if(alumni && alumni.length > 0) {
                const spotlight = alumni[0];
                const profileLinkEmail = spotlight.email;
                if (profileLinkEmail) {
                    alumniSpotlightContainer.innerHTML = `
                        <div class="spotlight-profile">
                            <img src="${spotlight.profile_pic_url ? `http://localhost:3000/${spotlight.profile_pic_url}` : createInitialsAvatar(spotlight.full_name)}" alt="${spotlight.full_name}">
                            <h4>${sanitizeHTML(spotlight.full_name)}</h4>
                            <p>${sanitizeHTML(spotlight.job_title || '')} at ${sanitizeHTML(spotlight.current_company || '')}</p>
                            <a href="view-profile.html?email=${profileLinkEmail}" class="btn btn-secondary btn-sm">View Profile</a>
                        </div>
                    `;
                } else {
                    alumniSpotlightContainer.innerHTML = '<p>Could not load a featured alumnus at this time.</p>';
                }
            } else {
                 alumniSpotlightContainer.innerHTML = '<p>No featured alumni right now.</p>';
            }
        } catch (error) {
             console.error('Error fetching alumni spotlight:', error);
             alumniSpotlightContainer.innerHTML = '<p>Could not load a featured alumnus at this time.</p>';
        }
    };

    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            tabContents.forEach(content => content.classList.remove('active'));
            target.classList.add('active');
        });
    });

    fetchUserProfileAndProgress();
    fetchDashboardStats();
    fetchMyRsvps();
    fetchMyApplications();
    fetchAlumniSpotlight();
});