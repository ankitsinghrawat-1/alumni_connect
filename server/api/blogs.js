const express = require('express');
const router = express.Router();

// This function receives the database connection pool from your main server.js
module.exports = (pool) => {
    // --- BLOG ENDPOINTS ---

    // GET /api/blogs
    router.get('/', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT b.blog_id, b.title, b.content, u.full_name AS author, b.created_at FROM blogs b JOIN users u ON b.author_id = u.user_id ORDER BY b.created_at DESC');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/blogs/:id
    router.get('/:id', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT b.blog_id, b.title, b.content, u.full_name AS author, u.email as author_email, b.created_at FROM blogs b JOIN users u ON b.author_id = u.user_id WHERE b.blog_id = ?', [req.params.id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Blog post not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching blog post:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
    
    // GET /api/user/blogs
    router.get('/user/blogs', async (req, res) => {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const author_id = user[0].user_id;
            const [rows] = await pool.query('SELECT blog_id, title, created_at FROM blogs WHERE author_id = ? ORDER BY created_at DESC', [author_id]);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching user blogs:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });


    // POST /api/blogs
    router.post('/', async (req, res) => {
        const { title, content, author_email } = req.body;
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [author_email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'Author not found' });
            }
            const author_id = user[0].user_id;
            await pool.query('INSERT INTO blogs (title, content, author_id) VALUES (?, ?, ?)', [title, content, author_id]);
            res.status(201).json({ message: 'Blog post created successfully' });
        } catch (error) {
            console.error('Error creating blog post:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // PUT /api/blogs/:id
    router.put('/:id', async (req, res) => {
        const { title, content, email } = req.body;
        const blog_id = req.params.id;

        try {
            const [user] = await pool.query('SELECT user_id, role FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const current_user_id = user[0].user_id;
            const user_role = user[0].role;
            
            const [blog] = await pool.query('SELECT author_id FROM blogs WHERE blog_id = ?', [blog_id]);
            if (blog.length === 0) {
                return res.status(404).json({ message: 'Blog post not found' });
            }

            if (blog[0].author_id !== current_user_id && user_role !== 'admin') {
                return res.status(403).json({ message: 'You are not authorized to edit this post.' });
            }

            await pool.query(
                'UPDATE blogs SET title = ?, content = ? WHERE blog_id = ?',
                [title, content, blog_id]
            );
            res.status(200).json({ message: 'Blog post updated successfully!' });
        } catch (error) {
            console.error('Error updating blog post:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // DELETE /api/blogs/:id
    router.delete('/:id', async (req, res) => {
        const { email } = req.body;
        const blog_id = req.params.id;

        try {
            const [user] = await pool.query('SELECT user_id, role FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const current_user_id = user[0].user_id;
            const user_role = user[0].role;

            const [blog] = await pool.query('SELECT author_id FROM blogs WHERE blog_id = ?', [blog_id]);
            if (blog.length === 0) {
                return res.status(200).json({ message: 'Blog post already deleted.' });
            }

            if (blog[0].author_id !== current_user_id && user_role !== 'admin') {
                return res.status(403).json({ message: 'You are not authorized to delete this post.' });
            }

            await pool.query('DELETE FROM blogs WHERE blog_id = ?', [blog_id]);
            res.status(200).json({ message: 'Blog post deleted successfully' });
        } catch (error) {
            console.error('Error deleting blog post:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    return router;
};