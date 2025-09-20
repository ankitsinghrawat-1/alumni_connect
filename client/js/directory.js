// docs/directory.js
document.addEventListener('DOMContentLoaded', async () => {
    const alumniListContainer = document.getElementById('directory-list');
    const searchInput = document.getElementById('directory-search-input');
    const universityFilter = document.getElementById('university-filter');
    const majorFilter = document.getElementById('major-filter');
    const yearFilter = document.getElementById('year-filter');
    const cityFilter = document.getElementById('city-filter');
    const searchButton = document.getElementById('directory-search-button');

    const showLoading = (isLoading) => {
        if (isLoading) {
            alumniListContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        }
    };

    const showEmptyState = () => {
        alumniListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Alumni Found</h3>
                <p>No alumni matched your search criteria. Try broadening your search.</p>
            </div>`;
    };

    const fetchAndRenderAlumni = async () => {
        showLoading(true);

        const query = searchInput.value;
        const university = universityFilter.value;
        const major = majorFilter.value;
        const year = yearFilter.value;
        const city = cityFilter.value;

        const params = new URLSearchParams({
            query,
            university,
            major,
            graduation_year: year,
            city
        });

        try {
            const response = await fetch(`http://localhost:3000/api/users/directory?${params.toString()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const alumni = await response.json();
            
            alumniListContainer.innerHTML = ''; // Clear loading spinner

            if (alumni.length > 0) {
                alumni.forEach(alumnus => {
                    const alumnusItem = document.createElement('div');
                    alumnusItem.classList.add('alumnus-list-item');
                    
                    const profilePicUrl = alumnus.profile_pic_url 
                        ? `http://localhost:3000/${alumnus.profile_pic_url}` 
                        : createInitialsAvatar(alumnus.full_name);

                    alumnusItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${sanitizeHTML(alumnus.full_name)}" class="alumnus-pfp-round">
                        <div class="alumnus-details">
                            <h3>
                                ${sanitizeHTML(alumnus.full_name)}
                                ${alumnus.is_verified ? '<span class="verified-badge-sm" title="Verified"><i class="fas fa-check-circle"></i></span>' : ''}
                            </h3>
                            <p><i class="fas fa-briefcase"></i> ${sanitizeHTML(alumnus.job_title ? alumnus.job_title + ' at ' : '')}${sanitizeHTML(alumnus.current_company || 'N/A')}</p>
                            <p><i class="fas fa-graduation-cap"></i> ${sanitizeHTML(alumnus.major || 'N/A')} | Class of ${sanitizeHTML(alumnus.graduation_year || 'N/A')}</p>
                            <a href="view-profile.html?email=${alumnus.email}" class="btn btn-secondary">View Profile</a>
                        </div>
                    `;
                    alumniListContainer.appendChild(alumnusItem);
                });
            } else {
                showEmptyState();
            }
        } catch (error) {
            console.error('Error fetching alumni:', error);
            alumniListContainer.innerHTML = '<p class="info-message error">Failed to load alumni. Please try again later.</p>';
        }
    };

    fetchAndRenderAlumni();

    if (searchButton) {
        searchButton.addEventListener('click', fetchAndRenderAlumni);
    }

    const filterInputs = [searchInput, universityFilter, majorFilter, yearFilter, cityFilter];
    filterInputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchAndRenderAlumni();
                }
            });
        }
    });
});