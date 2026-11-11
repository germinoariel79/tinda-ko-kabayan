const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. ROOT ROUTE: Pilitin munang isalubong ang homepage.html
// ----------------------------------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

// 2. STATIC FILES: I-serve ang buong folder para sa assets, CSS, at JS
app.use(express.static(__dirname));

// Kung sakaling i-type nila nang direkta ang /index.html pero hindi pa naka-login, 
// pwede rin nating lagyan ng fallback kung kinakailangan, pero itong root route ang pinakaunang i-load.

// IN-MEMORY DATABASE (Taguan ng mga rehistradong kabayan at mga pumasok na order)
let usersDB = [];    
let ordersDB = [];   

// ==========================================
// 2. AUTHENTICATION ENDPOINTS (LOGIN / REGISTER / LOGOUT)
// ==========================================

app.post('/api/register', (req, res) => {
    const { name, phone, emirate } = req.body;

    if (!name || !phone || !emirate) {
        return res.status(400).json({ success: false, message: "Kailangan ang buong pangalan, phone, at emirate!" });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const existingUser = usersDB.find(u => u.phone === cleanPhone);

    if (existingUser) {
        existingUser.isActive = true;
        return res.status(400).json({ success: false, message: "May account na ang WhatsApp number na ito! Mag-login na lamang." });
    }

    const newUser = {
        id: usersDB.length + 1,
        name: name.trim(),
        phone: cleanPhone,
        emirate: emirate,
        isActive: true, 
        createdAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })
    };

    usersDB.push(newUser);
    return res.json({
        success: true,
        message: "Matagumpay ang iyong pag-register!",
        user: newUser
    });
});

app.post('/api/login', (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: "Pakilagay ang iyong WhatsApp number!" });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const foundUser = usersDB.find(u => u.phone === cleanPhone);

    if (!foundUser) {
        return res.status(404).json({
            success: false,
            message: "Wala pang account ang numerong ito. Mag-register muna, Kabayan!"
        });
    }

    foundUser.isActive = true;
    return res.json({
        success: true,
        message: "Welcome back, Kabayan!",
        user: foundUser
    });
});

app.post('/api/logout', (req, res) => {
    const { phone } = req.body;

    if (phone) {
        const cleanPhone = phone.replace(/\s/g, '');
        const foundUser = usersDB.find(u => u.phone === cleanPhone);
        if (foundUser) {
            foundUser.isActive = false; 
        }
    }

    return res.json({ success: true, message: "Logged out successfully" });
});

// ==========================================
// 3. ADMIN & ORDERS ENDPOINTS
// ==========================================

app.get('/api/admin/users', (req, res) => {
    res.json({ success: true, count: usersDB.length, users: usersDB });
});

app.get('/api/admin/orders', (req, res) => {
    res.json({ success: true, count: ordersDB.length, orders: ordersDB });
});

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
    res.json({ success: true, message: "Pumasok na ang order sa Admin!", order: newOrder });
});

app.put('/api/admin/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const order = ordersDB.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        return res.json({ success: true, message: "Na-update ang Order Status!", order });
    }

    res.status(404).json({ success: false, message: "Hindi nahanap ang order." });
});

app.listen(PORT, () => {
    console.log(`🚀 Tinda Ko Kabayan Backend Server is Running on port ${PORT}`);
});