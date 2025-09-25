// client/js/event-details.js
document.addEventListener('DOMContentLoaded', async () => {
    const eventDetailsContainer = document.getElementById('event-details-container');
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    let userRsvps = [];

    if (!eventId) {
        eventDetailsContainer.innerHTML = '<h1>Event not found</h1>';
        return;
    }

    const fetchUserRsvps = async () => {
        if (!loggedInUserEmail) return;
        try {
            userRsvps = await window.api.get('/events/user/rsvps');
        } catch (error) {
            console.error('Could not fetch user RSVPs', error);
        }
    };

    const renderEventDetails = async () => {
        eventDetailsContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        try {
            const [event, attendees] = await Promise.all([
                window.api.get(`/events/${eventId}`),
                window.api.get(`/events/${eventId}/attendees`)
            ]);
            document.title = event.title;

            const eventDate = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            const isRsvpd = userRsvps.includes(event.event_id);
            const rsvpButtonHtml = loggedInUserEmail 
                ? `<button id="rsvp-btn" class="btn ${isRsvpd ? 'btn-secondary' : 'btn-primary'}" data-event-id="${event.event_id}">
                       <i class="fas ${isRsvpd ? 'fa-times-circle' : 'fa-check-circle'}"></i> ${isRsvpd ? 'Cancel RSVP' : 'RSVP Now'}
                   </button>`
                : '<p><a href="login.html">Log in</a> to RSVP for this event.</p>';

            const attendeesHtml = attendees.length > 0 
                ? attendees.map(attendee => `
                    <a href="view-profile.html?email=${attendee.email}" class="attendee-item" title="${sanitizeHTML(attendee.full_name)}">
                        <img src="${attendee.profile_pic_url ? `http://localhost:3000/${attendee.profile_pic_url}` : createInitialsAvatar(attendee.full_name)}" class="attendee-pic" alt="${sanitizeHTML(attendee.full_name)}">
                        <span>${sanitizeHTML(attendee.full_name.split(' ')[0])} ${attendee.verification_status === 'verified' ? '<span class="verified-badge-sm"><i class="fas fa-check-circle"></i></span>' : ''}</span>
                    </a>`).join('')
                : '<p>No one has RSVP\'d yet. Be the first!</p>';

            eventDetailsContainer.innerHTML = `
                <div class="event-details-card card">
                    <h1>${sanitizeHTML(event.title)}</h1>
                    <div class="event-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${eventDate}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${sanitizeHTML(event.location)}</span>
                        <span><i class="fas fa-user-tie"></i> Organized by: ${sanitizeHTML(event.organizer)}</span>
                    </div>
                    <div class="event-full-description">
                        ${sanitizeHTML(event.description).replace(/\n/g, '<br>')}
                    </div>
                    <div class="rsvp-section">
                        <h3>Interested in attending?</h3>
                        ${rsvpButtonHtml}
                    </div>
                    <div class="attendees-section">
                        <h3>Who's Going (${attendees.length})</h3>
                        <div class="attendees-list">
                            ${attendeesHtml}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            eventDetailsContainer.innerHTML = '<h1>Error loading event</h1><p>The event could not be found or there was a server error.</p>';
        }
    };

    eventDetailsContainer.addEventListener('click', async (e) => {
        if (e.target.id === 'rsvp-btn') {
            const button = e.target;
            const eventId = button.dataset.eventId;
            const isRsvpd = userRsvps.includes(parseInt(eventId));

            try {
                if (isRsvpd) {
                    await window.api.del(`/events/${eventId}/rsvp`);
                    showToast('RSVP Canceled', 'info');
                    userRsvps = userRsvps.filter(id => id !== parseInt(eventId));
                } else {
                    await window.api.post(`/events/${eventId}/rsvp`);
                    showToast('RSVP Successful!', 'success');
                    userRsvps.push(parseInt(eventId));
                }
                await renderEventDetails(); // Re-render to update button and attendee list
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        }
    });

    await fetchUserRsvps();
    await renderEventDetails();
});