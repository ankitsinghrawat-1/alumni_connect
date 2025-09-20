const express = require('express');
const router = express.Router();

// This function receives the database connection pool from your main server.js
module.exports = (pool) => {
    // --- MENTORSHIP ENDPOINTS ---

    // POST /api/mentors
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

    // GET /api/mentors
    router.get('/', async (req, res) => {
        try {
            const [mentors] = await pool.query(`
                SELECT u.full_name, u.job_title, u.current_company, u.profile_pic_url, u.email, m.expertise_areas, u.is_verified
                FROM mentors m JOIN users u ON m.user_id = u.user_id WHERE m.is_available = TRUE
            `);
            res.json(mentors);
        } catch (error) {
            console.error('Error fetching mentors:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

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