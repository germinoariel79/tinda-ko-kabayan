let regAnswer = 0;
let logAnswer = 0;
const API_BASE_URL = "https://tinda-ko-kabayan.onrender.com/api";

window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
});

document.addEventListener("DOMContentLoaded", () => {
    window.scrollTo(0, 0);
    generateRegisterCaptcha();
    generateLoginCaptcha();
    fetchRegisteredUsersCount();

    const phoneInputs = [document.getElementById("regPhone"), document.getElementById("logPhone")];
    phoneInputs.forEach(input => {
        if (input) {
            input.addEventListener("input", (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
            });
        }
    });
});

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
        alert(message);
        if (callback) callback();
    }
}

function generateRegisterCaptcha() {
    const num1 = Math.floor(Math.random() * 6) + 1;
    const num2 = Math.floor(Math.random() * 5) + 1;
    regAnswer = num1 + num2;
    const label = document.getElementById("captchaLabel");
    if (label) label.innerText = `Anti-Spam Verification: Magkano ang ${num1} + ${num2}? *`;
}

function generateLoginCaptcha() {
    const num1 = Math.floor(Math.random() * 6) + 1;
    const num2 = Math.floor(Math.random() * 5) + 1;
    logAnswer = num1 + num2;
    const label = document.getElementById("loginCaptchaLabel");
    if (label) label.innerText = `Anti-Spam Verification: Magkano ang ${num1} + ${num2}? *`;
}

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
            showTkkModal("Rehistrado na Ka Na, Kabayan!", `Matagumpay ang pag-register mo, ${name}! Mag-login gamit ang iyong WhatsApp number.`, true, () => {
                document.getElementById("registerForm").reset();
                switchAuthMode('login');
                const logPhoneEl = document.getElementById("logPhone");
                if(logPhoneEl) logPhoneEl.value = phone;
            });
        } else {
            showTkkModal("Pansin!", data.message, false);
        }
    } catch (err) {
        showTkkModal("Connection Error", "Hindi makakonekta sa Render Server!", false);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const captchaVal = parseInt(document.getElementById("logCaptcha").value.trim());
    if (captchaVal !== logAnswer) {
        showTkkModal("Mali ang Sagot!", "Mali ang sagot sa Anti-Spam Verification.", false);
        generateLoginCaptcha();
        document.getElementById("logCaptcha").value = "";
        return;
    }

    const phoneInput = document.getElementById("logPhone").value.trim();
    if (phoneInput.length !== 9) {
        showTkkModal("Mali ang Numero", "Kailangang eksaktong 9 digits ang iyong UAE WhatsApp number.", false);
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
        showTkkModal("Connection Error", "Hindi makakonekta sa Render Server!", false);
    }
}

async function fetchRegisteredUsersCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        const data = await response.json();
        if (data.success) {
            const badge = document.getElementById("userCountBadge");
            if (badge) {
                const totalCalculated = 1420 + (data.count || 0);
                badge.innerText = totalCalculated.toLocaleString();
            }
        }
    } catch (err) {
        const badge = document.getElementById("userCountBadge");
        if (badge) badge.innerText = "1,420";
    }
}