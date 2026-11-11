// ==========================================
// SECURITY GUARD: Harangin ang direktang pagpasok
// ==========================================
const currentUserSession = JSON.parse(localStorage.getItem("tkk_user") || "{}");
if (!currentUserSession.phone) {
    window.location.href = "homepage.html";
}

let regAnswer = 0;
let logAnswer = 0;
const API_BASE_URL = "https://tinda-ko-kabayan.onrender.com/api";

let cart = [];
let cachedProducts = [];
let lastKnownOrderStatus = "";
let unreadOrderUpdates = 0;

async function loadFoodItems() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const data = await response.json();
        if (data.success) {
            cachedProducts = data.products;
            renderFoodGrid(cachedProducts);
        }
    } catch (err) {
        console.error("Error loading products from server:", err);
    }
}

function getFoodItems() {
    return cachedProducts;
}

document.addEventListener("DOMContentLoaded", async () => {
    window.scrollTo(0, 0);
    await loadFoodItems();
    updateCartUI();
    checkUserOrderStatus();
    setInterval(checkUserOrderStatus, 4000);

    const phoneInput = document.getElementById("bookPhone");
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
        });
    }
});

function checkUserOrderStatus() {
    const savedUser = JSON.parse(localStorage.getItem("tkk_user") || "{}");
    const savedOrders = JSON.parse(localStorage.getItem("tkk_orders")) || [];
    
    const myOrder = savedOrders.find(o => (o.phone === savedUser.phone || o.customerName === savedUser.name) && !o.dismissedByCustomer);
    const trackerCard = document.getElementById("userOrderTrackerCard");
    const notifBadge = document.getElementById("orderNotifBadge");
    const mobNotifBadge = document.getElementById("mobOrderNotifBadge");

    if(!myOrder || !trackerCard) {
        if(trackerCard) trackerCard.classList.add("d-none");
        if(notifBadge) notifBadge.style.display = "none";
        if(mobNotifBadge) mobNotifBadge.style.display = "none";
        return;
    }
    
    trackerCard.classList.remove("d-none");
    const refCodeEl = document.getElementById("trackRefCode");
    if(refCodeEl) refCodeEl.innerText = "Ref: " + (myOrder.ref || "TKK-2026");
    
    const badge = document.getElementById("trackStatusBadge");
    const pBar = document.getElementById("trackProgressBar");
    const status = myOrder.status || "Pending Delivery";

    if (lastKnownOrderStatus !== "" && lastKnownOrderStatus !== status) {
        unreadOrderUpdates++;
        showToast(`🔔 Update sa Order mo: Na-update na sa "${status}"!`);
        if(notifBadge) { notifBadge.innerText = unreadOrderUpdates; notifBadge.style.display = "inline-block"; }
        if(mobNotifBadge) { mobNotifBadge.innerText = unreadOrderUpdates; mobNotifBadge.style.display = "inline-block"; }
    }
    lastKnownOrderStatus = status;

    const sPending = document.getElementById("stepPending");
    const sCooking = document.getElementById("stepCooking");
    const sDelivery = document.getElementById("stepDelivery");
    const sDelivered = document.getElementById("stepDelivered");

    [sPending, sCooking, sDelivery, sDelivered].forEach(el => { if(el) el.className = "text-white-50"; });

    const actionArea = document.getElementById("trackerActionArea");

    if(status === "Pending Delivery" || status === "Pending") {
        if(badge) { badge.className = "badge bg-warning text-dark px-2 py-1 rounded-pill"; badge.innerText = "🟡 Pending"; }
        if(pBar) { pBar.style.width = "25%"; pBar.className = "progress-bar bg-warning progress-bar-striped progress-bar-animated"; }
        if(sPending) sPending.className = "text-warning fw-bold"; if(actionArea) actionArea.innerHTML = "";
    } else if(status === "In Cooking") {
        if(badge) { badge.className = "badge text-white px-2 py-1 rounded-pill shadow-sm"; badge.style.backgroundColor = "#fd7e14"; badge.innerText = "🟠 Cooking"; }
        if(pBar) { pBar.style.width = "50%"; pBar.className = "progress-bar bg-warning progress-bar-striped progress-bar-animated"; }
        if(sCooking) sCooking.className = "text-warning fw-bold"; if(actionArea) actionArea.innerHTML = "";
    } else if(status === "Out for Delivery") {
        if(badge) { badge.className = "badge bg-info text-dark px-2 py-1 rounded-pill shadow-sm"; badge.innerText = "🔵 Delivery"; }
        if(pBar) { pBar.style.width = "75%"; pBar.className = "progress-bar bg-info progress-bar-striped progress-bar-animated"; }
        if(sDelivery) sDelivery.className = "text-info fw-bold"; if(actionArea) actionArea.innerHTML = "";
    } else if(status === "Delivered") {
        if(badge) { badge.className = "badge bg-success text-white px-2 py-1 rounded-pill shadow-sm"; badge.innerText = "🟢 Delivered"; }
        if(pBar) { pBar.style.width = "100%"; pBar.className = "progress-bar bg-success"; }
        if(sDelivered) sDelivered.className = "text-success fw-bold";
        if(actionArea) {
            actionArea.innerHTML = `
                <div class="mt-2 text-center">
                    <small class="text-success fw-bold d-block mb-1">🎉 Order Complete!</small>
                    <button class="btn btn-sm btn-warning w-100 fw-bold rounded-pill shadow-sm" onclick="clearDeliveredTracker('${myOrder.ref}')">
                        <i class="bi bi-arrow-repeat me-1"></i> Mag-order Ulit
                    </button>
                </div>`;
        }
    }
}

function clearDeliveredTracker(refCode) {
    let savedOrders = JSON.parse(localStorage.getItem("tkk_orders") || "[]");
    let historyOrders = JSON.parse(localStorage.getItem("tkk_order_history") || "[]");
    const finishedOrder = savedOrders.find(o => o.ref === refCode);
    
    if(finishedOrder) {
        historyOrders.unshift(finishedOrder);
        localStorage.setItem("tkk_order_history", JSON.stringify(historyOrders));
        savedOrders = savedOrders.filter(o => o.ref !== refCode);
        localStorage.setItem("tkk_orders", JSON.stringify(savedOrders));
    }
    lastKnownOrderStatus = "";
    checkUserOrderStatus();
    showToast("Handa ka nang mag-order ulit, kabayan!");
}

function toggleCartDrawer(open = null) {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("cartBackdrop");
    if(!drawer || !backdrop) return;

    if(open === true || !drawer.classList.contains("open")) {
        drawer.classList.add("open");
        backdrop.classList.add("show");
        unreadOrderUpdates = 0;
        const notifBadge = document.getElementById("orderNotifBadge");
        const mobNotifBadge = document.getElementById("mobOrderNotifBadge");
        if(notifBadge) notifBadge.style.display = "none";
        if(mobNotifBadge) mobNotifBadge.style.display = "none";
    } else {
        drawer.classList.remove("open");
        backdrop.classList.remove("show");
    }
}

function renderFoodGrid(items) {
    const grid = document.getElementById("foodGrid");
    if(!grid) return;
    grid.innerHTML = "";

    if(items.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-shop fs-1 text-warning"></i><p class="mt-2 small">Wala pang nakalagay na ulam. Magdagdag na sa Admin Dashboard!</p></div>`;
        return;
    }

    items.forEach(item => {
        const isAvailable = item.available !== false;
        const cardHTML = `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card food-card h-100 border-0 shadow-sm ${!isAvailable ? 'opacity-75' : ''}">
                    <div class="position-relative">
                        <img src="${item.image}" class="food-card-img" alt="${item.name}">
                        ${!isAvailable ? '<span class="position-absolute top-50 start-50 translate-middle badge bg-danger px-3 py-2 fs-6 shadow">SOLD OUT</span>' : ''}
                    </div>
                    <div class="card-body p-2 p-md-3 d-flex flex-column justify-content-between">
                        <div>
                            <h6 class="fw-bold mb-1 fs-6 text-truncate">${item.name}</h6>
                            <p class="text-muted small mb-2 d-none d-sm-block" style="font-size: 0.75rem;">${item.description ? item.description.substring(0, 45) + '...' : ''}</p>
                        </div>
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-2 pt-1 border-top">
                            <span class="price-tag align-self-start">${Number(item.price).toFixed(2)} AED</span>
                            <div class="btn-group btn-group-sm w-100 w-sm-auto">
                                <button class="btn btn-outline-secondary py-1 px-2 shadow-none fw-semibold" onclick="openFoodModal(${item.id})" style="font-size: 0.75rem;">Tingnan</button>
                                ${isAvailable ? `<button class="btn btn-ph-primary fw-bold py-1 px-2 shadow-none" onclick="addToCart(${item.id})" style="font-size: 0.75rem;"><i class="bi bi-plus-lg"></i> Add</button>` : `<button class="btn btn-secondary fw-bold py-1 px-2 shadow-none" disabled style="font-size: 0.75rem;">Sold Out</button>`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        grid.innerHTML += cardHTML;
    });
}

function filterCategory(cat, btn) {
    document.querySelectorAll(".filter-buttons button").forEach(b => {
        b.classList.remove("active", "btn-ph-primary");
        b.classList.add("btn-outline-ph-primary");
    });
    btn.classList.add("active", "btn-ph-primary");
    btn.classList.remove("btn-outline-ph-primary");

    const items = getFoodItems();
    if (cat === "all") {
        renderFoodGrid(items);
    } else {
        renderFoodGrid(items.filter(item => item.category === cat));
    }
}

function filterItems() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase();
    const items = getFoodItems();
    renderFoodGrid(items.filter(item => item.name.toLowerCase().includes(query) || (item.description && item.description.toLowerCase().includes(query))));
}

function addToCart(id) {
    const items = getFoodItems();
    const existing = cart.find(item => item.id == id);
    if(existing) {
        existing.qty += 1;
    } else {
        const food = items.find(f => f.id == id);
        if(food) cart.push({ ...food, qty: 1 });
    }
    updateCartUI();
    showToast("Naidagdag na sa cart, kabayan!");
}

function updateCartQty(id, delta) {
    const item = cart.find(i => i.id == id);
    if(item) {
        item.qty += delta;
        if(item.qty <= 0) cart = cart.filter(i => i.id != id);
    }
    updateCartUI();
}

function updateCartUI() {
    const countEl = document.getElementById("cartCount");
    const mobCountElReal = document.getElementById("mobCartCount");
    const totalEl = document.getElementById("cartTotalAED");
    const listEl = document.getElementById("cartItemList");
    const barEl = document.getElementById("freeDeliveryBar");
    const msgEl = document.getElementById("freeDeliveryMsg");

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

    if(countEl) countEl.innerText = totalQty;
    if(mobCountElReal) mobCountElReal.innerText = totalQty;
    if(totalEl) totalEl.innerText = totalPrice.toFixed(2) + " AED";

    const target = 100;
    const progress = Math.min((totalPrice / target) * 100, 100);
    if(barEl) barEl.style.width = progress + "%";
    
    if(msgEl) {
        if(totalPrice >= target) {
            msgEl.innerText = "🎉 Congratulations! Pasok ka na sa FREE DELIVERY sa Sharjah!";
            msgEl.className = "text-success fw-bold small mt-1 d-block";
        } else {
            const diff = (target - totalPrice).toFixed(2);
            msgEl.innerText = `Magdagdag pa ng ${diff} AED para sa FREE DELIVERY sa Sharjah!`;
            msgEl.className = "text-muted small mt-1 d-block";
        }
    }

    if(!listEl) return;
    if(cart.length === 0) {
        listEl.innerHTML = `<div class="text-center py-5 text-muted"><i class="bi bi-basket fs-1"></i><p class="mt-2 small">Walang laman ang cart mo, kabayan!</p></div>`;
        return;
    }

    listEl.innerHTML = "";
    cart.forEach(item => {
        listEl.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div>
                    <h6 class="mb-0 fw-bold fs-6">${item.name}</h6>
                    <small class="text-ph-red fw-bold">${Number(item.price).toFixed(2)} AED x ${item.qty}</small>
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary shadow-none" onclick="updateCartQty(${item.id}, -1)">-</button>
                    <button class="btn btn-light" disabled>${item.qty}</button>
                    <button class="btn btn-outline-secondary shadow-none" onclick="updateCartQty(${item.id}, 1)">+</button>
                </div>
            </div>`;
    });
}

function openFoodModal(id) {
    const food = getFoodItems().find(f => f.id == id);
    if(!food) return;

    const isAvailable = food.available !== false;
    document.getElementById("modalTitle").innerText = food.name;
    document.getElementById("modalImg").src = food.image;
    document.getElementById("modalDesc").innerText = food.description || "Walang deskripsyon.";
    document.getElementById("modalPrice").innerText = Number(food.price).toFixed(2) + " AED";
    
    const addBtn = document.getElementById("modalAddBtn");
    if(isAvailable) {
        addBtn.className = "btn btn-ph-primary px-4 py-2 rounded-pill fw-bold shadow-sm text-nowrap";
        addBtn.innerText = "Idagdag sa Cart";
        addBtn.disabled = false;
        addBtn.onclick = () => {
            addToCart(food.id);
            bootstrap.Modal.getInstance(document.getElementById('foodModal')).hide();
        };
    } else {
        addBtn.className = "btn btn-secondary px-4 py-2 rounded-pill fw-bold shadow-sm text-nowrap";
        addBtn.innerText = "Not Available (Sold Out)";
        addBtn.disabled = true;
    }
    new bootstrap.Modal(document.getElementById('foodModal')).show();
}

async function switchTab(tab) {
    document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-item-btn").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".app-view").forEach(el => el.classList.add("d-none"));

    if(tab === 'menu') {
        document.getElementById("tab-menu")?.classList.add("active");
        document.getElementById("mob-tab-menu")?.classList.add("active");
        document.getElementById("view-menu")?.classList.remove("d-none");
        await loadFoodItems();
    } else if(tab === 'book') {
        document.getElementById("tab-book")?.classList.add("active");
        document.getElementById("mob-tab-book")?.classList.add("active");
        document.getElementById("view-book")?.classList.remove("d-none");
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(msg) {
    const toastMsgEl = document.getElementById("toastMsg");
    const toastEl = document.getElementById('cartToast');
    if(!toastMsgEl || !toastEl) return;
    toastMsgEl.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i> ${msg}`;
    new bootstrap.Toast(toastEl).show();
}

function openCartConfirmModal() {
    if(cart.length === 0) {
        document.getElementById("alertModalMsg").innerText = "Wala pang laman ang cart mo, kabayan!";
        new bootstrap.Modal(document.getElementById('alertModal')).show();
        return;
    }
    const listEl = document.getElementById("modalCartSummaryList");
    const totalEl = document.getElementById("modalCartTotal");
    let html = "", total = 0;
    
    cart.forEach(item => {
        const subtotal = Number(item.price) * item.qty;
        total += subtotal;
        html += `<div class="d-flex justify-content-between mb-1"><span>${item.name} (x${item.qty})</span><span class="fw-bold">${subtotal.toFixed(2)} AED</span></div>`;
    });

    if(listEl) listEl.innerHTML = html;
    if(totalEl) totalEl.innerText = total.toFixed(2) + " AED";
    toggleCartDrawer(false); 
    new bootstrap.Modal(document.getElementById('cartConfirmModal')).show();
}

async function confirmAndSubmitCartOrder() {
    const savedUser = JSON.parse(localStorage.getItem("tkk_user") || "{}");
    const refCode = "TKK-2026-" + Math.floor(1000 + Math.random() * 9000);
    const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    const itemsSummary = cart.map(i => `${i.name} (${i.qty}x)`).join(', ');
    
    const newOrderPayload = {
        customerName: savedUser.name || 'Walk-in Customer',
        phone: savedUser.phone || 'N/A',
        emirate: savedUser.emirate || 'Sharjah',
        itemsSummary: itemsSummary,
        total: total
    };

    try {
        await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newOrderPayload)
        });
    } catch(err) {
        console.error("Error submitting order to server:", err);
    }

    const localOrder = {
        ...newOrderPayload,
        status: 'Pending Delivery',
        ref: refCode,
        date: new Date().toISOString(),
        dismissedByCustomer: false
    };

    let orders = JSON.parse(localStorage.getItem("tkk_orders")) || [];
    orders.unshift(localOrder);
    localStorage.setItem("tkk_orders", JSON.stringify(orders));

    bootstrap.Modal.getInstance(document.getElementById('cartConfirmModal'))?.hide();
    cart = [];
    updateCartUI();
    checkUserOrderStatus();

    document.getElementById("successRefCode").innerText = refCode;
    new bootstrap.Modal(document.getElementById('orderSuccessModal')).show();
}

function openBookingConfirmModal(e) {
    e.preventDefault();
    document.getElementById("modalBookName").innerText = document.getElementById("bookName").value;
    document.getElementById("modalBookPhone").innerText = "+971 " + document.getElementById("bookPhone").value;
    document.getElementById("modalBookAddr").innerText = `${document.getElementById("bookAddress").value}, ${document.getElementById("bookEmirate").value}`;
    document.getElementById("modalBookDateTime").innerText = `${document.getElementById("bookDate").value} (${document.getElementById("bookTime").value})`;
    document.getElementById("modalBookDetails").innerText = document.getElementById("bookDetails").value;
    new bootstrap.Modal(document.getElementById('bookingConfirmModal')).show();
}

async function confirmAndSubmitBookingOrder() {
    const refCode = "TKK-2026-" + Math.floor(1000 + Math.random() * 9000);
    const bookingDetails = `[BOOKING] ${document.getElementById("bookDetails").value} (Petsa: ${document.getElementById("bookDate").value} - ${document.getElementById("bookTime").value})`;
    
    const bookingPayload = {
        customerName: document.getElementById("bookName").value,
        phone: document.getElementById("bookPhone").value,
        emirate: document.getElementById("bookEmirate").value,
        itemsSummary: bookingDetails,
        total: 0.00
    };

    try {
        await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingPayload)
        });
    } catch(err) {
        console.error("Error submitting booking to server:", err);
    }

    const localBooking = {
        ...bookingPayload,
        status: 'Pending Delivery',
        ref: refCode,
        date: new Date().toISOString(),
        dismissedByCustomer: false
    };

    let orders = JSON.parse(localStorage.getItem("tkk_orders")) || [];
    orders.unshift(localBooking);
    localStorage.setItem("tkk_orders", JSON.stringify(orders));

    bootstrap.Modal.getInstance(document.getElementById('bookingConfirmModal'))?.hide();
    document.getElementById("bookingForm").reset();
    switchTab('menu');
    checkUserOrderStatus();

    document.getElementById("successRefCode").innerText = refCode;
    new bootstrap.Modal(document.getElementById('orderSuccessModal')).show();
}

function openLogoutModal() {
    new bootstrap.Modal(document.getElementById('logoutConfirmModal')).show();
}

async function confirmLogout() {
    let savedUser = JSON.parse(localStorage.getItem("tkk_user") || "{}");
    if (savedUser.phone) {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: savedUser.phone })
            });
        } catch(err) { console.log("Logout sync error:", err); }
    }
    savedUser.isActive = false;
    localStorage.setItem("tkk_user", JSON.stringify(savedUser));
    window.location.href = "homepage.html";
}