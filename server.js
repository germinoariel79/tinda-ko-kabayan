const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares (Naka-set sa 50mb para kaya ang malalaking image uploads)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ----------------------------------------------------
// SUPABASE CONFIGURATION (Puro at valid URL)
// ----------------------------------------------------
// SUPABASE CONFIGURATION (Ligtas gamit ang Environment Variables)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ROOT ROUTE: Piliting isalubong ang homepage.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

app.use(express.static(__dirname));

// ==========================================
// 1. AUTHENTICATION ENDPOINTS (Supabase 'users' table)
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { name, phone, emirate } = req.body;
        if (!name || !phone || !emirate) {
            return res.status(400).json({ success: false, message: "Kailangan ang buong pangalan, phone, at emirate!" });
        }
        const cleanPhone = phone.replace(/\s/g, '');

        // Check kung existing na
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (existingUser) {
            await supabase.from('users').update({ isActive: true }).eq('phone', cleanPhone);
            return res.status(400).json({ success: false, message: "May account na ang WhatsApp number na ito!" });
        }

        const newUser = {
            name: name.trim(),
            phone: cleanPhone,
            emirate: emirate,
            isActive: true,
            createdAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })
        };

        const { data, error } = await supabase.from('users').insert([newUser]).select();
        if (error) throw error;

        return res.json({ success: true, message: "Matagumpay ang iyong pag-register!", user: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: "Pakilagay ang iyong WhatsApp number!" });
        }
        const cleanPhone = phone.replace(/\s/g, '');

        const { data: foundUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (error || !foundUser) {
            return res.status(404).json({ success: false, message: "Wala pang account ang numerong ito." });
        }

        await supabase.from('users').update({ isActive: true }).eq('phone', cleanPhone);
        return res.json({ success: true, message: "Welcome back, Kabayan!", user: foundUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/logout', async (req, res) => {
    try {
        const { phone } = req.body;
        if (phone) {
            const cleanPhone = phone.replace(/\s/g, '');
            await supabase.from('users').update({ isActive: false }).eq('phone', cleanPhone);
        }
        return res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 2. PRODUCTS / MENU API ENDPOINTS (Supabase 'products' table)
// ==========================================
app.get('/api/products', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
        if (error) throw error;
        res.json({ success: true, products: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/products', async (req, res) => {
    try {
        const { name, category, price, image, description } = req.body;
        const newProduct = {
            name,
            category,
            price: parseFloat(price),
            image,
            description,
            available: true
        };

        const { data, error } = await supabase.from('products').insert([newProduct]).select();
        if (error) throw error;

        res.json({ success: true, message: "Naidagdag na ang ulam sa menu!", product: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/products/:id/toggle', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        // Kunin muna ang current status
        const { data: prod } = await supabase.from('products').select('available').eq('id', productId).single();
        if (!prod) return res.status(404).json({ success: false, message: "Hindi nahanap ang paninda." });

        const newStatus = !prod.available;
        const { data, error } = await supabase.from('products').update({ available: newStatus }).eq('id', productId).select();
        if (error) throw error;

        res.json({ success: true, message: "Na-update ang status ng ulam!", product: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;

        res.json({ success: true, message: "Nabura na ang paninda." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 3. ORDERS & ADMIN ENDPOINTS (Supabase 'orders' table)
// ==========================================
app.get('/api/admin/users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        res.json({ success: true, count: data.length, users: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const { data, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
        if (error) throw error;
        res.json({ success: true, count: data.length, orders: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { customerName, phone, emirate, itemsSummary, total } = req.body;
        const newOrder = {
            customerName,
            phone,
            emirate,
            itemsSummary,
            total: parseFloat(total),
            status: "Pending Delivery",
            orderDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })
        };

        const { data, error } = await supabase.from('orders').insert([newOrder]).select();
        if (error) throw error;

        res.json({ success: true, message: "Pumasok na ang order sa Admin!", order: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;

        const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select();
        if (error) throw error;

        res.json({ success: true, message: "Na-update ang Order Status!", order: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Tinda Ko Kabayan Backend Server (Supabase Connected) is Running on port ${PORT}`);
});