const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// This function receives the database pool and multer upload instance
module.exports = (pool, upload) => {

    // --- USER AUTHENTICATION ---

    // POST /api/users/signup
    router.post('/signup', async (req, res) => {
        const { full_name, email, password } = req.body;
        try {
            const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (existingUser.length > 0) {
                return res.status(409).json({ message: 'Email already registered' });
            }
            const password_hash = await bcrypt.hash(password, 10);
            await pool.query('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', [full_name, email, password_hash]);
            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // POST /api/users/login
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (isMatch) {
                res.cookie('loggedIn', 'true', { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000 });
                res.status(200).json({ message: 'Login successful', role: user.role, email: user.email });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // POST /api/users/logout
    router.post('/logout', (req, res) => {
        res.clearCookie('loggedIn');
        res.status(200).json({ message: 'Logout successful' });
    });

    // POST /api/users/change-password
    router.post('/change-password', async (req, res) => {
        const { email, currentPassword, newPassword } = req.body;
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const user = rows[0];
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect current password.' });
            }
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [newPasswordHash, email]);
            res.status(200).json({ message: 'Password updated successfully!' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // POST /api/users/forgot-password
    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        try {
            const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                // We don't want to reveal if an email exists or not
                return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

            await pool.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [resetToken, resetTokenExpiry, email]);
            
            // In a real application, you would send an email with this link
            const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;
            console.log(`Password reset link for ${email}: ${resetLink}`);

            res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

        //Route for a user to request verification
        router.post('/request-verification', async (req, res) => {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email is required.' });
            }
            try {
                const [result] = await pool.query(
                    "UPDATE users SET verification_status = 'pending' WHERE email = ? AND verification_status = 'unverified'",
                    [email]
                );
    
                if (result.affectedRows === 0) {
                    return res.status(400).json({ message: 'Could not submit request. You may have already submitted one or are already verified.' });
                }
    
                res.status(200).json({ message: 'Verification request submitted successfully!' });
            } catch (error) {
                console.error('Error requesting verification:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });


    // --- USER PROFILE & ONBOARDING ---

    // POST /api/users/onboard
    router.post('/onboard', async (req, res) => {
        const { email, university, university_email, city, graduation_year, major, degree, current_company, job_title, bio, linkedin } = req.body;
        try {
            await pool.query(
                'UPDATE users SET university = ?, university_email = ?, city = ?, graduation_year = ?, major = ?, degree = ?, current_company = ?, job_title = ?, bio = ?, linkedin = ?, onboarding_complete = TRUE WHERE email = ?',
                [university, university_email || null, city, graduation_year || null, major, degree, current_company, job_title, bio, linkedin || null, email]
            );
            res.status(200).json({ message: 'Onboarding complete' });
        } catch (error) {
            console.error('Onboarding error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/users/profile/:email
    router.get('/profile/:email', async (req, res) => {
        const { email } = req.params;
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Profile not found' });
            }
            
            const user = rows[0];
            const isOwner = true; // Simplified for now

            if (!user.is_profile_public && !isOwner) {
                return res.status(403).json({ 
                    message: 'This profile is private.',
                    full_name: user.full_name,
                    profile_pic_url: user.profile_pic_url,
                    is_verified: user.is_verified
                });
            }
            
            const publicProfile = { ...user };
            delete publicProfile.password_hash;
            res.json(publicProfile);
        } catch (error) {
            console.error('Error fetching profile:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // PUT /api/users/profile/:email
    router.put('/profile/:email', upload.single('profile_picture'), async (req, res) => {
        const { email } = req.params;
        const {
            full_name, bio, current_company, job_title, city,
            linkedin, university, major, graduation_year, degree
        } = req.body;

        let profile_pic_url = req.file ? `uploads/${req.file.filename}` : undefined;

        try {
            const [userRows] = await pool.query('SELECT profile_pic_url FROM users WHERE email = ?', [email]);
            if (userRows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const user = userRows[0];

            const updateFields = {};
            const addField = (fieldName, value, isOptional = false) => {
                if (value !== undefined) {
                    if (isOptional && (value === '' || value === null)) {
                        updateFields[fieldName] = null;
                    } else {
                        updateFields[fieldName] = value;
                    }
                }
            };

            addField('full_name', full_name);
            addField('bio', bio, true);
            addField('current_company', current_company, true);
            addField('job_title', job_title, true);
            addField('city', city, true);
            addField('linkedin', linkedin, true); // Mark linkedin as optional
            addField('university', university, true);
            addField('major', major, true);
            addField('degree', degree, true);

            if (graduation_year !== undefined) {
                updateFields.graduation_year = (graduation_year === '' || graduation_year === null)
                    ? null
                    : parseInt(graduation_year, 10);
            }

            if (profile_pic_url) {
                updateFields.profile_pic_url = profile_pic_url;
                if (user.profile_pic_url) {
                    const oldPicPath = path.join(__dirname, '..','..', user.profile_pic_url);
                    fs.unlink(oldPicPath).catch(err => console.error("Failed to delete old profile pic:", err));
                }
            }

            if (Object.keys(updateFields).length > 0) {
                await pool.query('UPDATE users SET ? WHERE email = ?', [updateFields, email]);
            }

            res.status(200).json({ message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ message: 'Internal Server Error', sqlMessage: error.sqlMessage });
        }
    });


    // --- PRIVACY & DIRECTORY ---

    // GET /api/users/directory (replaces /api/alumni)
    router.get('/directory', async (req, res) => {
        const { query, university, major, graduation_year, city } = req.query;
        try {
            let sql = 'SELECT * FROM users WHERE is_profile_public = TRUE';
            const params = [];

            if (query) {
                sql += ' AND (full_name LIKE ? OR current_company LIKE ?)';
                params.push(`%${query}%`, `%${query}%`);
            }
            if (university) {
                sql += ' AND university LIKE ?';
                params.push(`%${university}%`);
            }
            if (major) {
                sql += ' AND major LIKE ?';
                params.push(`%${major}%`);
            }
            if (graduation_year) {
                sql += ' AND graduation_year = ?';
                params.push(graduation_year);
            }
            if (city) {
                sql += ' AND city LIKE ?';
                params.push(`%${city}%`);
            }

            const [rows] = await pool.query(sql, params);
            
            const publicProfiles = rows.map(user => {
                return {
                    ...user,
                    email: user.is_email_visible ? user.email : null,
                    current_company: user.is_company_visible ? user.current_company : null,
                    job_title: user.is_company_visible ? user.job_title : null,
                    city: user.is_location_visible ? user.city : null,
                };
            });

            res.json(publicProfiles);
        } catch (error) {
            console.error('Error fetching alumni:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // GET /api/users/privacy/:email
    router.get('/privacy/:email', async (req, res) => {
        const { email } = req.params;
        try {
            const [rows] = await pool.query('SELECT is_profile_public, is_email_visible, is_company_visible, is_location_visible FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching privacy settings:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // PUT /api/users/privacy/:email
    router.put('/privacy/:email', async (req, res) => {
        const { email } = req.params;
        const { is_profile_public, is_email_visible, is_company_visible, is_location_visible } = req.body;
        try {
            await pool.query(
                'UPDATE users SET is_profile_public = ?, is_email_visible = ?, is_company_visible = ?, is_location_visible = ? WHERE email = ?',
                [is_profile_public, is_email_visible, is_company_visible, is_location_visible, email]
            );
            res.status(200).json({ message: 'Privacy settings updated successfully' });
        } catch (error) {
            console.error('Error updating privacy settings:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
    
    // --- MESSAGING ---

    // GET /api/users/conversations
    router.get('/conversations', async (req, res) => {
        const { email } = req.query;
        try {
            const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const userId = user[0].user_id;

            const [conversations] = await pool.query(`
                SELECT 
                    c.conversation_id,
                    u.full_name,
                    u.email AS other_user_email,
                    u.profile_pic_url,
                    (SELECT content FROM messages WHERE conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1) AS last_message
                FROM conversations c
                JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
                JOIN users u ON u.user_id = cp.user_id
                WHERE c.conversation_id IN (
                    SELECT conversation_id FROM conversation_participants WHERE user_id = ?
                ) AND cp.user_id != ?
            `, [userId, userId]);
            
            res.json(conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    return router;
};