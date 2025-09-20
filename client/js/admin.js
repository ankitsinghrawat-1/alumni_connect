document.addEventListener('DOMContentLoaded', () => {
    const fetchAdminStats = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/stats');
            const stats = await response.json();

            document.getElementById('total-users').textContent = stats.totalUsers;
            document.getElementById('total-events').textContent = stats.totalEvents;
            document.getElementById('total-jobs').textContent = stats.totalJobs;
            document.getElementById('total-applications').textContent = stats.totalApplications;
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        }
    };

    fetchAdminStats();
});