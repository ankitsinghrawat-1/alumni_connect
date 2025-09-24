// client/js/edit-user.js
document.addEventListener('DOMContentLoaded', async () => {
    const editUserForm = document.getElementById('edit-user-form');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    // Security check: ensure it's an admin and a user ID is present
    if (localStorage.getItem('userRole') !== 'admin' || !userId) {
        window.location.href = 'index.html';
        return;
    }

    const fetchUserData = async () => {
        try {
            const user = await window.api.get(`/admin/users/${userId}`);
            // Populate the form with the user's data
            document.getElementById('full_name').value = user.full_name || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('role').value = user.role || 'user';
            document.getElementById('bio').value = user.bio || '';
            document.getElementById('job_title').value = user.job_title || '';
            document.getElementById('current_company').value = user.current_company || '';
        } catch (error) {
            showToast(`Error fetching user data: ${error.message}`, 'error');
        }
    };

    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedUserData = {
            full_name: document.getElementById('full_name').value,
            email: document.getElementById('email').value,
            role: document.getElementById('role').value,
            bio: document.getElementById('bio').value,
            job_title: document.getElementById('job_title').value,
            current_company: document.getElementById('current_company').value,
        };

        try {
            const result = await window.api.put(`/admin/users/${userId}`, updatedUserData);
            showToast(result.message, 'success');
            // Redirect back to the user management page after a short delay
            setTimeout(() => {
                window.location.href = 'user-management.html';
            }, 1500);
        } catch (error) {
            showToast(`Error updating user: ${error.message}`, 'error');
        }
    });

    // Initial fetch of user data when the page loads
    await fetchUserData();
});