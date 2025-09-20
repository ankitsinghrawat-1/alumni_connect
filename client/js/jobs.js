// docs/jobs.js
document.addEventListener('DOMContentLoaded', async () => {
    const jobsGrid = document.getElementById('jobs-grid');
    
    // Show loading spinner initially
    jobsGrid.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const response = await fetch('http://localhost:3000/api/jobs');
        const jobs = await response.json();

        jobsGrid.innerHTML = ''; 

        if (jobs.length > 0) {
            jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.classList.add('job-card');

                const applyUrl = `apply.html?job_id=${job.job_id}&title=${encodeURIComponent(job.title)}`;

                jobCard.innerHTML = `
                    <h3>${sanitizeHTML(job.title)}</h3>
                    <p class="job-company"><i class="fas fa-building"></i> ${sanitizeHTML(job.company)}</p>
                    <p class="job-location"><i class="fas fa-map-marker-alt"></i> ${sanitizeHTML(job.location)}</p>
                    <p class="job-description">${sanitizeHTML(job.description)}</p>
                    <a href="${applyUrl}" class="btn btn-primary apply-btn">Apply Now</a>
                `;
                jobsGrid.appendChild(jobCard);
            });
        } else {
            jobsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No Jobs Available</h3>
                    <p>There are no job opportunities posted at the moment. Check back soon!</p>
                </div>`;
        }
    } catch (error) {
        console.error('Error fetching jobs:', error);
        jobsGrid.innerHTML = '<p class="info-message error">Failed to load jobs. Please try again later.</p>';
    }
});