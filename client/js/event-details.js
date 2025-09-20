document.addEventListener('DOMContentLoaded', async () => {
    const eventDetailsContainer = document.getElementById('event-details-container');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (!eventId) {
        eventDetailsContainer.innerHTML = '<p class="info-message error">Event not found.</p>';
        return;
    }

    const fetchEventData = async () => {
        try {
            const [eventRes, attendeesRes, rsvpsRes] = await Promise.all([
                fetch(`http://localhost:3000/api/events/${eventId}`),
                fetch(`http://localhost:3000/api/events/${eventId}/attendees`),
                loggedInUserEmail ? fetch(`http://localhost:3000/api/events/user/rsvps?email=${encodeURIComponent(loggedInUserEmail)}`) : Promise.resolve({ ok: false })
            ]);

            if (!eventRes.ok) {
                throw new Error('Failed to load event details.');
            }

            const event = await eventRes.json();
            const attendees = attendeesRes.ok ? await attendeesRes.json() : [];
            const userRsvps = rsvpsRes.ok ? new Set(await rsvpsRes.json()) : new Set();
            
            const isRsvpd = userRsvps.has(parseInt(event.event_id));

            document.title = event.title;

            let attendeesHTML = '<h4>No attendees yet.</h4>';
            if (attendees.length > 0) {
                attendeesHTML = attendees.map(attendee => {
                    const attendeePic = attendee.profile_pic_url 
                        ? `http://localhost:3000/${attendee.profile_pic_url}` 
                        : createInitialsAvatar(attendee.full_name);
                    return `
                        <a href="view-profile.html?email=${attendee.email}" class="attendee-item">
                            <img src="${attendeePic}" alt="${attendee.full_name}" class="attendee-pic">
                            <span>${attendee.full_name}</span>
                        </a>
                    `;
                }).join('');
            }

            eventDetailsContainer.innerHTML = `
                <div class="event-details-card card">
                    <h1>${event.title}</h1>
                    <p class="event-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${event.date}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                        <span><i class="fas fa-user-tie"></i> Organized by: ${event.organizer}</span>
                    </p>
                    <div class="event-full-description">
                        ${event.description}
                    </div>
                    <div class="event-actions-detail">
                        ${loggedInUserEmail ? 
                            `<button class="btn ${isRsvpd ? 'btn-secondary' : 'btn-primary'} respond-btn">
                                ${isRsvpd ? 'Cancel Response' : 'Respond'}
                             </button>` : '<p><a href="login.html">Log in</a> to respond to this event.</p>'
                        }
                    </div>
                </div>
                <div class="attendees-section card">
                    <h3>Attendees (${attendees.length})</h3>
                    <div class="attendees-list">
                        ${attendeesHTML}
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error fetching event data:', error);
            eventDetailsContainer.innerHTML = '<p class="info-message error">Could not load event details. Please try again.</p>';
        }
    };

    eventDetailsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('respond-btn')) {
            const isRsvpd = e.target.textContent.trim() === 'Cancel Response';
            const method = isRsvpd ? 'DELETE' : 'POST';
            
            try {
                const response = await fetch(`http://localhost:3000/api/events/${eventId}/rsvp`, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loggedInUserEmail })
                });

                if (response.ok) {
                    showToast('Your response has been updated!', 'success');
                    fetchEventData(); 
                } else {
                    const result = await response.json();
                    showToast(`Error: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Error responding to event:', error);
                showToast('An error occurred. Please try again.', 'error');
            }
        }
    });

    fetchEventData();
});