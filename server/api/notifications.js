const express = require('express');
const router = express.Router();

// This function receives the database connection pool from your main server.js
module.exports = (pool) => {
    // --- NOTIFICATION ENDPOINTS ---

    // GET /api/notifications
    router.get('/', async (req, res) => {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) return res.status(404).json({ message: 'User not found' });
            const [notifications] = await pool.query(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
                [user[0].user_id]
            );
            res.json(notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // POST /api/notifications/mark-read
    router.post('/mark-read', async (req, res) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) return res.status(404).json({ message: 'User not found' });
            await pool.query(
                'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
                [user[0].user_id]
            );
            res.status(200).json({ message: 'Notifications marked as read.' });
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // DELETE /api/notifications/:id
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        const { email } = req.body; // For authorization
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) return res.status(404).json({ message: 'User not found' });

            const [result] = await pool.query(
                'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
                [id, user[0].user_id]
            );

            if (result.affectedRows === 0) {
                return res.status(403).json({ message: 'You are not authorized to delete this notification.' });
            }

            res.status(200).json({ message: 'Notification deleted.' });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    return router;
};