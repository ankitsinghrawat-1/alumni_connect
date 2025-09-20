// server/api/mentors.js
const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // --- MENTORSHIP ENDPOINTS ---

    // POST /api/mentors (Register as a mentor)
    router.post('/', async (req, res) => {
        const { email, expertise_areas } = req.body;
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const user_id = user[0].user_id;
            const [existingMentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user_id]);
            if (existingMentor.length > 0) {
                return res.status(409).json({ message: 'You are already registered as a mentor.' });
            }
            await pool.query('INSERT INTO mentors (user_id, expertise_areas) VALUES (?, ?)', [user_id, expertise_areas]);
            res.status(201).json({ message: 'Successfully registered as a mentor!' });
        } catch (error) {
            console.error('Error registering mentor:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/mentors (Get all available mentors)
    router.get('/', async (req, res) => {
        try {
            const [mentors] = await pool.query(`
                SELECT u.user_id, u.full_name, u.job_title, u.current_company, u.profile_pic_url, u.email, m.expertise_areas, u.verification_status
                FROM mentors m JOIN users u ON m.user_id = u.user_id WHERE m.is_available = TRUE
            `);
            res.json(mentors);
        } catch (error) {
            console.error('Error fetching mentors:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // --- NEW: MENTORSHIP REQUEST ROUTES ---

    // POST /api/mentors/request
    // A mentee sends a request to a mentor.
    router.post('/request', async (req, res) => {
        const { mentor_id, mentee_email, message } = req.body;
        try {
            const [mentee] = await pool.query('SELECT user_id FROM users WHERE email = ?', [mentee_email]);
            if (mentee.length === 0) {
                return res.status(404).json({ message: 'Mentee user not found' });
            }
            const mentee_user_id = mentee[0].user_id;

            await pool.query(
                'INSERT INTO mentor_requests (mentor_user_id, mentee_user_id, request_message) VALUES (?, ?, ?)',
                [mentor_id, mentee_user_id, message]
            );
            res.status(201).json({ message: 'Mentorship request sent successfully!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'You have already sent a request to this mentor.' });
            }
            console.error('Error sending mentorship request:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/mentors/requests
    // A mentor retrieves their pending requests.
    router.get('/requests', async (req, res) => {
        const { mentor_email } = req.query;
        try {
            const [mentor] = await pool.query('SELECT user_id FROM users WHERE email = ?', [mentor_email]);
            if (mentor.length === 0) {
                return res.status(404).json({ message: 'Mentor user not found' });
            }
            const mentor_user_id = mentor[0].user_id;

            const [requests] = await pool.query(`
                SELECT mr.request_id, mr.request_message, mr.created_at, u.full_name as mentee_name, u.email as mentee_email, u.profile_pic_url 
                FROM mentor_requests mr
                JOIN users u ON mr.mentee_user_id = u.user_id
                WHERE mr.mentor_user_id = ? AND mr.status = 'pending'
            `, [mentor_user_id]);
            res.json(requests);
        } catch (error) {
            console.error('Error fetching mentorship requests:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // POST /api/mentors/requests/:requestId/respond
    // A mentor accepts or declines a request.
    router.post('/requests/:requestId/respond', async (req, res) => {
        const { requestId } = req.params;
        const { action } = req.body; // 'accepted' or 'declined'

        if (!['accepted', 'declined'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action.' });
        }

        try {
            await pool.query('UPDATE mentor_requests SET status = ? WHERE request_id = ?', [action, requestId]);
            res.status(200).json({ message: `Request has been ${action}.` });
        } catch (error) {
            console.error('Error responding to request:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
    
    // --- EXISTING MENTOR PROFILE ROUTES ---
    
    // GET /api/mentors/status
    router.get('/status', async (req, res) => {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.json({ isMentor: false });
            }
            const [mentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user[0].user_id]);
            res.json({ isMentor: mentor.length > 0 });
        } catch (error) {
            console.error('Error checking mentor status:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/mentors/profile
    router.get('/profile', async (req, res) => {
        const { email } = req.query;
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const [mentor] = await pool.query('SELECT expertise_areas FROM mentors WHERE user_id = ?', [user[0].user_id]);
            if (mentor.length === 0) {
                return res.status(404).json({ message: 'Mentor profile not found' });
            }
            res.json(mentor[0]);
        } catch (error) {
            console.error('Error fetching mentor profile:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // PUT /api/mentors/profile
    router.put('/profile', async (req, res) => {
        const { email, expertise_areas } = req.body;
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const [result] = await pool.query('UPDATE mentors SET expertise_areas = ? WHERE user_id = ?', [expertise_areas, user[0].user_id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Mentor profile not found to update.' });
            }
            res.status(200).json({ message: 'Mentor profile updated successfully!' });
        } catch (error) {
            console.error('Error updating mentor profile:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // DELETE /api/mentors/profile
    router.delete('/profile', async (req, res) => {
        const { email } = req.body;
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            await pool.query('DELETE FROM mentors WHERE user_id = ?', [user[0].user_id]);
            res.status(200).json({ message: 'You have been unlisted as a mentor.' });
        } catch (error) {
            console.error('Error unlisting mentor:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    return router;
};