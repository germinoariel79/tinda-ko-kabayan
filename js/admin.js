const API_BASE_URL = "https://tinda-ko-kabayan.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
    loadAdminData();
    setInterval(loadAdminData, 5000);
});

function loadAdminData() {
    loadUsersTable();
    loadOrdersTables();
    loadAdminProductsTable();
    loadOrderHistoryTable();
}

function switchAdminTab(tabName, element) {
    document.querySelectorAll(".admin-tab-content").forEach(content => {
        content.classList.add("d-none");
    });

    document.querySelectorAll("#adminMenuNav .nav-link").forEach(btn => {
        btn.classList.remove("active", "fw-bold");
        btn.classList.add("text-white-50");
    });

    const titleEl = document.getElementById("currentTabTitle");
    const subEl = document.getElementById("currentTabSub");

    if (tabName === 'dashboard') {
        document.getElementById("tabDashboardSection").classList.remove("d-none");
        titleEl.innerText = "Dashboard Overview";
        subEl.innerText = "Subaybayan ang pangkalahatang status ng iyong tindahan.";
    } else if (tabName === 'store-orders') {
        document.getElementById("tabStoreOrdersSection").classList.remove("d-none");
        titleEl.innerText = "Mga Store Orders (Daily Cart)";
        subEl.innerText = "Pamahalaan ang mga pumasok na daily orders mula sa storefront.";
        
        const bCart = document.getElementById("badgeCartOrders");
        const mobBCart = document.getElementById("mobBadgeCartOrders");
        const savedOrders = JSON.parse(localStorage.getItem("tkk_orders")) || [];
        const storeCount = savedOrders.filter(o => !o.itemsSummary || !o.itemsSummary.startsWith('[BOOKING]')).length;
        if(bCart) bCart.innerText = storeCount;
        if(mobBCart) mobBCart.innerText = storeCount;
    } else if (tabName === 'bilao-bookings') {
        document.getElementById("tabBilaoBookingsSection").classList.remove("d-none");
        titleEl.innerText = "Party Bilao & Catering Bookings";
        subEl.innerText = "Tingnan at i-schedule ang mga nakalinyang handaan at catering.";
        
        const bBook = document.getElementById("badgeBookings");
        const mobBBook = document.getElementById("mobBadgeBookings");
        const savedOrders = JSON.parse(localStorage.getItem("tkk_orders")) || [];
        const bookCount = savedOrders.filter(o => o.itemsSummary && o.itemsSummary.startsWith('[BOOKING]')).length;
        if(bBook) bBook.innerText = bookCount;
        if(mobBBook) mobBBook.innerText = bookCount;
    } else if (tabName === 'users') {
        document.getElementById("tabUsersSection").classList.remove("d-none");
        titleEl.innerText = "Direktoryo ng mga Customer";
        subEl.innerText = "Tingnan ang listahan ng mga rehistradong kabayan at kanilang mobile numbers.";
    } else if (tabName === 'products-menu') {
        document.getElementById("tabProductsMenuSection").classList.remove("d-none");
        titleEl.innerText = "Pamamahala ng Menu at Paninda";
        subEl.innerText = "I-set kung Available o Not Available ang mga ulam sa tindahan.";
    } else if (tabName === 'order-history') {
        document.getElementById("tabOrderHistorySection").classList.remove("d-none");
        titleEl.innerText = "Order History & Archives";
        subEl.innerText = "Tingnan ang talaan ng lahat ng nakaraang matagumpay na transaksyon.";
        
        // SMARTER NOTIFICATION RESET: Markahan na nabasa na ang lahat ng kasalukuyang history items
        const historyOrders = JSON.parse(localStorage.getItem("tkk_order_history")) || [];
        localStorage.setItem("tkk_last_seen_history_count", historyOrders.length);
        
        const bHist = document.getElementById("badgeHistory");
        const mobBHist = document.getElementById("mobBadgeHistory");
        if(bHist) bHist.innerText = "0";
        if(mobBHist) mobBHist.innerText = "0";
    }

    if (element) {
        element.classList.add("active", "fw-bold");
        element.classList.remove("text-white-50");
    }
}

// ------------------------------------------------------------------
// MGA USERS TABLE MULA SA BACKEND API
// ------------------------------------------------------------------
async function loadUsersTable() {
    const tableBody = document.getElementById("usersTableBody");
    const statUsers = document.getElementById("statTotalUsers");
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        const data = await response.json();

        if (data.success && data.users) {
            const allUsers = data.users;
            if(statUsers) statUsers.innerText = allUsers.length;

            if (allUsers.length > 0) {
                let usersRowsHtml = "";
                allUsers.forEach(user => {
                    const isOnline = user.isActive === true || user.isActive === "true" || user.isActive === 1;
                    const statusBadge = isOnline 
                        ? `<span class="badge bg-success">Aktibo (Online)</span>` 
                        : `<span class="badge bg-secondary">Inactive (Logged Out)</span>`;

                    usersRowsHtml += `
                        <tr class="searchable-row">
                            <td class="fw-bold search-target">${user.name || 'Kabayan'}</td>
                            <td class="search-target"><a href="https://wa.me/971${user.phone}" target="_blank" class="text-decoration-none text-success fw-bold"><i class="bi bi-whatsapp me-1"></i>+971 ${user.phone}</a></td>
                            <td><span class="badge bg-light text-dark border">${user.emirate || 'Sharjah'}</span></td>
                            <td>${statusBadge}</td>
                        </tr>
                    `;
                });
                if(tableBody) tableBody.innerHTML = usersRowsHtml;
            } else {
                if(tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang rehistradong user sa database.</td></tr>`;
            }
        }
    } catch (err) {
        console.error("Hindi makakonekta sa backend para sa users:", err);
        loadUsersTableFallback(tableBody, statUsers);
    }
}

function loadUsersTableFallback(tableBody, statUsers) {
    const allUsers = JSON.parse(localStorage.getItem("tkk_all_users") || "[]");
    if(statUsers) statUsers.innerText = allUsers.length;

    if (allUsers.length > 0) {
        let usersRowsHtml = "";
        allUsers.forEach(user => {
            usersRowsHtml += `
                <tr class="searchable-row">
                    <td class="fw-bold search-target">${user.name || 'Kabayan'}</td>
                    <td class="search-target"><a href="https://wa.me/971${user.phone}" target="_blank" class="text-decoration-none text-success fw-bold"><i class="bi bi-whatsapp me-1"></i>+971 ${user.phone}</a></td>
                    <td><span class="badge bg-light text-dark border">${user.emirate || 'Sharjah'}</span></td>
                    <td><span class="badge bg-secondary">Offline Mode</span></td>
                </tr>
            `;
        });
        if(tableBody) tableBody.innerHTML = usersRowsHtml;
    } else {
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang rehistradong user.</td></tr>`;
    }
}

// ------------------------------------------------------------------
// ORDERS AT BOOKINGS TABLES (May Smart Unread History Counter)
// ------------------------------------------------------------------
function loadOrdersTables() {
    const storeTableBody = document.getElementById("storeOrdersTableBody");
    const bilaoTableBody = document.getElementById("bilaoBookingsTableBody");
    const statOrders = document.getElementById("statTotalOrders");
    const statSales = document.getElementById("statTotalSales");

    const badgeCart = document.getElementById("badgeCartOrders");
    const badgeBookings = document.getElementById("badgeBookings");
    const mobBadgeCart = document.getElementById("mobBadgeCartOrders");
    const mobBadgeBookings = document.getElementById("mobBadgeBookings");

    const badgeHistory = document.getElementById("badgeHistory");
    const mobBadgeHistory = document.getElementById("mobBadgeHistory");

    const savedOrders = JSON.parse(localStorage.getItem("tkk_orders")) || [];
    const historyOrders = JSON.parse(localStorage.getItem("tkk_order_history")) || [];

    // Kalkulahin ang unread history items batay sa huling beses na binuksan ni Admin ang History tab
    const lastSeenCount = parseInt(localStorage.getItem("tkk_last_seen_history_count") || "0");
    const unreadHistoryCount = Math.max(0, historyOrders.length - lastSeenCount);

    if(badgeHistory) badgeHistory.innerText = unreadHistoryCount > 0 ? unreadHistoryCount : "0";
    if(mobBadgeHistory) mobBadgeHistory.innerText = unreadHistoryCount > 0 ? unreadHistoryCount : "0";

    let totalRevenue = 0;
    savedOrders.forEach(o => totalRevenue += parseFloat(o.total || 0));
    historyOrders.forEach(o => totalRevenue += parseFloat(o.total || 0));

    let storeOrdersCount = 0;
    let bilaoBookingsCount = 0;
    let pendingStoreCount = 0;
    let pendingBilaoCount = 0;

    let storeRowsHtml = "";
    let bilaoRowsHtml = "";

    if (savedOrders.length > 0 || historyOrders.length > 0) {
        if(statOrders) statOrders.innerText = savedOrders.length + historyOrders.length;

        savedOrders.forEach((order, index) => {
            const currentStatus = order.status || 'Pending Delivery';
            const isBooking = order.itemsSummary && order.itemsSummary.startsWith('[BOOKING]');

            if (isBooking) {
                bilaoBookingsCount++;
                if (currentStatus === 'Pending Delivery') pendingBilaoCount++;

                bilaoRowsHtml += `
                    <tr class="searchable-row">
                        <td>
                            <span class="badge bg-primary mb-1">${order.ref || 'TKK-2026'}</span>
                            <span class="fw-bold d-block search-target">${order.customerName || 'Kabayan'}</span>
                            <small class="text-muted search-target"><i class="bi bi-whatsapp text-success"></i> +971 ${order.phone || ''} (${order.emirate || 'Sharjah'})</small>
                        </td>
                        <td><small class="text-secondary search-target">${order.itemsSummary}</small></td>
                        <td>
                            <select class="form-select form-select-sm shadow-none border-secondary text-dark fw-bold" onchange="updateOrderStatus(${index}, this.value)">
                                <option value="Pending Delivery" ${currentStatus === 'Pending Delivery' ? 'selected' : ''}>🟡 Pending</option>
                                <option value="In Cooking" ${currentStatus === 'In Cooking' ? 'selected' : ''}>🟠 In Cooking / Preparing</option>
                                <option value="Out for Delivery" ${currentStatus === 'Out for Delivery' ? 'selected' : ''}>🔵 Out for Delivery</option>
                                <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>🟢 Completed / Delivered</option>
                            </select>
                        </td>
                    </tr>
                `;
            } else {
                storeOrdersCount++;
                if (currentStatus === 'Pending Delivery') pendingStoreCount++;

                storeRowsHtml += `
                    <tr class="searchable-row">
                        <td>
                            <span class="badge bg-secondary mb-1">${order.ref || 'TKK-2026'}</span>
                            <span class="fw-bold d-block search-target">${order.customerName || 'Kabayan'}</span>
                            <small class="text-muted search-target"><i class="bi bi-whatsapp text-success"></i> +971 ${order.phone || ''} (${order.emirate || 'Sharjah'})</small>
                        </td>
                        <td><small class="text-secondary search-target">${order.itemsSummary}</small></td>
                        <td class="fw-bold text-success">${parseFloat(order.total || 0).toFixed(2)} AED</td>
                        <td>
                            <select class="form-select form-select-sm shadow-none border-secondary text-dark fw-bold" onchange="updateOrderStatus(${index}, this.value)">
                                <option value="Pending Delivery" ${currentStatus === 'Pending Delivery' ? 'selected' : ''}>🟡 Pending</option>
                                <option value="In Cooking" ${currentStatus === 'In Cooking' ? 'selected' : ''}>🟠 In Cooking</option>
                                <option value="Out for Delivery" ${currentStatus === 'Out for Delivery' ? 'selected' : ''}>🔵 Out for Delivery</option>
                                <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>🟢 Delivered</option>
                            </select>
                        </td>
                    </tr>
                `;
            }
        });

        if(statSales) statSales.innerText = totalRevenue.toFixed(2) + " AED";
        if(storeTableBody) storeTableBody.innerHTML = storeRowsHtml || `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang Store Orders.</td></tr>`;
        if(bilaoTableBody) bilaoTableBody.innerHTML = bilaoRowsHtml || `<tr><td colspan="3" class="text-center text-muted py-4">Wala pang Bilao Bookings.</td></tr>`;
    } else {
        if(statOrders) statOrders.innerText = "0";
        if(statSales) statSales.innerText = "0.00 AED";
        if(storeTableBody) storeTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang pumasok na order.</td></tr>`;
        if(bilaoTableBody) bilaoTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Wala pang pumasok na booking.</td></tr>`;
    }

    if(badgeCart) badgeCart.innerText = pendingStoreCount > 0 ? `${pendingStoreCount} New` : storeOrdersCount;
    if(badgeBookings) badgeBookings.innerText = pendingBilaoCount > 0 ? `${pendingBilaoCount} New` : bilaoBookingsCount;
    if(mobBadgeCart) mobBadgeCart.innerText = pendingStoreCount > 0 ? `${pendingStoreCount} New` : storeOrdersCount;
    if(mobBadgeBookings) mobBadgeBookings.innerText = pendingBilaoCount > 0 ? `${pendingBilaoCount} New` : bilaoBookingsCount;

    const mobNotif = document.getElementById("mobGlobalNotifDot");
    if(mobNotif) mobNotif.style.display = (pendingStoreCount + pendingBilaoCount > 0) ? "block" : "none";
}

function updateOrderStatus(index, newStatus) {
    let savedOrders = JSON.parse(localStorage.getItem("tkk_orders")) || [];
    if (savedOrders[index]) {
        savedOrders[index].status = newStatus;
        
        if(newStatus === "Delivered") {
            let historyOrders = JSON.parse(localStorage.getItem("tkk_order_history")) || [];
            historyOrders.unshift(savedOrders[index]);
            localStorage.setItem("tkk_order_history", JSON.stringify(historyOrders));
            
            savedOrders.splice(index, 1);
        }

        localStorage.setItem("tkk_orders", JSON.stringify(savedOrders));
        loadOrdersTables();
        loadOrderHistoryTable();
    }
}

// ------------------------------------------------------------------
// ORDER HISTORY TABLE LOADER
// ------------------------------------------------------------------
function loadOrderHistoryTable() {
    const historyTableBody = document.getElementById("orderHistoryTableBody");
    if(!historyTableBody) return;

    const historyOrders = JSON.parse(localStorage.getItem("tkk_order_history")) || [];

    if (historyOrders.length > 0) {
        let historyRowsHtml = "";
        historyOrders.forEach(order => {
            historyRowsHtml += `
                <tr class="searchable-row">
                    <td>
                        <span class="badge bg-success mb-1">${order.ref || 'TKK-2026'}</span>
                        <span class="fw-bold d-block search-target">${order.customerName || 'Kabayan'}</span>
                        <small class="text-muted search-target"><i class="bi bi-whatsapp text-success"></i> +971 ${order.phone || ''} (${order.emirate || 'Sharjah'})</small>
                    </td>
                    <td><small class="text-secondary search-target">${order.itemsSummary}</small></td>
                    <td class="fw-bold text-success">${parseFloat(order.total || 0).toFixed(2)} AED</td>
                    <td><span class="badge bg-success">🟢 Completed / Delivered</span></td>
                </tr>
            `;
        });
        historyTableBody.innerHTML = historyRowsHtml;
    } else {
        historyTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang nakatalang history ng mga natapos na order.</td></tr>`;
    }
}

// ------------------------------------------------------------------
// MGA PANINDA (MENU) MANAGEMENT SA ADMIN SIDE
// ------------------------------------------------------------------
function loadAdminProductsTable() {
    const tableBody = document.getElementById("adminProductsTableBody");
    if(!tableBody) return;

    let customProducts = JSON.parse(localStorage.getItem("tkk_custom_products")) || [];

    if(customProducts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Wala pang nakalagay na paninda. Magdagdag sa pamamagitan ng "Magdagdag ng Ulam".</td></tr>`;
        return;
    }

    let html = "";
    customProducts.forEach(prod => {
        const isAvailable = prod.available !== false;
        const statusBadge = isAvailable 
            ? `<span class="badge bg-success">Available</span>` 
            : `<span class="badge bg-danger">Not Available (Sold Out)</span>`;

        html += `
            <tr class="searchable-row">
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${prod.image}" class="rounded-3 object-fit-cover" style="width: 45px; height: 45px;" alt="Ulam">
                        <div>
                            <span class="fw-bold d-block search-target">${prod.name}</span>
                            <small class="text-muted text-truncate d-inline-block" style="max-width: 180px;">${prod.description || ''}</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border">${prod.category}</span></td>
                <td class="fw-bold text-success">${Number(prod.price).toFixed(2)} AED</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn ${isAvailable ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold" onclick="promptToggleStatus(${prod.id})">
                            ${isAvailable ? 'Gawing Not Available' : 'Gawing Available'}
                        </button>
                        <button class="btn btn-outline-dark" onclick="promptDeleteProduct(${prod.id})" title="Burahin">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

function promptToggleStatus(id) {
    let customProducts = JSON.parse(localStorage.getItem("tkk_custom_products")) || [];
    const prod = customProducts.find(p => p.id == id);
    if(prod) {
        const isCurrentlyAvailable = prod.available !== false;
        document.getElementById("toggleTargetId").value = id;
        document.getElementById("toggleStatusModalMsg").innerText = `Gusto mo bang gawing ${isCurrentlyAvailable ? 'NOT AVAILABLE (Sold Out)' : 'AVAILABLE'} ang "${prod.name}"?`;
        new bootstrap.Modal(document.getElementById('toggleStatusModal')).show();
    }
}

function confirmToggleProductStatus() {
    const id = document.getElementById("toggleTargetId").value;
    let customProducts = JSON.parse(localStorage.getItem("tkk_custom_products")) || [];
    const prod = customProducts.find(p => p.id == id);
    if(prod) {
        prod.available = prod.available === false ? true : false;
        localStorage.setItem("tkk_custom_products", JSON.stringify(customProducts));
        bootstrap.Modal.getInstance(document.getElementById('toggleStatusModal')).hide();
        loadAdminProductsTable();
    }
}

function promptDeleteProduct(id) {
    document.getElementById("deleteTargetId").value = id;
    new bootstrap.Modal(document.getElementById('deleteProductModal')).show();
}

function confirmDeleteProduct() {
    const id = document.getElementById("deleteTargetId").value;
    let customProducts = JSON.parse(localStorage.getItem("tkk_custom_products")) || [];
    customProducts = customProducts.filter(p => p.id != id);
    localStorage.setItem("tkk_custom_products", JSON.stringify(customProducts));
    
    bootstrap.Modal.getInstance(document.getElementById('deleteProductModal')).hide();
    loadAdminProductsTable();

    document.getElementById("adminSuccessTitle").innerText = "Na-delete na!";
    document.getElementById("adminSuccessMsg").innerText = "Matagumpay na nabura ang ulam sa menu.";
    new bootstrap.Modal(document.getElementById('adminSuccessModal')).show();
}

function handleAddNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById("prodName").value.trim();
    const category = document.getElementById("prodCategory").value;
    const price = parseFloat(document.getElementById("prodPrice").value);
    const imageFile = document.getElementById("prodImageFile").files[0];
    const description = document.getElementById("prodDesc").value.trim();
    
    if (!imageFile) {
        alert("Pumili muna ng larawan, kabayan!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(uploadEvent) {
        const base64Image = uploadEvent.target.result;

        const newProduct = {
            id: Date.now(),
            name: name,
            category: category,
            price: price,
            image: base64Image,
            description: description,
            available: true
        };
        
        let customProducts = JSON.parse(localStorage.getItem("tkk_custom_products")) || [];
        customProducts.push(newProduct);
        localStorage.setItem("tkk_custom_products", JSON.stringify(customProducts));
        
        const modalEl = document.getElementById('addProductModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        document.getElementById("addProductForm").reset();
        
        loadAdminProductsTable();

        document.getElementById("adminSuccessTitle").innerText = "Bagong Ulam Naidagdag!";
        document.getElementById("adminSuccessMsg").innerText = `Matagumpay na naidagdag ang "${name}" (${price.toFixed(2)} AED) sa Storefront!`;
        new bootstrap.Modal(document.getElementById('adminSuccessModal')).show();
    };

    reader.readAsDataURL(imageFile);
}

// ------------------------------------------------------------------
// LOGOUT AT CLEAR UTILITIES
// ------------------------------------------------------------------
function openLogoutModal() {
    new bootstrap.Modal(document.getElementById('logoutConfirmModal')).show();
}

function confirmLogoutAdmin() {
    window.location.href = "homepage.html";
}

function filterAdminTables() {
    const filter = document.getElementById("adminSearchInput").value.toLowerCase();
    const rows = document.querySelectorAll(".searchable-row");
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
}

function clearUsersData() {
    new bootstrap.Modal(document.getElementById('clearUsersModal')).show();
}

function executeClearUsers() {
    localStorage.removeItem("tkk_user");
    localStorage.removeItem("tkk_all_users");
    loadUsersTable();
    bootstrap.Modal.getInstance(document.getElementById('clearUsersModal')).hide();
    
    document.getElementById("adminSuccessTitle").innerText = "Na-reset na!";
    document.getElementById("adminSuccessMsg").innerText = "Matagumpay na na-clear ang lahat ng user data.";
    new bootstrap.Modal(document.getElementById('adminSuccessModal')).show();
}

function clearOrdersData() {
    new bootstrap.Modal(document.getElementById('clearOrdersModal')).show();
}

function executeClearOrders() {
    localStorage.removeItem("tkk_orders");
    loadOrdersTables();
    bootstrap.Modal.getInstance(document.getElementById('clearOrdersModal')).hide();
    
    document.getElementById("adminSuccessTitle").innerText = "Malinis na!";
    document.getElementById("adminSuccessMsg").innerText = "Na-clear na ang lahat ng mga active order at bookings.";
    new bootstrap.Modal(document.getElementById('adminSuccessModal')).show();
}

function clearHistoryData() {
    new bootstrap.Modal(document.getElementById('clearHistoryModal')).show();
}

function executeClearHistory() {
    localStorage.removeItem("tkk_order_history");
    localStorage.removeItem("tkk_last_seen_history_count");
    loadOrderHistoryTable();
    loadOrdersTables();
    bootstrap.Modal.getInstance(document.getElementById('clearHistoryModal')).hide();
    
    document.getElementById("adminSuccessTitle").innerText = "Malinis na!";
    document.getElementById("adminSuccessMsg").innerText = "Na-clear na ang buong transaction history.";
    new bootstrap.Modal(document.getElementById('adminSuccessModal')).show();
}