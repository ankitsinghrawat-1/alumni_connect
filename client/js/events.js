// docs/events.js
document.addEventListener('DOMContentLoaded', async () => {
    const eventsList = document.getElementById('events-list');

    // Show loading spinner initially
    eventsList.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const response = await fetch('http://localhost:3000/api/events');
        const events = await response.json();

        eventsList.innerHTML = ''; // Clear the spinner

        if (events.length > 0) {
            events.forEach(event => {
                const eventCard = document.createElement('a');
                eventCard.href = `event-details.html?id=${event.event_id}`;
                eventCard.classList.add('event-card', 'card', 'event-card-link'); 
                
                const summary = sanitizeHTML(event.description.substring(0, 100) + (event.description.length > 100 ? '...' : ''));

                eventCard.innerHTML = `
                    <h3>${sanitizeHTML(event.title)}</h3>
                    <p><i class="fas fa-calendar-alt"></i> ${sanitizeHTML(event.date)}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${sanitizeHTML(event.location)}</p>
                    <p class="event-summary">${summary}</p>
                    <span class="view-details-link">View Details &rarr;</span>
                `;
                eventsList.appendChild(eventCard);
            });
        } else {
            eventsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Events Scheduled</h3>
                    <p>There are currently no upcoming events. Please check back later!</p>
                </div>`;
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        eventsList.innerHTML = '<p class="info-message error">Failed to load events. Please try again later.</p>';
    }
});