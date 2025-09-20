document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('my-blogs-list');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    const loadMyBlogs = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/blogs/user/blogs?email=${encodeURIComponent(loggedInUserEmail)}`);
            const blogs = await response.json();
            
            if (blogs.length > 0) {
                listContainer.innerHTML = blogs.map(blog => `
                    <tr>
                        <td>${sanitizeHTML(blog.title)}</td>
                        <td>${new Date(blog.created_at).toLocaleDateString()}</td>
                        <td>
                            <a href="edit-blog.html?id=${blog.blog_id}&user=true" class="btn btn-secondary btn-sm">Edit</a>
                            <button class="btn btn-danger btn-sm delete-btn" data-id="${blog.blog_id}">Delete</button>
                        </td>
                    </tr>`
                ).join('');
            } else {
                listContainer.innerHTML = '<tr><td colspan="3" class="info-message">You have not created any blog posts yet.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching your blogs:', error);
            listContainer.innerHTML = '<tr><td colspan="3" class="info-message error">Failed to load your blog posts.</td></tr>';
        }
    };

    listContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const blogId = e.target.dataset.id;
            
            if (confirm('Are you sure you want to delete this blog post?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/blogs/${blogId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: loggedInUserEmail }) // Send email for authorization
                    });

                    if (response.ok) {
                        showToast('Blog post deleted successfully.', 'success');
                        loadMyBlogs(); // Refresh the list
                    } else {
                        const result = await response.json();
                        showToast(`Error: ${result.message}`, 'error');
                    }
                } catch (error) {
                    console.error('Error deleting blog post:', error);
                    showToast('An error occurred while deleting the post.', 'error');
                }
            }
        }
    });

    loadMyBlogs();
});