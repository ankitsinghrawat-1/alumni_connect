// server/server.js
const express = require('express');
const http = require('http'); // Import http module
const { Server } = require("socket.io"); // Import socket.io
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app
const io = new Server(server, { // Attach socket.io to the server
    cors: {
        origin: "http://localhost:3000", // Allow your client's origin
        methods: ["GET", "POST"]
    }
});

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
module.exports = pool; // Export for middleware

// --- FILE UPLOAD (MULTER) SETUP ---
// ... (Your existing multer code remains the same)
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

// --- REAL-TIME CHAT LOGIC (SOCKET.IO) ---
let onlineUsers = [];

const addUser = (userId, socketId) => {
    !onlineUsers.some(user => user.userId === userId) &&
        onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter(user => user.socketId !== socketId);
};

const getUser = (userId) => {
    return onlineUsers.find(user => user.userId === userId);
};

io.on("connection", (socket) => {
    // When a user connects
    console.log("A user connected.");

    // Take userId and socketId from user
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", onlineUsers);
    });

    // Send and get message
    socket.on("sendMessage", ({ senderId, receiverId, content, conversationId }) => {
        const user = getUser(receiverId);
        if (user) {
            io.to(user.socketId).emit("getMessage", {
                sender_id: senderId,
                content,
                created_at: new Date().toISOString(),
                conversation_id: conversationId,
            });
        }
    });
    
    // Typing indicator
    socket.on("typing", ({ receiverId, isTyping }) => {
         const user = getUser(receiverId);
         if(user) {
             io.to(user.socketId).emit("getTyping", { isTyping });
         }
    });

    // When a user disconnects
    socket.on("disconnect", () => {
        console.log("A user disconnected.");
        removeUser(socket.id);
        io.emit("getUsers", onlineUsers);
    });
});


// --- START SERVER ---
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});