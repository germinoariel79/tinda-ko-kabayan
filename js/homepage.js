// Global variables para sa dynamic anti-spam captchas
let regAnswer = 0;
let logAnswer = 0;
const API_BASE_URL = "http://localhost:3000/api";

// Pilitin ibalik sa pinakataas (top) ang page kapag nag-refresh o nag-load
window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
});

// Pag-load ng pahina (Pinag-isa na lahat dito para malinis)
document.addEventListener("DOMContentLoaded", () => {
    window.scrollTo(0, 0);
    generateRegisterCaptcha();
    generateLoginCaptcha();
    fetchRegisteredUsersCount(); // Kunin ang live count ng users

    // Restrict Phone Inputs to numbers only & max 9 digits
    const phoneInputs = [document.getElementById("regPhone"), document.getElementById("logPhone")];
    phoneInputs.forEach(input => {
        if (input) {
            input.addEventListener("input", (e) => {
                // Tanggalin ang lahat ng hindi numero at limit sa 9 digits
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
            });
        }
    });
});

// Helper Function para magpakita ng Pro-looking Modal sa halip na browser alert()
function showTkkModal(title, message, isSuccess = true, callback = null) {
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalIconContainer = document.getElementById("modalIconContainer");
    const modalIcon = document.getElementById("modalIcon");
    const modalElement = document.getElementById("tkkNoticeModal");

    if (modalTitle && modalMessage) {
        modalTitle.innerText = title;
        modalMessage.innerText = message;

        if (isSuccess) {
            modalIconContainer.className = "mb-3 fs-1 text-success";
            modalIcon.className = "bi bi-check-circle-fill";
        } else {
            modalIconContainer.className = "mb-3 fs-1 text-danger";
            modalIcon.className = "bi bi-exclamation-triangle-fill";
        }

        const bsModal = new bootstrap.Modal(modalElement);
        bsModal.show();

        if (callback) {
            modalElement.addEventListener('hidden.bs.modal', function onHidden() {
                callback();
                modalElement.removeEventListener('hidden.bs.modal', onHidden);
            });
        }
    } else {
        // Fallback sa alert kung sakaling wala ang modal elements
        alert(message);
        if (callback) callback();
    }
}

// Function para sa Register Captcha
function generateRegisterCaptcha() {
    const num1 = Math.floor(Math.random() * 6) + 1;
    const num2 = Math.floor(Math.random() * 5) + 1;
    regAnswer = num1 + num2;
    
    const label = document.getElementById("captchaLabel");
    if (label) {
        label.innerText = `Anti-Spam Verification: Magkano ang ${num1} + ${num2}? *`;
    }
}

// Function para sa Login Captcha
function generateLoginCaptcha() {
    const num1 = Math.floor(Math.random() * 6) + 1;
    const num2 = Math.floor(Math.random() * 5) + 1;
    logAnswer = num1 + num2;
    
    const label = document.getElementById("loginCaptchaLabel");
    if (label) {
        label.innerText = `Anti-Spam Verification: Magkano ang ${num1} + ${num2}? *`;
    }
}

// Function para mag-switch sa pagitan ng Register at Login form
function switchAuthMode(mode) {
    const btnReg = document.getElementById("btnTabReg");
    const btnLog = document.getElementById("btnTabLog");
    const formReg = document.getElementById("registerForm");
    const formLog = document.getElementById("loginForm");

    if (mode === 'register') {
        btnReg.classList.add("active", "shadow-sm");
        btnReg.classList.remove("text-muted");
        btnLog.classList.remove("active", "shadow-sm");
        btnLog.classList.add("text-muted");

        formReg.classList.remove("d-none");
        formLog.classList.add("d-none");
        generateRegisterCaptcha();
    } else {
        btnLog.classList.add("active", "shadow-sm");
        btnLog.classList.remove("text-muted");
        btnReg.classList.remove("active", "shadow-sm");
        btnReg.classList.add("text-muted");

        formLog.classList.remove("d-none");
        formReg.classList.add("d-none");
        generateLoginCaptcha();
    }
}

// 1. REGISTRATION HANDLER (Na-update: Babalik sa Login pagka-register)
async function handleRegister(e) {
    e.preventDefault();
    
    const captchaVal = parseInt(document.getElementById("regCaptcha").value.trim());
    if (captchaVal !== regAnswer) {
        showTkkModal("Mali ang Sagot!", "Mali ang sagot sa Anti-Spam Verification. Pakisubukan muli.", false);
        generateRegisterCaptcha();
        document.getElementById("regCaptcha").value = "";
        return;
    }

    const name = document.getElementById("regName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const emirate = document.getElementById("regEmirate").value;

    if (phone.length !== 9) {
        showTkkModal("Mali ang Numero", "Kailangang eksaktong 9 digits ang iyong UAE WhatsApp number (Halimbawa: 501234567).", false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, emirate })
        });

        const data = await response.json();

        if (data.success) {
            // Huwag munang i-save ang tkk_user para sa index.html, kundi i-reset at papasukin sa Login!
            showTkkModal("Rehistrado na Ka Na, Kabayan!", `Matagumpay ang pag-register mo, ${name}! Ngayon, mag-login gamit ang iyong WhatsApp number para makapasok sa store.`, true, () => {
                document.getElementById("registerForm").reset();
                
                // I-switch pabalik sa Login form para kailangan niyang mag-log in
                switchAuthMode('login');
                
                // Opsyonal: Ilagay na agad ang phone number niya sa login input para madali
                const logPhoneEl = document.getElementById("logPhone");
                if(logPhoneEl) logPhoneEl.value = phone;
            });
        } else {
            showTkkModal("Pansin!", data.message, false);
        }
    } catch (err) {
        console.error("Backend Error:", err);
        showTkkModal("Connection Error", "Hindi makakonekta sa Server! Siguraduhing nakatakbo ang 'node server.js'.", false);
    }
}

// 2. LOGIN HANDLER
async function handleLogin(e) {
    e.preventDefault();
    
    const captchaVal = parseInt(document.getElementById("logCaptcha").value.trim());
    if (captchaVal !== logAnswer) {
        showTkkModal("Mali ang Sagot!", "Mali ang sagot sa Anti-Spam Verification. Pakisubukan muli.", false);
        generateLoginCaptcha();
        document.getElementById("logCaptcha").value = "";
        return;
    }

    const phoneInput = document.getElementById("logPhone").value.trim();
    
    if (phoneInput.length !== 9) {
        showTkkModal("Mali ang Numero", "Kailangang eksaktong 9 digits ang iyong UAE WhatsApp number (Halimbawa: 501234567).", false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: phoneInput })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("tkk_user", JSON.stringify(data.user));
            showTkkModal("Maligayang Pagbabalik!", `Welcome back, ${data.user.name}! Diretso na tayo sa menu store.`, true, () => {
                window.location.href = "index.html";
            });
        } else {
            showTkkModal("Wala pang Account", data.message, false);
        }
    } catch (err) {
        console.error("Backend Error:", err);
        showTkkModal("Connection Error", "Hindi makakonekta sa Server! Siguraduhing nakatakbo ang 'node server.js'.", false);
    }
}

// Function para kunin ang accurate/real-time count ng users mula sa Node.js backend API
async function fetchRegisteredUsersCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        const data = await response.json();
        
        if (data.success) {
            const badge = document.getElementById("userCountBadge");
            if (badge) {
                // Base community number (1420) + tunay na bilang ng nakarehistro sa Admin Database
                const realUserCount = data.count || 0;
                const totalCalculated = 1420 + realUserCount;

                badge.innerText = totalCalculated.toLocaleString(); // Format para may koma (e.g. 1,425)
            }
        }
    } catch (err) {
        console.error("Hindi makuha ang live user count:", err);
        const badge = document.getElementById("userCountBadge");
        if (badge) badge.innerText = "1,420";
    }
}