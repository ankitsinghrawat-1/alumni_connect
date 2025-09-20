document.addEventListener('DOMContentLoaded', async () => {
    const navLinks = document.getElementById('nav-links');

    if (!navLinks) {
        console.error("Error: Navigation element with ID 'nav-links' was not found.");
        return;
    }

    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
    const userRole = sessionStorage.getItem('userRole');

    const navItems = document.createElement('ul');
    navItems.className = 'nav-links';

    if (loggedInUserEmail) {
        let profilePicUrl = ''; // Will be set after fetch
        let unreadCount = 0;
        let userName = 'Alumni'; // Default name

        // --- LOGGED-IN VIEW (Initial structure) ---
        navItems.innerHTML = `
            <li><a href="about.html">About</a></li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">Connect <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="directory.html">Directory</a></li>
                    <li><a href="mentors.html">Mentors</a></li>
                    <li><a href="events.html">Events</a></li>
                </ul>
            </li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">Resources <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="blogs.html">Blog</a></li>
                    <li><a href="jobs.html">Job Board</a></li>
                    <li><a href="campaigns.html">Campaigns</a></li>
                </ul>
            </li>
            ${userRole === 'admin' ? `<li><a href="admin.html" class="btn btn-secondary">Admin Dashboard</a></li>` : ''}
            <li>
                <a href="messages.html" class="notification-bell" title="Messages">
                    <i class="fas fa-envelope"></i>
                </a>
            </li>
            <li>
                <a href="notifications.html" id="notification-bell" class="notification-bell" title="Notifications">
                    <i class="fas fa-bell"></i>
                </a>
            </li>
            <li class="profile-dropdown nav-dropdown">
                <a href="#" class="dropdown-toggle profile-toggle">
                    <img src="" alt="Profile" class="nav-profile-pic">
                </a>
                <ul class="dropdown-menu">
                    <li><a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
                    <li><a href="profile.html"><i class="fas fa-user-edit"></i> Edit Profile</a></li>
                    <li><a href="my-blogs.html"><i class="fas fa-feather-alt"></i> My Blogs</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button id="theme-toggle-btn" class="theme-toggle-button"><i class="fas fa-moon"></i><span>Toggle Theme</span></button></li>
                    <li><button id="logout-btn" class="logout-button"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
                </ul>
            </li>
        `;
        
        // --- Fetch data and update UI ---
        try {
            const [profileRes, notificationsRes] = await Promise.all([
                fetch(`http://localhost:3000/api/users/profile/${loggedInUserEmail}`),
                fetch(`http://localhost:3000/api/notifications?email=${encodeURIComponent(loggedInUserEmail)}`)
            ]);

            if (profileRes.ok) {
                const user = await profileRes.json();
                userName = user.full_name;
                sessionStorage.setItem('loggedInUserName', userName); // Store name for fallback
                profilePicUrl = user.profile_pic_url 
                    ? `http://localhost:3000/${user.profile_pic_url}` 
                    : createInitialsAvatar(userName);
            } else {
                 profilePicUrl = createInitialsAvatar(userName);
            }

            if (notificationsRes.ok) {
                const notifications = await notificationsRes.json();
                unreadCount = notifications.filter(n => !n.is_read).length;
                if (unreadCount > 0) {
                    const bell = navItems.querySelector('#notification-bell');
                    bell.innerHTML += `<span class="notification-badge">${unreadCount}</span>`;
                }
            }
             // Update the image source and add the error handler
            const navImg = navItems.querySelector('.nav-profile-pic');
            if (navImg) {
                navImg.src = profilePicUrl;
                navImg.onerror = function() {
                    this.onerror = null;
                    this.src = createInitialsAvatar(sessionStorage.getItem('loggedInUserName') || 'Alumni');
                };
            }

        } catch (error) {
            console.error('Could not fetch initial nav data:', error);
            const navImg = navItems.querySelector('.nav-profile-pic');
             if (navImg) {
                navImg.src = createInitialsAvatar(userName);
            }
        }

    } else {
        // --- LOGGED-OUT VIEW ---
        navItems.innerHTML = `
            <li><a href="about.html">About</a></li>
            <li><a href="blogs.html">Blog</a></li>
            <li><a href="login.html" class="btn btn-secondary">Log In</a></li>
            <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
            <li><button id="theme-toggle-btn" class="theme-toggle-button"><i class="fas fa-moon"></i></button></li>
        `;
    }

    navLinks.innerHTML = '';
    navLinks.appendChild(navItems);

    // --- Notification Bell Click Logic ---
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', async (e) => {
            try {
                await fetch('http://localhost:3000/api/notifications/mark-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loggedInUserEmail })
                });
                const badge = notificationBell.querySelector('.notification-badge');
                if (badge) {
                    badge.style.display = 'none';
                }
            } catch (error) {
                console.error('Failed to mark notifications as read:', error);
            }
        });
    }

    // --- Dropdown Logic ---
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const parentDropdown = e.currentTarget.closest('.nav-dropdown');
            
            document.querySelectorAll('.nav-dropdown').forEach(dd => {
                if (dd !== parentDropdown) {
                    dd.classList.remove('dropdown-active');
                }
            });

            parentDropdown.classList.toggle('dropdown-active');
        });
    });
    
    window.addEventListener('click', () => {
        document.querySelectorAll('.nav-dropdown').forEach(dd => {
            dd.classList.remove('dropdown-active');
        });
    });

    // --- Logout Button Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            sessionStorage.removeItem('loggedInUserEmail');
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('loggedInUserName');
            await fetch('http://localhost:3000/api/users/logout', { method: 'POST', credentials: 'include' });
            window.location.href = 'index.html';
        });
    }
    
    // --- Theme Toggle Logic ---
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    if (themeToggleButton) {
        const themeIcon = themeToggleButton.querySelector('i');
        
        // Set initial icon based on theme
        if (document.documentElement.classList.contains('dark-mode')) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
        
        themeToggleButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent dropdown from closing
            document.documentElement.classList.toggle('dark-mode');
            
            let theme = 'light-mode';
            if (document.documentElement.classList.contains('dark-mode')) {
                theme = 'dark-mode';
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            } else {
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            }
            localStorage.setItem('theme', theme);
        });
    }

    // --- Index Page Header Logic ---
    const path = window.location.pathname;
    const isIndexPage = path.endsWith('/') || path.endsWith('/index.html');
    if (isIndexPage) {
        const loggedInHeader = document.getElementById('loggedIn-header');
        const loggedOutHeader = document.getElementById('loggedOut-header');
        if (loggedInHeader && loggedOutHeader) {
            loggedInHeader.style.display = loggedInUserEmail ? 'block' : 'none';
            loggedOutHeader.style.display = loggedInUserEmail ? 'none' : 'block';
        }
    }
});