const express = require('express');
const router = express.Router();

// This function receives the database connection pool from your main server.js
module.exports = (pool) => {
    // --- CAMPAIGN ENDPOINTS ---

    // POST /api/campaigns
    router.post('/', async (req, res) => {
        const { title, description, goal_amount, start_date, end_date, image_url, admin_email } = req.body;
        try {
            const [admin] = await pool.query('SELECT user_id FROM users WHERE email = ? AND role = "admin"', [admin_email]);
            if (admin.length === 0) {
                return res.status(403).json({ message: 'Unauthorized: Only admins can create campaigns.' });
            }
            const created_by = admin[0].user_id;

            await pool.query(
                'INSERT INTO campaigns (title, description, goal_amount, start_date, end_date, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, description, goal_amount, start_date, end_date, image_url, created_by]
            );
            res.status(201).json({ message: 'Campaign created successfully!' });
        } catch (error) {
            console.error('Error creating campaign:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/campaigns
    router.get('/', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM campaigns ORDER BY end_date DESC');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/campaigns/:id
    router.get('/:id', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM campaigns WHERE campaign_id = ?', [req.params.id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Campaign not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching single campaign:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // PUT /api/campaigns/:id
    router.put('/:id', async (req, res) => {
        const { title, description, goal_amount, start_date, end_date, image_url } = req.body;
        try {
            await pool.query(
                'UPDATE campaigns SET title = ?, description = ?, goal_amount = ?, start_date = ?, end_date = ?, image_url = ? WHERE campaign_id = ?',
                [title, description, goal_amount, start_date, end_date, image_url, req.params.id]
            );
            res.status(200).json({ message: 'Campaign updated successfully!' });
        } catch (error) {
            console.error('Error updating campaign:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // DELETE /api/campaigns/:id
    router.delete('/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM campaigns WHERE campaign_id = ?', [req.params.id]);
            res.status(200).json({ message: 'Campaign deleted successfully' });
        } catch (error) {
            console.error('Error deleting campaign:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    return router;
};