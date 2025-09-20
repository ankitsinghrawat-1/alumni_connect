document.addEventListener('DOMContentLoaded', () => {
    const editEventForm = document.getElementById('edit-event-form');
    const userRole = sessionStorage.getItem('userRole');
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (userRole !== 'admin' || !eventId) {
        window.location.href = 'index.html';
        return;
    }

    const fetchEventData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
            if (!response.ok) throw new Error('Event not found');
            const event = await response.json();
            
            document.getElementById('title').value = event.title;
            document.getElementById('description').value = event.description;
            document.getElementById('location').value = event.location;
            document.getElementById('organizer').value = event.organizer;
            document.getElementById('date').value = new Date(event.date).toISOString().split('T')[0];
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            location: document.getElementById('location').value,
            organizer: document.getElementById('organizer').value,
        };

        try {
            const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            const result = await response.json();
            if (response.ok) {
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'event-management.html', 1500);
            } else {
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showToast('An unexpected error occurred.', 'error');
        }
    });

    fetchEventData();
});