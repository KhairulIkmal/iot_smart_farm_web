// App State
let currentUser = null;
let allUsers = [];

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById('login-text');
const loginSpinner = document.getElementById('login-spinner');
const logoutBtn = document.getElementById('logout-btn');

// Check authentication state on load
auth.onAuthStateChanged((user) => {
    if (user) {
        checkAdminRole(user);
    } else {
        showLoginScreen();
    }
});

// Login Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    loginBtn.disabled = true;
    loginText.classList.add('hidden');
    loginSpinner.classList.remove('hidden');
    loginError.classList.add('hidden');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await checkAdminRole(userCredential.user);
    } catch (error) {
        console.error('Login error:', error);
        showLoginError(getErrorMessage(error.code));
        loginBtn.disabled = false;
        loginText.classList.remove('hidden');
        loginSpinner.classList.add('hidden');
    }
});

// Check if user has admin role
async function checkAdminRole(user) {
    try {
        const userDoc = await db.collection('users')
            .where('uid', '==', user.uid)
            .limit(1)
            .get();

        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            if (userData.role === 'admin' || user.email.includes('admin')) {
                currentUser = user;
                showDashboard();
                loadDashboardData();
            } else {
                await auth.signOut();
                showLoginError('Access denied. Admin privileges required.');
            }
        } else {
            if (user.email.includes('admin')) {
                currentUser = user;
                showDashboard();
                loadDashboardData();
            } else {
                await auth.signOut();
                showLoginError('Access denied. Admin privileges required.');
            }
        }
    } catch (error) {
        console.error('Role check error:', error);
        await auth.signOut();
        showLoginError('Error checking admin privileges');
    }
}

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        showLoginScreen();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Show/Hide Screens
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    loginForm.reset();
}

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');

    if (currentUser) {
        const adminName = currentUser.displayName || currentUser.email.split('@')[0];
        document.getElementById('admin-name-text').textContent = adminName;
    }
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

function getErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email': return 'Invalid email address';
        case 'auth/user-not-found': return 'No account found with this email';
        case 'auth/wrong-password': return 'Incorrect password';
        case 'auth/too-many-requests': return 'Too many attempts. Please try again later';
        case 'auth/invalid-credential': return 'Invalid email or password';
        default: return 'Login failed. Please try again';
    }
}

// Navigation
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        navigateToPage(page);
    });
});

function navigateToPage(pageName) {
    navItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === pageName) {
            item.classList.remove('text-[#9db9a6]', 'hover:bg-[#1c271f]');
            item.classList.add('bg-[#28392e]');
            item.querySelector('p').classList.add('text-white');
            item.querySelector('.material-symbols-outlined').classList.add('text-primary');
        } else {
            item.classList.add('text-[#9db9a6]', 'hover:bg-[#1c271f]');
            item.classList.remove('bg-[#28392e]');
            item.querySelector('p').classList.remove('text-white');
            item.querySelector('.material-symbols-outlined').classList.remove('text-primary');
        }
    });

    document.querySelectorAll('div[id^="page-"]').forEach(page => {
        page.classList.add('hidden');
    });

    const selectedPage = document.getElementById(`page-${pageName}`);
    if (selectedPage) {
        selectedPage.classList.remove('hidden');
    }

    const titles = {
        'overview': 'Dashboard Overview',
        'users': 'Farmers',
        'farms': 'Farm Details',
        'devices': 'Device Inventory',
        'support': 'Support Tickets',
        'analytics': 'Farm Analytics',
        'notifications': 'Notifications',
        'settings': 'Settings'
    };
    document.getElementById('page-title').textContent = titles[pageName] || 'Dashboard';

    // Load page-specific data
    if (pageName === 'users') {
        loadAllUsers();
    } else if (pageName === 'farms') {
        loadAllFarms();
    } else if (pageName === 'devices') {
        loadDevicesPage();
    } else if (pageName === 'support') {
        loadSupportPage();
    } else if (pageName === 'notifications') {
        loadAllNotifications();
    } else if (pageName === 'analytics') {
        loadAnalyticsPage();
    } else if (pageName === 'settings') {
        loadSettingsPage();
    }
}

// Dashboard chart instance
let dashboardChart = null;
let dashboardSelectedFarm = null;
let dashboardSelectedCrop = null;

// Load Dashboard Data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadOverviewDeviceStats(),
            loadOverviewRecentDevices(),
            loadOverviewRecentTickets(),
            loadRecentUsers(),
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load device-centric stat cards
async function loadOverviewDeviceStats() {
    try {
        const snap = await db.collection('devices').get();
        const devices = snap.docs.map(d => d.data());
        const total = devices.length;
        const unclaimed = devices.filter(d => d.status === 'available').length;
        const claimed = devices.filter(d => d.status === 'claimed').length;

        document.getElementById('stat-devices-total').textContent = total;
        document.getElementById('stat-devices-unclaimed').textContent = unclaimed;
        document.getElementById('stat-active-farmers').textContent = claimed;
    } catch (err) {
        console.error('Device stats error:', err);
    }

    try {
        const ticketSnap = await db.collection('support_tickets')
            .where('status', 'in', ['open', 'in_progress'])
            .get();
        const openCount = ticketSnap.size;
        document.getElementById('stat-open-tickets').textContent = openCount;

        const badge = document.getElementById('quick-ticket-badge');
        if (badge) {
            if (openCount > 0) {
                badge.textContent = openCount;
                badge.classList.remove('hidden');
                badge.classList.add('flex');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error('Ticket stats error:', err);
    }
}

// Load recent devices for overview table
async function loadOverviewRecentDevices() {
    try {
        const snap = await db.collection('devices').orderBy('created_at', 'desc').limit(8).get();
        const tbody = document.getElementById('overview-devices-tbody');
        if (!tbody) return;

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-[#9db9a6]">No devices yet — generate your first code</td></tr>';
            return;
        }

        const statusColors = {
            available: 'bg-primary/10 text-primary',
            claimed:   'bg-blue-400/10 text-blue-400',
            inactive:  'bg-red-400/10 text-red-400',
        };

        tbody.innerHTML = snap.docs.map(doc => {
            const d = doc.data();
            const statusBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[d.status] || 'bg-[#28392e] text-[#9db9a6]'}">${d.status || 'unknown'}</span>`;
            const claimedBy = d.farmer_name || '<span class="text-[#9db9a6]">—</span>';
            const date = d.created_at ? formatDate(d.created_at.toDate ? d.created_at.toDate() : new Date(d.created_at)) : '—';
            return `<tr class="hover:bg-[#223026] transition-colors">
                <td class="p-4 font-mono text-primary font-semibold tracking-wider">${d.unique_code || doc.id}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-white">${claimedBy}</td>
                <td class="p-4 text-[#9db9a6] text-sm">${date}</td>
            </tr>`;
        }).join('');
    } catch (err) {
        console.error('Overview devices error:', err);
    }
}

// Load recent support tickets for overview
async function loadOverviewRecentTickets() {
    try {
        const snap = await db.collection('support_tickets')
            .orderBy('updated_at', 'desc')
            .limit(6)
            .get();

        const container = document.getElementById('overview-tickets-list');
        if (!container) return;

        if (snap.empty) {
            container.innerHTML = '<div class="p-6 text-center text-[#9db9a6] text-sm">No support tickets yet</div>';
            return;
        }

        const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Resolve all device_ids → AGR-XXXX-XXXX unique codes
        const needsLookup = [...new Set(tickets.map(t => t.device_id).filter(Boolean))];
        const uniqueCodeMap = {};
        for (let i = 0; i < needsLookup.length; i += 10) {
            const batch = needsLookup.slice(i, i + 10);
            try {
                const devSnap = await db.collection('devices')
                    .where(firebase.firestore.FieldPath.documentId(), 'in', batch)
                    .get();
                devSnap.forEach(d => { uniqueCodeMap[d.id] = d.data().unique_code || d.id; });
            } catch (_) {}
        }

        const statusColors = { open: 'text-primary', in_progress: 'text-orange-400', resolved: 'text-[#9db9a6]' };
        const statusLabels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };

        container.innerHTML = tickets.map(t => {
            const color = statusColors[t.status] || 'text-[#9db9a6]';
            const label = statusLabels[t.status] || t.status;
            const time = t.updated_at ? formatDate(t.updated_at.toDate ? t.updated_at.toDate() : new Date(t.updated_at)) : '';
            const unread = t.unread_admin > 0 ? `<span class="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-1"></span>` : '';
            const deviceCode = t.device_id ? (uniqueCodeMap[t.device_id] || t.device_id) : '—';
            return `<div class="p-4 hover:bg-[#223026] cursor-pointer transition-colors" onclick="navigateToPage('support')">
                <div class="flex items-start gap-2">
                    ${unread}
                    <div class="flex-1 min-w-0">
                        <p class="text-white text-sm font-medium truncate">${t.subject || 'No subject'}</p>
                        <p class="text-[#9db9a6] text-xs mt-0.5 truncate">
                            ${t.farmer_name || 'Unknown'}
                            <span class="mx-1 opacity-40">·</span>
                            <span class="font-mono text-primary/70">${deviceCode}</span>
                        </p>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-xs font-medium ${color}">${label}</span>
                            <span class="text-[#9db9a6] text-xs">${time}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('Overview tickets error:', err);
    }
}

// Load Total Users
async function loadTotalUsers() {
    try {
        const snapshot = await db.collection('users').get();
        document.getElementById('total-users').textContent = snapshot.size;
    } catch (error) {
        console.error('Error loading total users:', error);
        document.getElementById('total-users').textContent = '0';
    }
}

// Load Total Farms
async function loadTotalFarms() {
    try {
        const snapshot = await db.collection('users').get();
        const farms = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.farm_name) farms.add(data.farm_name);
        });
        document.getElementById('total-farms').textContent = farms.size;
    } catch (error) {
        console.error('Error loading total farms:', error);
        document.getElementById('total-farms').textContent = '0';
    }
}

// Load Total Crops
async function loadTotalCrops() {
    try {
        const snapshot = await db.collection('crops')
            .where('status', '==', 'active')
            .get();
        document.getElementById('total-crops').textContent = snapshot.size;
    } catch (error) {
        console.error('Error loading total crops:', error);
        document.getElementById('total-crops').textContent = '0';
    }
}

// Load Recent Users
async function loadRecentUsers() {
    try {
        const snapshot = await db.collection('users').get();

        const users = [];
        snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

        users.sort((a, b) => {
            const tA = a.created_at ? a.created_at.toMillis() : (a.createdAt ? a.createdAt.toMillis() : 0);
            const tB = b.created_at ? b.created_at.toMillis() : (b.createdAt ? b.createdAt.toMillis() : 0);
            return tB - tA;
        });

        const recentUsers = users.slice(0, 3);
        const tbody = document.getElementById('recent-users-tbody');
        tbody.innerHTML = '';

        if (recentUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-[#9db9a6]">No farmers found</td></tr>';
            return;
        }

        // ── Fetch crops for these users to get device IDs ─────────────
        const farmerIds = recentUsers.map(u => u.uid || u.id).filter(Boolean);
        const deviceIdByFarmer = {}; // farmerId → unique_code string

        if (farmerIds.length) {
            // Query crops in batches of 10 (Firestore whereIn limit)
            for (let i = 0; i < farmerIds.length; i += 10) {
                const batch = farmerIds.slice(i, i + 10);
                try {
                    const cropsSnap = await db.collection('crops')
                        .where('farmer_id', 'in', batch)
                        .where('status', '==', 'active')
                        .get();

                    // Collect unique device_ids per farmer
                    const devicesByFarmer = {};
                    cropsSnap.forEach(d => {
                        const c = d.data();
                        if (!c.farmer_id || !c.device_id) return;
                        if (!devicesByFarmer[c.farmer_id]) devicesByFarmer[c.farmer_id] = [];
                        devicesByFarmer[c.farmer_id].push(c.device_id);
                    });

                    // Fetch unique_code from devices collection
                    const allDeviceIds = [...new Set(Object.values(devicesByFarmer).flat())];
                    const uniqueCodeMap = {};
                    for (let j = 0; j < allDeviceIds.length; j += 10) {
                        const dBatch = allDeviceIds.slice(j, j + 10);
                        try {
                            const devSnap = await db.collection('devices')
                                .where(firebase.firestore.FieldPath.documentId(), 'in', dBatch)
                                .get();
                            devSnap.forEach(d => { uniqueCodeMap[d.id] = d.data().unique_code || d.id; });
                        } catch (_) {}
                    }

                    // Map farmer → display string (first device code, or "N devices")
                    Object.entries(devicesByFarmer).forEach(([fid, dids]) => {
                        const codes = dids.map(id => uniqueCodeMap[id] || id).filter(Boolean);
                        if (codes.length === 1) deviceIdByFarmer[fid] = codes[0];
                        else if (codes.length > 1) deviceIdByFarmer[fid] = `${codes.length} devices`;
                    });
                } catch (_) {}
            }
        }

        // ── Render rows ───────────────────────────────────────────────
        recentUsers.forEach(user => {
            const farmerId   = user.uid || user.id;
            const deviceCode = deviceIdByFarmer[farmerId];

            const statusClass = user.status === 'pending'  ? 'bg-yellow-500/10 text-yellow-500' :
                                user.status === 'inactive' ? 'bg-red-500/10 text-red-500' :
                                'bg-green-500/10 text-green-500';
            const statusText  = user.status === 'pending'  ? 'Pending' :
                                user.status === 'inactive' ? 'Inactive' : 'Active';

            const avatarHTML = user.photoURL
                ? `<img src="${user.photoURL}" alt="Profile" class="w-8 h-8 rounded-full object-cover">`
                : `<div class="w-8 h-8 rounded-full bg-[#28392e] flex items-center justify-center text-white font-semibold">
                    ${(user.name || user.displayName || 'U')[0].toUpperCase()}
                   </div>`;

            const deviceCell = deviceCode
                ? `<span class="font-mono text-xs text-white">${deviceCode}</span>`
                : `<span class="text-[#9db9a6]">—</span>`;

            tbody.innerHTML += `
                <tr class="hover:bg-[#223026] transition-colors">
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            ${avatarHTML}
                            <span class="text-white font-medium">${user.name || user.displayName || 'N/A'}</span>
                        </div>
                    </td>
                    <td class="p-4 text-[#9db9a6]">${user.email || 'N/A'}</td>
                    <td class="p-4">${deviceCell}</td>
                    <td class="p-4">
                        <span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">${statusText}</span>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error('Error loading recent users:', error);
        document.getElementById('recent-users-tbody').innerHTML =
            '<tr><td colspan="4" class="p-4 text-center text-[#9db9a6]">Error loading farmers</td></tr>';
    }
}

// Load Recent Farms
async function loadRecentFarms() {
    try {
        const snapshot = await db.collection('users')
            .limit(4)
            .get();

        const tbody = document.getElementById('recent-farms-tbody');
        tbody.innerHTML = '';

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-[#9db9a6]">No farms found</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.farm_name) {
                // Mock sensor status
                const sensorStatus = Math.random() > 0.5;
                const statusColor = sensorStatus ? 'bg-green-500' : 'bg-yellow-500 animate-pulse';
                const statusText = sensorStatus ? 'Online (12)' : 'Warning (2)';
                const statusTextColor = sensorStatus ? 'text-white' : 'text-white';

                const row = `
                    <tr class="hover:bg-[#223026] transition-colors">
                        <td class="p-4">
                            <div class="flex flex-col">
                                <span class="text-white font-medium">${user.farm_name}</span>
                                <span class="text-xs text-[#9db9a6]">Owner: ${user.name || 'Unknown'}</span>
                            </div>
                        </td>
                        <td class="p-4 text-[#9db9a6]">-</td>
                        <td class="p-4">
                            <div class="flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full ${statusColor}"></span>
                                <span class="text-xs ${statusTextColor}">${statusText}</span>
                            </div>
                        </td>
                        <td class="p-4 text-right">
                            <button class="text-[#9db9a6] hover:text-white transition-colors">
                                <span class="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            }
        });
    } catch (error) {
        console.error('Error loading recent farms:', error);
        document.getElementById('recent-farms-tbody').innerHTML =
            '<tr><td colspan="4" class="p-4 text-center text-[#9db9a6]">Error loading farms</td></tr>';
    }
}

// Load Dashboard Chart
async function loadDashboardChart() {
    try {
        // Load farms for filter
        const farmsSnapshot = await db.collection('users').get();
        const farmSelect = document.getElementById('dashboard-farm-filter');

        if (farmSelect) {
            farmSelect.innerHTML = '<option value="">All Farms</option>';
            farmsSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.farm_name) {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = userData.farm_name;
                    farmSelect.appendChild(option);
                }
            });

            farmSelect.addEventListener('change', async (e) => {
                dashboardSelectedFarm = e.target.value || null;
                await loadDashboardCrops(dashboardSelectedFarm);
                await updateDashboardChart();
            });
        }

        // Load crops for filter
        const cropSelect = document.getElementById('dashboard-crop-filter');
        if (cropSelect) {
            cropSelect.addEventListener('change', async () => {
                dashboardSelectedCrop = cropSelect.value || null;
                await updateDashboardChart();
            });
        }

        // Initialize chart
        await updateDashboardChart();

    } catch (error) {
        console.error('Error loading dashboard chart:', error);
    }
}

// Load crops for dashboard filter
async function loadDashboardCrops(farmId) {
    try {
        const cropSelect = document.getElementById('dashboard-crop-filter');
        if (!cropSelect) return;

        cropSelect.innerHTML = '<option value="">All Crops</option>';

        if (!farmId) return;

        const userDoc = await db.collection('users').doc(farmId).get();
        if (!userDoc.exists) return;

        const userData = userDoc.data();
        const authUid = userData.uid || farmId;

        let cropsSnapshot = await db.collection('crops')
            .where('farmer_id', '==', authUid)
            .get();

        if (cropsSnapshot.empty) {
            cropsSnapshot = await db.collection('crops')
                .where('farmer_id', '==', farmId)
                .get();
        }

        cropsSnapshot.forEach(doc => {
            const cropData = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${cropData.crop_type || 'Unknown'} (${cropData.device_id || 'N/A'})`;
            cropSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading dashboard crops:', error);
    }
}

// Update dashboard chart with real data
async function updateDashboardChart() {
    try {
        const canvas = document.getElementById('dashboard-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (dashboardChart) {
            dashboardChart.destroy();
        }

        // Get device IDs based on filters
        let deviceIds = [];

        if (dashboardSelectedCrop) {
            const cropDoc = await db.collection('crops').doc(dashboardSelectedCrop).get();
            if (cropDoc.exists && cropDoc.data().device_id) {
                deviceIds.push(cropDoc.data().device_id);
            }
        } else if (dashboardSelectedFarm) {
            const userDoc = await db.collection('users').doc(dashboardSelectedFarm).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const authUid = userData.uid || dashboardSelectedFarm;

                let cropsSnapshot = await db.collection('crops')
                    .where('farmer_id', '==', authUid)
                    .get();

                if (cropsSnapshot.empty) {
                    cropsSnapshot = await db.collection('crops')
                        .where('farmer_id', '==', dashboardSelectedFarm)
                        .get();
                }

                cropsSnapshot.forEach(doc => {
                    const cropData = doc.data();
                    if (cropData.device_id) deviceIds.push(cropData.device_id);
                });
            }
        } else {
            // Get all devices
            const cropsSnapshot = await db.collection('crops').get();
            cropsSnapshot.forEach(doc => {
                const cropData = doc.data();
                if (cropData.device_id) deviceIds.push(cropData.device_id);
            });
        }

        deviceIds = [...new Set(deviceIds)];

        // Load sensor data for last 7 days
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        const startTimestamp = Math.floor(sevenDaysAgo / 1000);

        const chartData = {
            soilMoisture: [],
            temperature: []
        };

        for (const deviceId of deviceIds.slice(0, 5)) { // Limit to 5 devices for performance
            try {
                const soilSnapshot = await rtdb.ref(`sensors/${deviceId}/history/soil`)
                    .orderByKey()
                    .startAt(startTimestamp.toString())
                    .limitToLast(50)
                    .once('value');

                const tempSnapshot = await rtdb.ref(`sensors/${deviceId}/history/temp`)
                    .orderByKey()
                    .startAt(startTimestamp.toString())
                    .limitToLast(50)
                    .once('value');

                if (soilSnapshot.exists()) {
                    const soilData = soilSnapshot.val();
                    Object.entries(soilData).forEach(([timestamp, value]) => {
                        chartData.soilMoisture.push({
                            x: parseInt(timestamp) * 1000,
                            y: value
                        });
                    });
                }

                if (tempSnapshot.exists()) {
                    const tempData = tempSnapshot.val();
                    Object.entries(tempData).forEach(([timestamp, value]) => {
                        chartData.temperature.push({
                            x: parseInt(timestamp) * 1000,
                            y: value
                        });
                    });
                }
            } catch (error) {
                console.error(`Error loading device ${deviceId}:`, error);
            }
        }

        // Sort by timestamp
        chartData.soilMoisture.sort((a, b) => a.x - b.x);
        chartData.temperature.sort((a, b) => a.x - b.x);

        // Create chart
        dashboardChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Soil Moisture (%)',
                        data: chartData.soilMoisture,
                        borderColor: '#4ade80',
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Temperature (°C)',
                        data: chartData.temperature,
                        borderColor: '#fb923c',
                        backgroundColor: 'rgba(251, 146, 60, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1c271f',
                        borderColor: '#28392e',
                        borderWidth: 1,
                        titleColor: '#9db9a6',
                        bodyColor: '#ffffff',
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            title: function(context) {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM d'
                            }
                        },
                        grid: {
                            color: '#28392e',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9db9a6',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#28392e',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9db9a6',
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error updating dashboard chart:', error);
    }
}

// Load Dashboard Announcements
async function loadDashboardAnnouncements() {
    try {
        const container = document.getElementById('dashboard-announcements');
        if (!container) return;

        // Try to get notifications ordered by createdAt
        // Note: This may require a composite index in Firestore
        let snapshot;
        try {
            snapshot = await db.collection('notifications')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
        } catch (indexError) {
            console.log('Composite index not available, using simple query:', indexError);
            // Fallback to simple query without orderBy
            snapshot = await db.collection('notifications')
                .limit(10)
                .get();
        }

        if (snapshot.empty) {
            container.innerHTML = '<div class="p-6 text-center text-[#9db9a6] text-sm">No announcements yet</div>';
            return;
        }

        // Filter for admin notifications and sort manually
        let notifications = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.sentBy === 'admin') {
                notifications.push({ id: doc.id, ...data });
            }
        });

        // Sort by createdAt manually
        notifications.sort((a, b) => {
            const aTime = a.createdAt ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
        });

        // Take only first 5
        notifications = notifications.slice(0, 5);

        if (notifications.length === 0) {
            container.innerHTML = '<div class="p-6 text-center text-[#9db9a6] text-sm">No announcements yet</div>';
            return;
        }

        let html = '';
        notifications.forEach(notif => {
            const typeColors = {
                'alert': 'bg-red-500/10 text-red-500 border-red-500/20',
                'warning': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                'info': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                'success': 'bg-green-500/10 text-green-500 border-green-500/20'
            };
            const colorClass = typeColors[notif.type] || typeColors['info'];

            const createdDate = notif.createdAt ?
                new Date(notif.createdAt.toDate()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'N/A';

            // Truncate message to 2 lines max
            const maxLength = 80;
            const message = notif.message || '';
            const truncatedMessage = message.length > maxLength ? message.substring(0, maxLength) + '...' : message;

            html += `
                <div class="p-4 border-b border-[#28392e] last:border-b-0 hover:bg-[#223026] transition-colors">
                    <div class="flex items-start gap-3">
                        <span class="px-2 py-1 rounded text-xs font-medium ${colorClass} border capitalize">${notif.type || 'info'}</span>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-white text-sm font-medium mb-1">${notif.title || 'Announcement'}</h4>
                            <p class="text-[#9db9a6] text-xs mb-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${truncatedMessage}</p>
                            <p class="text-[#9db9a6] text-xs">${createdDate}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading dashboard announcements:', error);
        const container = document.getElementById('dashboard-announcements');
        if (container) {
            container.innerHTML = '<div class="p-6 text-center text-[#9db9a6] text-sm">No announcements sent yet. <br><small class="text-xs">Go to Notifications to send one.</small></div>';
        }
    }
}

// Refresh Data Button
document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadDashboardData();
});

// Header Generate Code Button
document.getElementById('header-generate-btn')?.addEventListener('click', () => {
    navigateToPage('devices');
    setTimeout(() => {
        document.getElementById('generated-code-display')?.classList.add('hidden');
        document.getElementById('gen-quantity').value = 1;
        document.getElementById('gen-notes').value = '';
        document.getElementById('generate-code-modal')?.classList.remove('hidden');
    }, 200);
});

// ========================================
// USER MANAGEMENT PAGE
// ========================================

// Load All Users (for Users page)
async function loadAllUsers() {
    try {
        const snapshot = await db.collection('users').get();

        allUsers = [];
        snapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });

        // Sort by created_at in JavaScript (newest first)
        allUsers.sort((a, b) => {
            const timeA = a.created_at ? a.created_at.toMillis() : (a.createdAt ? a.createdAt.toMillis() : 0);
            const timeB = b.created_at ? b.created_at.toMillis() : (b.createdAt ? b.createdAt.toMillis() : 0);
            return timeB - timeA; // Descending order
        });

        renderUsersTable(allUsers);
    } catch (error) {
        console.error('Error loading all users:', error);
        const grid = document.getElementById('farmers-grid');
        if (grid) grid.innerHTML = '<div class="col-span-full p-8 text-center text-red-400">Error loading farmers</div>';
    }
}

// Render Farmers Card Grid
function renderUsersTable(users) {
    const grid = document.getElementById('farmers-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (users.length === 0) {
        grid.innerHTML = '<div class="col-span-full p-10 text-center text-[#9db9a6]">No farmers found</div>';
        return;
    }

    users.forEach(user => {
        const statusColor = user.status === 'pending' ? '#eab308' :
                            user.status === 'inactive' ? '#ef4444' : '#22c55e';
        const statusText  = user.status === 'pending' ? 'Pending' :
                            user.status === 'inactive' ? 'Inactive' : 'Active';

        const joinedDate = user.created_at ?
            new Date(user.created_at.toDate()).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) :
            (user.createdAt ?
                new Date(user.createdAt.toDate()).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—');

        const initials = (user.name || user.displayName || 'U')[0].toUpperCase();
        const avatarHTML = user.photoURL
            ? `<img src="${user.photoURL}" alt="Profile" class="w-12 h-12 rounded-full object-cover">`
            : `<div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style="background:rgba(43,238,108,0.2);border:1.5px solid rgba(43,238,108,0.35)">${initials}</div>`;

        const safeName = (user.name || user.displayName || 'N/A').replace(/'/g, "\\'");
        const card = `
            <div onclick="viewUserDetails('${user.id}')"
                 class="bg-[#1c271f] border border-[#3b5443] rounded-2xl p-5 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group relative overflow-hidden">
                <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                     style="background:linear-gradient(135deg,rgba(43,238,108,0.04) 0%,transparent 60%)"></div>
                <div class="flex items-center gap-4">
                    ${avatarHTML}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="text-white font-semibold truncate">${user.name || user.displayName || 'N/A'}</p>
                            <span class="flex-shrink-0 w-2 h-2 rounded-full" style="background:${statusColor}" title="${statusText}"></span>
                        </div>
                        <p class="text-[#9db9a6] text-xs truncate mt-0.5">${user.email || '—'}</p>
                        <p class="text-[#9db9a6] text-xs truncate mt-0.5">
                            <span class="material-symbols-outlined text-[13px] align-middle mr-0.5">grass</span>${user.farm_name || 'No farm set'}
                        </p>
                    </div>
                    <span class="material-symbols-outlined text-[#3b5443] group-hover:text-primary/50 transition-colors flex-shrink-0">chevron_right</span>
                </div>
                <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#3b5443]">
                    <span class="text-[#9db9a6] text-xs">Joined ${joinedDate}</span>
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full" style="color:${statusColor};background:${statusColor}1a">${statusText}</span>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

// Search Users
document.getElementById('search-users')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredUsers = allUsers.filter(user => {
        const name = (user.name || user.displayName || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const farmName = (user.farm_name || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm) || farmName.includes(searchTerm);
    });
    renderUsersTable(filteredUsers);
});

// Filter Users by Status
document.getElementById('filter-user-status')?.addEventListener('change', (e) => {
    const status = e.target.value;
    const filteredUsers = status === 'all'
        ? allUsers
        : allUsers.filter(user => user.status === status);
    renderUsersTable(filteredUsers);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

// Copy text to clipboard and briefly flash the button icon
function _copyToClipboard(text, iconEl) {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text).then(() => {
        const orig = iconEl.textContent;
        iconEl.textContent = 'check_circle';
        iconEl.style.color = '#22c55e';
        setTimeout(() => { iconEl.textContent = orig; iconEl.style.color = ''; }, 1500);
    });
}

// Build an inline copyable field: value + small copy icon button
function _copyableField(elId, text) {
    const el = document.getElementById(elId);
    if (!el) return;
    const safeText = (text || '—').replace(/</g, '&lt;');
    el.innerHTML = `
        <span class="flex-1 break-all">${safeText}</span>
        ${text ? `<button onclick="_copyToClipboard('${text.replace(/'/g,"\\'")}', this.querySelector('.material-symbols-outlined'))"
            class="ml-2 flex-shrink-0 text-[#9db9a6] hover:text-primary transition-colors" title="Copy">
            <span class="material-symbols-outlined text-[16px]">content_copy</span>
        </button>` : ''}`;
    el.classList.add('flex', 'items-center');
}

// Open crop photo lightbox
function _openCropLightbox(url, label) {
    const lb = document.createElement('div');
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    lb.innerHTML = `
        <img src="${url}" alt="${label}" style="max-width:90vw;max-height:80vh;border-radius:12px;box-shadow:0 25px 60px rgba(0,0,0,0.6);">
        <p style="color:#fff;margin-top:14px;font-size:14px;opacity:0.8;">${label}</p>
        <button style="position:absolute;top:20px;right:24px;background:rgba(255,255,255,0.1);border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;" onclick="this.parentElement.remove()">✕</button>`;
    lb.addEventListener('click', e => { if (e.target === lb) lb.remove(); });
    document.body.appendChild(lb);
}

// ── View User Details (new tabbed modal) ──────────────────────────────────────
async function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('user-details-modal');

    // ── Hero section ──────────────────────────────────────────────────
    const initials = (user.name || user.displayName || 'U')[0].toUpperCase();
    const photoEl  = document.getElementById('modal-user-photo');
    if (user.photoURL) {
        photoEl.innerHTML = `<img src="${user.photoURL}" alt="Profile" class="w-full h-full object-cover" style="cursor:pointer" onclick="_openCropLightbox('${user.photoURL}','${(user.name||'').replace(/'/g,"\\'")}')">`;
    } else {
        photoEl.textContent = initials;
    }

    document.getElementById('modal-user-name').textContent = user.name || user.displayName || 'N/A';

    // Email — mailto link
    const emailEl = document.getElementById('modal-user-email');
    if (user.email) {
        emailEl.innerHTML = `<a href="mailto:${user.email}" class="hover:text-primary transition-colors inline-flex items-center gap-1" title="Send email">
            <span class="material-symbols-outlined text-[14px]">mail</span>${user.email}</a>`;
    } else { emailEl.textContent = '—'; }

    document.getElementById('modal-user-id-inline').textContent = userId;

    const joinedDate = user.created_at ?
        new Date(user.created_at.toDate()).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) :
        (user.createdAt ?
            new Date(user.createdAt.toDate()).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—');
    document.getElementById('modal-user-joined').textContent = joinedDate;

    const statusBadge = document.getElementById('modal-user-status-badge');
    const statusColors = { pending:'bg-yellow-500/15 text-yellow-400', inactive:'bg-red-500/15 text-red-400', active:'bg-primary/15 text-primary' };
    statusBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[user.status] || statusColors.active}`;
    statusBadge.textContent = user.status ? (user.status[0].toUpperCase() + user.status.slice(1)) : 'Active';

    // ── Stats (load async) ────────────────────────────────────────────
    document.getElementById('modal-stat-crops').textContent   = '…';
    document.getElementById('modal-stat-devices').textContent = '…';
    document.getElementById('modal-stat-tickets').textContent = '…';

    const farmerId = user.uid || userId;
    Promise.all([
        db.collection('crops').where('farmer_id', '==', farmerId).get(),
        db.collection('support_tickets').where('farmer_uid', '==', farmerId).get(),
    ]).then(([cropsSnap, ticketsSnap]) => {
        const deviceIds = new Set();
        cropsSnap.forEach(d => { if (d.data().device_id) deviceIds.add(d.data().device_id); });
        document.getElementById('modal-stat-crops').textContent   = cropsSnap.size;
        document.getElementById('modal-stat-devices').textContent = deviceIds.size;
        document.getElementById('modal-stat-tickets').textContent = ticketsSnap.size;
    }).catch(() => {});

    // ── Profile tab ───────────────────────────────────────────────────
    // Phone — tel link
    const phoneEl = document.getElementById('modal-user-phone');
    const phoneNum = user.phone || user.phoneNumber;
    if (phoneNum) {
        phoneEl.innerHTML = `<a href="tel:${phoneNum}" class="hover:text-primary transition-colors inline-flex items-center gap-1" title="Call">
            <span class="material-symbols-outlined text-[14px]">call</span>${phoneNum}</a>`;
    } else { phoneEl.textContent = '—'; }

    document.getElementById('modal-user-role').textContent = user.role || 'farmer';

    // Copyable IDs
    _copyableField('modal-user-id',  userId);
    _copyableField('modal-user-uid', user.uid);

    const tsOpts = { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' };
    document.getElementById('modal-user-created').textContent =
        user.created_at ? new Date(user.created_at.toDate()).toLocaleString('en-US', tsOpts) :
        (user.createdAt ? new Date(user.createdAt.toDate()).toLocaleString('en-US', tsOpts) : '—');
    document.getElementById('modal-user-updated').textContent =
        user.updated_at ? new Date(user.updated_at.toDate()).toLocaleString('en-US', tsOpts) :
        (user.updatedAt ? new Date(user.updatedAt.toDate()).toLocaleString('en-US', tsOpts) : '—');

    // Password toggle
    const passwordElement   = document.getElementById('modal-user-password');
    const togglePasswordBtn = document.getElementById('toggle-password-visibility');
    const actualPassword    = user.password || null;
    let passwordVisible = false;
    if (actualPassword) {
        passwordElement.textContent = '••••••••';
        passwordElement.dataset.password = actualPassword;
        if (togglePasswordBtn) {
            togglePasswordBtn.style.display = '';
            const newToggleBtn = togglePasswordBtn.cloneNode(true);
            togglePasswordBtn.parentNode.replaceChild(newToggleBtn, togglePasswordBtn);
            newToggleBtn.addEventListener('click', () => {
                passwordVisible = !passwordVisible;
                const pwdEl = document.getElementById('modal-user-password');
                const icon  = newToggleBtn.querySelector('.material-symbols-outlined');
                pwdEl.textContent = passwordVisible ? pwdEl.dataset.password : '••••••••';
                icon.textContent  = passwordVisible ? 'visibility_off' : 'visibility';
            });
        }
    } else {
        passwordElement.textContent = 'Not available';
        passwordElement.dataset.password = '';
        if (togglePasswordBtn) togglePasswordBtn.style.display = 'none';
    }

    // ── Farm tab (load async) ─────────────────────────────────────────
    document.getElementById('modal-user-farm').textContent        = user.farm_name || '—';
    document.getElementById('modal-farm-size').textContent        = '…';
    document.getElementById('modal-farm-location').textContent    = '…';
    document.getElementById('modal-farm-coordinates').textContent = '';

    db.collection('users').doc(userId).collection('farm').doc('details').get().then(doc => {
        const d = doc.exists ? doc.data() : {};
        document.getElementById('modal-farm-size').textContent = d.size ? `${d.size} hectares` : '—';
    }).catch(() => { document.getElementById('modal-farm-size').textContent = '—'; });

    db.collection('users').doc(userId).collection('farm').doc('location').get().then(doc => {
        const d = doc.exists ? doc.data() : {};
        const locEl   = document.getElementById('modal-farm-location');
        const coordEl = document.getElementById('modal-farm-coordinates');
        const hasCoords = d.latitude && d.longitude;
        const mapsUrl = hasCoords
            ? `https://www.google.com/maps?q=${d.latitude},${d.longitude}`
            : (d.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address)}` : null);

        if (d.address && mapsUrl) {
            locEl.innerHTML = `<a href="${mapsUrl}" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1.5 hover:text-primary transition-colors group" title="Open in Google Maps">
                <span class="material-symbols-outlined text-[16px] text-primary">location_on</span>
                ${d.address}
                <span class="material-symbols-outlined text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
            </a>`;
        } else {
            locEl.textContent = d.address || '—';
        }

        if (hasCoords) {
            const coordStr = `${d.latitude.toFixed(6)}, ${d.longitude.toFixed(6)}`;
            coordEl.innerHTML = `<a href="${mapsUrl}" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1 text-[#9db9a6] hover:text-primary transition-colors font-mono text-xs group" title="Open pinned location">
                <span class="material-symbols-outlined text-[13px]">my_location</span>
                ${coordStr}
                <span class="material-symbols-outlined text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
            </a>`;
        } else {
            coordEl.textContent = '';
        }
    }).catch(() => { document.getElementById('modal-farm-location').textContent = '—'; });

    // ── Crops tab (load async) ────────────────────────────────────────
    const cropsContainer = document.getElementById('modal-user-crops');
    cropsContainer.innerHTML = '<div class="text-center py-10 text-[#9db9a6]">Loading crops…</div>';

    db.collection('crops').where('farmer_id', '==', farmerId).get()
        .then(snap => {
            if (snap.empty) {
                cropsContainer.innerHTML = `
                    <div class="text-center py-10">
                        <span class="material-symbols-outlined text-[48px] text-[#3b5443]">grass</span>
                        <p class="text-[#9db9a6] text-sm mt-2">No crops planted yet</p>
                    </div>`;
                return;
            }
            const statusLabel = { active:'Active', harvested:'Harvested', inactive:'Removed' };
            const statusStyle = {
                active:   'color:#22c55e;background:rgba(34,197,94,0.12)',
                harvested:'color:#3b82f6;background:rgba(59,130,246,0.12)',
                inactive: 'color:#ef4444;background:rgba(239,68,68,0.12)',
            };
            let html = '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
            snap.forEach(doc => {
                const crop    = doc.data();
                const st      = crop.status || 'active';
                const label   = crop.crop_type || 'Unknown';
                const imgUrl  = crop.image_url || '';
                const clickFn = imgUrl ? `onclick="_openCropLightbox('${imgUrl.replace(/'/g,"\\'")}','${label.replace(/'/g,"\\'")}');event.stopPropagation()"` : '';
                const imgTag  = imgUrl
                    ? `<div class="relative overflow-hidden" style="height:112px;cursor:zoom-in" ${clickFn}>
                           <img src="${imgUrl}" alt="${label}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105">
                           <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style="background:rgba(0,0,0,0.35)">
                               <span class="material-symbols-outlined text-white text-[28px]">zoom_in</span>
                           </div>
                       </div>`
                    : `<div class="w-full flex items-center justify-center" style="height:112px;background:#1c271f">
                           <span class="material-symbols-outlined text-[40px]" style="color:#3b5443">grass</span>
                       </div>`;
                html += `
                    <div class="bg-[#1c271f] rounded-xl overflow-hidden border border-[#3b5443] hover:border-primary/40 transition-colors">
                        ${imgTag}
                        <div class="p-3">
                            <p class="text-white font-semibold text-sm truncate">${label}</p>
                            <p class="text-[#9db9a6] text-xs truncate mt-0.5 flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-[12px]">memory</span>${crop.device_id || '—'}
                            </p>
                            <span class="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style="${statusStyle[st] || statusStyle.active}">${statusLabel[st] || st}</span>
                        </div>
                    </div>`;
            });
            html += '</div>';
            cropsContainer.innerHTML = html;
        })
        .catch(() => { cropsContainer.innerHTML = '<p class="text-red-400 text-sm">Error loading crops</p>'; });

    // ── Tab switching ─────────────────────────────────────────────────
    const tabPanels = { profile:'modal-tab-profile', farm:'modal-tab-farm', crops:'modal-tab-crops' };
    modal.querySelectorAll('.modal-tab-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            modal.querySelectorAll('.modal-tab-btn').forEach(b => {
                b.classList.remove('text-primary', 'border-primary');
                b.classList.add('text-[#9db9a6]', 'border-transparent');
            });
            newBtn.classList.add('text-primary', 'border-primary');
            newBtn.classList.remove('text-[#9db9a6]', 'border-transparent');
            Object.values(tabPanels).forEach(id => document.getElementById(id)?.classList.add('hidden'));
            const panelId = tabPanels[newBtn.dataset.tab];
            if (panelId) document.getElementById(panelId)?.classList.remove('hidden');
        });
    });
    // Reset to Profile tab
    Object.values(tabPanels).forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.getElementById('modal-tab-profile')?.classList.remove('hidden');
    modal.querySelectorAll('.modal-tab-btn').forEach(b => {
        const isProfile = b.dataset.tab === 'profile';
        b.classList.toggle('text-primary', isProfile);
        b.classList.toggle('border-primary', isProfile);
        b.classList.toggle('text-[#9db9a6]', !isProfile);
        b.classList.toggle('border-transparent', !isProfile);
    });

    // ── Delete button ─────────────────────────────────────────────────
    const deleteBtn = document.getElementById('modal-delete-user-btn');
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.addEventListener('click', () => deleteUser(userId, user.name || user.email));
    }

    modal.classList.remove('hidden');
}

// Close User Details Modal
document.getElementById('close-user-modal')?.addEventListener('click', () => {
    document.getElementById('user-details-modal').classList.add('hidden');
});

document.getElementById('close-user-modal-btn')?.addEventListener('click', () => {
    document.getElementById('user-details-modal').classList.add('hidden');
});

// Edit User
function editUser(userId) {
    // For now, just show an alert. You can implement a full edit form later
    alert(`Edit user functionality for ${userId} - Coming soon!`);
}

// Delete User
async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone and will:\n- Delete the user account\n- Delete all farm data\n- Delete all crops\n- Unassign all devices (set back to unassigned)`)) {
        return;
    }

    try {
        // Get user's Firebase Auth UID first
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const authUid = userData?.uid || userId;

        // Step 1: Find and delete user's crops (try both custom userId and Firebase Auth UID)
        let cropsSnapshot = await db.collection('crops')
            .where('farmer_id', '==', authUid)
            .get();

        // If no crops found with Auth UID, try with custom userId
        if (cropsSnapshot.empty && authUid !== userId) {
            cropsSnapshot = await db.collection('crops')
                .where('farmer_id', '==', userId)
                .get();
        }

        const deletePromises = [];
        const deviceIds = new Set(); // Track devices to unassign

        // Collect device IDs and prepare crop deletion
        cropsSnapshot.forEach(doc => {
            const cropData = doc.data();
            if (cropData.device_id) {
                deviceIds.add(cropData.device_id);
            }
            deletePromises.push(doc.ref.delete());
        });

        // Step 2: Unassign all devices (set status back to 'unassigned')
        for (const deviceId of deviceIds) {
            deletePromises.push(
                db.collection('devices').doc(deviceId).update({
                    status: 'unassigned',
                    assigned_to: null,
                    assigned_at: null
                })
            );
        }

        // Step 3: Delete user's farm subcollections (location, details)
        try {
            const farmDetailsDoc = db.collection('users').doc(userId).collection('farm').doc('details');
            const farmLocationDoc = db.collection('users').doc(userId).collection('farm').doc('location');
            deletePromises.push(farmDetailsDoc.delete());
            deletePromises.push(farmLocationDoc.delete());
        } catch (e) {
            console.log('Farm subcollections may not exist, continuing...');
        }

        // Step 4: Delete user document
        deletePromises.push(db.collection('users').doc(userId).delete());

        // Execute all deletions and updates
        await Promise.all(deletePromises);

        alert(`User "${userName}" deleted successfully!\n\n- ${cropsSnapshot.size} crops deleted\n- ${deviceIds.size} devices unassigned`);
        loadAllUsers(); // Reload the table
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
    }
}

// ========================================
// FARM MANAGEMENT PAGE
// ========================================

// Load All Farms (for Farms page)
async function loadAllFarms() {
    try {
        const snapshot = await db.collection('users').get();
        const farms = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            if (userData.farm_name) {
                // Get farm location
                const locationDoc = await db.collection('users')
                    .doc(doc.id)
                    .collection('farm')
                    .doc('location')
                    .get();

                const location = locationDoc.exists ? locationDoc.data() : null;

                // Get crops to find device IDs
                // Try with both Auth UID and document ID
                const authUid = userData.uid || doc.id;
                let cropsSnapshot = await db.collection('crops')
                    .where('farmer_id', '==', authUid)
                    .get();

                // If no results with Auth UID, try with document ID
                if (cropsSnapshot.empty && authUid !== doc.id) {
                    cropsSnapshot = await db.collection('crops')
                        .where('farmer_id', '==', doc.id)
                        .get();
                }

                const deviceIds = new Set();
                cropsSnapshot.forEach(cropDoc => {
                    const cropData = cropDoc.data();
                    if (cropData.device_id) {
                        deviceIds.add(cropData.device_id);
                    }
                });

                // Get sensor status from RTDB for each device
                let onlineCount = 0;
                let warningCount = 0;

                for (const deviceId of deviceIds) {
                    try {
                        const deviceSnapshot = await rtdb.ref(`sensors/${deviceId}`).once('value');
                        const deviceData = deviceSnapshot.val();

                        if (deviceData) {
                            // Check if device is online (updated within last 5 minutes)
                            // Check live/lastSeen, live/timestamp, or root timestamp
                            const lastUpdate = (deviceData.live?.lastSeen) ||
                                             (deviceData.live?.timestamp) ||
                                             (deviceData.timestamp) || 0;
                            const now = Date.now();
                            const isOnline = (now - lastUpdate) < 300000; // 5 minutes

                            if (isOnline) {
                                onlineCount++;
                            } else {
                                warningCount++;
                            }
                        } else {
                            warningCount++;
                        }
                    } catch (error) {
                        console.error(`Error checking device ${deviceId}:`, error);
                        warningCount++;
                    }
                }

                const totalDevices = deviceIds.size;
                const sensorStatus = warningCount > 0 ? 'warning' : 'online';

                farms.push({
                    id: doc.id,
                    farmName: userData.farm_name,
                    ownerName: userData.name || userData.displayName || 'Unknown',
                    ownerEmail: userData.email || 'N/A',
                    location: location?.address || 'Not set',
                    latitude: location?.latitude,
                    longitude: location?.longitude,
                    sensorStatus: sensorStatus,
                    sensorCount: totalDevices,
                    onlineCount: onlineCount,
                    warningCount: warningCount
                });
            }
        }

        renderFarmsTable(farms);
    } catch (error) {
        console.error('Error loading all farms:', error);
        document.getElementById('all-farms-tbody').innerHTML =
            '<tr><td colspan="5" class="p-4 text-center text-[#9db9a6]">Error loading farms</td></tr>';
    }
}

// Render Farms Table
function renderFarmsTable(farms) {
    const tbody = document.getElementById('all-farms-tbody');
    tbody.innerHTML = '';

    if (farms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-[#9db9a6]">No farms found</td></tr>';
        return;
    }

    farms.forEach(farm => {
        let statusColor, statusText;

        if (farm.sensorCount === 0) {
            statusColor = 'bg-gray-500';
            statusText = 'No devices';
        } else if (farm.sensorStatus === 'warning') {
            statusColor = 'bg-yellow-500 animate-pulse';
            statusText = `${farm.onlineCount} online, ${farm.warningCount} offline`;
        } else {
            statusColor = 'bg-green-500';
            statusText = `All online (${farm.onlineCount})`;
        }

        const row = `
            <tr class="hover:bg-[#223026] transition-colors">
                <td class="p-4">
                    <div class="flex flex-col">
                        <span class="text-white font-medium">${farm.farmName}</span>
                        <span class="text-xs text-[#9db9a6]">Owner: ${farm.ownerName}</span>
                    </div>
                </td>
                <td class="p-4 text-[#9db9a6]">${farm.ownerEmail}</td>
                <td class="p-4 text-[#9db9a6]">${farm.location}</td>
                <td class="p-4">
                    <div class="flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full ${statusColor}"></span>
                        <span class="text-xs text-white">${statusText}</span>
                    </div>
                </td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="viewFarmDetails('${farm.id}')" class="text-[#9db9a6] hover:text-primary transition-colors" title="View Details">
                            <span class="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        ${farm.latitude ? `<button onclick="viewFarmLocation(${farm.latitude}, ${farm.longitude})" class="text-[#9db9a6] hover:text-primary transition-colors" title="View on Map">
                            <span class="material-symbols-outlined text-[20px]">location_on</span>
                        </button>` : ''}
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Search Farms
document.getElementById('search-farms')?.addEventListener('input', () => {
    // Will be implemented when farms data is stored globally
    loadAllFarms();
});

// View Farm Details
async function viewFarmDetails(farmId) {
    try {
        const modal = document.getElementById('farm-details-modal');

        // Load user data
        const userDoc = await db.collection('users').doc(farmId).get();
        if (!userDoc.exists) {
            alert('Farm not found');
            return;
        }

        const userData = userDoc.data();

        // Basic farm info
        document.getElementById('modal-farm-name').textContent = userData.farm_name || 'N/A';
        document.getElementById('modal-farm-owner').textContent = userData.name || userData.displayName || 'Unknown';
        document.getElementById('modal-farm-email').textContent = userData.email || 'N/A';

        // Load farm size from subcollection
        const farmDetailsDoc = await db.collection('users')
            .doc(farmId)
            .collection('farm')
            .doc('details')
            .get();

        if (farmDetailsDoc.exists) {
            const farmData = farmDetailsDoc.data();
            document.getElementById('modal-farm-size-detail').textContent = farmData.size ? `${farmData.size} hectares` : 'Not set';
        } else {
            document.getElementById('modal-farm-size-detail').textContent = 'Not set';
        }

        // Load farm location
        const farmLocationDoc = await db.collection('users')
            .doc(farmId)
            .collection('farm')
            .doc('location')
            .get();

        if (farmLocationDoc.exists) {
            const locationData = farmLocationDoc.data();
            document.getElementById('modal-farm-address').textContent = locationData.address || 'Not set';
            document.getElementById('modal-farm-gps').textContent =
                locationData.latitude && locationData.longitude
                    ? `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`
                    : 'Not set';
        } else {
            document.getElementById('modal-farm-address').textContent = 'Not set';
            document.getElementById('modal-farm-gps').textContent = 'Not set';
        }

        // Load crops and devices
        const cropsSnapshot = await db.collection('crops')
            .where('farmer_id', '==', userData.uid || farmId)
            .get();

        // Also try with custom userId if no results
        let crops = [];
        if (cropsSnapshot.empty && userData.uid && userData.uid !== farmId) {
            const altCropsSnapshot = await db.collection('crops')
                .where('farmer_id', '==', farmId)
                .get();
            altCropsSnapshot.forEach(doc => crops.push({ id: doc.id, ...doc.data() }));
        } else {
            cropsSnapshot.forEach(doc => crops.push({ id: doc.id, ...doc.data() }));
        }

        // Get unique device IDs
        const deviceIds = [...new Set(crops.map(crop => crop.device_id).filter(id => id))];

        // Load device status from RTDB
        const devicesData = [];
        let onlineCount = 0;
        let offlineCount = 0;

        for (const deviceId of deviceIds) {
            try {
                const deviceSnapshot = await rtdb.ref(`sensors/${deviceId}`).once('value');
                const sensorData = deviceSnapshot.val();

                if (sensorData) {
                    // Check live/lastSeen, live/timestamp, or root timestamp
                    const lastUpdate = (sensorData.live?.lastSeen) ||
                                     (sensorData.live?.timestamp) ||
                                     (sensorData.timestamp) || 0;
                    const now = Date.now();
                    const isOnline = (now - lastUpdate) < 300000; // 5 minutes
                    const timeDiff = now - lastUpdate;
                    const lastSeenMinutes = Math.floor(timeDiff / 60000);

                    if (isOnline) {
                        onlineCount++;
                    } else {
                        offlineCount++;
                    }

                    // Get live sensor data (prefer live subcollection, fallback to root)
                    const liveSensorData = sensorData.live || sensorData;

                    // Get sensor health status
                    const sensorHealth = sensorData.sensorHealth || {};

                    // Check for sensor errors (from sensor health or value ranges)
                    const hasErrors =
                        (sensorHealth.soil === 'error') ||
                        (sensorHealth.temp === 'error') ||
                        (sensorHealth.humidity === 'error') ||
                        (sensorHealth.ph === 'error') ||
                        (sensorHealth.waterLevel === 'error') ||
                        (liveSensorData.soil && (liveSensorData.soil < 20 || liveSensorData.soil > 80)) ||
                        (liveSensorData.temp && (liveSensorData.temp < 15 || liveSensorData.temp > 40)) ||
                        (liveSensorData.waterLevel && liveSensorData.waterLevel < 20);

                    devicesData.push({
                        id: deviceId,
                        isOnline,
                        hasErrors,
                        lastSeen: lastSeenMinutes,
                        sensorData: liveSensorData,
                        sensorHealth: sensorHealth
                    });
                } else {
                    offlineCount++;
                    devicesData.push({
                        id: deviceId,
                        isOnline: false,
                        hasErrors: false,
                        lastSeen: null,
                        sensorData: null
                    });
                }
            } catch (error) {
                console.error(`Error loading device ${deviceId}:`, error);
                offlineCount++;
                devicesData.push({
                    id: deviceId,
                    isOnline: false,
                    hasErrors: false,
                    lastSeen: null,
                    sensorData: null
                });
            }
        }

        // Update device status overview
        document.getElementById('modal-total-devices').textContent = deviceIds.length;
        document.getElementById('modal-online-devices').textContent = onlineCount;
        document.getElementById('modal-offline-devices').textContent = offlineCount;

        // Render device details
        const devicesContainer = document.getElementById('modal-devices-list');
        if (devicesData.length === 0) {
            devicesContainer.innerHTML = '<p class="text-[#9db9a6] text-sm p-4 bg-[#28392e] rounded-lg">No devices found</p>';
        } else {
            let devicesHTML = '';
            devicesData.forEach(device => {
                const statusColor = device.isOnline ? 'bg-green-500' : 'bg-red-500';
                const statusText = device.isOnline ? 'Online' : 'Offline';
                const errorBadge = device.hasErrors && device.isOnline
                    ? '<span class="px-2 py-1 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 ml-2">Sensor Alert</span>'
                    : '';

                const lastSeenText = device.isOnline
                    ? 'Active now'
                    : (device.lastSeen !== null ? `Last seen ${device.lastSeen} min ago` : 'Never connected');

                devicesHTML += `
                    <div class="p-4 bg-[#28392e] rounded-lg">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <span class="w-3 h-3 rounded-full ${statusColor}"></span>
                                <div>
                                    <p class="text-white font-medium">${device.id}</p>
                                    <p class="text-[#9db9a6] text-xs">${lastSeenText}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-1 rounded text-xs font-medium ${device.isOnline ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}">
                                    ${statusText}
                                </span>
                                ${errorBadge}
                            </div>
                        </div>
                        ${device.sensorData ? `
                            <div class="grid grid-cols-5 gap-2 pt-3 border-t border-[#1c271f]">
                                <div class="text-center">
                                    <div class="flex items-center justify-center gap-1 mb-1">
                                        <p class="text-[#9db9a6] text-xs">Soil %</p>
                                        ${device.sensorHealth?.soil === 'error' ? '<span class="material-symbols-outlined text-red-500 text-xs">error</span>' :
                                          device.sensorHealth?.soil === 'ok' ? '<span class="material-symbols-outlined text-green-500 text-xs">check_circle</span>' : ''}
                                    </div>
                                    <p class="text-white text-sm font-medium">${device.sensorData.soil?.toFixed?.(1) || device.sensorData.soil || 'N/A'}</p>
                                </div>
                                <div class="text-center">
                                    <div class="flex items-center justify-center gap-1 mb-1">
                                        <p class="text-[#9db9a6] text-xs">Temp °C</p>
                                        ${device.sensorHealth?.temp === 'error' ? '<span class="material-symbols-outlined text-red-500 text-xs">error</span>' :
                                          device.sensorHealth?.temp === 'ok' ? '<span class="material-symbols-outlined text-green-500 text-xs">check_circle</span>' : ''}
                                    </div>
                                    <p class="text-white text-sm font-medium">${device.sensorData.temp?.toFixed?.(1) || device.sensorData.temp || 'N/A'}</p>
                                </div>
                                <div class="text-center">
                                    <div class="flex items-center justify-center gap-1 mb-1">
                                        <p class="text-[#9db9a6] text-xs">Humidity %</p>
                                        ${device.sensorHealth?.humidity === 'error' ? '<span class="material-symbols-outlined text-red-500 text-xs">error</span>' :
                                          device.sensorHealth?.humidity === 'ok' ? '<span class="material-symbols-outlined text-green-500 text-xs">check_circle</span>' : ''}
                                    </div>
                                    <p class="text-white text-sm font-medium">${device.sensorData.humidity?.toFixed?.(1) || device.sensorData.humidity || 'N/A'}</p>
                                </div>
                                <div class="text-center">
                                    <div class="flex items-center justify-center gap-1 mb-1">
                                        <p class="text-[#9db9a6] text-xs">pH</p>
                                        ${device.sensorHealth?.ph === 'error' ? '<span class="material-symbols-outlined text-red-500 text-xs">error</span>' :
                                          device.sensorHealth?.ph === 'ok' ? '<span class="material-symbols-outlined text-green-500 text-xs">check_circle</span>' : ''}
                                    </div>
                                    <p class="text-white text-sm font-medium">${device.sensorData.ph?.toFixed?.(1) || device.sensorData.ph || 'N/A'}</p>
                                </div>
                                <div class="text-center">
                                    <div class="flex items-center justify-center gap-1 mb-1">
                                        <p class="text-[#9db9a6] text-xs">Water %</p>
                                        ${device.sensorHealth?.waterLevel === 'error' ? '<span class="material-symbols-outlined text-red-500 text-xs">error</span>' :
                                          device.sensorHealth?.waterLevel === 'ok' ? '<span class="material-symbols-outlined text-green-500 text-xs">check_circle</span>' : ''}
                                    </div>
                                    <p class="text-white text-sm font-medium">${device.sensorData.waterLevel?.toFixed?.(1) || device.sensorData.waterLevel || 'N/A'}</p>
                                </div>
                            </div>
                        ` : '<p class="text-[#9db9a6] text-xs pt-3 border-t border-[#1c271f]">No sensor data available</p>'}
                    </div>
                `;
            });
            devicesContainer.innerHTML = devicesHTML;
        }

        // Render crops with detailed information
        const cropsContainer = document.getElementById('modal-farm-crops');
        if (crops.length === 0) {
            cropsContainer.innerHTML = '<p class="text-[#9db9a6] text-sm">No crops planted yet</p>';
        } else {
            let cropsHTML = '<div class="space-y-3">';
            crops.forEach(crop => {
                const statusClass = crop.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                  crop.status === 'harvested' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                  'bg-red-500/10 text-red-500 border-red-500/20';

                // Format created date
                let createdDate = 'N/A';
                if (crop.createdAt) {
                    try {
                        createdDate = new Date(crop.createdAt.toDate()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    } catch (e) {
                        createdDate = 'N/A';
                    }
                }

                cropsHTML += `
                    <div class="p-4 bg-[#1c271f] rounded-lg border border-[#28392e]">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="material-symbols-outlined text-primary text-lg">eco</span>
                                    <h5 class="text-white font-semibold text-base">${crop.crop_type || 'Unknown Crop'}</h5>
                                </div>
                                ${crop.field_name ? `<p class="text-[#9db9a6] text-sm ml-7">Field: ${crop.field_name}</p>` : ''}
                            </div>
                            <span class="px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}">${crop.status || 'active'}</span>
                        </div>

                        <div class="grid grid-cols-2 gap-3 ml-7">
                            <div>
                                <p class="text-[#9db9a6] text-xs mb-1">Device ID</p>
                                <p class="text-white text-sm font-mono">${crop.device_id || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-[#9db9a6] text-xs mb-1">Planted Date</p>
                                <p class="text-white text-sm">${createdDate}</p>
                            </div>
                        </div>

                        ${crop.notes ? `
                            <div class="mt-3 pt-3 border-t border-[#28392e] ml-7">
                                <p class="text-[#9db9a6] text-xs mb-1">Notes</p>
                                <p class="text-white text-sm">${crop.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            cropsHTML += '</div>';
            cropsContainer.innerHTML = cropsHTML;
        }

        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading farm details:', error);
        alert('Failed to load farm details. Please try again.');
    }
}

// Close Farm Details Modal
document.getElementById('close-farm-modal')?.addEventListener('click', () => {
    document.getElementById('farm-details-modal').classList.add('hidden');
});

document.getElementById('close-farm-modal-btn')?.addEventListener('click', () => {
    document.getElementById('farm-details-modal').classList.add('hidden');
});

// View Farm Location
function viewFarmLocation(lat, lng) {
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`, '_blank');
}

// ========================================
// NOTIFICATIONS PAGE
// ========================================

// Load All Notifications
async function loadAllNotifications() {
    try {
        // Initialize notification form handlers
        initializeNotificationForm();

        const snapshot = await db.collection('notifications')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const tbody = document.getElementById('all-notifications-tbody');
        tbody.innerHTML = '';

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-[#9db9a6]">No notifications found</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const notif = doc.data();
            const typeClass = notif.type === 'alert' ? 'bg-red-500/10 text-red-500' :
                            notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                            notif.type === 'success' ? 'bg-green-500/10 text-green-500' :
                            'bg-blue-500/10 text-blue-500';

            const createdDate = notif.createdAt ?
                new Date(notif.createdAt.toDate()).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'N/A';

            const row = `
                <tr class="hover:bg-[#223026] transition-colors">
                    <td class="p-4">
                        <span class="px-2 py-1 rounded text-xs font-medium ${typeClass}">${notif.type || 'info'}</span>
                    </td>
                    <td class="p-4 text-white">${notif.title || 'N/A'}</td>
                    <td class="p-4 text-[#9db9a6] max-w-xs truncate">${notif.message || 'N/A'}</td>
                    <td class="p-4 text-[#9db9a6]">${notif.farmer_id || 'All users'}</td>
                    <td class="p-4 text-[#9db9a6]">${createdDate}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading notifications:', error);
        document.getElementById('all-notifications-tbody').innerHTML =
            '<tr><td colspan="5" class="p-4 text-center text-[#9db9a6]">Error loading notifications</td></tr>';
    }
}

// Track if notification form has been initialized
let notificationFormInitialized = false;

// Initialize notification form and handlers
function initializeNotificationForm() {
    // Prevent duplicate initialization
    if (notificationFormInitialized) return;
    notificationFormInitialized = true;

    // Load users for specific user dropdown
    loadNotificationUsers();

    // Load scheduled notifications
    loadScheduledNotifications();

    // Handle recipient type change
    const recipientType = document.getElementById('notif-recipient-type');
    const specificUserContainer = document.getElementById('specific-user-select-container');

    recipientType?.addEventListener('change', (e) => {
        if (e.target.value === 'specific') {
            specificUserContainer.classList.remove('hidden');
        } else {
            specificUserContainer.classList.add('hidden');
        }
    });

    // Message character counter
    const messageTextarea = document.getElementById('notif-message');
    const messageCounter = document.getElementById('message-counter');

    messageTextarea?.addEventListener('input', (e) => {
        messageCounter.textContent = e.target.value.length;
    });

    // Template buttons
    document.getElementById('template-maintenance')?.addEventListener('click', () => {
        setNotificationTemplate('warning',
            'Scheduled System Maintenance',
            'Our system will undergo scheduled maintenance on [DATE] from [START TIME] to [END TIME]. During this period, some features may be temporarily unavailable. We apologize for any inconvenience.'
        );
    });

    document.getElementById('template-downtime')?.addEventListener('click', () => {
        setNotificationTemplate('alert',
            'System Downtime Alert',
            'We are currently experiencing technical difficulties. Our team is working to resolve the issue as quickly as possible. We apologize for the inconvenience and appreciate your patience.'
        );
    });

    document.getElementById('template-update')?.addEventListener('click', () => {
        setNotificationTemplate('info',
            'System Update Available',
            'A new update has been released with exciting features and improvements. Update your app to enjoy the latest enhancements and bug fixes.'
        );
    });

    // Clear button
    document.getElementById('clear-notif-btn')?.addEventListener('click', () => {
        clearNotificationForm();
    });

    // Send button
    document.getElementById('send-notif-btn')?.addEventListener('click', async () => {
        await sendNotification();
    });
}

// Load users for notification dropdown
async function loadNotificationUsers() {
    try {
        const snapshot = await db.collection('users').get();
        const userSelect = document.getElementById('notif-specific-user');

        if (!userSelect) return;

        userSelect.innerHTML = '<option value="">Select a user</option>';

        snapshot.forEach(doc => {
            const userData = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${userData.full_name || 'Unknown'} - ${userData.farm_name || 'No Farm'} (${userData.email || doc.id})`;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users for notifications:', error);
    }
}

// Set notification template
function setNotificationTemplate(type, title, message) {
    document.getElementById('notif-type').value = type;
    document.getElementById('notif-title').value = title;
    document.getElementById('notif-message').value = message;
    document.getElementById('message-counter').textContent = message.length;
}

// ── Notification mode (send now / schedule) ──
let _notifMode = 'now';

function setNotifMode(mode) {
    _notifMode = mode;
    const sendNowBtn = document.getElementById('mode-send-now');
    const scheduleBtn = document.getElementById('mode-schedule');
    const datetimeRow = document.getElementById('schedule-datetime-row');
    const sendLabel = document.getElementById('send-notif-label');

    if (mode === 'schedule') {
        scheduleBtn.classList.add('bg-primary', 'text-[#111813]');
        scheduleBtn.classList.remove('text-[#9db9a6]', 'hover:text-white');
        sendNowBtn.classList.remove('bg-primary', 'text-[#111813]');
        sendNowBtn.classList.add('text-[#9db9a6]', 'hover:text-white');
        datetimeRow.classList.remove('hidden');
        sendLabel.textContent = 'Schedule Notification';
        // Open flatpickr calendar + time picker
        const scheduledInput = document.getElementById('notif-scheduled-at');
        if (!scheduledInput._flatpickr) {
            flatpickr(scheduledInput, {
                enableTime: true,
                dateFormat: 'Y-m-dTH:i',
                altInput: true,
                altFormat: 'D, d M Y  •  h:i K',
                minDate: new Date(),
                disableMobile: true,
                time_24hr: false,
                onReady(_dates, _str, fp) {
                    fp.altInput.classList.add(
                        'w-full', 'py-2.5', 'pl-4', 'pr-10',
                        'bg-[#111813]', 'border', 'border-[#3b5443]',
                        'text-white', 'rounded-lg', 'text-sm', 'cursor-pointer',
                        'focus:outline-none', 'focus:border-primary'
                    );
                    fp.altInput.placeholder = 'Click to pick date & time...';
                },
            });
        } else {
            scheduledInput._flatpickr.set('minDate', new Date());
        }
    } else {
        sendNowBtn.classList.add('bg-primary', 'text-[#111813]');
        sendNowBtn.classList.remove('text-[#9db9a6]', 'hover:text-white');
        scheduleBtn.classList.remove('bg-primary', 'text-[#111813]');
        scheduleBtn.classList.add('text-[#9db9a6]', 'hover:text-white');
        datetimeRow.classList.add('hidden');
        if (sendLabel) sendLabel.textContent = 'Send Notification';
        const scheduledInput = document.getElementById('notif-scheduled-at');
        if (scheduledInput._flatpickr) scheduledInput._flatpickr.clear();
    }
}

// Clear notification form
function clearNotificationForm() {
    document.getElementById('notif-recipient-type').value = 'all';
    document.getElementById('specific-user-select-container').classList.add('hidden');
    document.getElementById('notif-specific-user').value = '';
    document.getElementById('notif-type').value = 'info';
    document.getElementById('notif-title').value = '';
    document.getElementById('notif-message').value = '';
    const scheduledInput = document.getElementById('notif-scheduled-at');
    if (scheduledInput._flatpickr) scheduledInput._flatpickr.clear();
    else scheduledInput.value = '';
    document.getElementById('message-counter').textContent = '0';
    setNotifMode('now');
}

// Send notification
async function sendNotification() {
    try {
        const recipientType = document.getElementById('notif-recipient-type').value;
        const specificUserId = document.getElementById('notif-specific-user').value;
        const type = document.getElementById('notif-type').value;
        const title = document.getElementById('notif-title').value.trim();
        const message = document.getElementById('notif-message').value.trim();
        const isSchedule = _notifMode === 'schedule';
        const scheduledAt = document.getElementById('notif-scheduled-at').value;

        // Validation
        if (!title) { alert('Please enter a notification title'); return; }
        if (!message) { alert('Please enter a notification message'); return; }
        if (recipientType === 'specific' && !specificUserId) { alert('Please select a specific user'); return; }
        if (isSchedule && !scheduledAt) { alert('Please select a schedule date and time'); return; }
        if (isSchedule && new Date(scheduledAt) <= new Date()) { alert('Scheduled time must be in the future'); return; }

        // ── Schedule mode — save to scheduled_notifications and stop ──
        if (isSchedule) {
            const sendBtn = document.getElementById('send-notif-btn');
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span><span>Scheduling...</span>';

            let recipientLabel = 'All Users';
            let recipientId = null;
            if (recipientType === 'specific') {
                const userDoc = await db.collection('users').doc(specificUserId).get();
                const ud = userDoc.exists ? userDoc.data() : {};
                recipientLabel = ud.full_name || ud.name || specificUserId;
                recipientId = ud.uid || specificUserId;
            }

            await db.collection('scheduled_notifications').add({
                type, title, message,
                recipient_type: recipientType,
                recipient_id: recipientId,
                recipient_label: recipientLabel,
                scheduled_for: firebase.firestore.Timestamp.fromDate(new Date(scheduledAt)),
                status: 'scheduled',
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                created_by: currentUser.uid,
            });

            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">schedule</span><span id="send-notif-label">Schedule Notification</span>';
            clearNotificationForm();
            await loadScheduledNotifications();
            return;
        }

        // Disable send button
        const sendBtn = document.getElementById('send-notif-btn');
        const originalBtnHTML = sendBtn.innerHTML;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span><span>Sending...</span>';

        // Prepare notification data
        const notificationData = {
            type: type,
            title: title,
            message: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false,
            sentBy: 'admin'
        };

        if (recipientType === 'specific') {
            // Send to specific user
            // Get user's Auth UID (not the document ID)
            const userDoc = await db.collection('users').doc(specificUserId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();

                // Use Firebase Auth UID, not document ID
                notificationData.farmer_id = userData.uid || specificUserId;

                // Save to Firestore
                await db.collection('notifications').add(notificationData);

                // If user has FCM token, send push notification via Cloud Function
                if (userData.fcmToken) {
                    // Note: This requires a Cloud Function to send FCM notifications
                    console.log('FCM token found, notification saved to Firestore');
                }

                alert(`Notification sent to user successfully!`);
            } else {
                alert('User not found');
            }
        } else {
            // Send to all users
            const usersSnapshot = await db.collection('users').get();
            const batch = db.batch();

            usersSnapshot.forEach(userDoc => {
                const userData = userDoc.data();
                const notifRef = db.collection('notifications').doc();
                const userNotifData = {
                    ...notificationData,
                    // Use Firebase Auth UID, not document ID
                    farmer_id: userData.uid || userDoc.id
                };
                batch.set(notifRef, userNotifData);
            });

            await batch.commit();
            alert(`Notification sent to ${usersSnapshot.size} users successfully!`);
        }

        // Clear form
        clearNotificationForm();

        // Reload notifications table
        await loadAllNotifications();

        // Re-enable send button
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalBtnHTML;

    } catch (error) {
        console.error('Error sending notification:', error);
        alert('Error sending notification: ' + error.message);

        // Re-enable send button
        const sendBtn = document.getElementById('send-notif-btn');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">send</span><span>Send Notification</span>';
    }
}

// ── Scheduled notifications list ──
async function loadScheduledNotifications() {
    const listEl = document.getElementById('scheduled-notifs-list');
    if (!listEl) return;

    try {
        const snap = await db.collection('scheduled_notifications')
            .where('status', '==', 'scheduled')
            .orderBy('scheduled_for', 'asc')
            .get();

        if (snap.empty) {
            listEl.innerHTML = '<div class="p-5 text-center text-[#9db9a6] text-sm">No scheduled notifications</div>';
            return;
        }

        listEl.innerHTML = snap.docs.map(doc => {
            const d = doc.data();
            const scheduledDate = d.scheduled_for?.toDate?.() || new Date(d.scheduled_for);
            const isPast = scheduledDate <= new Date();
            const dateStr = scheduledDate.toLocaleString('en-MY', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
            const typeColors = { info: 'text-blue-400', warning: 'text-yellow-400', alert: 'text-red-400', success: 'text-green-400' };
            const typeColor = typeColors[d.type] || 'text-[#9db9a6]';

            return `<div class="p-4 flex items-start gap-4">
                <div class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isPast ? 'bg-red-400/10' : 'bg-yellow-400/10'}">
                    <span class="material-symbols-outlined text-[18px] ${isPast ? 'text-red-400' : 'text-yellow-400'}">schedule</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                        <span class="text-white text-sm font-semibold truncate">${escapeHtml(d.title)}</span>
                        <span class="text-xs font-medium ${typeColor} uppercase">${d.type}</span>
                        ${isPast ? '<span class="text-xs text-red-400 font-medium">• Overdue</span>' : ''}
                    </div>
                    <p class="text-[#9db9a6] text-xs truncate mb-1">${escapeHtml(d.message)}</p>
                    <div class="flex items-center gap-3 text-xs text-[#9db9a6]">
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[13px]">group</span>
                            ${escapeHtml(d.recipient_label || 'All Users')}
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[13px]">calendar_today</span>
                            ${dateStr}
                        </span>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button onclick="sendScheduledNow('${doc.id}')"
                        class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-semibold transition-colors">
                        <span class="material-symbols-outlined text-[14px]">send</span> Send Now
                    </button>
                    <button onclick="cancelScheduledNotification('${doc.id}')"
                        class="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 hover:bg-red-400/20 border border-red-400/30 text-red-400 rounded-lg text-xs font-semibold transition-colors">
                        <span class="material-symbols-outlined text-[14px]">close</span> Cancel
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('Error loading scheduled notifications:', err);
        listEl.innerHTML = '<div class="p-5 text-center text-red-400 text-sm">Error loading scheduled notifications</div>';
    }
}

async function sendScheduledNow(docId) {
    if (!confirm('Send this notification now?')) return;
    try {
        const doc = await db.collection('scheduled_notifications').doc(docId).get();
        if (!doc.exists) return;
        const d = doc.data();

        const notificationData = {
            type: d.type,
            title: d.title,
            message: d.message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false,
            sentBy: 'admin',
        };

        if (d.recipient_type === 'specific' && d.recipient_id) {
            notificationData.farmer_id = d.recipient_id;
            await db.collection('notifications').add(notificationData);
        } else {
            const usersSnap = await db.collection('users').get();
            const batch = db.batch();
            usersSnap.forEach(userDoc => {
                const ref = db.collection('notifications').doc();
                batch.set(ref, { ...notificationData, farmer_id: userDoc.data().uid || userDoc.id });
            });
            await batch.commit();
        }

        // Mark as sent
        await db.collection('scheduled_notifications').doc(docId).update({ status: 'sent' });
        await loadScheduledNotifications();
        await loadAllNotifications();
    } catch (err) {
        alert('Failed to send: ' + err.message);
    }
}

async function cancelScheduledNotification(docId) {
    if (!confirm('Cancel this scheduled notification?')) return;
    try {
        await db.collection('scheduled_notifications').doc(docId).update({ status: 'cancelled' });
        await loadScheduledNotifications();
    } catch (err) {
        alert('Failed to cancel: ' + err.message);
    }
}

// ========================================
// SETTINGS PAGE
// ========================================

// Settings configuration stored in localStorage
const SETTINGS_KEY = 'smartfarm_admin_settings';

// Default settings
const defaultSettings = {
    thresholds: {
        soilMin: 20,
        tempMax: 40,
        waterMin: 20,
        phMin: 5.5,
        phMax: 7.5
    },
    autoDeleteOldData: true,
    emailNotifications: true,
    deviceTimeout: 300000 // 5 minutes in milliseconds
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
}

// Save settings to localStorage
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Initialize settings page
async function loadSettingsPage() {
    try {
        // Load current settings
        const settings = loadSettings();

        // Update threshold displays
        document.getElementById('threshold-soil-min').textContent = settings.thresholds.soilMin;
        document.getElementById('threshold-temp-max').textContent = settings.thresholds.tempMax;
        document.getElementById('threshold-water-min').textContent = settings.thresholds.waterMin;
        document.getElementById('threshold-ph-range').textContent = `${settings.thresholds.phMin}-${settings.thresholds.phMax}`;

        // Update toggles
        document.getElementById('auto-delete-toggle').checked = settings.autoDeleteOldData;
        document.getElementById('email-notif-toggle').checked = settings.emailNotifications;

        // Update device timeout
        document.getElementById('device-timeout-select').value = settings.deviceTimeout;

        // Load admin profile
        await loadAdminProfile();

        // Load database statistics
        await loadDatabaseStats();

        // Initialize event listeners (only once)
        initializeSettingsHandlers();

    } catch (error) {
        console.error('Error loading settings page:', error);
    }
}

// Load admin profile information
async function loadAdminProfile() {
    try {
        const user = auth.currentUser;
        if (user) {
            document.getElementById('admin-email-display').textContent = user.email || 'admin@smartfarm.com';
            document.getElementById('admin-name-display').textContent = user.displayName || 'Admin User';

            // Get last login from metadata
            if (user.metadata && user.metadata.lastSignInTime) {
                const lastLogin = new Date(user.metadata.lastSignInTime);
                document.getElementById('admin-last-login').textContent = lastLogin.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }
    } catch (error) {
        console.error('Error loading admin profile:', error);
    }
}

// Load database statistics
async function loadDatabaseStats() {
    try {
        // Total users
        const usersSnapshot = await db.collection('users').get();
        document.getElementById('db-total-users').textContent = usersSnapshot.size;

        // Total notifications
        const notificationsSnapshot = await db.collection('notifications').get();
        document.getElementById('db-total-notifications').textContent = notificationsSnapshot.size;

        // Total unique devices
        const cropsSnapshot = await db.collection('crops').get();
        const deviceIds = new Set();
        cropsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.device_id) deviceIds.add(data.device_id);
        });
        document.getElementById('db-total-devices').textContent = deviceIds.size;

    } catch (error) {
        console.error('Error loading database stats:', error);
    }
}

// Track if settings handlers have been initialized
let settingsHandlersInitialized = false;

// Initialize settings event handlers
function initializeSettingsHandlers() {
    if (settingsHandlersInitialized) return;
    settingsHandlersInitialized = true;

    const settings = loadSettings();

    // Edit thresholds
    document.getElementById('edit-thresholds-btn')?.addEventListener('click', () => {
        editThresholds();
    });

    // Auto-delete toggle
    document.getElementById('auto-delete-toggle')?.addEventListener('change', (e) => {
        settings.autoDeleteOldData = e.target.checked;
        saveSettings(settings);
        alert(`Auto-delete old data ${e.target.checked ? 'enabled' : 'disabled'}`);
    });

    // Email notifications toggle
    document.getElementById('email-notif-toggle')?.addEventListener('change', (e) => {
        settings.emailNotifications = e.target.checked;
        saveSettings(settings);
        alert(`Email notifications ${e.target.checked ? 'enabled' : 'disabled'}`);
    });

    // Device timeout select
    document.getElementById('device-timeout-select')?.addEventListener('change', (e) => {
        settings.deviceTimeout = parseInt(e.target.value);
        saveSettings(settings);
        alert('Device timeout updated successfully');
    });

    // Export database
    document.getElementById('export-database-btn')?.addEventListener('click', async () => {
        await exportDatabaseBackup();
    });

    // Clear old notifications
    document.getElementById('clear-old-notifications-btn')?.addEventListener('click', async () => {
        await clearOldNotifications();
    });

    // Change password
    document.getElementById('change-password-btn')?.addEventListener('click', () => {
        changeAdminPassword();
    });

    // View login history
    document.getElementById('view-login-history-btn')?.addEventListener('click', () => {
        viewLoginHistory();
    });

    // Edit admin profile
    document.getElementById('edit-admin-profile-btn')?.addEventListener('click', () => {
        editAdminProfile();
    });
}

// Edit sensor thresholds
function editThresholds() {
    const settings = loadSettings();

    const soilMin = prompt('Enter minimum soil moisture (%):', settings.thresholds.soilMin);
    if (soilMin !== null && soilMin !== '') {
        settings.thresholds.soilMin = parseFloat(soilMin);
    }

    const tempMax = prompt('Enter maximum temperature (°C):', settings.thresholds.tempMax);
    if (tempMax !== null && tempMax !== '') {
        settings.thresholds.tempMax = parseFloat(tempMax);
    }

    const waterMin = prompt('Enter minimum water level (%):', settings.thresholds.waterMin);
    if (waterMin !== null && waterMin !== '') {
        settings.thresholds.waterMin = parseFloat(waterMin);
    }

    const phMin = prompt('Enter minimum pH level:', settings.thresholds.phMin);
    if (phMin !== null && phMin !== '') {
        settings.thresholds.phMin = parseFloat(phMin);
    }

    const phMax = prompt('Enter maximum pH level:', settings.thresholds.phMax);
    if (phMax !== null && phMax !== '') {
        settings.thresholds.phMax = parseFloat(phMax);
    }

    saveSettings(settings);

    // Update displays
    document.getElementById('threshold-soil-min').textContent = settings.thresholds.soilMin;
    document.getElementById('threshold-temp-max').textContent = settings.thresholds.tempMax;
    document.getElementById('threshold-water-min').textContent = settings.thresholds.waterMin;
    document.getElementById('threshold-ph-range').textContent = `${settings.thresholds.phMin}-${settings.thresholds.phMax}`;

    alert('Thresholds updated successfully!');
}

// Export database backup
async function exportDatabaseBackup() {
    try {
        if (!confirm('This will download a JSON backup of all users, farms, and crops. Continue?')) {
            return;
        }

        const btn = document.getElementById('export-database-btn');
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<div class="flex items-center gap-3"><span class="material-symbols-outlined text-primary text-[24px] animate-spin">progress_activity</span><div><p class="text-white font-medium">Exporting...</p></div></div>';

        const backup = {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            users: [],
            crops: [],
            notifications: []
        };

        // Export users
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(doc => {
            backup.users.push({ id: doc.id, ...doc.data() });
        });

        // Export crops
        const cropsSnapshot = await db.collection('crops').get();
        cropsSnapshot.forEach(doc => {
            backup.crops.push({ id: doc.id, ...doc.data() });
        });

        // Export recent notifications (last 100)
        const notificationsSnapshot = await db.collection('notifications')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        notificationsSnapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firestore timestamp to ISO string
            if (data.createdAt) {
                data.createdAt = data.createdAt.toDate().toISOString();
            }
            backup.notifications.push({ id: doc.id, ...data });
        });

        // Create and download JSON file
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartfarm-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        btn.disabled = false;
        btn.innerHTML = originalHTML;

        alert(`Database backup exported successfully!\nUsers: ${backup.users.length}\nCrops: ${backup.crops.length}\nNotifications: ${backup.notifications.length}`);

    } catch (error) {
        console.error('Error exporting database:', error);
        alert('Error exporting database: ' + error.message);
        document.getElementById('export-database-btn').disabled = false;
    }
}

// Clear old notifications
async function clearOldNotifications() {
    try {
        if (!confirm('This will permanently delete notifications older than 30 days. Continue?')) {
            return;
        }

        const btn = document.getElementById('clear-old-notifications-btn');
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<div class="flex items-center gap-3"><span class="material-symbols-outlined text-yellow-500 text-[24px] animate-spin">progress_activity</span><div><p class="text-white font-medium">Clearing...</p></div></div>';

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const snapshot = await db.collection('notifications')
            .where('createdAt', '<', thirtyDaysAgo)
            .get();

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        btn.disabled = false;
        btn.innerHTML = originalHTML;

        alert(`Successfully deleted ${snapshot.size} old notifications`);

        // Reload database stats
        await loadDatabaseStats();

    } catch (error) {
        console.error('Error clearing notifications:', error);
        alert('Error clearing notifications: ' + error.message);
        document.getElementById('clear-old-notifications-btn').disabled = false;
    }
}

// Change admin password
function changeAdminPassword() {
    const user = auth.currentUser;
    if (!user) {
        alert('No user is currently signed in');
        return;
    }

    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword) return;

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    user.updatePassword(newPassword)
        .then(() => {
            alert('Password updated successfully!');
        })
        .catch((error) => {
            if (error.code === 'auth/requires-recent-login') {
                alert('For security reasons, please sign out and sign in again before changing your password.');
            } else {
                alert('Error updating password: ' + error.message);
            }
            console.error('Error updating password:', error);
        });
}

// View login history
function viewLoginHistory() {
    const user = auth.currentUser;
    if (!user || !user.metadata) {
        alert('No login history available');
        return;
    }

    const createdAt = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'N/A';
    const lastSignIn = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A';

    alert(`Account Created: ${createdAt}\nLast Sign In: ${lastSignIn}`);
}

// Edit admin profile
function editAdminProfile() {
    const user = auth.currentUser;
    if (!user) {
        alert('No user is currently signed in');
        return;
    }

    const newName = prompt('Enter new display name:', user.displayName || 'Admin User');
    if (!newName) return;

    user.updateProfile({
        displayName: newName
    })
        .then(() => {
            document.getElementById('admin-name-display').textContent = newName;
            alert('Profile updated successfully!');
        })
        .catch((error) => {
            alert('Error updating profile: ' + error.message);
            console.error('Error updating profile:', error);
        });
}

// ========================================
// ANALYTICS PAGE
// ========================================

let analyticsCharts = {
    soilMoisture: null,
    temperature: null,
    waterLevel: null,
    humidity: null,
    ph: null,
};

let selectedTimeRange = '7d'; // Default to 7 days
let selectedFarmId = null;
let selectedCropId = null;

// Load Analytics Page
async function loadAnalyticsPage() {
    try {
        await loadAnalyticsFarms();
        await loadAnalyticsData();
        initializeTimeRangeButtons();
        initializeDatePicker();
        loadAdminOverview(); // fire-and-forget, non-blocking
    } catch (error) {
        console.error('Error loading analytics page:', error);
    }
}

// Initialize Flatpickr calendar on custom date input
function initializeDatePicker() {
    const el = document.getElementById('analytics-custom-date');
    if (!el || el._flatpickr) return; // already initialized
    flatpickr(el, {
        dateFormat: 'd M Y',
        maxDate: 'today',
        disableMobile: true,
        onChange: async ([selectedDate]) => {
            if (!selectedDate) return;
            // Deactivate time range buttons when custom date is picked
            ['time-24h','time-7d','time-30d','time-all'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.classList.remove('bg-primary', 'font-medium');
                    btn.classList.add('bg-[#111813]', 'border', 'border-[#3b5443]');
                }
            });
            selectedTimeRange = 'custom';
            // Store selected date and reload
            window._analyticsCustomDate = selectedDate;
            await loadAnalyticsData();
        },
        onClear: async () => {
            window._analyticsCustomDate = null;
            selectedTimeRange = '7d';
            await loadAnalyticsData();
        }
    });
}

// ─── Admin Overview: KPI cards + pie/bar charts ───────────────────────────────
let overviewCharts = { deviceStatus: null, tickets: null, cropDist: null };

async function loadAdminOverview() {
    const CHART_BG = '#1c271f';
    const TOOLTIP_STYLE = {
        backgroundColor: '#1c271f',
        titleColor: '#fff',
        bodyColor: '#9db9a6',
        borderColor: '#28392e',
        borderWidth: 1,
        cornerRadius: 8,
    };

    try {
        // ── 1. Devices ──────────────────────────────────────────────────────
        const devSnap = await db.collection('devices').get();
        let available = 0, claimed = 0, inactive = 0;
        devSnap.forEach(d => {
            const s = d.data().status;
            if (s === 'available') available++;
            else if (s === 'claimed') claimed++;
            else inactive++;
        });
        const totalDevices = devSnap.size;
        const utilRate = totalDevices > 0 ? Math.round((claimed / totalDevices) * 100) : 0;

        const kpiDev = document.getElementById('kpi-total-devices');
        const kpiUtil = document.getElementById('kpi-utilization');
        if (kpiDev) kpiDev.textContent = totalDevices;
        if (kpiUtil) kpiUtil.textContent = utilRate + '% utilisation';

        // Device status donut
        const devPieCtx = document.getElementById('device-status-pie');
        if (devPieCtx) {
            if (overviewCharts.deviceStatus) overviewCharts.deviceStatus.destroy();
            const devLabels  = ['Available', 'Claimed', 'Inactive'];
            const devValues  = [available, claimed, inactive];
            const devColors  = ['#13EC37', '#3B82F6', '#EF4444'];
            overviewCharts.deviceStatus = new Chart(devPieCtx, {
                type: 'doughnut',
                data: { labels: devLabels, datasets: [{ data: devValues, backgroundColor: devColors, borderWidth: 0, hoverOffset: 18 }] },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '62%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { ...TOOLTIP_STYLE, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } }
                    }
                }
            });
            // Legend
            const leg = document.getElementById('device-status-legend');
            if (leg) leg.innerHTML = devLabels.map((l, i) =>
                `<span class="flex items-center gap-1 text-xs text-[#9db9a6]">
                    <span style="width:10px;height:10px;border-radius:50%;background:${devColors[i]};display:inline-block"></span>
                    ${l} <strong class="text-white">${devValues[i]}</strong>
                </span>`
            ).join('');
        }

        // ── 2. Support Tickets ───────────────────────────────────────────────
        let tickOpen = 0, tickProg = 0, tickDone = 0;
        try {
            const tSnap = await db.collection('support_tickets').get();
            tSnap.forEach(d => {
                const s = d.data().status;
                if (s === 'open') tickOpen++;
                else if (s === 'in_progress') tickProg++;
                else tickDone++;
            });
        } catch (_) {}
        const totalTickets = tickOpen + tickProg + tickDone;

        const kpiTick = document.getElementById('kpi-tickets');
        const kpiOpen = document.getElementById('kpi-open-tickets');
        if (kpiTick) kpiTick.textContent = totalTickets;
        if (kpiOpen) kpiOpen.textContent = tickOpen + ' open';

        const tickPieCtx = document.getElementById('tickets-pie');
        if (tickPieCtx) {
            if (overviewCharts.tickets) overviewCharts.tickets.destroy();
            const tLabels = ['Open', 'In Progress', 'Resolved'];
            const tValues = [tickOpen, tickProg, tickDone];
            const tColors = ['#13EC37', '#FBBF24', '#6B7280'];
            overviewCharts.tickets = new Chart(tickPieCtx, {
                type: 'doughnut',
                data: { labels: tLabels, datasets: [{ data: tValues, backgroundColor: tColors, borderWidth: 0, hoverOffset: 18 }] },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '62%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { ...TOOLTIP_STYLE, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } }
                    }
                }
            });
            const tLeg = document.getElementById('tickets-legend');
            if (tLeg) tLeg.innerHTML = tLabels.map((l, i) =>
                `<span class="flex items-center gap-1 text-xs text-[#9db9a6]">
                    <span style="width:10px;height:10px;border-radius:50%;background:${tColors[i]};display:inline-block"></span>
                    ${l} <strong class="text-white">${tValues[i]}</strong>
                </span>`
            ).join('');
        }

        // ── 3. Active Crops + Distribution ──────────────────────────────────
        const cropSnap = await db.collection('crops').where('status', '==', 'active').get();
        const cropTypeCounts = {};
        const farmerIds = new Set();
        cropSnap.forEach(d => {
            const data = d.data();
            const t = data.crop_type || 'Other';
            cropTypeCounts[t] = (cropTypeCounts[t] || 0) + 1;
            if (data.farmer_id) farmerIds.add(data.farmer_id);
        });

        const kpiCrops   = document.getElementById('kpi-crops');
        const kpiFarmers = document.getElementById('kpi-farmers');
        if (kpiCrops)   kpiCrops.textContent   = cropSnap.size;
        if (kpiFarmers) kpiFarmers.textContent  = farmerIds.size;

        // Crop distribution horizontal bar
        const cropBarCtx = document.getElementById('crop-dist-bar');
        if (cropBarCtx) {
            if (overviewCharts.cropDist) overviewCharts.cropDist.destroy();
            const CROP_COLORS = ['#13EC37','#3B82F6','#F97316','#A855F7','#14B8A6','#EF4444','#FBBF24'];
            const sorted = Object.entries(cropTypeCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);
            const barLabels = sorted.map(([k]) => k);
            const barValues = sorted.map(([, v]) => v);
            const barBgColors      = barLabels.map((_, i) => CROP_COLORS[i % CROP_COLORS.length]);
            const barHoverColors   = barBgColors.map(c => c + 'cc'); // slightly transparent on non-hovered (handled via hoverBackgroundColor)
            // Make hover color a brighter/whiter tint by mixing with white at 20%
            const brighten = hex => {
                const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
                const mix = (v) => Math.min(255, Math.round(v + (255-v)*0.3)).toString(16).padStart(2,'0');
                return `#${mix(r)}${mix(g)}${mix(b)}`;
            };

            overviewCharts.cropDist = new Chart(cropBarCtx, {
                type: 'bar',
                data: {
                    labels: barLabels,
                    datasets: [{
                        data: barValues,
                        backgroundColor: barBgColors,
                        hoverBackgroundColor: barBgColors.map(brighten),
                        borderRadius: 6,
                        borderWidth: 0,
                        borderSkipped: false,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { ...TOOLTIP_STYLE, callbacks: { label: ctx => ` ${ctx.parsed.x} farms` } },
                        datalabels: { display: false }
                    },
                    scales: {
                        x: { display: false, grid: { display: false } },
                        y: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } }
                    }
                }
            });
        }

    } catch (err) {
        console.error('Admin overview error:', err);
    }
}

// Load farms for analytics filter
async function loadAnalyticsFarms() {
    try {
        const snapshot = await db.collection('users').get();
        const farmSelect = document.getElementById('analytics-farm-filter');

        farmSelect.innerHTML = '<option value="">All Farms</option>';

        snapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.farm_name) {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = userData.farm_name;
                farmSelect.appendChild(option);
            }
        });

        // Add event listener for farm selection
        farmSelect.addEventListener('change', async (e) => {
            selectedFarmId = e.target.value || null;
            await loadCropsForFarm(selectedFarmId);
            await loadAnalyticsData();
        });
    } catch (error) {
        console.error('Error loading analytics farms:', error);
    }
}

// Load crops for selected farm
async function loadCropsForFarm(farmId) {
    try {
        const cropSelect = document.getElementById('analytics-crop-filter');
        cropSelect.innerHTML = '<option value="">All Crops</option>';

        if (!farmId) return;

        // Get the user's Firebase Auth UID first
        const userDoc = await db.collection('users').doc(farmId).get();
        if (!userDoc.exists) {
            console.error('Farm user not found:', farmId);
            return;
        }

        const userData = userDoc.data();
        const authUid = userData.uid || farmId;

        // Query crops by Firebase Auth UID
        let cropsSnapshot = await db.collection('crops')
            .where('farmer_id', '==', authUid)
            .get();

        // If no results, try with custom user ID
        if (cropsSnapshot.empty) {
            cropsSnapshot = await db.collection('crops')
                .where('farmer_id', '==', farmId)
                .get();
        }

        if (cropsSnapshot.empty) {
            console.log('No crops found for farm:', farmId, 'or auth UID:', authUid);
        }

        cropsSnapshot.forEach(doc => {
            const cropData = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${cropData.crop_type || 'Unknown'} (${cropData.device_id || 'N/A'})`;
            cropSelect.appendChild(option);
        });

        // Add event listener for crop selection (only once)
        const newCropSelect = cropSelect.cloneNode(true);
        cropSelect.parentNode.replaceChild(newCropSelect, cropSelect);

        newCropSelect.addEventListener('change', async (e) => {
            selectedCropId = e.target.value || null;
            await loadAnalyticsData();
        });
    } catch (error) {
        console.error('Error loading crops:', error);
    }
}

// Initialize time range buttons
function initializeTimeRangeButtons() {
    const buttons = {
        'time-24h': '24h',
        'time-7d': '7d',
        'time-30d': '30d',
        'time-all': 'all'
    };

    Object.entries(buttons).forEach(([buttonId, range]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', async () => {
                // Update button states
                Object.keys(buttons).forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) {
                        if (id === buttonId) {
                            btn.classList.remove('bg-[#111813]', 'border', 'border-[#3b5443]');
                            btn.classList.add('bg-primary', 'font-medium');
                        } else {
                            btn.classList.remove('bg-primary', 'font-medium');
                            btn.classList.add('bg-[#111813]', 'border', 'border-[#3b5443]');
                        }
                    }
                });

                selectedTimeRange = range;
                window._analyticsCustomDate = null;
                window._analyticsCustomEndTime = null;
                // Clear the flatpickr input
                const dp = document.getElementById('analytics-custom-date');
                if (dp && dp._flatpickr) dp._flatpickr.clear();
                await loadAnalyticsData();
            });
        }
    });
}

// Load Analytics Data
async function loadAnalyticsData() {
    try {
        // Get all device IDs to analyze
        let deviceIds = [];

        if (selectedCropId) {
            // Get specific crop's device
            const cropDoc = await db.collection('crops').doc(selectedCropId).get();
            if (cropDoc.exists) {
                const cropData = cropDoc.data();
                if (cropData.device_id) {
                    deviceIds.push(cropData.device_id);
                }
            }
        } else if (selectedFarmId) {
            // Get farmer's Firebase Auth UID
            const userDoc = await db.collection('users').doc(selectedFarmId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const authUid = userData.uid || selectedFarmId;

                // Query crops by Firebase Auth UID
                let cropsSnapshot = await db.collection('crops')
                    .where('farmer_id', '==', authUid)
                    .get();

                // If no results, try with custom user ID
                if (cropsSnapshot.empty) {
                    cropsSnapshot = await db.collection('crops')
                        .where('farmer_id', '==', selectedFarmId)
                        .get();
                }

                cropsSnapshot.forEach(doc => {
                    const cropData = doc.data();
                    if (cropData.device_id) {
                        deviceIds.push(cropData.device_id);
                    }
                });
            }
        } else {
            // Get all devices from all farms
            const cropsSnapshot = await db.collection('crops').get();
            cropsSnapshot.forEach(doc => {
                const cropData = doc.data();
                if (cropData.device_id) {
                    deviceIds.push(cropData.device_id);
                }
            });
        }

        // Remove duplicates
        deviceIds = [...new Set(deviceIds)];

        if (deviceIds.length === 0) {
            updateAnalyticsUI([], []);
            return;
        }

        // Show loading state on charts
        ['soilMoisture','temperature','waterLevel','humidity','ph'].forEach(k => {
            if (analyticsCharts[k]) { analyticsCharts[k].destroy(); analyticsCharts[k] = null; }
        });

        // Calculate time range
        const now = Date.now();
        let startTime = 0;
        switch (selectedTimeRange) {
            case '24h':
                startTime = now - (24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = now - (7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = now - (30 * 24 * 60 * 60 * 1000);
                break;
            case 'custom':
                if (window._analyticsCustomDate) {
                    const d = new Date(window._analyticsCustomDate);
                    d.setHours(0, 0, 0, 0);
                    startTime = d.getTime();
                    // endTime = end of the selected day
                    window._analyticsCustomEndTime = d.getTime() + 86400000 - 1;
                } else {
                    startTime = 0;
                }
                break;
            default:
                startTime = 0; // All time
        }

        const startTimestamp = Math.floor(startTime / 1000);
        const endTimestamp = selectedTimeRange === 'custom' && window._analyticsCustomEndTime
            ? Math.floor(window._analyticsCustomEndTime / 1000)
            : null;

        // Helper: build a query with optional endAt
        function buildQuery(ref) {
            let q = ref.orderByKey().startAt(startTimestamp.toString());
            if (endTimestamp) q = q.endAt(endTimestamp.toString());
            return q;
        }

        // Fetch historical sensor data for all devices
        const allHistoricalData = [];
        for (const deviceId of deviceIds) {
            try {
                const soilSnapshot    = await buildQuery(rtdb.ref(`sensors/${deviceId}/history/soil`)).once('value');
                const tempSnapshot    = await buildQuery(rtdb.ref(`sensors/${deviceId}/history/temp`)).once('value');
                const humiditySnapshot= await buildQuery(rtdb.ref(`sensors/${deviceId}/history/humidity`)).once('value');
                const phSnapshot      = await buildQuery(rtdb.ref(`sensors/${deviceId}/history/ph`)).once('value');
                const waterSnapshot   = await buildQuery(rtdb.ref(`sensors/${deviceId}/history/waterLevel`)).once('value');

                // Combine all historical data by timestamp
                const combinedData = {};

                if (soilSnapshot.exists()) {
                    const soilData = soilSnapshot.val();
                    Object.keys(soilData).forEach(timestamp => {
                        if (!combinedData[timestamp]) {
                            combinedData[timestamp] = { timestamp: parseInt(timestamp) * 1000 };
                        }
                        combinedData[timestamp].soilMoisture = soilData[timestamp];
                    });
                }

                if (tempSnapshot.exists()) {
                    const tempData = tempSnapshot.val();
                    Object.keys(tempData).forEach(timestamp => {
                        if (!combinedData[timestamp]) {
                            combinedData[timestamp] = { timestamp: parseInt(timestamp) * 1000 };
                        }
                        combinedData[timestamp].temperature = tempData[timestamp];
                    });
                }

                if (humiditySnapshot.exists()) {
                    const humidityData = humiditySnapshot.val();
                    Object.keys(humidityData).forEach(timestamp => {
                        if (!combinedData[timestamp]) {
                            combinedData[timestamp] = { timestamp: parseInt(timestamp) * 1000 };
                        }
                        combinedData[timestamp].humidity = humidityData[timestamp];
                    });
                }

                if (phSnapshot.exists()) {
                    const phData = phSnapshot.val();
                    Object.keys(phData).forEach(timestamp => {
                        if (!combinedData[timestamp]) {
                            combinedData[timestamp] = { timestamp: parseInt(timestamp) * 1000 };
                        }
                        combinedData[timestamp].ph = phData[timestamp];
                    });
                }

                if (waterSnapshot.exists()) {
                    const waterData = waterSnapshot.val();
                    Object.keys(waterData).forEach(timestamp => {
                        if (!combinedData[timestamp]) {
                            combinedData[timestamp] = { timestamp: parseInt(timestamp) * 1000 };
                        }
                        combinedData[timestamp].waterLevel = waterData[timestamp];
                    });
                }

                // Convert to array
                Object.values(combinedData).forEach(dataPoint => {
                    allHistoricalData.push(dataPoint);
                });

            } catch (error) {
                console.error(`Error loading device ${deviceId}:`, error);
            }
        }

        // If selected range has no data, fall back to most recent available readings
        const notice = document.getElementById('analytics-range-notice');
        if (allHistoricalData.length === 0 && selectedTimeRange !== 'all') {
            if (notice) notice.classList.remove('hidden');

            const SENSOR_MAP = {
                soil: 'soilMoisture', temp: 'temperature',
                humidity: 'humidity', ph: 'ph', waterLevel: 'waterLevel',
            };

            // How many data points to fetch per sensor based on range
            const fallbackLimit = (selectedTimeRange === '24h' || selectedTimeRange === 'custom') ? 24
                                : selectedTimeRange === '7d' ? 168
                                : 60;

            for (const deviceId of deviceIds) {
                try {
                    const combined = {};
                    for (const [rtdbKey, jsKey] of Object.entries(SENSOR_MAP)) {
                        const snap = await rtdb.ref(`sensors/${deviceId}/history/${rtdbKey}`)
                            .orderByKey().limitToLast(fallbackLimit).once('value');
                        if (snap.exists()) {
                            Object.entries(snap.val()).forEach(([ts, val]) => {
                                if (!combined[ts]) combined[ts] = { timestamp: parseInt(ts) * 1000 };
                                combined[ts][jsKey] = val;
                            });
                        }
                    }
                    Object.values(combined).forEach(dp => allHistoricalData.push(dp));
                } catch (err) {
                    console.error('Fallback fetch error:', err);
                }
            }
        } else {
            if (notice) notice.classList.add('hidden');
        }

        // Update UI with analytics (empty array shows "no data" state correctly)
        updateAnalyticsUI(allHistoricalData, allHistoricalData);
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

// Update Analytics UI
function updateAnalyticsUI(filteredData, allData) {
    if (filteredData.length === 0) {
        document.getElementById('avg-soil-moisture').textContent = '--%';
        document.getElementById('avg-temperature').textContent = '--°C';
        document.getElementById('avg-ph').textContent = '--';
        document.getElementById('soil-moisture-change').textContent = '+0.0%';
        document.getElementById('temperature-change').textContent = '-0.0°C';
        document.getElementById('ph-status').textContent = 'No Data';

        // Clear charts
        ['soilMoisture','temperature','waterLevel','humidity','ph'].forEach(k => {
            if (analyticsCharts[k]) { analyticsCharts[k].destroy(); analyticsCharts[k] = null; }
        });
        return;
    }

    // Calculate averages
    const avgSoilMoisture = filteredData.reduce((sum, d) => sum + (d.soilMoisture || 0), 0) / filteredData.length;
    const avgTemperature = filteredData.reduce((sum, d) => sum + (d.temperature || 0), 0) / filteredData.length;
    const avgPh = filteredData.reduce((sum, d) => sum + (d.ph || 0), 0) / filteredData.length;

    // Calculate changes (compare with previous period)
    const previousData = allData.filter(d => {
        const now = Date.now();
        let timeLimit = 0;
        switch (selectedTimeRange) {
            case '24h':
                timeLimit = now - (48 * 60 * 60 * 1000); // Previous 24h
                break;
            case '7d':
                timeLimit = now - (14 * 24 * 60 * 60 * 1000); // Previous 7d
                break;
            case '30d':
                timeLimit = now - (60 * 24 * 60 * 60 * 1000); // Previous 30d
                break;
            default:
                return false;
        }
        return d.timestamp && d.timestamp >= timeLimit && d.timestamp < (now - getTimeRangeMs());
    });

    let soilMoistureChange = 0;
    let temperatureChange = 0;

    if (previousData.length > 0) {
        const prevAvgSoil = previousData.reduce((sum, d) => sum + (d.soilMoisture || 0), 0) / previousData.length;
        const prevAvgTemp = previousData.reduce((sum, d) => sum + (d.temperature || 0), 0) / previousData.length;

        soilMoistureChange = ((avgSoilMoisture - prevAvgSoil) / prevAvgSoil) * 100;
        temperatureChange = avgTemperature - prevAvgTemp;
    }

    // Update statistics cards
    document.getElementById('avg-soil-moisture').textContent = `${avgSoilMoisture.toFixed(0)}%`;
    document.getElementById('avg-temperature').textContent = `${avgTemperature.toFixed(0)}°C`;
    document.getElementById('avg-ph').textContent = avgPh.toFixed(1);

    // Update changes
    const soilChangeEl = document.getElementById('soil-moisture-change');
    soilChangeEl.textContent = `${soilMoistureChange >= 0 ? '+' : ''}${soilMoistureChange.toFixed(1)}%`;
    soilChangeEl.className = soilMoistureChange >= 0 ? 'text-green-500 text-sm font-medium' : 'text-red-500 text-sm font-medium';

    const tempChangeEl = document.getElementById('temperature-change');
    tempChangeEl.textContent = `${temperatureChange >= 0 ? '+' : ''}${temperatureChange.toFixed(1)}°C`;
    tempChangeEl.className = temperatureChange >= 0 ? 'text-red-500 text-sm font-medium' : 'text-blue-500 text-sm font-medium';

    // Update pH status
    const phStatusEl = document.getElementById('ph-status');
    if (avgPh >= 6.0 && avgPh <= 7.5) {
        phStatusEl.textContent = 'Stable';
        phStatusEl.className = 'text-green-500 text-sm font-medium';
    } else if (avgPh >= 5.5 && avgPh <= 8.0) {
        phStatusEl.textContent = 'Fair';
        phStatusEl.className = 'text-yellow-500 text-sm font-medium';
    } else {
        phStatusEl.textContent = 'Warning';
        phStatusEl.className = 'text-red-500 text-sm font-medium';
    }

    // Generate chart data
    generateCharts(filteredData);
}

// Get time range in milliseconds
function getTimeRangeMs() {
    switch (selectedTimeRange) {
        case '24h': return 24 * 60 * 60 * 1000;
        case '7d': return 7 * 24 * 60 * 60 * 1000;
        case '30d': return 30 * 24 * 60 * 60 * 1000;
        default: return Infinity;
    }
}

// Generate Charts
function generateCharts(data) {
    console.log('Generating charts with data:', data);

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded!');
        return;
    }

    // Sort data by timestamp (guard against missing timestamps)
    const sortedData = [...data]
        .filter(d => d && d.timestamp != null && !isNaN(d.timestamp))
        .sort((a, b) => a.timestamp - b.timestamp);

    if (sortedData.length === 0) {
        console.log('No valid timestamped data to chart');
        return;
    }

    // Group data by hour for smoother charts
    const hourlyData = {};
    sortedData.forEach(d => {
        const hourKey = new Date(d.timestamp).toISOString().slice(0, 13); // Group by hour
        if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = { soilMoisture: [], temperature: [], waterLevel: [], humidity: [], ph: [] };
        }
        if (d.soilMoisture) hourlyData[hourKey].soilMoisture.push(d.soilMoisture);
        if (d.temperature)  hourlyData[hourKey].temperature.push(d.temperature);
        if (d.waterLevel)   hourlyData[hourKey].waterLevel.push(d.waterLevel);
        if (d.humidity)     hourlyData[hourKey].humidity.push(d.humidity);
        if (d.ph)           hourlyData[hourKey].ph.push(d.ph);
    });

    // Calculate hourly averages
    const labels = [];
    const soilMoistureValues = [];
    const temperatureValues = [];
    const waterLevelValues = [];
    const humidityValues = [];
    const phValues = [];

    const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    Object.keys(hourlyData).sort().forEach(hourKey => {
        const date = new Date(hourKey + ':00:00Z');
        labels.push(date);
        soilMoistureValues.push(avg(hourlyData[hourKey].soilMoisture));
        temperatureValues.push(avg(hourlyData[hourKey].temperature));
        waterLevelValues.push(avg(hourlyData[hourKey].waterLevel));
        humidityValues.push(avg(hourlyData[hourKey].humidity));
        phValues.push(avg(hourlyData[hourKey].ph));
    });

    // ── Error threshold helpers ──────────────────────────────────────────────
    const THRESHOLDS = {
        soilMoisture: { min: 20, max: 90,  unit: '%',   label: 'Soil Moisture' },
        temperature:  { min: 10, max: 40,  unit: '°C',  label: 'Temperature'   },
        humidity:     { min: 20, max: 90,  unit: '%',   label: 'Humidity'      },
        ph:           { min: 5,  max: 8,   unit: ' pH', label: 'pH Level'      },
        waterLevel:   { min: 10, max: 100, unit: '%',   label: 'Water Level'   },
    };

    function isErr(key, v) {
        if (v == null) return false;
        return v < THRESHOLDS[key].min || v > THRESHOLDS[key].max;
    }

    function ptColors(key, values, normalColor) {
        return values.map(v => isErr(key, v) ? '#ef4444' : normalColor);
    }

    function ptSizes(key, values) {
        return values.map(v => isErr(key, v) ? 7 : 3);
    }

    function ptBorderColors(key, values) {
        return values.map(v => isErr(key, v) ? '#ffffff' : 'transparent');
    }

    function makeTooltip(key, values) {
        return {
            mode: 'index', intersect: false,
            backgroundColor: '#1c271f', titleColor: '#fff',
            bodyColor: '#9db9a6', borderColor: '#28392e', borderWidth: 1,
            callbacks: {
                afterBody(ctx) {
                    const v = values[ctx[0]?.dataIndex];
                    if (v == null) return [];
                    const t = THRESHOLDS[key];
                    if (v < t.min) return [`⚠ ERROR: Too low (safe min ${t.min}${t.unit})`];
                    if (v > t.max) return [`⚠ ERROR: Too high (safe max ${t.max}${t.unit})`];
                    return [];
                },
                afterBodyColor() { return '#ef4444'; },
            }
        };
    }

    // Short x-axis tick formatter — format depends on selected time range
    const xTickCb = function(val, index) {
        const d = labels[index];
        if (!d) return '';
        const date = new Date(d);
        if (selectedTimeRange === '24h' || selectedTimeRange === 'custom') {
            // Hours only: "06:00"
            const hr  = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            return `${hr}:${min}`;
        }
        if (selectedTimeRange === '7d') {
            // Weekday + day: "Mon 14"
            const wd  = date.toLocaleDateString('en', { weekday: 'short' });
            const day = date.getDate();
            const hr  = String(date.getHours()).padStart(2, '0');
            return `${wd} ${day}, ${hr}:00`;
        }
        // 30d / all / custom: "May 14"
        const mon = date.toLocaleDateString('en', { month: 'short' });
        const day = date.getDate();
        return `${mon} ${day}`;
    };
    const xAxisOpts = {
        grid: { color: '#28392e' },
        ticks: { color: '#9db9a6', maxTicksLimit: 6, maxRotation: 0, callback: xTickCb }
    };

    console.log('Chart data prepared - Labels:', labels.length, 'Soil values:', soilMoistureValues.length);

    // Generate Soil Moisture Chart
    const soilMoistureCtx = document.getElementById('soil-moisture-chart');
    if (!soilMoistureCtx) {
        console.error('Soil moisture chart canvas not found!');
        return;
    }

    if (analyticsCharts.soilMoisture) {
        analyticsCharts.soilMoisture.destroy();
    }

    try {
        analyticsCharts.soilMoisture = new Chart(soilMoistureCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Soil Moisture (%)',
                    data: soilMoistureValues,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74,222,128,0.1)',
                    borderWidth: 2, fill: true, tension: 0.4, spanGaps: true,
                    pointRadius: ptSizes('soilMoisture', soilMoistureValues),
                    pointBackgroundColor: ptColors('soilMoisture', soilMoistureValues, '#4ade80'),
                    pointBorderColor: ptBorderColors('soilMoisture', soilMoistureValues),
                    pointBorderWidth: 2,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: makeTooltip('soilMoisture', soilMoistureValues) },
                scales: { x: xAxisOpts, y: { beginAtZero: true, max: 100, grid: { color: '#28392e' }, ticks: { color: '#9db9a6', callback: v => v + '%' } } }
            }
        });
        console.log('Soil moisture chart created successfully');
    } catch (error) {
        console.error('Error creating soil moisture chart:', error);
    }

    // Generate Temperature Chart
    const temperatureCtx = document.getElementById('temperature-chart');
    if (!temperatureCtx) {
        console.error('Temperature chart canvas not found!');
        return;
    }

    if (analyticsCharts.temperature) {
        analyticsCharts.temperature.destroy();
    }

    try {
        analyticsCharts.temperature = new Chart(temperatureCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temperatureValues,
                    borderColor: '#fb923c',
                    backgroundColor: 'rgba(251,146,60,0.1)',
                    borderWidth: 2, fill: true, tension: 0.4, spanGaps: true,
                    pointRadius: ptSizes('temperature', temperatureValues),
                    pointBackgroundColor: ptColors('temperature', temperatureValues, '#fb923c'),
                    pointBorderColor: ptBorderColors('temperature', temperatureValues),
                    pointBorderWidth: 2,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: makeTooltip('temperature', temperatureValues) },
                scales: { x: xAxisOpts, y: { grid: { color: '#28392e' }, ticks: { color: '#9db9a6', callback: v => v + '°C' } } }
            }
        });
        console.log('Temperature chart created successfully');
    } catch (error) {
        console.error('Error creating temperature chart:', error);
    }

    // Generate Water Level Chart
    const waterLevelCtx = document.getElementById('water-level-chart');
    if (!waterLevelCtx) {
        console.error('Water level chart canvas not found!');
        return;
    }

    if (analyticsCharts.waterLevel) {
        analyticsCharts.waterLevel.destroy();
    }

    try {
        analyticsCharts.waterLevel = new Chart(waterLevelCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Water Level (%)',
                    data: waterLevelValues,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    borderWidth: 2, fill: true, tension: 0.4, spanGaps: true,
                    pointRadius: ptSizes('waterLevel', waterLevelValues),
                    pointBackgroundColor: ptColors('waterLevel', waterLevelValues, '#3b82f6'),
                    pointBorderColor: ptBorderColors('waterLevel', waterLevelValues),
                    pointBorderWidth: 2,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: makeTooltip('waterLevel', waterLevelValues) },
                scales: { x: xAxisOpts, y: { beginAtZero: true, max: 100, grid: { color: '#28392e' }, ticks: { color: '#9db9a6', callback: v => v + '%' } } }
            }
        });
        console.log('Water level chart created successfully');
    } catch (error) {
        console.error('Error creating water level chart:', error);
    }

    // Generate Humidity Chart
    const humidityCtx = document.getElementById('humidity-chart');
    if (humidityCtx) {
        if (analyticsCharts.humidity) analyticsCharts.humidity.destroy();
        try {
            analyticsCharts.humidity = new Chart(humidityCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Humidity (%)',
                        data: humidityValues,
                        borderColor: '#2dd4bf',
                        backgroundColor: 'rgba(45,212,191,0.1)',
                        borderWidth: 2, fill: true, tension: 0.4, spanGaps: true,
                        pointRadius: ptSizes('humidity', humidityValues),
                        pointBackgroundColor: ptColors('humidity', humidityValues, '#2dd4bf'),
                        pointBorderColor: ptBorderColors('humidity', humidityValues),
                        pointBorderWidth: 2,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: makeTooltip('humidity', humidityValues) },
                    scales: { x: xAxisOpts, y: { beginAtZero: true, max: 100, grid: { color: '#28392e' }, ticks: { color: '#9db9a6', callback: v => v + '%' } } }
                }
            });
        } catch (e) { console.error('Error creating humidity chart:', e); }
    }

    // Generate pH Chart
    const phCtx = document.getElementById('ph-chart');
    if (phCtx) {
        if (analyticsCharts.ph) analyticsCharts.ph.destroy();
        try {
            analyticsCharts.ph = new Chart(phCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'pH Level',
                        data: phValues,
                        borderColor: '#c084fc',
                        backgroundColor: 'rgba(192,132,252,0.1)',
                        borderWidth: 2, fill: true, tension: 0.4, spanGaps: true,
                        pointRadius: ptSizes('ph', phValues),
                        pointBackgroundColor: ptColors('ph', phValues, '#c084fc'),
                        pointBorderColor: ptBorderColors('ph', phValues),
                        pointBorderWidth: 2,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: makeTooltip('ph', phValues) },
                    scales: { x: xAxisOpts, y: { min: 0, max: 14, grid: { color: '#28392e' }, ticks: { color: '#9db9a6', callback: v => v + ' pH' } } }
                }
            });
        } catch (e) { console.error('Error creating pH chart:', e); }
    }
}

// ── Report Preview ────────────────────────────────────────────────────────────
document.getElementById('export-report-btn')?.addEventListener('click', () => {
    openReportPreview();
});

function openReportPreview() {
    const now        = new Date();
    const adminName  = document.getElementById('admin-name-text')?.textContent || 'Admin';
    const farmSelect = document.getElementById('analytics-farm-filter');
    const cropSelect = document.getElementById('analytics-crop-filter');
    const farmLabel  = farmSelect?.options[farmSelect.selectedIndex]?.text || 'All Farms';
    const cropLabel  = (cropSelect && cropSelect.options.length > 0)
        ? cropSelect.options[cropSelect.selectedIndex]?.text || 'All Crops'
        : 'All Crops';
    const timeLabel  = selectedTimeRange === '24h' ? 'Last 24 Hours'
                     : selectedTimeRange === '7d'  ? 'Last 7 Days'
                     : selectedTimeRange === '30d' ? 'Last 30 Days'
                     : 'All Time';

    // Populate metadata
    document.getElementById('rp-farm').textContent  = farmLabel;
    document.getElementById('rp-crop').textContent  = cropLabel;
    document.getElementById('rp-range').textContent = timeLabel;
    document.getElementById('rp-admin').textContent = adminName;
    document.getElementById('rp-date').textContent  = now.toLocaleString('en-MY', {
        year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
    });

    // Populate stats
    document.getElementById('rp-soil').textContent = document.getElementById('avg-soil-moisture')?.textContent || '—';
    document.getElementById('rp-temp').textContent = document.getElementById('avg-temperature')?.textContent || '—';
    document.getElementById('rp-ph').textContent   = document.getElementById('avg-ph')?.textContent || '—';

    // Chart thumbnails
    const chartsContainer = document.getElementById('rp-charts');
    chartsContainer.innerHTML = '';
    const chartDefs = [
        { id:'device-status-pie',   label:'Device Status',       color:'#2bec6c' },
        { id:'tickets-pie',         label:'Ticket Status',       color:'#c084fc' },
        { id:'crop-dist-bar',       label:'Crop Distribution',   color:'#fb923c' },
        { id:'soil-moisture-chart', label:'Soil Moisture Trend', color:'#4ade80' },
        { id:'temperature-chart',   label:'Temperature Trend',   color:'#fb923c' },
        { id:'humidity-chart',      label:'Humidity Trend',      color:'#2dd4bf' },
        { id:'ph-chart',            label:'pH Level Trend',      color:'#c084fc' },
        { id:'water-level-chart',   label:'Water Tank Level',    color:'#60a5fa' },
    ];
    chartDefs.forEach(({ id, label, color }) => {
        const canvas = document.getElementById(id);
        const wrap   = document.createElement('div');
        wrap.className = 'bg-[#1c271f] rounded-xl border border-[#3b5443] overflow-hidden';
        if (canvas) {
            try {
                const imgSrc = canvas.toDataURL('image/png');
                wrap.innerHTML = `
                    <div class="px-4 pt-3 pb-1 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${color}"></span>
                        <p class="text-white text-xs font-semibold">${label}</p>
                    </div>
                    <img src="${imgSrc}" alt="${label}" class="w-full" style="display:block">`;
            } catch {
                wrap.innerHTML = `<p class="text-[#9db9a6] text-xs p-4">Chart unavailable</p>`;
            }
        } else {
            wrap.innerHTML = `<p class="text-[#9db9a6] text-xs p-4">No data for ${label}</p>`;
        }
        chartsContainer.appendChild(wrap);
    });

    // Wire buttons
    const modal      = document.getElementById('report-preview-modal');
    const closePreview = () => modal.classList.add('hidden');

    const closeBtn   = document.getElementById('close-report-preview');
    const cancelBtn  = document.getElementById('rp-cancel-btn');
    const dlBtn      = document.getElementById('rp-download-btn');

    const newClose  = closeBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    const newDl     = dlBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    dlBtn.parentNode.replaceChild(newDl, dlBtn);

    newClose.addEventListener('click',  closePreview);
    newCancel.addEventListener('click', closePreview);
    modal.addEventListener('click', e => { if (e.target === modal) closePreview(); });

    newDl.addEventListener('click', async () => {
        closePreview();
        await generateAndDownloadPDF();
    });

    modal.classList.remove('hidden');
}

// ── PDF Generation ────────────────────────────────────────────────────────────
async function generateAndDownloadPDF() {
    const btn = document.getElementById('export-report-btn');
    const originalHTML = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">hourglass_empty</span><span class="font-medium">Generating PDF...</span>';

        if (!window.jspdf) throw new Error('PDF library not loaded. Please refresh and try again.');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pageW = 210, pageH = 297, margin = 15;
        const contentW = pageW - margin * 2;          // 180 mm
        const halfW    = (contentW - 3) / 2;          // 88.5 mm (2-col layout)
        const thirdW   = (contentW - 6) / 3;          // 58 mm  (3-col layout)
        const quarterW = (contentW - 9) / 4;          // 42.75 mm (4-col KPIs)

        const C = {
            green:    [43, 238, 108],
            darkBg:   [16, 34, 22],
            surface:  [28, 39, 31],
            surface2: [40, 57, 46],
            muted:    [157, 185, 166],
            white:    [255, 255, 255],
            soil:     [74, 222, 128],
            temp:     [251, 146, 60],
            humidity: [45, 212, 191],
            ph:       [192, 132, 252],
            water:    [96, 165, 250],
            blue:     [96, 165, 250],
            orange:   [251, 146, 60],
            purple:   [192, 132, 252],
        };

        const now       = new Date();
        const dateStr   = now.toLocaleDateString('en-MY', { year:'numeric', month:'short', day:'numeric' });
        const timeStr   = now.toLocaleTimeString('en-MY', { hour:'2-digit', minute:'2-digit' });
        const adminName = document.getElementById('admin-name-text')?.textContent || 'Admin';

        const farmSelect = document.getElementById('analytics-farm-filter');
        const cropSelect = document.getElementById('analytics-crop-filter');
        const farmLabel  = farmSelect?.options[farmSelect.selectedIndex]?.text || 'All Farms';
        const cropLabel  = (cropSelect && cropSelect.options.length > 0)
            ? cropSelect.options[cropSelect.selectedIndex]?.text || 'All Crops' : 'All Crops';
        const timeLabel  = selectedTimeRange === '24h' ? 'Last 24 Hours'
                         : selectedTimeRange === '7d'  ? 'Last 7 Days'
                         : selectedTimeRange === '30d' ? 'Last 30 Days' : 'All Time';

        // ── Helpers ───────────────────────────────────────────────────
        function sectionLabel(text, y) {
            doc.setFillColor(...C.green);
            doc.rect(margin, y, 2.5, 5, 'F');
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.green);
            doc.text(text.toUpperCase(), margin + 5, y + 4);
            return y + 9;
        }

        function embedChart(canvasId, x, y, w, h) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            try {
                doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h);
            } catch {
                doc.setFontSize(7);
                doc.setTextColor(...C.muted);
                doc.text('No data available', x + w / 2, y + h / 2, { align: 'center' });
            }
        }

        // Draw a chart card with label, safe range label, and embedded canvas
        function chartCard(x, y, w, h, canvasId, label, safeRange, accent) {
            doc.setFillColor(...C.surface);
            doc.roundedRect(x, y, w, h, 2, 2, 'F');
            doc.setFillColor(...accent);
            doc.roundedRect(x, y, w, 2.5, 1, 1, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.white);
            doc.text(label, x + 4, y + 9.5);
            if (safeRange) {
                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...C.muted);
                doc.text(safeRange, x + w - 4, y + 9.5, { align: 'right' });
            }
            embedChart(canvasId, x + 3, y + 12, w - 6, h - 14);
        }

        // ════════════════════════════════════════════════════════════
        // PAGE 1 — Overview
        // ════════════════════════════════════════════════════════════

        // ── Header ────────────────────────────────────────────────
        doc.setFillColor(...C.darkBg);
        doc.rect(0, 0, pageW, 35, 'F');
        doc.setFillColor(...C.green);
        doc.rect(0, 0, 4, 35, 'F');
        // Bottom green line
        doc.setFillColor(...C.surface2);
        doc.rect(0, 34.5, pageW, 0.8, 'F');

        doc.setFontSize(19);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.green);
        doc.text('AgroEzuran', margin + 5, 16);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.muted);
        doc.text('AgroEzuran  ·  Admin Analytics Report', margin + 5, 24);

        // "CONFIDENTIAL" tag
        doc.setFillColor(...C.surface2);
        doc.roundedRect(margin + 5, 26.5, 26, 5, 1, 1, 'F');
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.green);
        doc.text('CONFIDENTIAL', margin + 5 + 13, 30, { align: 'center' });

        // Right side: generated info
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.muted);
        doc.text(`Generated: ${dateStr}  ${timeStr}`, pageW - margin, 16, { align: 'right' });
        doc.text(`By: ${adminName}`, pageW - margin, 24, { align: 'right' });

        let y = 40;

        // ── Filter / Scope Bar ─────────────────────────────────────
        doc.setFillColor(...C.surface);
        doc.roundedRect(margin, y, contentW, 18, 2, 2, 'F');
        doc.setFillColor(...C.green);
        doc.rect(margin, y, 2, 18, 'F');

        [{ label:'FARM', value:farmLabel }, { label:'CROP', value:cropLabel }, { label:'TIME RANGE', value:timeLabel }]
        .forEach((f, i) => {
            const fx = margin + 5 + i * (contentW / 3);
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.muted);
            doc.text(f.label, fx, y + 7);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.white);
            doc.text(f.value, fx, y + 14);
        });
        doc.setFont('helvetica', 'normal');
        y += 23;

        // ── Section: Platform Overview ─────────────────────────────
        y = sectionLabel('Platform Overview', y);

        // KPI cards (4 in a row)
        const kpis = [
            { label:'Total Devices',   value: document.getElementById('kpi-total-devices')?.textContent || '—', sub: document.getElementById('kpi-utilization')?.textContent || '',          accent: C.green  },
            { label:'Active Farmers',  value: document.getElementById('kpi-farmers')?.textContent || '—',        sub: 'registered users',                                                     accent: C.blue   },
            { label:'Active Crops',    value: document.getElementById('kpi-crops')?.textContent || '—',          sub: 'currently monitored',                                                  accent: C.orange },
            { label:'Support Tickets', value: document.getElementById('kpi-tickets')?.textContent || '—',        sub: document.getElementById('kpi-open-tickets')?.textContent || '0 open',  accent: C.purple },
        ];
        kpis.forEach((k, i) => {
            const kx = margin + i * (quarterW + 3);
            doc.setFillColor(...C.surface);
            doc.roundedRect(kx, y, quarterW, 26, 2, 2, 'F');
            doc.setFillColor(...k.accent);
            doc.roundedRect(kx, y, quarterW, 2, 1, 1, 'F');
            doc.setFontSize(15);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.white);
            doc.text(k.value, kx + quarterW / 2, y + 14, { align: 'center' });
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.muted);
            doc.text(k.label, kx + quarterW / 2, y + 20, { align: 'center' });
            doc.setFontSize(5.5);
            doc.setTextColor(...k.accent);
            doc.text(k.sub, kx + quarterW / 2, y + 25, { align: 'center' });
        });
        y += 31;

        // ── Section: Device & Crop Distribution ────────────────────
        y = sectionLabel('Device & Crop Distribution', y);

        const overviewH = 52;
        [
            { id:'device-status-pie', label:'Device Status',  accent: C.green  },
            { id:'tickets-pie',       label:'Ticket Status',  accent: C.purple },
            { id:'crop-dist-bar',     label:'Crop Types',     accent: C.orange },
        ].forEach((oc, i) => {
            const ox = margin + i * (thirdW + 3);
            doc.setFillColor(...C.surface);
            doc.roundedRect(ox, y, thirdW, overviewH, 2, 2, 'F');
            doc.setFillColor(...oc.accent);
            doc.roundedRect(ox, y, thirdW, 2.5, 1, 1, 'F');
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.white);
            doc.text(oc.label, ox + thirdW / 2, y + 9, { align: 'center' });
            embedChart(oc.id, ox + 3, y + 11, thirdW - 6, overviewH - 13);
        });
        y += overviewH + 5;

        // ── Section: Sensor Summary ────────────────────────────────
        y = sectionLabel('Sensor Summary', y);

        const avgSoil = document.getElementById('avg-soil-moisture')?.textContent || '—';
        const avgTemp = document.getElementById('avg-temperature')?.textContent || '—';
        const avgPh   = document.getElementById('avg-ph')?.textContent || '—';
        const soilChg = document.getElementById('soil-moisture-change')?.textContent || '';
        const tempChg = document.getElementById('temperature-change')?.textContent || '';
        const phStat  = document.getElementById('ph-status')?.textContent || '';

        [
            { label:'Avg Soil Moisture', value:avgSoil, sub:soilChg, accent:C.soil,  range:'Safe: 20–90%'  },
            { label:'Avg Temperature',   value:avgTemp, sub:tempChg, accent:C.temp,  range:'Safe: 10–40°C' },
            { label:'Avg pH Level',      value:avgPh,   sub:phStat,  accent:C.ph,    range:'Safe: 5.0–8.0' },
        ].forEach((s, i) => {
            const sx = margin + i * (thirdW + 3);
            doc.setFillColor(...C.surface);
            doc.roundedRect(sx, y, thirdW, 32, 2, 2, 'F');
            doc.setFillColor(...s.accent);
            doc.roundedRect(sx, y, thirdW, 2.5, 1, 1, 'F');
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.muted);
            doc.text(s.label.toUpperCase(), sx + thirdW / 2, y + 9.5, { align: 'center' });
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.white);
            doc.text(s.value, sx + thirdW / 2, y + 21, { align: 'center' });
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...s.accent);
            doc.text(s.sub, sx + thirdW / 2, y + 27, { align: 'center' });
            doc.setFontSize(5.5);
            doc.setTextColor(...C.muted);
            doc.text(s.range, sx + thirdW / 2, y + 32, { align: 'center' });
        });
        // y after sensor stats — page 1 ends here

        // ════════════════════════════════════════════════════════════
        // PAGE 2 — Sensor Charts
        // ════════════════════════════════════════════════════════════
        doc.addPage();

        // Slim continuation header
        doc.setFillColor(...C.darkBg);
        doc.rect(0, 0, pageW, 12, 'F');
        doc.setFillColor(...C.green);
        doc.rect(0, 0, 4, 12, 'F');
        doc.setFillColor(...C.surface2);
        doc.rect(0, 11.5, pageW, 0.8, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.green);
        doc.text('AgroEzuran', margin + 5, 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.muted);
        doc.text('Sensor Charts', margin + 32, 8);
        doc.text(`${farmLabel}  ·  ${timeLabel}  ·  Generated ${dateStr}`, pageW - margin, 8, { align: 'right' });

        y = 18;
        y = sectionLabel('Sensor Charts', y);

        const chartH = 57;
        const chartGap = 4;

        // Row 1: Soil Moisture + Temperature
        chartCard(margin,          y, halfW, chartH, 'soil-moisture-chart', 'Soil Moisture', 'Safe: 20–90%',  C.soil);
        chartCard(margin + halfW + 3, y, halfW, chartH, 'temperature-chart',   'Temperature',   'Safe: 10–40°C', C.temp);
        y += chartH + chartGap;

        // Row 2: Humidity + pH
        chartCard(margin,          y, halfW, chartH, 'humidity-chart', 'Humidity',  'Safe: 20–90%',  C.humidity);
        chartCard(margin + halfW + 3, y, halfW, chartH, 'ph-chart',      'pH Level',  'Safe: 5.0–8.0', C.ph);
        y += chartH + chartGap;

        // Row 3: Water Tank Level (full width)
        chartCard(margin, y, contentW, chartH, 'water-level-chart', 'Water Tank Level', 'Safe: ≥ 10%', C.water);

        // ── Footer on all pages ────────────────────────────────────
        const lastPage = doc.internal.getNumberOfPages();
        for (let p = 1; p <= lastPage; p++) {
            doc.setPage(p);
            doc.setFillColor(...C.darkBg);
            doc.rect(0, pageH - 11, pageW, 11, 'F');
            doc.setFillColor(...C.green);
            doc.rect(0, pageH - 11, pageW, 0.8, 'F');
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.muted);
            doc.text('AgroEzuran Admin Dashboard  ·  Confidential', margin, pageH - 3.5);
            doc.text(`Page ${p} of ${lastPage}`, pageW - margin, pageH - 3.5, { align: 'right' });
        }

        // ── Save ───────────────────────────────────────────────────
        const fileDateStr = now.toISOString().split('T')[0];
        doc.save(`AgroEzuran-Report-${fileDateStr}.pdf`);

        btn.disabled = false;
        btn.innerHTML = originalHTML;

    } catch (error) {
        console.error('Error generating PDF:', error);
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        alert('Failed to generate PDF: ' + error.message);
    }
}

// ─────────────────────────────────────────────────────────────
// DEVICE INVENTORY
// ─────────────────────────────────────────────────────────────

let devicesUnsubscribe = null;
let currentDeviceStatusFilter = '';

async function loadDevicesPage() {
    if (devicesUnsubscribe) devicesUnsubscribe();
    currentDeviceStatusFilter = '';

    // Wire status filter
    document.getElementById('device-status-filter').onchange = (e) => {
        currentDeviceStatusFilter = e.target.value;
        renderDevices();
    };

    // Wire generate code modal
    document.getElementById('generate-code-btn').onclick = () => {
        document.getElementById('generated-code-display').classList.add('hidden');
        document.getElementById('gen-quantity').value = 1;
        document.getElementById('gen-notes').value = '';
        document.getElementById('generate-code-modal').classList.remove('hidden');
    };
    document.getElementById('close-generate-modal').onclick = () => {
        document.getElementById('generate-code-modal').classList.add('hidden');
    };
    document.getElementById('confirm-generate-btn').onclick = handleGenerateCodes;

    // Real-time listener on devices collection
    devicesUnsubscribe = db.collection('devices')
        .orderBy('created_at', 'desc')
        .onSnapshot(async (snap) => {
            const devices = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // For claimed devices missing farmer_name, look it up from crops collection
            const needsLookup = devices.filter(d => d.status === 'claimed' && !d.farmer_name);
            if (needsLookup.length > 0) {
                try {
                    const cropsSnap = await db.collection('crops')
                        .where('status', '==', 'active')
                        .get();
                    const cropsByDevice = {};
                    cropsSnap.docs.forEach(c => {
                        const data = c.data();
                        if (data.device_id) cropsByDevice[data.device_id] = data;
                    });

                    // Also fetch user names from users collection for matched crops
                    const farmerUids = [...new Set(
                        Object.values(cropsByDevice).map(c => c.farmer_id).filter(Boolean)
                    )];
                    const userNames = {};
                    for (const uid of farmerUids) {
                        try {
                            const uSnap = await db.collection('users').where('uid', '==', uid).limit(1).get();
                            if (!uSnap.empty) {
                                const u = uSnap.docs[0].data();
                                userNames[uid] = u.name || u.displayName || uid;
                            }
                        } catch (_) {}
                    }

                    needsLookup.forEach(dev => {
                        const crop = cropsByDevice[dev.id];
                        if (crop) {
                            dev.farmer_name = userNames[crop.farmer_id] || crop.farmer_id || '—';
                            dev.claimed_at = dev.claimed_at || crop.createdAt || null;
                        }
                    });
                } catch (e) {
                    console.warn('Could not enrich device farmer data:', e);
                }
            }

            window._allDevices = devices;
            renderDevices();
        }, (err) => {
            console.error('Devices listener error:', err);
        });
}

let _allDevices = [];

function renderDevices() {
    const devices = window._allDevices || [];
    const filtered = currentDeviceStatusFilter
        ? devices.filter(d => d.status === currentDeviceStatusFilter)
        : devices;

    // Update stats
    document.getElementById('dev-total').textContent = devices.length;
    document.getElementById('dev-available').textContent = devices.filter(d => d.status === 'available').length;
    document.getElementById('dev-claimed').textContent = devices.filter(d => d.status === 'claimed').length;
    document.getElementById('dev-inactive').textContent = devices.filter(d => d.status === 'inactive').length;

    const tbody = document.getElementById('devices-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-[#9db9a6]">No devices found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(dev => {
        const statusColors = {
            available:  'bg-primary/10 text-primary',
            claimed:    'bg-blue-400/10 text-blue-400',
            inactive:   'bg-red-400/10 text-red-400',
        };
        const statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[dev.status] || 'bg-[#28392e] text-[#9db9a6]'}">${dev.status || 'unknown'}</span>`;
        const claimedBy = dev.farmer_name ? `<span class="text-white">${dev.farmer_name}</span>` : '<span class="text-[#9db9a6]">—</span>';
        const claimedDate = dev.claimed_at ? formatDate(dev.claimed_at.toDate ? dev.claimed_at.toDate() : new Date(dev.claimed_at)) : '<span class="text-[#9db9a6]">—</span>';
        const notes = dev.notes ? `<span class="text-[#9db9a6] text-xs">${dev.notes}</span>` : '<span class="text-[#9db9a6]">—</span>';

        return `<tr class="hover:bg-[#223026] transition-colors">
            <td class="p-4">
                <span class="font-mono text-primary font-semibold tracking-wider">${dev.unique_code || dev.id}</span>
            </td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4">${claimedBy}</td>
            <td class="p-4 text-[#9db9a6] text-sm">${claimedDate}</td>
            <td class="p-4">${notes}</td>
            <td class="p-4 text-right">
                <button onclick="toggleDeviceStatus('${dev.id}', '${dev.status}')"
                    class="px-3 py-1.5 text-xs rounded-lg border border-[#3b5443] text-[#9db9a6] hover:text-white hover:border-[#9db9a6] transition-colors">
                    ${dev.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                </button>
            </td>
        </tr>`;
    }).join('');
}

async function handleGenerateCodes() {
    const quantity = parseInt(document.getElementById('gen-quantity').value) || 1;
    const notes = document.getElementById('gen-notes').value.trim();
    const btn = document.getElementById('confirm-generate-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
        const codes = [];
        const batch = db.batch();
        for (let i = 0; i < Math.min(quantity, 50); i++) {
            const code = generateUniqueDeviceCode();
            codes.push(code);
            const ref = db.collection('devices').doc();
            batch.set(ref, {
                unique_code: code,
                status: 'available',
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                notes: notes || null,
                claimed_at: null,
                claimed_by: null,
                farmer_name: null,
            });
        }
        await batch.commit();

        document.getElementById('generated-code-display').classList.remove('hidden');
        document.getElementById('generated-code-value').textContent = codes.length === 1 ? codes[0] : `${codes.length} codes generated`;
        btn.textContent = 'Generate More';
    } catch (err) {
        console.error('Generate error:', err);
        alert('Failed to generate codes: ' + err.message);
        btn.textContent = 'Generate';
    }
    btn.disabled = false;
}

function generateUniqueDeviceCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const part = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `AGR-${part(4)}-${part(4)}`;
}

async function toggleDeviceStatus(deviceId, currentStatus) {
    const newStatus = currentStatus === 'inactive' ? 'available' : 'inactive';
    try {
        await db.collection('devices').doc(deviceId).update({ status: newStatus });
    } catch (err) {
        alert('Failed to update device: ' + err.message);
    }
}

function formatDate(date) {
    if (!date) return '—';
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────
// SUPPORT TICKETS
// ─────────────────────────────────────────────────────────────

let supportUnsubscribe = null;
let chatMessagesUnsubscribe = null;
let currentTicketId = null;
let currentSupportFilter = '';
let currentSupportSearch = '';
let _allSupportDocs = [];
let _deviceCodeCache = {}; // deviceId (doc ID) → unique_code
let _farmerPhotoCache = {}; // farmer_uid → photoURL | null

async function _ensureFarmerPhotos(uids) {
    const missing = [...new Set(uids)].filter(uid => uid && _farmerPhotoCache[uid] === undefined);
    if (!missing.length) return;
    for (let i = 0; i < missing.length; i += 10) {
        const batch = missing.slice(i, i + 10);
        try {
            const snap = await db.collection('users').where('uid', 'in', batch).get();
            snap.docs.forEach(doc => {
                const d = doc.data();
                _farmerPhotoCache[d.uid] = d.photoURL || null;
            });
        } catch (_) {}
        batch.forEach(uid => { if (_farmerPhotoCache[uid] === undefined) _farmerPhotoCache[uid] = null; });
    }
}

async function _ensureDeviceCodes(deviceIds) {
    const missing = [...new Set(deviceIds)].filter(id => id && _deviceCodeCache[id] === undefined);
    if (!missing.length) return;
    // Firestore 'in' supports up to 10 items
    for (let i = 0; i < missing.length; i += 10) {
        const batch = missing.slice(i, i + 10);
        try {
            const snap = await db.collection('devices')
                .where(firebase.firestore.FieldPath.documentId(), 'in', batch)
                .get();
            snap.docs.forEach(doc => {
                _deviceCodeCache[doc.id] = doc.data().unique_code || null;
            });
        } catch (_) {}
        // Mark unfound ids so we don't re-query them
        batch.forEach(id => { if (_deviceCodeCache[id] === undefined) _deviceCodeCache[id] = null; });
    }
}

// ── Farmer avatar popover ─────────────────────────────────────────────────────

let _fp_target = null;
let _fp_timer  = null;

function _initFarmerPopover() {
    if (document.getElementById('farmer-popover')) return; // already exists

    const pop = document.createElement('div');
    pop.id = 'farmer-popover';
    pop.style.cssText = [
        'position:fixed',
        'z-index:9999',
        'pointer-events:none',
        'opacity:0',
        'transform:translateX(-6px)',
        'transition:opacity 0.18s ease,transform 0.18s ease',
        'width:230px',
    ].join(';');
    pop.innerHTML = `
        <div style="background:#1c271f;border:1px solid #3b5443;border-radius:14px;padding:14px 16px;box-shadow:0 16px 48px rgba(0,0,0,0.55);pointer-events:auto;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div id="fp-photo" style="width:42px;height:42px;border-radius:50%;overflow:hidden;flex-shrink:0;background:rgba(43,238,108,0.12);border:1.5px solid rgba(43,238,108,0.3);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px;"></div>
                <div style="flex:1;min-width:0;">
                    <p id="fp-name" style="color:#fff;font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;"></p>
                    <span id="fp-status" style="font-size:10px;padding:2px 8px;border-radius:999px;font-weight:600;"></span>
                </div>
            </div>
            <div style="border-top:1px solid #3b5443;padding-top:8px;">
                <p id="fp-email" style="color:#9db9a6;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:4px;display:flex;align-items:center;gap:4px;"></p>
                <p id="fp-farm"  style="color:#9db9a6;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:4px;"></p>
            </div>
            <button id="fp-view-btn"
                style="margin-top:10px;width:100%;padding:7px;background:rgba(43,238,108,0.1);border:1px solid rgba(43,238,108,0.3);border-radius:8px;color:#2bec6c;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background 0.15s;"
                onmouseover="this.style.background='rgba(43,238,108,0.2)'"
                onmouseout="this.style.background='rgba(43,238,108,0.1)'"
                onclick="goToFarmerProfile(this.dataset.uid)">
                <span style="font-family:sans-serif;font-size:14px;line-height:1;">↗</span>View Profile
            </button>
        </div>`;
    document.body.appendChild(pop);

    // Hide when mouse leaves the popover itself
    pop.addEventListener('mouseleave', () => {
        clearTimeout(_fp_timer);
        _fp_target = null;
        _hideFarmerPopover();
    });

    // Event delegation on ticket list
    const list = document.getElementById('ticket-list');
    if (!list) return;

    list.addEventListener('mouseover', e => {
        const el = e.target.closest('[data-farmer-uid]');
        if (!el) return;
        if (el === _fp_target) return;
        _fp_target = el;
        clearTimeout(_fp_timer);
        _fp_timer = setTimeout(() => _showFarmerPopover(el), 150);
    });

    list.addEventListener('mouseout', e => {
        const to = e.relatedTarget;
        if (pop.contains(to)) return;
        if (to && to.closest('[data-farmer-uid]')) return;
        clearTimeout(_fp_timer);
        _fp_target = null;
        _hideFarmerPopover();
    });
}

function _hideFarmerPopover() {
    const pop = document.getElementById('farmer-popover');
    if (!pop) return;
    pop.style.opacity = '0';
    pop.style.transform = 'translateX(-6px)';
}

function _showFarmerPopover(avatarEl) {
    const pop = document.getElementById('farmer-popover');
    if (!pop) return;

    const farmerUid = avatarEl.dataset.farmerUid;
    const user = allUsers.find(u => u.uid === farmerUid);
    if (!user) return;

    // Photo / initials
    const ini     = (user.name || user.displayName || 'U')[0].toUpperCase();
    const photoEl = document.getElementById('fp-photo');
    if (user.photoURL) {
        photoEl.innerHTML = `<img src="${user.photoURL}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent='${ini}'">`;
    } else {
        photoEl.textContent = ini;
    }

    document.getElementById('fp-name').textContent = user.name || user.displayName || 'Unknown';

    const stColors = { active:'#22c55e', pending:'#eab308', inactive:'#ef4444' };
    const stBg     = { active:'rgba(34,197,94,0.12)', pending:'rgba(234,179,8,0.12)', inactive:'rgba(239,68,68,0.12)' };
    const st = user.status || 'active';
    const statusEl = document.getElementById('fp-status');
    statusEl.textContent = st[0].toUpperCase() + st.slice(1);
    statusEl.style.color      = stColors[st] || stColors.active;
    statusEl.style.background = stBg[st]     || stBg.active;

    const emailEl = document.getElementById('fp-email');
    emailEl.innerHTML = user.email
        ? `<span style="font-family:sans-serif;">✉</span>${user.email}`
        : '<span style="opacity:0.5">No email</span>';

    const farmEl = document.getElementById('fp-farm');
    farmEl.innerHTML = user.farm_name
        ? `<span style="font-family:sans-serif;">🌱</span>${user.farm_name}`
        : '<span style="opacity:0.5">No farm set</span>';

    document.getElementById('fp-view-btn').dataset.uid = farmerUid;

    // Position: right side of avatar, vertically centred
    const rect  = avatarEl.getBoundingClientRect();
    const popW  = 230;
    const popH  = 185; // approximate rendered height
    let   left  = rect.right + 12;
    let   top   = rect.top + rect.height / 2 - popH / 2;

    // Flip left if would overflow right viewport edge
    if (left + popW > window.innerWidth - 8) left = rect.left - popW - 12;
    // Clamp vertically
    top = Math.max(8, Math.min(top, window.innerHeight - popH - 8));

    pop.style.left      = `${left}px`;
    pop.style.top       = `${top}px`;
    pop.style.opacity   = '1';
    pop.style.transform = 'translateX(0)';
}

function goToFarmerProfile(farmerUid) {
    const user = allUsers.find(u => u.uid === farmerUid);
    if (!user) { alert('Farmer profile not found'); return; }
    _hideFarmerPopover();
    navigateToPage('users');
    // Brief delay for page to render, then open modal
    setTimeout(() => viewUserDetails(user.id), 250);
}

async function loadSupportPage() {
    if (supportUnsubscribe) supportUnsubscribe();
    currentSupportFilter = '';
    currentSupportSearch = '';
    currentTicketId = null;

    // Wire tab filter buttons
    document.querySelectorAll('.support-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.support-tab').forEach(t => {
                t.classList.remove('text-white', 'bg-[#28392e]');
                t.classList.add('text-[#9db9a6]');
            });
            tab.classList.add('text-white', 'bg-[#28392e]');
            tab.classList.remove('text-[#9db9a6]');
            currentSupportFilter = tab.getAttribute('data-status');
            renderTicketList();
        };
    });

    // Wire search input
    const searchInput = document.getElementById('ticket-search');
    if (searchInput) {
        searchInput.value = '';
        searchInput.oninput = () => {
            currentSupportSearch = searchInput.value.trim().toLowerCase();
            renderTicketList();
        };
    }

    // Wire send reply
    document.getElementById('send-reply-btn').onclick = sendAdminReply;
    document.getElementById('admin-reply-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminReply(); }
    });

    // Wire status buttons
    document.getElementById('resolve-btn').onclick = () => updateTicketStatus(currentTicketId, 'resolved');
    document.getElementById('reopen-btn').onclick = () => updateTicketStatus(currentTicketId, 'open');

    _initFarmerPopover();
    loadTicketList();
}

function loadTicketList() {
    if (supportUnsubscribe) supportUnsubscribe();

    // Fetch all tickets real-time, filter client-side
    supportUnsubscribe = db.collection('support_tickets')
        .orderBy('updated_at', 'desc')
        .onSnapshot((snap) => {
            _allSupportDocs = snap.docs;
            renderTicketList();
        }, err => console.error('Support listener error:', err));
}

async function renderTicketList() {
    const list = document.getElementById('ticket-list');
    const docs = _allSupportDocs;

    // Pre-fetch unique_code and farmer photos in parallel
    await Promise.all([
        _ensureDeviceCodes(docs.map(d => d.data().device_id).filter(Boolean)),
        _ensureFarmerPhotos(docs.map(d => d.data().farmer_uid).filter(Boolean)),
    ]);

    // --- Stats counts ---
    const cOpen     = docs.filter(d => d.data().status === 'open').length;
    const cActive   = docs.filter(d => d.data().status === 'in_progress').length;
    const cResolved = docs.filter(d => d.data().status === 'resolved').length;
    const cTotal    = docs.length;
    const cNavOpen  = cOpen + cActive;

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('sup-count-open',     cOpen);
    setEl('sup-count-active',   cActive);
    setEl('sup-count-resolved', cResolved);
    setEl('sup-total-badge',    `${cTotal} total`);

    // Nav badge
    const navLabel = document.getElementById('support-nav-label');
    if (navLabel) navLabel.textContent = cNavOpen > 0 ? `Support (${cNavOpen})` : 'Support';

    // --- Filter + search ---
    // "All" tab hides resolved — they live in the "Done" tab only
    let filtered = currentSupportFilter
        ? docs.filter(d => d.data().status === currentSupportFilter)
        : docs.filter(d => d.data().status !== 'resolved');

    if (currentSupportSearch) {
        filtered = filtered.filter(d => {
            const t = d.data();
            return (t.subject || '').toLowerCase().includes(currentSupportSearch)
                || (t.farmer_name || '').toLowerCase().includes(currentSupportSearch)
                || (t.device_id || '').toLowerCase().includes(currentSupportSearch);
        });
    }

    if (filtered.length === 0) {
        list.innerHTML = `<div class="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <span class="material-symbols-outlined text-3xl text-[#3b5443]">inbox</span>
            <p class="text-[#9db9a6] text-sm">${currentSupportSearch ? 'No matching tickets' : 'No tickets here'}</p>
        </div>`;
        return;
    }

    // --- Status helpers ---
    const statusBorderColor = s => s === 'open' ? 'border-primary' : s === 'in_progress' ? 'border-orange-400' : 'border-[#3b5443]';
    const statusDotColor    = s => s === 'open' ? 'bg-primary' : s === 'in_progress' ? 'bg-orange-400' : 'bg-[#3b5443]';
    const statusLabel       = s => s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : 'Resolved';
    const statusTextColor   = s => s === 'open' ? 'text-primary' : s === 'in_progress' ? 'text-orange-400' : 'text-[#9db9a6]';

    const timeAgo = (date) => {
        if (!date) return '';
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60)   return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const initials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    };

    list.innerHTML = filtered.map(doc => {
        const t = doc.data();
        const isActive = doc.id === currentTicketId;
        const border   = statusBorderColor(t.status);
        const dot      = statusDotColor(t.status);
        const label    = statusLabel(t.status);
        const txtColor = statusTextColor(t.status);
        const updAt    = t.updated_at ? (t.updated_at.toDate ? t.updated_at.toDate() : new Date(t.updated_at)) : null;
        const ago      = timeAgo(updAt);
        const avatar   = initials(t.farmer_name);
        const photoURL = _farmerPhotoCache[t.farmer_uid];
        const safeUid  = (t.farmer_uid || '').replace(/'/g, "\\'");
        const innerAvatar = photoURL
            ? `<img src="${photoURL}" alt="${avatar}" class="w-9 h-9 rounded-full object-cover" style="border:1.5px solid rgba(43,238,108,0.25);display:block;" onerror="this.replaceWith((()=>{const d=document.createElement('div');d.className='w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white';d.style='background:rgba(43,238,108,0.12);border:1.5px solid rgba(43,238,108,0.25)';d.textContent='${avatar}';return d})())">`
            : `<div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background:rgba(43,238,108,0.12);border:1.5px solid rgba(43,238,108,0.25)">${avatar}</div>`;
        const avatarHtml = `<div class="flex-shrink-0 relative group/av" data-farmer-uid="${t.farmer_uid || ''}"
            style="cursor:pointer"
            title="View farmer profile"
            onclick="event.stopPropagation();goToFarmerProfile('${safeUid}')">
            ${innerAvatar}
            <div class="absolute inset-0 rounded-full opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center" style="background:rgba(43,238,108,0.25);">
                <span style="font-size:12px;line-height:1;color:#fff;">↗</span>
            </div>
        </div>`;
        const unreadBadge = t.unread_admin > 0
            ? `<span class="flex-shrink-0 min-w-[20px] h-5 px-1 bg-primary rounded-full text-[#111813] text-[10px] font-bold flex items-center justify-center animate-pulse">${t.unread_admin}</span>`
            : '';

        return `<div class="ticket-item relative flex items-start gap-3 px-4 py-3 cursor-pointer border-l-4 ${border}
                    hover:bg-[#1a2a1f] transition-colors ${isActive ? 'bg-[#1e2f23]' : ''}"
                    onclick="openTicket('${doc.id}')">
            ${avatarHtml}
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                    <p class="text-white text-sm font-semibold truncate flex-1">${t.subject || 'No subject'}</p>
                    ${unreadBadge}
                </div>
                <p class="text-[#9db9a6] text-xs mt-0.5 truncate">${t.farmer_name || 'Unknown'} · ${_deviceCodeCache[t.device_id] || t.device_code || t.device_id || '—'}</p>
                <div class="flex items-center gap-2 mt-1.5">
                    <span class="flex items-center gap-1 text-xs font-medium ${txtColor}">
                        <span class="w-1.5 h-1.5 rounded-full ${dot} inline-block"></span>${label}
                    </span>
                    <span class="text-[#9db9a6] text-xs ml-auto">${ago}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

async function openTicket(ticketId) {
    currentTicketId = ticketId;

    // Highlight selected — re-render list so isActive flag updates
    renderTicketList();

    // Show active chat panel
    document.getElementById('chat-empty-state').classList.add('hidden');
    const chatActive = document.getElementById('chat-active');
    chatActive.classList.remove('hidden');
    chatActive.classList.add('flex');

    // Load ticket metadata
    const ticketDoc = await db.collection('support_tickets').doc(ticketId).get();
    if (!ticketDoc.exists) return;
    const ticket = ticketDoc.data();

    document.getElementById('chat-subject').textContent = ticket.subject || 'Support Ticket';
    document.getElementById('chat-meta').textContent = `${ticket.farmer_name || 'Farmer'} · ${ticket.device_code || ticket.device_id || '—'}`;

    // Populate farmer avatar — photo if available, else initials
    const avatarEl = document.getElementById('chat-avatar');
    if (avatarEl) {
        const name = ticket.farmer_name || '';
        const ini = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
        await _ensureFarmerPhotos([ticket.farmer_uid].filter(Boolean));
        const photoURL = _farmerPhotoCache[ticket.farmer_uid];
        if (photoURL) {
            avatarEl.innerHTML = '';
            avatarEl.style.padding = '0';
            avatarEl.style.overflow = 'hidden';
            const img = document.createElement('img');
            img.src = photoURL;
            img.alt = ini;
            img.className = 'w-full h-full object-cover';
            img.onerror = () => { avatarEl.innerHTML = ''; avatarEl.textContent = ini; };
            avatarEl.appendChild(img);
        } else {
            avatarEl.innerHTML = '';
            avatarEl.textContent = ini;
        }
    }

    updateChatStatusUI(ticket.status);

    // Mark admin unread as 0
    db.collection('support_tickets').doc(ticketId).update({ unread_admin: 0 }).catch(() => {});

    // Real-time messages
    if (chatMessagesUnsubscribe) chatMessagesUnsubscribe();
    chatMessagesUnsubscribe = db.collection('support_tickets').doc(ticketId)
        .collection('messages')
        .orderBy('sent_at', 'asc')
        .onSnapshot((snap) => {
            renderMessages(snap.docs);
        });
}

function updateChatStatusUI(status) {
    const badge = document.getElementById('chat-status-badge');
    const resolveBtn = document.getElementById('resolve-btn');
    const reopenBtn = document.getElementById('reopen-btn');
    const resolvedBar = document.getElementById('resolved-bar');
    const inputArea = document.getElementById('chat-input-area');

    const badgeStyles = {
        open:        'bg-primary/10 text-primary',
        in_progress: 'bg-orange-400/10 text-orange-400',
        resolved:    'bg-[#28392e] text-[#9db9a6]',
    };
    badge.className = `px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyles[status] || badgeStyles.open}`;
    badge.textContent = status === 'open' ? 'Open' : status === 'in_progress' ? 'In Progress' : 'Resolved';

    if (status === 'resolved') {
        resolveBtn.classList.add('hidden');
        reopenBtn.classList.remove('hidden');
        resolvedBar.classList.remove('hidden');
        inputArea.classList.add('hidden');
    } else {
        resolveBtn.classList.remove('hidden');
        reopenBtn.classList.add('hidden');
        resolvedBar.classList.add('hidden');
        inputArea.classList.remove('hidden');
    }
}

function renderMessages(docs) {
    const container = document.getElementById('chat-messages');
    if (docs.length === 0) {
        container.innerHTML = '<div class="text-center text-[#9db9a6] text-sm py-8">No messages yet</div>';
        return;
    }

    container.innerHTML = docs.map((doc, i) => {
        const m = doc.data();

        // ── Device info attachment card ──
        if (m.type === 'device_info') {
            const code     = m.unique_code || m.device_id || '—';
            const cropName = m.crop_name   || '';
            const imageUrl = m.image_url   || '';
            const imgHtml  = imageUrl
                ? `<img src="${imageUrl}" alt="crop"
                        class="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        style="border:1px solid rgba(43,238,108,0.2)"
                        onerror="this.outerHTML='<div class=\\'w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0\\'style=\\'background:rgba(43,238,108,0.08);border:1px solid rgba(43,238,108,0.2)\\'><span class=\\'material-symbols-outlined text-primary\\'style=\\'font-size:26px\\'>eco</span></div>'">`
                : `<div class="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                        style="background:rgba(43,238,108,0.08);border:1px solid rgba(43,238,108,0.2)">
                       <span class="material-symbols-outlined text-primary" style="font-size:26px">eco</span>
                   </div>`;
            return `<div class="flex justify-start mb-3">
                <div class="max-w-xs bg-[#131f16] border border-[#3b5443] rounded-2xl overflow-hidden">
                    <div class="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border-b border-[#3b5443]">
                        <span class="material-symbols-outlined text-primary" style="font-size:15px">memory</span>
                        <span class="text-primary text-xs font-bold">Device Details</span>
                    </div>
                    <div class="flex items-center gap-3 px-3 py-3">
                        ${imgHtml}
                        <div class="space-y-1.5">
                            <div class="flex gap-2">
                                <span class="text-[#9db9a6] text-xs w-12 flex-shrink-0">Device</span>
                                <span class="text-white text-xs font-semibold">${escapeHtml(code)}</span>
                            </div>
                            ${cropName ? `<div class="flex gap-2">
                                <span class="text-[#9db9a6] text-xs w-12 flex-shrink-0">Crop</span>
                                <span class="text-white text-xs font-semibold">${escapeHtml(cropName)}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            </div>`;
        }

        const isAdmin = m.sender_role === 'admin';
        const isFarmer = m.sender_role === 'farmer';
        const time = m.sent_at ? (m.sent_at.toDate ? m.sent_at.toDate() : new Date(m.sent_at)).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : '';
        const showName = i === 0 || docs[i - 1].data().sender_role !== m.sender_role;

        // ── Image message ──
        if (m.type === 'image' && m.image_url) {
            const imgBubble = `<img src="${m.image_url}" alt="image"
                class="max-w-[220px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                style="border:1px solid rgba(43,238,108,0.2)"
                onclick="openImageViewer('${m.image_url}')"
                onerror="this.outerHTML='<div class=\\'flex items-center gap-2 text-[#9db9a6] text-xs px-3 py-2\\'><span class=\\'material-symbols-outlined text-[16px]\\'>broken_image</span>Image unavailable</div>'" />`;
            if (isAdmin) {
                return `<div class="flex flex-col items-end gap-1">
                    ${showName ? `<span class="text-xs text-[#9db9a6] mr-1">${m.sender_name || 'Admin'}</span>` : ''}
                    <div class="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm p-1.5">${imgBubble}</div>
                    <span class="text-[#9db9a6] text-xs mr-1">${time}</span>
                </div>`;
            } else {
                return `<div class="flex flex-col items-start gap-1">
                    ${showName ? `<span class="text-xs text-[#9db9a6] ml-1">${m.sender_name || 'Farmer'}</span>` : ''}
                    <div class="bg-[#28392e] border border-[#3b5443] rounded-2xl rounded-tl-sm p-1.5">${imgBubble}</div>
                    <span class="text-[#9db9a6] text-xs ml-1">${time}</span>
                </div>`;
            }
        }

        if (isAdmin) {
            return `<div class="flex flex-col items-end gap-1">
                ${showName ? `<span class="text-xs text-[#9db9a6] mr-1">${m.sender_name || 'Admin'}</span>` : ''}
                <div class="max-w-xs lg:max-w-sm bg-primary/15 border border-primary/30 rounded-2xl rounded-tr-sm px-4 py-2.5">
                    <p class="text-white text-sm">${escapeHtml(m.text)}</p>
                </div>
                <span class="text-[#9db9a6] text-xs mr-1">${time}</span>
            </div>`;
        } else {
            return `<div class="flex flex-col items-start gap-1">
                ${showName ? `<span class="text-xs text-[#9db9a6] ml-1">${m.sender_name || 'Farmer'}</span>` : ''}
                <div class="max-w-xs lg:max-w-sm bg-[#28392e] border border-[#3b5443] rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <p class="text-white text-sm">${escapeHtml(m.text)}</p>
                </div>
                <span class="text-[#9db9a6] text-xs ml-1">${time}</span>
            </div>`;
        }
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// ── Image selection state ──
let _selectedImageFile = null;

function onImageSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    _selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewArea = document.getElementById('image-preview-area');
        const previewThumb = document.getElementById('image-preview-thumb');
        previewThumb.src = e.target.result;
        previewArea.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    event.target.value = '';
}

function removeSelectedImage() {
    _selectedImageFile = null;
    document.getElementById('image-preview-area').classList.add('hidden');
    document.getElementById('image-preview-thumb').src = '';
}

function openImageViewer(url) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] cursor-zoom-out';
    overlay.onclick = () => overlay.remove();
    overlay.innerHTML = `<img src="${url}" class="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" />`;
    document.body.appendChild(overlay);
}

async function sendAdminReply() {
    if (!currentTicketId) return;
    const input = document.getElementById('admin-reply-input');
    const text = input.value.trim();
    const hasImage = !!_selectedImageFile;

    if (!text && !hasImage) return;

    const adminName = document.getElementById('admin-name-text')?.textContent || 'Admin';
    const sendBtn = document.getElementById('send-reply-btn');
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<div class="w-4 h-4 border-2 border-[#111813] border-t-transparent rounded-full animate-spin"></div>';

    try {
        if (hasImage) {
            // Upload image to Firebase Storage
            const file = _selectedImageFile;
            const ext = file.name.split('.').pop();
            const fileName = `${Date.now()}.${ext}`;
            const storageRef = storage.ref()
                .child('support_tickets')
                .child(currentTicketId)
                .child(fileName);

            const snapshot = await storageRef.put(file, { contentType: file.type });
            const downloadUrl = await snapshot.ref.getDownloadURL();

            await db.collection('support_tickets').doc(currentTicketId)
                .collection('messages').add({
                    sender_uid:  currentUser.uid,
                    sender_name: adminName,
                    sender_role: 'admin',
                    type:        'image',
                    image_url:   downloadUrl,
                    text:        '',
                    sent_at:     firebase.firestore.FieldValue.serverTimestamp(),
                });

            removeSelectedImage();
        }

        if (text) {
            input.value = '';
            await db.collection('support_tickets').doc(currentTicketId)
                .collection('messages').add({
                    sender_uid:  currentUser.uid,
                    sender_name: adminName,
                    sender_role: 'admin',
                    text:        text,
                    sent_at:     firebase.firestore.FieldValue.serverTimestamp(),
                });
        }

        // Update ticket
        await db.collection('support_tickets').doc(currentTicketId).update({
            status:        'in_progress',
            updated_at:    firebase.firestore.FieldValue.serverTimestamp(),
            unread_farmer: firebase.firestore.FieldValue.increment(1),
            unread_admin:  0,
        });
    } catch (err) {
        console.error('Send reply error:', err);
        alert('Failed to send: ' + err.message);
    }

    input.disabled = false;
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">send</span>';
    input.focus();
}

async function updateTicketStatus(ticketId, status) {
    if (!ticketId) return;
    try {
        await db.collection('support_tickets').doc(ticketId).update({
            status:     status,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        });
        updateChatStatusUI(status);
    } catch (err) {
        alert('Failed to update status: ' + err.message);
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>');
}

console.log('App initialized');
