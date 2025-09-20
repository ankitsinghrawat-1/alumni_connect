const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/authMiddleware');

// This function receives the database pool, upload instance, and notification helper
module.exports = (pool, upload, createGlobalNotification) => {

    // --- JOB & APPLICATION ENDPOINTS ---

    // POST /api/jobs/:job_id/apply
    router.post('/:job_id/apply', upload.single('resume'), async (req, res) => {
        const { job_id } = req.params;
        const { email, full_name, cover_letter } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'A resume file is required.' });
        }
        const resume_path = `uploads/resumes/${req.file.filename}`;
        try {
            await pool.query(
                'INSERT INTO job_applications (job_id, user_email, full_name, resume_path, cover_letter) VALUES (?, ?, ?, ?, ?)',
                [job_id, email, full_name, resume_path, cover_letter]
            );
            res.status(201).json({ message: 'Application submitted successfully!' });
        } catch (error) {
            console.error('Error submitting application:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/jobs/recent
    router.get('/recent', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT job_id, title, company, location FROM jobs ORDER BY created_at DESC LIMIT 3');
            res.json(rows);
        } catch (error)
        {
            console.error('Error fetching recent jobs:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/jobs
    router.get('/', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching all jobs:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/jobs/:id
    router.get('/:id', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM jobs WHERE job_id = ?', [req.params.id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Job not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching single job:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // PUT /api/jobs/:id
    router.put('/:id', async (req, res) => {
        const { title, description, company, location, contact_email } = req.body;
        try {
            await pool.query(
                'UPDATE jobs SET title = ?, description = ?, company = ?, location = ?, contact_email = ? WHERE job_id = ?',
                [title, description, company, location, contact_email, req.params.id]
            );
            res.status(200).json({ message: 'Job updated successfully!' });
        } catch (error) {
            console.error('Error updating job:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // POST /api/jobs
    router.post('/', isAdmin, async (req, res) => {
        const { title, company, location, description, contact_email, admin_email } = req.body;
        try {
            // The admin check is now handled by the middleware, so we can remove it from here.
            await pool.query('INSERT INTO jobs (title, company, location, description, contact_email) VALUES (?, ?, ?, ?, ?)', [title, company, location, description, contact_email]);
            await createGlobalNotification(`A new job has been posted: "${title}" at ${company}.`, '/jobs.html');
            res.status(201).json({ message: 'Job added successfully' });
        } catch (error) {
            console.error('Error adding job:', error);
            res.status(500).json({ message: 'Failed to add job' });
        }
    });

    return router;
};