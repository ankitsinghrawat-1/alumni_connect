const express = require('express');
const router = express.Router();

module.exports = (pool, createGlobalNotification) => {

    // --- EVENT & RSVP ENDPOINTS ---

    // POST /api/events/:id/rsvp
    router.post('/:id/rsvp', async (req, res) => {
        const event_id = req.params.id;
        const { email } = req.body;
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const user_id = user[0].user_id;
            await pool.query('INSERT INTO event_rsvps (event_id, user_id) VALUES (?, ?)', [event_id, user_id]);
            res.status(201).json({ message: 'RSVP successful!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'You have already RSVP\'d to this event.' });
            }
            console.error('Error RSVPing to event:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // DELETE /api/events/:id/rsvp
    router.delete('/:id/rsvp', async (req, res) => {
        const event_id = req.params.id;
        const { email } = req.body;
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const user_id = user[0].user_id;
            await pool.query('DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?', [event_id, user_id]);
            res.status(200).json({ message: 'RSVP canceled.' });
        } catch (error) {
            console.error('Error canceling RSVP:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/events/:id/attendees
    router.get('/:id/attendees', async (req, res) => {
        try {
            const [attendees] = await pool.query(`
                SELECT u.full_name, u.profile_pic_url, u.email, u.is_verified
                FROM users u
                JOIN event_rsvps er ON u.user_id = er.user_id
                WHERE er.event_id = ?
            `, [req.params.id]);
            res.json(attendees);
        } catch (error) {
            console.error('Error fetching attendees:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/events/user/rsvps
    router.get('/user/rsvps', async (req, res) => {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const user_id = user[0].user_id;
            const [rsvps] = await pool.query('SELECT event_id FROM event_rsvps WHERE user_id = ?', [user_id]);
            res.json(rsvps.map(r => r.event_id));
        } catch (error) {
            console.error('Error fetching user RSVPs:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/events/recent
    router.get('/recent', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT event_id, title, date, location, organizer FROM events ORDER BY date DESC LIMIT 3');
            const events = rows.map(row => ({
                ...row,
                date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
            }));
            res.json(events);
        } catch (error) {
            console.error('Error fetching recent events:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // POST /api/events/by-ids
    router.post('/by-ids', async (req, res) => {
        const { event_ids } = req.body;
        if (!event_ids || event_ids.length === 0) {
            return res.json([]);
        }
        try {
            const placeholders = event_ids.map(() => '?').join(',');
            const [rows] = await pool.query(`SELECT event_id, title, date, location FROM events WHERE event_id IN (${placeholders}) ORDER BY date DESC`, event_ids);
            const events = rows.map(row => ({
                ...row,
                date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
            }));
            res.json(events);
        } catch (error) {
            console.error('Error fetching events by IDs:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/events
    router.get('/', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT event_id, title, description, date, location, organizer FROM events ORDER BY date DESC');
            const events = rows.map(row => ({
                ...row,
                date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
            }));
            res.json(events);
        } catch (error) {
            console.error('Error fetching all events:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/events/:id
    router.get('/:id', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Event not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching single event:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // PUT /api/events/:id
    router.put('/:id', async (req, res) => {
        const { title, description, date, location, organizer } = req.body;
        try {
            await pool.query(
                'UPDATE events SET title = ?, description = ?, date = ?, location = ?, organizer = ? WHERE event_id = ?',
                [title, description, date, location, organizer, req.params.id]
            );
            res.status(200).json({ message: 'Event updated successfully!' });
        } catch (error) {
            console.error('Error updating event:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // DELETE /api/events/:id
    router.delete('/:id', async (req, res) => {
        try {
            const eventId = req.params.id;
            const [eventCheck] = await pool.query('SELECT event_id FROM events WHERE event_id = ?', [eventId]);
            if (eventCheck.length === 0) {
                return res.status(404).json({ message: 'Event not found.' });
            }
            await pool.query('DELETE FROM event_rsvps WHERE event_id = ?', [eventId]);
            await pool.query('DELETE FROM events WHERE event_id = ?', [eventId]);
            res.status(200).json({ message: 'Event and all related RSVPs deleted successfully.' });
        } catch (error) {
            console.error('Error deleting event:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // POST /api/events
    router.post('/', async (req, res) => {
        const { title, date, location, organizer, description, admin_email } = req.body;
        try {
            const [admin] = await pool.query('SELECT user_id FROM users WHERE email = ? AND role = "admin"', [admin_email]);
            if (admin.length === 0) {
                return res.status(403).json({ message: 'Unauthorized: Only admins can create events.' });
            }
            await pool.query('INSERT INTO events (title, date, location, organizer, description) VALUES (?, ?, ?, ?, ?)', [title, date, location, organizer, description]);
            await createGlobalNotification(`A new event has been scheduled: "${title}" on ${new Date(date).toLocaleDateString()}.`, '/events.html');
            res.status(201).json({ message: 'Event added successfully' });
        } catch (error) {
            console.error('Error adding event:', error);
            res.status(500).json({ message: 'Failed to add event' });
        }
    });

    return router;
};