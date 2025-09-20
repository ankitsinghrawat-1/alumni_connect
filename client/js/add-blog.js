document.addEventListener('DOMContentLoaded', () => {
    const addBlogForm = document.getElementById('add-blog-form');
    const messageDiv = document.getElementById('message');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    if (addBlogForm) {
        addBlogForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const blogData = {
                title: document.getElementById('title').value,
                content: document.getElementById('content').value,
                author_email: loggedInUserEmail
            };

            try {
                const response = await fetch('http://localhost:3000/api/blogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(blogData)
                });
                const result = await response.json();
                
                if (response.ok) {
                    messageDiv.textContent = 'Blog post added successfully!';
                    messageDiv.className = 'form-message success';
                    addBlogForm.reset();
                } else {
                    messageDiv.textContent = `Error: ${result.message}`;
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                console.error('Error adding blog post:', error);
                messageDiv.textContent = 'Failed to add blog post. Please try again.';
                messageDiv.className = 'form-message error';
            }
        });
    }
});