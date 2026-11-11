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
    document.querySelectorAll(".admin-tab-content").forEach(content => content.classList.add("d-none"));
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
    } else if (tabName === 'bilao-bookings') {
        document.getElementById("tabBilaoBookingsSection").classList.remove("d-none");
        titleEl.innerText = "Party Bilao & Catering Bookings";
        subEl.innerText = "Tingnan at i-schedule ang mga nakalinyang handaan.";
    } else if (tabName === 'users') {
        document.getElementById("tabUsersSection").classList.remove("d-none");
        titleEl.innerText = "Direktoryo ng mga Customer";
        subEl.innerText = "Listahan ng mga rehistradong kabayan.";
    } else if (tabName === 'products-menu') {
        document.getElementById("tabProductsMenuSection").classList.remove("d-none");
        titleEl.innerText = "Pamamahala ng Menu at Paninda";
        subEl.innerText = "I-set kung Available o Not Available ang mga ulam.";
    } else if (tabName === 'order-history') {
        document.getElementById("tabOrderHistorySection").classList.remove("d-none");
        titleEl.innerText = "Order History & Archives";
        subEl.innerText = "Tingnan ang talaan ng mga nakaraang transaksyon.";
        
        const historyOrders = JSON.parse(localStorage.getItem("tkk_order_history")) || [];
        localStorage.setItem("tkk_last_seen_history_count", historyOrders.length);
        const bHist = document.getElementById("badgeHistory");
        if(bHist) bHist.innerText = "0";
    }

    if (element) {
        element.classList.add("active", "fw-bold");
        element.classList.remove("text-white-50");
    }
}

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
                let html = "";
                allUsers.forEach(user => {
                    const isOnline = user.isActive === true || user.isActive === "true" || user.isActive === 1;
                    const statusBadge = isOnline ? `<span class="badge bg-success">Aktibo (Online)</span>` : `<span class="badge bg-secondary">Inactive</span>`;
                    html += `
                        <tr class="searchable-row">
                            <td class="fw-bold search-target">${user.name || 'Kabayan'}</td>
                            <td class="search-target"><a href="https://wa.me/971${user.phone}" target="_blank" class="text-decoration-none text-success fw-bold"><i class="bi bi-whatsapp me-1"></i>+971 ${user.phone}</a></td>
                            <td><span class="badge bg-light text-dark border">${user.emirate || 'Sharjah'}</span></td>
                            <td>${statusBadge}</td>
                        </tr>`;
                });
                if(tableBody) tableBody.innerHTML = html;
            } else {
                if(tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang rehistradong user.</td></tr>`;
            }
        }
    } catch (err) {
        loadUsersTableFallback(tableBody, statUsers);
    }
}

function loadUsersTableFallback(tableBody, statUsers) {
    const allUsers = JSON.parse(localStorage.getItem("tkk_all_users") || "[]");
    if(statUsers) statUsers.innerText = allUsers.length;
    if (allUsers.length > 0) {
        let html = "";
        allUsers.forEach(user => {
            html += `
                <tr class="searchable-row">
                    <td class="fw-bold search-target">${user.name || 'Kabayan'}</td>
                    <td class="search-target"><a href="https://wa.me/971${user.phone}" target="_blank" class="text-decoration-none text-success fw-bold">+971 ${user.phone}</a></td>
                    <td><span class="badge bg-light text-dark border">${user.emirate || 'Sharjah'}</span></td>
                    <td><span class="badge bg-secondary">Offline Mode</span></td>
                </tr>`;
        });
        if(tableBody) tableBody.innerHTML = html;
    } else {
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang rehistradong user.</td></tr>`;
    }
}

function loadOrdersTables() {
    const storeTableBody = document.getElementById("storeOrdersTableBody");
    const bilaoTableBody = document.getElementById("bilaoBookingsTableBody");
    const statOrders = document.getElementById("statTotalOrders");
    const statSales = document.getElementById("statTotalSales");

    const savedOrders = JSON.parse(localStorage.getItem("tkk_orders")) || [];
    const historyOrders = JSON.parse(localStorage.getItem("tkk_order_history")) || [];

    let totalRevenue = 0;
    savedOrders.forEach(o => totalRevenue += parseFloat(o.total || 0));
    historyOrders.forEach(o => totalRevenue += parseFloat(o.total || 0));

    let storeRowsHtml = "", bilaoRowsHtml = "";
    let pendingStoreCount = 0, pendingBilaoCount = 0;

    if (savedOrders.length > 0 || historyOrders.length > 0) {
        if(statOrders) statOrders.innerText = savedOrders.length + historyOrders.length;

        savedOrders.forEach((order, index) => {
            const currentStatus = order.status || 'Pending Delivery';
            const isBooking = order.itemsSummary && order.itemsSummary.startsWith('[BOOKING]');

            if (isBooking) {
                if (currentStatus === 'Pending Delivery') pendingBilaoCount++;
                bilaoRowsHtml += `
                    <tr class="searchable-row">
                        <td>
                            <span class="badge bg-primary mb-1">${order.ref || 'TKK-2026'}</span>
                            <span class="fw-bold d-block search-target">${order.customerName || 'Kabayan'}</span>
                            <small class="text-muted"><i class="bi bi-whatsapp text-success"></i> +971 ${order.phone || ''}</small>
                        </td>
                        <td><small class="text-secondary">${order.itemsSummary}</small></td>
                        <td>
                            <select class="form-select form-select-sm shadow-none border-secondary fw-bold" onchange="updateOrderStatus(${index}, this.value)">
                                <option value="Pending Delivery" ${currentStatus === 'Pending Delivery' ? 'selected' : ''}>🟡 Pending</option>
                                <option value="In Cooking" ${currentStatus === 'In Cooking' ? 'selected' : ''}>🟠 In Cooking</option>
                                <option value="Out for Delivery" ${currentStatus === 'Out for Delivery' ? 'selected' : ''}>🔵 Out for Delivery</option>
                                <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>🟢 Delivered</option>
                            </select>
                        </td>
                    </tr>`;
            } else {
                if (currentStatus === 'Pending Delivery') pendingStoreCount++;
                storeRowsHtml += `
                    <tr class="searchable-row">
                        <td>
                            <span class="badge bg-secondary mb-1">${order.ref || 'TKK-2026'}</span>
                            <span class="fw-bold d-block search-target">${order.customerName || 'Kabayan'}</span>
                            <small class="text-muted"><i class="bi bi-whatsapp text-success"></i> +971 ${order.phone || ''}</small>
                        </td>
                        <td><small class="text-secondary">${order.itemsSummary}</small></td>
                        <td class="fw-bold text-success">${parseFloat(order.total || 0).toFixed(2)} AED</td>
                        <td>
                            <select class="form-select form-select-sm shadow-none border-secondary fw-bold" onchange="updateOrderStatus(${index}, this.value)">
                                <option value="Pending Delivery" ${currentStatus === 'Pending Delivery' ? 'selected' : ''}>🟡 Pending</option>
                                <option value="In Cooking" ${currentStatus === 'In Cooking' ? 'selected' : ''}>🟠 In Cooking</option>
                                <option value="Out for Delivery" ${currentStatus === 'Out for Delivery' ? 'selected' : ''}>🔵 Out for Delivery</option>
                                <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>🟢 Delivered</option>
                            </select>
                        </td>
                    </tr>`;
            }
        });

        if(statSales) statSales.innerText = totalRevenue.toFixed(2) + " AED";
        if(storeTableBody) storeTableBody.innerHTML = storeRowsHtml || `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang Store Orders.</td></tr>`;
        if(bilaoTableBody) bilaoTableBody.innerHTML = bilaoRowsHtml || `<tr><td colspan="3" class="text-center text-muted py-4">Wala pang Bookings.</td></tr>`;
    } else {
        if(statOrders) statOrders.innerText = "0";
        if(statSales) statSales.innerText = "0.00 AED";
        if(storeTableBody) storeTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang pumasok na order.</td></tr>`;
        if(bilaoTableBody) bilaoTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Wala pang pumasok na booking.</td></tr>`;
    }

    const bCart = document.getElementById("badgeCartOrders");
    const bBook = document.getElementById("badgeBookings");
    if(bCart) bCart.innerText = pendingStoreCount > 0 ? `${pendingStoreCount} New` : "0";
    if(bBook) bBook.innerText = pendingBilaoCount > 0 ? `${pendingBilaoCount} New` : "0";
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

function loadOrderHistoryTable() {
    const historyTableBody = document.getElementById("orderHistoryTableBody");
    if(!historyTableBody) return;
    const historyOrders = JSON.parse(localStorage.getItem("tkk_order_history")) || [];

    if (historyOrders.length > 0) {
        let html = "";
        historyOrders.forEach(order => {
            html += `
                <tr class="searchable-row">
                    <td>
                        <span class="badge bg-success mb-1">${order.ref || 'TKK-2026'}</span>
                        <span class="fw-bold d-block">${order.customerName || 'Kabayan'}</span>
                        <small class="text-muted">+971 ${order.phone || ''}</small>
                    </td>
                    <td><small class="text-secondary">${order.itemsSummary}</small></td>
                    <td class="fw-bold text-success">${parseFloat(order.total || 0).toFixed(2)} AED</td>
                    <td><span class="badge bg-success">Completed</span></td>
                </tr>`;
        });
        historyTableBody.innerHTML = html;
    } else {
        historyTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang history.</td></tr>`;
    }
}

function loadAdminProductsTable() {
    const tableBody = document.getElementById("adminProductsTableBody");
    if(!tableBody) return;
    let customProducts = JSON.parse(localStorage.getItem("tkk_custom_products")) || [];

    if(customProducts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Wala pang paninda. Magdagdag ng ulam.</td></tr>`;
        return;
    }

    let html = "";
    customProducts.forEach(prod => {
        const isAvailable = prod.available !== false;
        html += `
            <tr class="searchable-row">
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${prod.image}" class="rounded-3 object-fit-cover" style="width: 45px; height: 45px;" alt="Ulam">
                        <div>
                            <span class="fw-bold d-block">${prod.name}</span>
                            <small class="text-muted text-truncate d-inline-block" style="max-width: 180px;">${prod.description || ''}</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border">${prod.category}</span></td>
                <td class="fw-bold text-success">${Number(prod.price).toFixed(2)} AED</td>
                <td>${isAvailable ? '<span class="badge bg-success">Available</span>' : '<span class="badge bg-danger">Sold Out</span>'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn ${isAvailable ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold" onclick="promptToggleStatus(${prod.id})">${isAvailable ? 'Sold Out' : 'Available'}</button>
                        <button class="btn btn-outline-dark" onclick="promptDeleteProduct(${prod.id})"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>`;
    });
    tableBody.innerHTML = html;
}

function promptToggleStatus(id) {
    let customProducts = JSON.parse(localStorage.getItem("tkk_custom_products")) || [];
    const prod = customProducts.find(p => p.id == id);
    if(prod) {
        document.getElementById("toggleTargetId").value = id;
        document.getElementById("toggleStatusModalMsg").innerText = `Gusto mo bang baguhin ang status ng "${prod.name}"?`;
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
    localStorage.setItem("tkk_custom_products", JSON.stringify(customProducts.filter(p => p.id != id)));
    bootstrap.Modal.getInstance(document.getElementById('deleteProductModal')).hide();
    loadAdminProductsTable();
}

function handleAddNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById("prodName").value.trim();
    const category = document.getElementById("prodCategory").value;
    const price = parseFloat(document.getElementById("prodPrice").value);
    const imageFile = document.getElementById("prodImageFile").files[0];
    const description = document.getElementById("prodDesc").value.trim();
    
    if (!imageFile) { alert("Pumili muna ng larawan!"); return; }

    const reader = new FileReader();
    reader.onload = function(uploadEvent) {
        const newProduct = {
            id: Date.now(), name, category, price,
            image: uploadEvent.target.result,
            description, available: true
        };
        let customProducts = JSON.parse(localStorage.getItem("tkk_custom_products")) || [];
        customProducts.push(newProduct);
        localStorage.setItem("tkk_custom_products", JSON.stringify(customProducts));

        bootstrap.Modal.getInstance(document.getElementById('addProductModal'))?.hide();
        document.getElementById("addProductForm").reset();
        loadAdminProductsTable();
    };
    reader.readAsDataURL(imageFile);
}

function filterAdminTables() {
    const filter = document.getElementById("adminSearchInput").value.toLowerCase();
    document.querySelectorAll(".searchable-row").forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
}