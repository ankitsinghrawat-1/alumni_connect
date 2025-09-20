// client/js/admin.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Fetch and Display STATS ---
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

    // --- Fetch and Render CHARTS ---
    const renderCharts = async () => {
        try {
            // Fetch data for both charts simultaneously
            const [signupsRes, contentRes] = await Promise.all([
                fetch('http://localhost:3000/api/admin/analytics/signups'),
                fetch('http://localhost:3000/api/admin/analytics/content-overview')
            ]);

            const signupData = await signupsRes.json();
            const contentData = await contentRes.json();

            // 1. Render User Signups Line Chart
            const userSignupsCtx = document.getElementById('userSignupsChart').getContext('2d');
            const labels = signupData.map(item => new Date(item.date).toLocaleDateString());
            const data = signupData.map(item => item.count);

            new Chart(userSignupsCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'New Users per Day',
                        data: data,
                        backgroundColor: 'rgba(245, 166, 35, 0.2)',
                        borderColor: 'rgba(245, 166, 35, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // 2. Render Content Overview Bar Chart
            const contentOverviewCtx = document.getElementById('contentOverviewChart').getContext('2d');
            new Chart(contentOverviewCtx, {
                type: 'bar',
                data: {
                    labels: ['Blogs', 'Jobs', 'Events'],
                    datasets: [{
                        label: 'Total Content',
                        data: [contentData.blogs, contentData.jobs, contentData.events],
                        backgroundColor: [
                            'rgba(30, 58, 95, 0.7)',
                            'rgba(52, 152, 219, 0.7)',
                            'rgba(46, 204, 113, 0.7)'
                        ],
                        borderColor: [
                            'rgba(30, 58, 95, 1)',
                            'rgba(52, 152, 219, 1)',
                            'rgba(46, 204, 113, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y', // Makes it a horizontal bar chart
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching or rendering analytics charts:', error);
        }
    };

    // --- Initial Load ---
    fetchAdminStats();
    renderCharts();
});