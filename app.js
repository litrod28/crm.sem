// CRM Portal SEM - Lead Management System - FIXED VERSION
let currentUser = null;
let leads = [];
let followups = [];
let users = [];
let supabaseClient = null;

// User data
const localUsers = [
    {id: 1, username: "sushant", password: "sush@123", role: "user", name: "Sushant"},
    {id: 2, username: "gaurav", password: "gaurav@123", role: "user", name: "Gaurav"},
    {id: 3, username: "yash", password: "yash@123", role: "user", name: "Yash"},
    {id: 4, username: "shikha", password: "shikha@123", role: "user", name: "Shikha"},
    {id: 5, username: "tripti", password: "tripti@123", role: "user", name: "Tripti"},
    {id: 6, username: "anshi", password: "anshi@123", role: "user", name: "Anshi"},
    {id: 7, username: "SEM", password: "semops@123", role: "sem", name: "SEM Operations"},
    {id: 8, username: "developer", password: "dev041228", role: "admin", name: "Developer"}
];

// Initialize Supabase
function initSupabase() {
    try {
        if (window.supabase) {
            supabaseClient = window.supabase.createClient(
                'https://drbbxxanlnfttxrkuqzn.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmJ4eGFubG5mdHR4cmt1cXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzQ0OTcsImV4cCI6MjA2OTA1MDQ5N30.ZyWy-ru4bs6Wf0NUGTrA9fVeVbgv1rvVwf9YJ70MuSI'
            );
            console.log('Supabase initialized');
        }
    } catch (error) {
        console.log('Supabase not available, using local data');
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('loginError');
    
    console.log('Attempting login for:', username);
    
    // Clear previous errors
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
    
    // Validate inputs
    if (!username || !password) {
        showError('Please enter both username and password');
        return false;
    }
    
    // Find user
    const user = localUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        console.log('Login successful for:', user.name);
        currentUser = user;
        
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        // Load sample data
        loadSampleData();
        
        // Show dashboard
        showDashboard();
        
    } else {
        console.log('Login failed');
        showError('Invalid username or password');
    }
    
    return false;
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000);
}

// Load sample data
function loadSampleData() {
    leads = [
        {
            id: 1,
            event_name: "Tech Conference 2025",
            organising_society: "Tech Society",
            contact_person: "John Doe",
            phone_no: "9876543210",
            email: "john@tech.com",
            lead_stage: "HOT",
            remarks: "Interested in premium package",
            followup_date: "2025-08-12",
            added_by: currentUser.username,
            assigned_to: currentUser.username,
            created_at: "2025-08-11T10:30:00.000Z"
        }
    ];
    
    followups = [
        {
            id: 1,
            lead_id: 1,
            followup_date: "2025-08-12",
            status: "pending",
            added_by: currentUser.username,
            remarks: "Follow up for pricing discussion",
            created_at: "2025-08-11T10:30:00.000Z"
        }
    ];
    
    users = localUsers;
}

// Show dashboard
function showDashboard() {
    console.log('Showing dashboard for:', currentUser.name);
    
    // Hide login page
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('loginPage').style.display = 'none';
    
    // Show dashboard
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('dashboard').style.display = 'block';
    
    // Set current user name
    document.getElementById('currentUser').textContent = currentUser.name;
    
    // Setup navigation
    setupNavigation();
    
    // Show first tab
    showTab('userTab');
    
    // Show welcome popup
    showWelcomePopup();
    
    // Update stats
    updateDashboardStats();
}

// Show welcome popup
function showWelcomePopup() {
    const popup = document.getElementById('welcomePopup');
    const userName = document.getElementById('welcomeUserName');
    
    if (popup && userName) {
        userName.textContent = currentUser.name;
        popup.classList.remove('hidden');
        popup.style.display = 'flex';
        
        setTimeout(() => {
            popup.classList.add('hidden');
            popup.style.display = 'none';
        }, 1000);
    }
}

// Setup navigation based on user role
function setupNavigation() {
    const navTabs = document.getElementById('navTabs');
    navTabs.innerHTML = '';
    
    let tabs = [];
    
    if (currentUser.role === 'user') {
        tabs = [
            {id: 'userTab', label: 'Dashboard', icon: '📊'},
            {id: 'addLeadTab', label: 'Add Lead', icon: '➕'},
            {id: 'leadsTab', label: 'My Leads', icon: '📝'},
            {id: 'followupTab', label: 'Follow-ups', icon: '📅'}
        ];
    } else if (currentUser.role === 'sem') {
        tabs = [
            {id: 'userTab', label: 'Dashboard', icon: '📊'},
            {id: 'addLeadTab', label: 'Add & Assign Lead', icon: '➕'},
            {id: 'leadsTab', label: 'All Leads', icon: '📝'},
            {id: 'reportTab', label: 'Report', icon: '📈'},
            {id: 'followupTab', label: 'Follow-ups', icon: '📅'}
        ];
        
        // Show assign to field for SEM
        document.getElementById('assignToRow').style.display = 'block';
        populateAssignToDropdown();
        
        // Update leads tab title and show filters
        document.getElementById('leadsTabTitle').textContent = 'All Leads';
        document.getElementById('leadsFilters').style.display = 'flex';
        populateUserFilter();
        
    } else if (currentUser.role === 'admin') {
        tabs = [
            {id: 'userTab', label: 'Dashboard', icon: '📊'},
            {id: 'addLeadTab', label: 'Add & Assign Lead', icon: '➕'},
            {id: 'leadsTab', label: 'All Leads', icon: '📝'},
            {id: 'reportTab', label: 'Report', icon: '📈'},
            {id: 'followupTab', label: 'Follow-ups', icon: '📅'},
            {id: 'adminTab', label: 'Admin Panel', icon: '⚙️'}
        ];
        
        // Show assign to field for admin
        document.getElementById('assignToRow').style.display = 'block';
        populateAssignToDropdown();
        
        // Update leads tab title and show filters
        document.getElementById('leadsTabTitle').textContent = 'All Leads';
        document.getElementById('leadsFilters').style.display = 'flex';
        populateUserFilter();
    }
    
    // Create tab buttons
    tabs.forEach(tab => {
        const button = document.createElement('button');
        button.className = 'nav-tab';
        button.setAttribute('data-tab', tab.id);
        button.innerHTML = `${tab.icon} ${tab.label}`;
        button.onclick = () => showTab(tab.id);
        navTabs.appendChild(button);
    });
    
    // Set first tab as active
    if (tabs.length > 0) {
        navTabs.querySelector('.nav-tab').classList.add('active');
    }
}

// Show tab
function showTab(tabId) {
    console.log('Showing tab:', tabId);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Load tab content
    loadTabContent(tabId);
}

// Load tab content
function loadTabContent(tabId) {
    switch(tabId) {
        case 'userTab':
            updateDashboardStats();
            loadDashboardFollowups();
            break;
        case 'leadsTab':
            renderLeadsTable();
            break;
        case 'followupTab':
            loadFollowupsTab();
            break;
        case 'reportTab':
            loadReport();
            break;
        case 'adminTab':
            loadAdminPanel();
            break;
    }
}

// Update dashboard stats
function updateDashboardStats() {
    const userLeads = leads.filter(lead => 
        currentUser.role === 'user' ? 
        (lead.added_by === currentUser.username) :
        true
    );
    
    const today = new Date().toISOString().split('T')[0];
    const todayFollowups = followups.filter(followup => {
        const followupUser = currentUser.role === 'user' ? 
            followup.added_by === currentUser.username : true;
        return followup.followup_date === today && followupUser && followup.status === 'completed';
    });
    
    document.getElementById('userLeadsCount').textContent = userLeads.length;
    document.getElementById('userFollowupsToday').textContent = todayFollowups.length;
}

// Load dashboard followups
function loadDashboardFollowups() {
    const today = new Date().toISOString().split('T')[0];
    
    const userFollowups = followups.filter(followup => 
        currentUser.role === 'user' ? 
        followup.added_by === currentUser.username : 
        true
    );
    
    const overdueFollowups = userFollowups.filter(followup => 
        followup.followup_date < today && followup.status === 'pending'
    );
    
    const todayFollowups = userFollowups.filter(followup => 
        followup.followup_date === today && followup.status === 'pending'
    );
    
    renderFollowupList('overdueFollowups', overdueFollowups, 'No overdue follow-ups');
    renderFollowupList('todayFollowups', todayFollowups, 'No follow-ups for today');
}

// Render followup list
function renderFollowupList(containerId, followups, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (followups.length === 0) {
        container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
        return;
    }
    
    container.innerHTML = followups.map(followup => {
        const lead = leads.find(l => l.id === followup.lead_id);
        return `
            <div class="followup-item">
                <div class="followup-header">
                    <div class="followup-date">${formatDate(followup.followup_date)}</div>
                    <div class="followup-status ${followup.status}">${followup.status.toUpperCase()}</div>
                </div>
                <div class="followup-details">
                    <strong>${lead?.event_name || 'Unknown Event'}</strong><br>
                    ${followup.remarks || 'No remarks'}
                </div>
                <div class="followup-actions">
                    <button class="btn btn--sm btn--primary" onclick="markFollowupComplete(${followup.id})">
                        Mark Complete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Handle add lead form
function handleAddLead(event) {
    event.preventDefault();
    console.log('Adding lead...');
    
    const formData = {
        id: Date.now(),
        event_name: document.getElementById('eventName').value,
        organising_society: document.getElementById('organisingSociety').value,
        contact_person: document.getElementById('contactPerson').value,
        phone_no: document.getElementById('phoneNo').value,
        email: document.getElementById('email').value,
        lead_stage: document.getElementById('leadStage').value,
        remarks: document.getElementById('remarks').value,
        followup_date: document.getElementById('followupDate').value,
        added_by: currentUser.username,
        assigned_to: currentUser.role === 'user' ? 
            currentUser.username : 
            document.getElementById('assignTo')?.value || currentUser.username,
        created_at: new Date().toISOString()
    };
    
    leads.unshift(formData);
    
    // Add follow-up if date is set
    if (formData.followup_date) {
        const followupData = {
            id: Date.now() + 1,
            lead_id: formData.id,
            followup_date: formData.followup_date,
            status: 'pending',
            added_by: formData.added_by,
            remarks: 'Initial follow-up',
            created_at: new Date().toISOString()
        };
        followups.unshift(followupData);
    }
    
    // Reset form and show success
    document.getElementById('addLeadForm').reset();
    setTodayDate();
    showSuccess('Lead added successfully!');
    
    // Refresh stats
    updateDashboardStats();
    
    return false;
}

// Render leads table
function renderLeadsTable() {
    let leadsToShow = [...leads];
    
    // Filter based on user role
    if (currentUser.role === 'user') {
        leadsToShow = leadsToShow.filter(lead => 
            lead.added_by === currentUser.username
        );
    }
    
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    
    if (leadsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">No leads found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = leadsToShow.map(lead => `
        <tr>
            <td>${lead.event_name}</td>
            <td>${lead.organising_society}</td>
            <td>${lead.contact_person}</td>
            <td>${lead.phone_no}</td>
            <td>${lead.email}</td>
            <td><span class="lead-stage ${lead.lead_stage}">${lead.lead_stage}</span></td>
            <td>${lead.added_by}</td>
            <td>${formatDateTime(lead.created_at)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn--sm btn--outline" onclick="viewLead(${lead.id})">View</button>
                    <button class="btn btn--sm btn--primary" onclick="showAddFollowupModal(${lead.id})">Follow-up</button>
                    ${currentUser.role === 'admin' ? 
                        `<button class="btn btn--sm btn--error" onclick="deleteLead(${lead.id})">Delete</button>` : 
                        ''
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Other functions...
function populateAssignToDropdown() {
    const assignTo = document.getElementById('assignTo');
    if (!assignTo) return;
    
    const usersList = users.filter(u => u.role === 'user');
    assignTo.innerHTML = usersList.map(user => 
        `<option value="${user.username}">${user.name}</option>`
    ).join('');
}

function populateUserFilter() {
    const userFilter = document.getElementById('userFilter');
    if (!userFilter) return;
    
    const usersList = users.filter(u => u.role === 'user');
    userFilter.innerHTML = '<option value="">All Users</option>' + 
        usersList.map(user => 
            `<option value="${user.username}">${user.name}</option>`
        ).join('');
}

function loadFollowupsTab() {
    const today = new Date().toISOString().split('T')[0];
    
    let userFollowups = followups;
    if (currentUser.role === 'user') {
        userFollowups = followups.filter(f => f.added_by === currentUser.username);
    }
    
    const todayFollowups = userFollowups.filter(f => 
        f.followup_date === today && f.status === 'pending'
    );
    
    const overdueFollowups = userFollowups.filter(f => 
        f.followup_date < today && f.status === 'pending'
    );
    
    renderFollowupsList('todayFollowupsList', todayFollowups);
    renderFollowupsList('overdueFollowupsList', overdueFollowups);
}

function renderFollowupsList(containerId, followups) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (followups.length === 0) {
        container.innerHTML = '<div class="empty-state">No follow-ups</div>';
        return;
    }
    
    container.innerHTML = followups.map(followup => {
        const lead = leads.find(l => l.id === followup.lead_id);
        return `
            <div class="followup-item">
                <div class="followup-header">
                    <div class="followup-date">${formatDate(followup.followup_date)}</div>
                    <div class="followup-actions">
                        <button class="btn btn--sm btn--primary" onclick="markFollowupComplete(${followup.id})">
                            Mark Complete
                        </button>
                    </div>
                </div>
                <div class="followup-details">
                    <strong>${lead?.event_name || 'Unknown Event'}</strong><br>
                    Contact: ${lead?.contact_person || 'N/A'}<br>
                    ${followup.remarks || 'No remarks'}
                </div>
            </div>
        `;
    }).join('');
}

function loadReport() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;
    generateReport();
}

function generateReport() {
    const reportDate = document.getElementById('reportDate').value;
    const usersList = users.filter(u => u.role === 'user');
    
    const reportData = usersList.map(user => {
        const userLeads = leads.filter(lead => {
            const leadDate = lead.created_at.split('T')[0];
            return lead.added_by === user.username && 
                   (reportDate ? leadDate === reportDate : true);
        });
        
        const userFollowups = followups.filter(followup => {
            const followupDate = followup.created_at?.split('T')[0];
            return followup.added_by === user.username && 
                   followup.status === 'completed' &&
                   (reportDate ? followupDate === reportDate : true);
        });
        
        const successRate = userLeads.length > 0 ? 
            Math.round((userFollowups.length / userLeads.length) * 100) : 0;
        
        return {
            user: user.name,
            leadsRegistered: userLeads.length,
            followupsCompleted: userFollowups.length,
            successRate: successRate + '%'
        };
    });
    
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = reportData.map(row => `
        <tr>
            <td>${row.user}</td>
            <td>${row.leadsRegistered}</td>
            <td>${row.followupsCompleted}</td>
            <td>${row.successRate}</td>
        </tr>
    `).join('');
}

function loadAdminPanel() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    container.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name">${user.name} (${user.username})</div>
                <div class="user-role">${user.role}</div>
            </div>
            <div class="user-actions">
                <button class="btn btn--sm btn--outline" onclick="showSuccess('Edit user functionality coming soon!')">Edit</button>
                ${user.id !== currentUser.id ? 
                    `<button class="btn btn--sm btn--error" onclick="deleteUser(${user.id})">Delete</button>` : 
                    ''
                }
            </div>
        </div>
    `).join('');
}

// Utility functions
function logout() {
    currentUser = null;
    leads = [];
    followups = [];
    users = [];
    
    document.getElementById('loginForm').reset();
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('dashboard').style.display = 'none';
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const followupDateInputs = document.querySelectorAll('input[type="date"]');
    followupDateInputs.forEach(input => {
        if (input.id === 'followupDate' || input.id === 'followupDateModal') {
            input.value = today;
        }
    });
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function markFollowupComplete(followupId) {
    const followup = followups.find(f => f.id === followupId);
    if (followup) {
        followup.status = 'completed';
        followup.completed_at = new Date().toISOString();
        showSuccess('Follow-up marked as complete!');
        loadDashboardFollowups();
        loadFollowupsTab();
        updateDashboardStats();
    }
}

function viewLead(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    const leadDetailsBody = document.getElementById('leadDetailsBody');
    leadDetailsBody.innerHTML = `
        <div class="lead-details">
            <div style="margin-bottom: 12px;"><strong>Event Name:</strong> ${lead.event_name}</div>
            <div style="margin-bottom: 12px;"><strong>Organising Society:</strong> ${lead.organising_society}</div>
            <div style="margin-bottom: 12px;"><strong>Contact Person:</strong> ${lead.contact_person}</div>
            <div style="margin-bottom: 12px;"><strong>Phone:</strong> ${lead.phone_no}</div>
            <div style="margin-bottom: 12px;"><strong>Email:</strong> ${lead.email}</div>
            <div style="margin-bottom: 12px;"><strong>Stage:</strong> <span class="lead-stage ${lead.lead_stage}">${lead.lead_stage}</span></div>
            <div style="margin-bottom: 12px;"><strong>Remarks:</strong> ${lead.remarks || 'No remarks'}</div>
            <div style="margin-bottom: 12px;"><strong>Added By:</strong> ${lead.added_by}</div>
            <div style="margin-bottom: 12px;"><strong>Added On:</strong> ${formatDateTime(lead.created_at)}</div>
        </div>
    `;
    
    showModal('leadDetailsModal');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing CRM system...');
    
    // Initialize Supabase
    initSupabase();
    
    // Set today's date
    setTodayDate();
    
    // Bind login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = handleLogin;
    }
    
    // Bind add lead form
    const addLeadForm = document.getElementById('addLeadForm');
    if (addLeadForm) {
        addLeadForm.onsubmit = handleAddLead;
    }
    
    // Bind logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = logout;
    }
    
    console.log('CRM system initialized');
});