// server/server.js
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE SETUP ---
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// --- SERVE STATIC FILES ---
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- DATABASE CONNECTION POOL ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ankit@54328',
    database: process.env.DB_NAME || 'alumni_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// Export the pool for use in middleware
module.exports = pool;


// --- FILE UPLOAD (MULTER) SETUP ---
const uploadDir = path.join(__dirname, '..', 'uploads');
const resumeDir = path.join(__dirname, '..', 'uploads', 'resumes');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
fs.mkdir(resumeDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'resume') {
            cb(null, resumeDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const userIdentifier = req.body.email ? req.body.email.split('@')[0] : 'user';
        cb(null, `${file.fieldname}-${userIdentifier}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "profile_picture") {
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
                cb(null, true);
            } else {
                cb(new Error('Only .jpg, .png, and .gif formats are allowed for profile pictures.'));
            }
        } else if (file.fieldname === "resume") {
            if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                cb(null, true);
            } else {
                cb(new Error('Only .pdf, .doc, and .docx formats are allowed for resumes.'));
            }
        } else {
            cb(null, false);
        }
    }
});


// --- HELPER FUNCTIONS ---
const createGlobalNotification = async (message, link) => {
    try {
        const [users] = await pool.query('SELECT user_id FROM users WHERE role != "admin"');
        const notificationPromises = users.map(user => {
            return pool.query(
                'INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)',
                [user.user_id, message, link]
            );
        });
        await Promise.all(notificationPromises);
    } catch (error) {
        console.error('Error creating global notification:', error);
    }
};


// --- API ROUTERS ---
const adminRoutes = require('./api/admin')(pool);
const blogRoutes = require('./api/blogs')(pool);
const campaignRoutes = require('./api/campaigns')(pool);
const eventRoutes = require('./api/events')(pool, createGlobalNotification);
const jobRoutes = require('./api/jobs')(pool, upload, createGlobalNotification);
const mentorRoutes = require('./api/mentors')(pool);
const messageRoutes = require('./api/messages')(pool);
const notificationRoutes = require('./api/notifications')(pool);
const userRoutes = require('./api/users')(pool, upload);

app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});