// server/middleware/authMiddleware.js
const pool = require('../server.js'); // Assuming your pool is exported from server.js, adjust if needed

const isAdmin = async (req, res, next) => {
    // A more robust solution would use sessions or JWTs.
    // This implementation assumes the admin's email is sent for verification.
    const { admin_email } = req.body;
    if (!admin_email) {
        return res.status(401).json({ message: 'Unauthorized: Missing admin credentials.' });
    }

    try {
        const [admin] = await pool.query('SELECT role FROM users WHERE email = ?', [admin_email]);
        if (admin.length === 0 || admin[0].role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required.' });
        }
        next(); // User is an admin, proceed.
    } catch (error) {
        console.error('Admin authorization error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { isAdmin };