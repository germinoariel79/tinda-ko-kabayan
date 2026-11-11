const API_BASE_URL = "https://tinda-ko-kabayan.onrender.com/api";

let cachedUsers = [];
let cachedOrders = [];
let cachedProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    window.scrollTo(0, 0);
    loadAdminData();
    setInterval(loadAdminData, 5000);
});

async function loadAdminData() {
    await Promise.all([
        loadUsersTable(),
        loadOrdersTables(),
        loadAdminProductsTable(),
        loadOrderHistoryTable()
    ]);
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
    }

    if (element) {
        element.classList.add("active", "fw-bold");
        element.classList.remove("text-white-50");
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadUsersTable() {
    const tableBody = document.getElementById("usersTableBody");
    const statUsers = document.getElementById("statTotalUsers");
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        const data = await response.json();
        if (data.success && data.users) {
            cachedUsers = data.users;
            if(statUsers) statUsers.innerText = cachedUsers.length;
            if (cachedUsers.length > 0) {
                let html = "";
                cachedUsers.forEach(user => {
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
        console.error("Error loading users from server:", err);
    }
}

async function loadOrdersTables() {
    const storeTableBody = document.getElementById("storeOrdersTableBody");
    const bilaoTableBody = document.getElementById("bilaoBookingsTableBody");
    const statOrders = document.getElementById("statTotalOrders");
    const statSales = document.getElementById("statTotalSales");

    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders`);
        const data = await response.json();
        if (!data.success) return;
        cachedOrders = data.orders;
    } catch (err) {
        console.error("Error loading orders from server:", err);
        return;
    }

    const activeOrders = cachedOrders.filter(o => o.status !== "Delivered");
    let totalRevenue = 0;
    cachedOrders.forEach(o => totalRevenue += parseFloat(o.total || 0));

    let storeRowsHtml = "", bilaoRowsHtml = "";
    let pendingStoreCount = 0, pendingBilaoCount = 0;

    if (activeOrders.length > 0) {
        if(statOrders) statOrders.innerText = cachedOrders.length;

        activeOrders.forEach(order => {
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
                            <select class="form-select form-select-sm shadow-none border-secondary fw-bold" onchange="updateOrderStatus(${order.id}, this.value)">
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
                            <select class="form-select form-select-sm shadow-none border-secondary fw-bold" onchange="updateOrderStatus(${order.id}, this.value)">
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
        if(statOrders) statOrders.innerText = cachedOrders.length;
        if(statSales) statSales.innerText = totalRevenue.toFixed(2) + " AED";
        if(storeTableBody) storeTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Wala pang pumasok na order.</td></tr>`;
        if(bilaoTableBody) bilaoTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Wala pang pumasok na booking.</td></tr>`;
    }

    const bCart = document.getElementById("badgeCartOrders");
    const bBook = document.getElementById("badgeBookings");
    if(bCart) bCart.innerText = pendingStoreCount > 0 ? `${pendingStoreCount} New` : "0";
    if(bBook) bBook.innerText = pendingBilaoCount > 0 ? `${pendingBilaoCount} New` : "0";
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        loadOrdersTables();
        loadOrderHistoryTable();
    } catch (err) {
        console.error("Error updating order status:", err);
    }
}

async function loadOrderHistoryTable() {
    const historyTableBody = document.getElementById("orderHistoryTableBody");
    if(!historyTableBody) return;

    const deliveredOrders = cachedOrders.filter(o => o.status === "Delivered");

    if (deliveredOrders.length > 0) {
        let html = "";
        deliveredOrders.forEach(order => {
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

async function loadAdminProductsTable() {
    const tableBody = document.getElementById("adminProductsTableBody");
    if(!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const data = await response.json();
        if (!data.success) return;
        cachedProducts = data.products;
    } catch (err) {
        console.error("Error loading products:", err);
        return;
    }

    if(cachedProducts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Wala pang paninda. Magdagdag ng ulam.</td></tr>`;
        return;
    }

    let html = "";
    cachedProducts.forEach(prod => {
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
    const prod = cachedProducts.find(p => p.id == id);
    if(prod) {
        document.getElementById("toggleTargetId").value = id;
        document.getElementById("toggleStatusModalMsg").innerText = `Gusto mo bang baguhin ang status ng "${prod.name}"?`;
        new bootstrap.Modal(document.getElementById('toggleStatusModal')).show();
    }
}

async function confirmToggleProductStatus() {
    const id = document.getElementById("toggleTargetId").value;
    try {
        await fetch(`${API_BASE_URL}/admin/products/${id}/toggle`, { method: "PUT" });
        bootstrap.Modal.getInstance(document.getElementById('toggleStatusModal'))?.hide();
        loadAdminProductsTable();
    } catch(err) { console.error("Error toggling product status:", err); }
}

function promptDeleteProduct(id) {
    document.getElementById("deleteTargetId").value = id;
    new bootstrap.Modal(document.getElementById('deleteProductModal')).show();
}

async function confirmDeleteProduct() {
    const id = document.getElementById("deleteTargetId").value;
    try {
        await fetch(`${API_BASE_URL}/admin/products/${id}`, { method: "DELETE" });
        bootstrap.Modal.getInstance(document.getElementById('deleteProductModal'))?.hide();
        loadAdminProductsTable();
    } catch(err) { console.error("Error deleting product:", err); }
}

// INAYOS NA ADD PRODUCT FUNCTION (Safe Modal Closing & 100+ items ready)
async function handleAddNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById("prodName").value.trim();
    const category = document.getElementById("prodCategory").value;
    const price = parseFloat(document.getElementById("prodPrice").value);
    const description = document.getElementById("prodDesc").value.trim();
    const imageInput = document.getElementById("prodImageFile");
    
    let imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500";

    if (imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        reader.onload = async function(uploadEvent) {
            imageUrl = uploadEvent.target.result;
            await submitProductToServer(name, category, price, imageUrl, description);
        };
        reader.readAsDataURL(file);
    } else {
        await submitProductToServer(name, category, price, imageUrl, description);
    }
}

async function submitProductToServer(name, category, price, image, description) {
    const newProductPayload = { name, category, price, image, description };

    try {
        const response = await fetch(`${API_BASE_URL}/admin/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProductPayload)
        });
        
        const data = await response.json();
        if (data.success) {
            document.getElementById("addProductForm").reset();
            const modalEl = document.getElementById('addProductModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            }
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            loadAdminProductsTable();
        } else {
            alert("May problema sa pag-save: " + data.message);
        }
    } catch(err) {
        console.error("Error adding product to server:", err);
        alert("Hindi naka-konekta sa server.");
    }
}

function filterAdminTables() {
    const searchInput = document.getElementById("adminSearchInput");
    if (!searchInput) return;
    const filter = searchInput.value.toLowerCase();
    document.querySelectorAll(".searchable-row").forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
}

function openLogoutModal() {
    new bootstrap.Modal(document.getElementById('logoutConfirmModal')).show();
}

async function confirmLogoutAdmin() {
    window.location.href = "homepage.html";
}