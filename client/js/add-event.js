document.addEventListener('DOMContentLoaded', () => {
    const addEventForm = document.getElementById('add-event-form');
    const messageDiv = document.getElementById('message');
    const userRole = sessionStorage.getItem('userRole');

    // Role check to prevent non-admins from accessing the page
    if (userRole !== 'admin') {
        window.location.href = 'events.html';
        return;
    }

    if (addEventForm) {
        addEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const eventData = {
                title: document.getElementById('title').value,
                date: document.getElementById('date').value,
                location: document.getElementById('location').value,
                organizer: document.getElementById('organizer').value,
                description: document.getElementById('description').value,
                // Pass admin's email for authorization and notification trigger
                admin_email: sessionStorage.getItem('loggedInUserEmail')
            };

            try {
                const response = await fetch('http://localhost:3000/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                const result = await response.json();
                
                if (response.ok) {
                    messageDiv.textContent = 'Event added successfully!';
                    messageDiv.className = 'form-message success';
                    addEventForm.reset();
                } else {
                    messageDiv.textContent = `Error: ${result.message}`;
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                console.error('Error adding event:', error);
                messageDiv.textContent = 'Failed to add event. Please try again.';
                messageDiv.className = 'form-message error';
            }
        });
    }
});