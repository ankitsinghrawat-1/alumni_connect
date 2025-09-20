const express = require('express'); 
const router = express.Router();
const bcrypt = require('bcrypt');

// This function receives the database connection pool from your main server.js
module.exports = (pool) => {

    // --- ADMIN AUTHENTICATION ---

    // Route: POST /api/admin/login
    // Handles the login process specifically for administrators.
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials or not an admin' });
            }
            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (isMatch) {
                res.cookie('loggedIn', 'true', { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000 });
                res.status(200).json({ message: 'Admin login successful', role: user.role, email: user.email });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });


    // --- ADMIN DASHBOARD & STATS ---

    // Route: GET /api/admin/stats
    // Fetches aggregate data for the admin dashboard.
    router.get('/stats', async (req, res) => {
        try {
            const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
            const [events] = await pool.query('SELECT COUNT(*) as count FROM events');
            const [jobs] = await pool.query('SELECT COUNT(*) as count FROM jobs');
            const [applications] = await pool.query('SELECT COUNT(*) as count FROM job_applications');
            res.json({
                totalUsers: users[0].count,
                totalEvents: events[0].count,
                totalJobs: jobs[0].count,
                totalApplications: applications[0].count
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // --- NEW: ANALYTICS ENDPOINTS ---

    // Route: GET /api/admin/analytics/signups
    // Fetches user signup counts grouped by date for a line chart.
    router.get('/analytics/signups', async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM users 
                WHERE created_at >= CURDATE() - INTERVAL 30 DAY
                GROUP BY DATE(created_at) 
                ORDER BY date ASC
            `);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching signup analytics:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // Route: GET /api/admin/analytics/content-overview
    // Fetches total counts of blogs, jobs, and events for a bar chart.
    router.get('/analytics/content-overview', async (req, res) => {
        try {
            const [[blogs]] = await pool.query('SELECT COUNT(*) as count FROM blogs');
            const [[jobs]] = await pool.query('SELECT COUNT(*) as count FROM jobs');
            const [[events]] = await pool.query('SELECT COUNT(*) as count FROM events');
            res.json({
                blogs: blogs.count,
                jobs: jobs.count,
                events: events.count
            });
        } catch (error) {
            console.error('Error fetching content overview analytics:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // --- APPLICATION MANAGEMENT ---

    // Route: GET /api/admin/applications
    // Retrieves all job applications for admin review.
    router.get('/applications', async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT
                    ja.application_id, ja.full_name, ja.user_email, ja.resume_path,
                    ja.application_date, ja.status, ja.admin_notes, j.title AS job_title
                FROM job_applications ja
                JOIN jobs j ON ja.job_id = j.job_id
                ORDER BY ja.application_date DESC
            `);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching applications for admin:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // Route: POST /api/admin/applications/:id/process
    // Updates the status of an application (accepted/rejected) and notifies the user.
    router.post('/applications/:id/process', async (req, res) => {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }
        try {
            const [application] = await pool.query(
                'SELECT ja.user_email, j.title FROM job_applications ja JOIN jobs j ON ja.job_id = j.job_id WHERE ja.application_id = ?',
                [id]
            );

            if (application.length === 0) {
                return res.status(404).json({ message: 'Application not found.' });
            }
            
            const { user_email, title } = application[0];
            
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [user_email]);
            if (user.length > 0) {
                const user_id = user[0].user_id;
                let message = `Your application for "${title}" has been ${status}.`;
                if (admin_notes) {
                    message += ` Note from admin: "${admin_notes}"`;
                }
                await pool.query(
                    'INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)',
                    [user_id, message, '/jobs.html']
                );
            }

            await pool.query(
                'UPDATE job_applications SET status = ?, admin_notes = ? WHERE application_id = ?',
                [status, admin_notes, id]
            );
            
            res.status(200).json({ message: `Application has been ${status}.` });

        } catch (error) {
            console.error('Error processing application:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // --- NEW: Verification Request Management ---
    // Route: GET /api/admin/verification-requests
    // Fetches only users with a 'pending' verification status.
    router.get('/verification-requests', async (req, res) => {
        try {
            const [rows] = await pool.query(
                "SELECT user_id, full_name, email FROM users WHERE verification_status = 'pending'"
            );
            res.json(rows);
        } catch (error) {
            console.error('Error fetching verification requests:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });


// --- USER MANAGEMENT (UPDATED) ---

    // Route: GET /api/admin/users
    // Fetches a list of all users for the admin.
    router.get('/users', async (req, res) => {
        try {
            // Updated to fetch the new verification_status column
            const [rows] = await pool.query('SELECT user_id, full_name, email, role, verification_status FROM users');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching users for admin:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // MODIFIED: This route now handles setting any valid status.
    router.post('/users/:id/update-status', async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        // Validate that the status is one of the allowed ENUM values
        if (!['verified', 'unverified'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }
        
        try {
            await pool.query('UPDATE users SET verification_status = ? WHERE user_id = ?', [status, id]);
            res.status(200).json({ message: 'User verification status updated.' });
        } catch (error) {
            console.error('Error updating user verification status:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // Route: DELETE /api/admin/users/:id
    // Deletes a user account from the system.
    router.delete('/users/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    return router;
};