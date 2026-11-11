const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// IN-MEMORY DATABASE (Pwedeng i-connect sa MongoDB / PostgreSQL sa hinaharap)
let usersDB = [];    // Lalagyan ng mga rehistradong kabayan
let ordersDB = [];   // Lalagyan ng mga pumasok na oda

// ==========================================
// 1. AUTHENTICATION ENDPOINTS (LOGIN / REGISTER / LOGOUT)
// ==========================================

// API: Registration Endpoint
app.post('/api/register', (req, res) => {
    const { name, phone, emirate } = req.body;

    if (!name || !phone || !emirate) {
        return res.status(400).json({ success: false, message: "Kailangan ang buong pangalan, phone, at emirate!" });
    }

    // Linisin ang phone number (tanggalin ang spaces)
    const cleanPhone = phone.replace(/\s/g, '');

    // Suriin kung may kaparehong number na sa Database
    const existingUser = usersDB.find(u => u.phone === cleanPhone);
    if (existingUser) {
        // Kapag nag-try mag-register ulit, i-update na rin ang active status
        existingUser.isActive = true;
        return res.status(400).json({ success: false, message: "May account na ang WhatsApp number na ito! Mag-login na lamang." });
    }

    // Gawa ng bagong User Profile (naka-set agad bilang active/online)
    const newUser = {
        id: usersDB.length + 1,
        name: name.trim(),
        phone: cleanPhone,
        emirate: emirate,
        isActive: true, // Marker para sa Active (Online) status sa Admin
        createdAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })
    };

    usersDB.push(newUser);
    console.log("--> Bagong Customer na Rehistrado (Online):", newUser);

    return res.json({
        success: true,
        message: "Matagumpay ang iyong pag-register!",
        user: newUser
    });
});

// API: Login Endpoint (Para sa may account na)
app.post('/api/login', (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: "Pakilagay ang iyong WhatsApp number!" });
    }

    const cleanPhone = phone.replace(/\s/g, '');

    // Hanapin sa User Database
    const foundUser = usersDB.find(u => u.phone === cleanPhone);

    if (!foundUser) {
        return res.status(404).json({
            success: false,
            message: "Wala pang account ang numerong ito. Mag-register muna, Kabayan!"
        });
    }

    // I-set bilang Aktibo (Online) kapag nag-login
    foundUser.isActive = true;
    console.log("--> Matagumpay na Mag-login (Online) si:", foundUser.name);

    return res.json({
        success: true,
        message: "Welcome back, Kabayan!",
        user: foundUser
    });
});

// API: Logout Endpoint (Para maging Inactive sa Admin)
app.post('/api/logout', (req, res) => {
    const { phone } = req.body;

    if (phone) {
        const cleanPhone = phone.replace(/\s/g, '');
        const foundUser = usersDB.find(u => u.phone === cleanPhone);
        if (foundUser) {
            foundUser.isActive = false; // Mark bilang Inactive (Logged Out)
            console.log("--> Mag-logout (Offline) si:", foundUser.name);
        }
    }

    return res.json({ success: true, message: "Logged out successfully" });
});

// ==========================================
// 2. ADMIN & ORDERS ENDPOINTS (PARA SA OWNER)
// ==========================================

// API: Kunin ang lahat ng Rehistradong Users para sa Admin
app.get('/api/admin/users', (req, res) => {
    res.json({ success: true, count: usersDB.length, users: usersDB });
});

// API: Kunin ang lahat ng Orders para sa Admin
app.get('/api/admin/orders', (req, res) => {
    res.json({ success: true, count: ordersDB.length, orders: ordersDB });
});

// API: Magpasok ng Bagong Order galing sa Storefront (index.html)
app.post('/api/orders', (req, res) => {
    const { customerName, phone, emirate, itemsSummary, total } = req.body;

    const newOrder = {
        id: ordersDB.length + 1,
        customerName,
        phone,
        emirate,
        itemsSummary,
        total,
        status: "Pending Delivery",
        orderDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })
    };

    ordersDB.push(newOrder);
    console.log("--> Pumasok na Bagong Order:", newOrder);

    res.json({ success: true, message: "Pumasok na ang order sa Admin!", order: newOrder });
});

// API: Palitan ang Delivery Status ng Order (Admin Action)
app.put('/api/admin/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const order = ordersDB.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        console.log(`--> Updated Order #${orderId} Status: ${status}`);
        return res.json({ success: true, message: "Na-update ang Order Status!", order });
    }

    res.status(404).json({ success: false, message: "Hindi nahanap ang order." });
});

// Simulan ang Node.js Server
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Tinda Ko Kabayan Backend Server is Running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`=================================`);
});