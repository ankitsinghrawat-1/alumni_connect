// client/js/profile.js
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profile-form');
    const userEmail = localStorage.getItem('loggedInUserEmail');
    const navLinks = document.querySelectorAll('.profile-nav a');
    const pages = document.querySelectorAll('.profile-page');
    const profilePic = document.getElementById('profile-pic');
    const uploadBtn = document.getElementById('upload-btn');
    const pfpUpload = document.getElementById('profile_picture');
    const privacyForm = document.getElementById('privacy-form');
    const passwordForm = document.getElementById('password-form');
    const verificationSection = document.getElementById('verification-status-section');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editModeBtns = document.getElementById('edit-mode-btns');

    let originalProfileData = {};

    const displayMessage = (message, type = 'error', containerId = 'message') => {
        const messageContainer = document.getElementById(containerId);
        if (messageContainer) {
            messageContainer.textContent = message;
            messageContainer.className = `form-message ${type}`;
            setTimeout(() => {
                messageContainer.textContent = '';
                messageContainer.className = 'form-message';
            }, 5000);
        }
    };

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // --- Tab Switching Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.hasAttribute('data-tab')) {
                e.preventDefault();
                const targetTab = e.currentTarget.getAttribute('data-tab');
                window.location.hash = targetTab;
            }
        });
    });

    const handleTabSwitching = () => {
        const hash = window.location.hash.substring(1) || 'edit-profile';
        document.querySelectorAll('.profile-nav a').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.profile-page').forEach(page => page.classList.remove('active'));
        document.querySelector(`.profile-nav a[data-tab="${hash}"]`)?.classList.add('active');
        document.getElementById(hash)?.classList.add('active');
    };
    
    window.addEventListener('hashchange', handleTabSwitching);
    handleTabSwitching();

    // --- Image Upload Preview ---
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => pfpUpload.click());
    }
    if (pfpUpload) {
        pfpUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => { profilePic.src = event.target.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- UI State Management (Read vs. Edit) ---
    const setFormEditable = (isEditable) => {
        const inputs = form.querySelectorAll('input:not([type="file"]), textarea');
        inputs.forEach(input => {
            if (input.id !== 'email') { // Don't make email editable
                input.readOnly = !isEditable;
            }
        });
        editProfileBtn.style.display = isEditable ? 'none' : 'block';
        editModeBtns.style.display = isEditable ? 'flex' : 'none';
        uploadBtn.style.display = isEditable ? 'inline-block' : 'none';
    };

    // --- Data Handling ---
    const renderVerificationStatus = (status) => {
        if (!verificationSection) return;
        let content = '';
        switch(status) {
            case 'verified':
                content = `<h3>Account Status</h3><p class="status-badge status-verified"><i class="fas fa-check-circle"></i> Verified</p>`;
                break;
            case 'pending':
                content = `<h3>Account Status</h3><p class="status-badge status-pending"><i class="fas fa-clock"></i> Verification Request Pending</p>`;
                break;
            default:
                content = `<h3>Account Status</h3><p class="status-badge status-unverified"><i class="fas fa-times-circle"></i> Unverified</p><p>Request verification to get a badge on your profile.</p><button type="button" id="request-verification-btn" class="btn btn-primary">Request Verification</button>`;
                break;
        }
        verificationSection.innerHTML = content;
    };

    const populateProfileData = (data) => {
        originalProfileData = data; // Save original data for cancellation
        const fields = ['full_name', 'bio', 'current_company', 'job_title', 'city', 'linkedin', 'university', 'major', 'graduation_year', 'degree', 'industry', 'skills'];
        fields.forEach(id => {
            const inputElement = document.getElementById(id);
            if (inputElement) {
                inputElement.value = data[id] || '';
            }
        });
        
        renderVerificationStatus(data.verification_status);
        document.getElementById('email').value = data.email || '';

        profilePic.src = data.profile_pic_url ? `http://localhost:3000/${data.profile_pic_url}` : createInitialsAvatar(data.full_name);
        profilePic.onerror = () => { profilePic.src = createInitialsAvatar(data.full_name); };
    };

    const fetchUserProfile = async () => {
        try {
            const data = await window.api.get(`/users/profile`);
            populateProfileData(data);
        } catch (error) {
            displayMessage('An error occurred while fetching profile data.');
        }
    };

    const fetchPrivacySettings = async () => {
        try {
            const settings = await window.api.get(`/users/privacy`);
            document.getElementById('is_profile_public').checked = settings.is_profile_public;
            document.getElementById('is_email_visible').checked = settings.is_email_visible;
            document.getElementById('is_company_visible').checked = settings.is_company_visible;
            document.getElementById('is_location_visible').checked = settings.is_location_visible;
        } catch (error) {
            console.error('Error fetching privacy settings:', error);
        }
    };

    // --- Event Listeners ---
    editProfileBtn.addEventListener('click', () => setFormEditable(true));
    cancelEditBtn.addEventListener('click', () => {
        populateProfileData(originalProfileData); // Revert changes
        setFormEditable(false);
    });

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            try {
                // Now using the unified window.api.put for FormData
                const data = await window.api.put(`/users/profile`, formData);
                showToast(data.message, 'success');
                setFormEditable(false);
                await fetchUserProfile(); // Re-fetch to confirm and get new image URL if changed
            } catch (error) {
                displayMessage(`Error: ${error.message}`);
            }
        });
    }

    if(privacyForm) {
        privacyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const settings = {
                is_profile_public: document.getElementById('is_profile_public').checked,
                is_email_visible: document.getElementById('is_email_visible').checked,
                is_company_visible: document.getElementById('is_company_visible').checked,
                is_location_visible: document.getElementById('is_location_visible').checked
            };
            try {
                const result = await window.api.put(`/users/privacy`, settings);
                displayMessage(result.message, 'success', 'privacy-message');
            } catch (error) {
                displayMessage(error.message, 'error', 'privacy-message');
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                displayMessage('New passwords do not match.', 'error', 'password-message');
                return;
            }
            if (newPassword.length < 8) {
                displayMessage('Password must be at least 8 characters long.', 'error', 'password-message');
                return;
            }

            try {
                const result = await window.api.post('/users/change-password', { currentPassword, newPassword });
                displayMessage(result.message, 'success', 'password-message');
                passwordForm.reset();
            } catch (error) {
                displayMessage(error.message, 'error', 'password-message');
            }
        });
    }

    if(verificationSection) {
        verificationSection.addEventListener('click', async (e) => {
            if (e.target.id === 'request-verification-btn') {
                e.target.disabled = true;
                e.target.textContent = 'Submitting...';
                try {
                    const result = await window.api.post('/users/request-verification', {});
                    showToast(result.message, 'success');
                    renderVerificationStatus('pending');
                } catch (error) {
                    showToast(error.message, 'error');
                     e.target.disabled = false;
                     e.target.textContent = 'Request Verification';
                }
            }
        });
    }

    // Initial load
    setFormEditable(false); // Ensure form is in read-only mode initially
    await fetchUserProfile();
    await fetchPrivacySettings();
});