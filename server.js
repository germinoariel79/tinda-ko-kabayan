const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares (Nakaset sa 50mb para kaya ang malalaking image upload o Base64)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ROOT ROUTE: Piliting isalubong ang homepage.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

app.use(express.static(__dirname));

// IN-MEMORY DATABASES
let usersDB = [];    
let ordersDB = [];   
let productsDB = [
    {
        id: 1,
        name: "Sizzling Pork Sisig",
        category: "lutong-bahay",
        price: 35.00,
        image: "https://images.unsplash.com/photo-1626509809489-3cb56ab3debc?w=500",
        description: "Malutong at masarap na sisig na may sili at kalamansi.",
        available: true
    },
    {
        id: 2,
        name: "Special Pancit Bilao",
        category: "bilao",
        price: 90.00,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
        description: "Pansit bihon guisado sakto para sa salu-salo ng pamilya at barkada.",
        available: true
    }
];

// ==========================================
// AUTHENTICATION ENDPOINTS
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
        return res.status(400).json({ success: false, message: "May account na ang WhatsApp number na ito!" });
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
    return res.json({ success: true, message: "Matagumpay ang iyong pag-register!", user: newUser });
});

app.post('/api/login', (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ success: false, message: "Pakilagay ang iyong WhatsApp number!" });
    }
    const cleanPhone = phone.replace(/\s/g, '');
    const foundUser = usersDB.find(u => u.phone === cleanPhone);

    if (!foundUser) {
        return res.status(404).json({ success: false, message: "Wala pang account ang numerong ito." });
    }

    foundUser.isActive = true;
    return res.json({ success: true, message: "Welcome back, Kabayan!", user: foundUser });
});

app.post('/api/logout', (req, res) => {
    const { phone } = req.body;
    if (phone) {
        const cleanPhone = phone.replace(/\s/g, '');
        const foundUser = usersDB.find(u => u.phone === cleanPhone);
        if (foundUser) foundUser.isActive = false; 
    }
    return res.json({ success: true, message: "Logged out successfully" });
});

// ==========================================
// PRODUCTS / MENU API ENDPOINTS
// ==========================================
app.get('/api/products', (req, res) => {
    res.json({ success: true, products: productsDB });
});

app.post('/api/admin/products', (req, res) => {
    const { name, category, price, image, description } = req.body;
    const newProduct = {
        id: Date.now(),
        name,
        category,
        price: parseFloat(price),
        image,
        description,
        available: true
    };
    productsDB.push(newProduct);
    res.json({ success: true, message: "Naidagdag na ang ulam sa menu!", product: newProduct });
});

app.put('/api/admin/products/:id/toggle', (req, res) => {
    const productId = parseInt(req.params.id);
    const prod = productsDB.find(p => p.id === productId);
    if (prod) {
        prod.available = !prod.available;
        return res.json({ success: true, message: "Na-update ang status ng ulam!", product: prod });
    }
    res.status(404).json({ success: false, message: "Hindi nahanap ang paninda." });
});

app.delete('/api/admin/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    productsDB = productsDB.filter(p => p.id !== productId);
    res.json({ success: true, message: "Nabura na ang paninda." });
});

// ==========================================
// ORDERS & ADMIN ENDPOINTS
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