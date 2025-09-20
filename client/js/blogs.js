// docs/blogs.js
document.addEventListener('DOMContentLoaded', async () => {
    const blogListContainer = document.getElementById('blog-list');

    try {
        const response = await fetch('http://localhost:3000/api/blogs');
        const posts = await response.json();

        if (posts.length > 0) {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('blog-post-summary', 'card');
                
                // Sanitize content before displaying
                const summary = sanitizeHTML(post.content.substring(0, 200) + '...');
                const postDate = new Date(post.created_at).toLocaleDateString();

                postElement.innerHTML = `
                    <h3>${sanitizeHTML(post.title)}</h3>
                    <p class="post-meta">By ${sanitizeHTML(post.author)} on ${postDate}</p>
                    <p>${summary}</p>
                    <a href="blog-post.html?id=${post.blog_id}" class="btn btn-secondary">Read More</a>
                `;
                blogListContainer.appendChild(postElement);
            });
        } else {
            blogListContainer.innerHTML = '<p>No blog posts found.</p>';
        }
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        blogListContainer.innerHTML = '<p>Could not load blog posts.</p>';
    }
});