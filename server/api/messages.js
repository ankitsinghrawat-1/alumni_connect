// server/api/messages.js
const express = require('express');
const router = express.Router();

// This function now receives the database pool and the multer upload instance
module.exports = (pool, upload) => {

    // --- MESSAGING ENDPOINTS ---

    // NEW: Endpoint for uploading an image in a chat
    router.post('/upload-image', upload.single('chat_image'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided.' });
        }
        // The file is uploaded, now return its path
        const imageUrl = `uploads/chat/${req.file.filename}`;
        res.status(200).json({ imageUrl: imageUrl });
    });

    // Get all messages for a specific conversation
    router.get('/conversations/:id/messages', async (req, res) => {
        try {
            const [messages] = await pool.query(
                'SELECT m.message_id, m.content, m.created_at, m.message_type, u.user_id as sender_id, u.full_name, u.profile_pic_url FROM messages m JOIN users u ON m.sender_id = u.user_id WHERE m.conversation_id = ? ORDER BY m.created_at ASC',
                [req.params.id]
            );
            res.json(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // Send a new message (text or image URL)
    router.post('/', async (req, res) => {
        // We now expect message_type as well
        const { sender_email, receiver_email, content, message_type = 'text' } = req.body;
        if (!sender_email || !receiver_email || !content) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        try {
            const [sender] = await pool.query('SELECT user_id FROM users WHERE email = ?', [sender_email]);
            const [receiver] = await pool.query('SELECT user_id FROM users WHERE email = ?', [receiver_email]);
            if (sender.length === 0 || receiver.length === 0) {
                return res.status(404).json({ message: 'Sender or receiver not found.' });
            }
            const senderId = sender[0].user_id;
            const receiverId = receiver[0].user_id;

            // Find if a conversation already exists
            const [existingConv] = await pool.query(`
                SELECT conversation_id FROM conversation_participants WHERE user_id = ?
                AND conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = ?)
            `, [senderId, receiverId]);

            let conversationId;
            if (existingConv.length > 0) {
                conversationId = existingConv[0].conversation_id;
            } else {
                // Create a new conversation
                const [newConv] = await pool.query('INSERT INTO conversations () VALUES ()');
                conversationId = newConv.insertId;
                await pool.query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)', [conversationId, senderId, conversationId, receiverId]);
            }
            
            // Insert the message with its type
            await pool.query('INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)', [conversationId, senderId, content, message_type]);
            res.status(201).json({ message: 'Message sent successfully!', conversationId });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    return router;
};