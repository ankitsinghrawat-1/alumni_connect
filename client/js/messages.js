document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const conversationsList = document.getElementById('conversations-list');
    const chatWelcome = document.getElementById('chat-welcome');
    const chatArea = document.getElementById('chat-area');
    const chatHeader = document.getElementById('chat-header');
    const messagesDisplay = document.getElementById('messages-display');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const searchInput = document.getElementById('user-search-input');
    const searchResultsContainer = document.getElementById('search-results');
    
    // --- State ---
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    let activeConversationId = null;
    let activeReceiverEmail = null;
    let loggedInUserId = null;
    let searchTimeout;

    // --- Initial Checks ---
    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }
    
    // --- Functions ---
    const fetchLoggedInUserId = async () => {
         try {
            const response = await fetch(`http://localhost:3000/api/users/profile/${loggedInUserEmail}`);
            if(response.ok) {
                const user = await response.json();
                loggedInUserId = user.user_id;
            }
        } catch(error) {
            console.error("Could not fetch user ID", error);
        }
    };

    const loadConversations = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/users/conversations?email=${encodeURIComponent(loggedInUserEmail)}`);
            const conversations = await res.json();
            conversationsList.innerHTML = '';
            if (conversations.length > 0) {
                conversations.forEach(conv => {
                    const convElement = document.createElement('div');
                    convElement.className = 'conversation-item';
                    convElement.dataset.id = conv.conversation_id;
                    convElement.dataset.receiverEmail = conv.other_user_email;
                    convElement.innerHTML = `
                        <img src="${conv.profile_pic_url ? `http://localhost:3000/${conv.profile_pic_url}` : createInitialsAvatar(conv.full_name)}" alt="${conv.full_name}" onerror="this.onerror=null; this.src=createInitialsAvatar('${conv.full_name.replace(/'/g, "\\'")}');">
                        <div class="conv-details">
                            <h4>${conv.full_name}</h4>
                            <p>${sanitizeHTML(conv.last_message) || 'No messages yet'}</p>
                        </div>
                    `;
                    conversationsList.appendChild(convElement);
                });
            } else {
                conversationsList.innerHTML = '<p class="info-message">You have no conversations.</p>';
            }
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const loadMessages = async (conversationId) => {
        if(!loggedInUserId) await fetchLoggedInUserId();
        
        try {
            const res = await fetch(`http://localhost:3000/api/messages/conversations/${conversationId}/messages`);
            const messages = await res.json();
            messagesDisplay.innerHTML = '';
            messages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.className = `message-bubble ${msg.sender_id === loggedInUserId ? 'sent' : 'received'}`;
                
                messageElement.innerHTML = `
                    <p class="message-content">${sanitizeHTML(msg.content)}</p>
                    <span class="message-timestamp">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                `;
                messagesDisplay.appendChild(messageElement);
            });
            messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const startConversation = async (receiverEmail) => {
        if (receiverEmail === loggedInUserEmail) {
            showToast("You cannot start a conversation with yourself.", "error");
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_email: loggedInUserEmail,
                    receiver_email: receiverEmail,
                    content: `Hello!` 
                })
            });

            if (response.ok) {
                await loadConversations();
                // Find and click the newly created or existing conversation
                const newConvElement = conversationsList.querySelector(`[data-receiver-email="${receiverEmail}"]`);
                if (newConvElement) {
                    newConvElement.click();
                }
            } else {
                const result = await response.json();
                showToast(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            showToast('Could not start conversation.', 'error');
        }
    };

    // --- Event Listeners ---
    conversationsList.addEventListener('click', (e) => {
        const conversationItem = e.target.closest('.conversation-item');
        if (conversationItem) {
            activeConversationId = conversationItem.dataset.id;
            activeReceiverEmail = conversationItem.dataset.receiverEmail;

            document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
            conversationItem.classList.add('active');

            chatWelcome.style.display = 'none';
            chatArea.style.display = 'flex';
            
            const receiverName = conversationItem.querySelector('h4').textContent;
            chatHeader.innerHTML = `<h3>Chat with ${receiverName}</h3>`;

            loadMessages(activeConversationId);
        }
    });

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (!content || !activeConversationId || !activeReceiverEmail) return;

        try {
            const response = await fetch('http://localhost:3000/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_email: loggedInUserEmail,
                    receiver_email: activeReceiverEmail,
                    content: content
                })
            });
            
            if(response.ok) {
                messageInput.value = '';
                loadMessages(activeConversationId);
                loadConversations();
            } else {
                showToast("Failed to send message.", "error");
            }

        } catch (error) {
            console.error('Failed to send message', error);
            showToast("An error occurred while sending the message.", "error");
        }
    });

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/users/directory?query=${encodeURIComponent(query)}`);
                const users = await res.json();
                
                searchResultsContainer.innerHTML = '';
                if (users.length > 0) {
                    users.forEach(user => {
                        const userElement = document.createElement('div');
                        userElement.className = 'search-result-item';
                        userElement.dataset.email = user.email;
                        userElement.innerHTML = `
                            <img src="${user.profile_pic_url ? `http://localhost:3000/${user.profile_pic_url}` : createInitialsAvatar(user.full_name)}" alt="${user.full_name}">
                            <span>${user.full_name}</span>
                        `;
                        searchResultsContainer.appendChild(userElement);
                    });
                    searchResultsContainer.style.display = 'block';
                } else {
                    searchResultsContainer.innerHTML = '<div class="info-message">No users found.</div>';
                    searchResultsContainer.style.display = 'block';
                }
            } catch (error) {
                console.error('Error searching users:', error);
            }
        }, 300);
    });

    searchResultsContainer.addEventListener('click', (e) => {
        const userItem = e.target.closest('.search-result-item');
        if (userItem) {
            const receiverEmail = userItem.dataset.email;
            startConversation(receiverEmail);
            searchInput.value = '';
            searchResultsContainer.style.display = 'none';
        }
    });

    // --- Initial Load ---
    loadConversations();
    fetchLoggedInUserId();
});