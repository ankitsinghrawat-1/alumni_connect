// client/js/add-blog.js
document.addEventListener('DOMContentLoaded', () => {
    const addBlogForm = document.getElementById('add-blog-form');
    const messageDiv = document.getElementById('message');

    if (!localStorage.getItem('loggedInUserEmail')) {
        window.location.href = 'login.html';
        return;
    }

    addBlogForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const blogData = {
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
        };

        try {
            const result = await window.api.post('/blogs', blogData);
            showToast(result.message, 'success');
            addBlogForm.reset();
            setTimeout(() => window.location.href = 'my-blogs.html', 1500);
        } catch (error) {
            console.error('Error creating blog post:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });
});