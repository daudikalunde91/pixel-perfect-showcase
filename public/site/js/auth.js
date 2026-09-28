/* =========================================================
   auth.js — login & registration (frontend validation only)
   Real authentication will be added with Django later.
   ========================================================= */

function showError(id, message) {
    var box = document.getElementById(id);
    if (box) {
        box.textContent = message;
        box.classList.remove("d-none");
    }
}

function hideError(id) {
    var box = document.getElementById(id);
    if (box) {
        box.classList.add("d-none");
    }
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
    return /^[0-9+\s-]{9,15}$/.test(value);
}

/* ---------------- Login ---------------- */
function initLogin() {
    var form = document.getElementById("login-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        hideError("login-error");

        var email = document.getElementById("email").value.trim();
        var password = document.getElementById("password").value;

        if (!email || !password) {
            showError("login-error", "Please fill in both email and password.");
            return;
        }
        if (!isValidEmail(email)) {
            showError("login-error", "Please enter a valid email address.");
            return;
        }
        if (password.length < 6) {
            showError("login-error", "Password must be at least 6 characters.");
            return;
        }

        // FUTURE DJANGO API
        // fetch('/api/auth/login/', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email: email, password: password })
        // });

        localStorage.setItem("cdd_user", JSON.stringify({
            fullName: "Farmer Account",
            email: email,
            phone: "+255 700 000 000"
        }));

        window.location.href = "dashboard.html";
    });
}

/* ---------------- Register ---------------- */
function initRegister() {
    var form = document.getElementById("register-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        hideError("register-error");

        var fullName = document.getElementById("fullName").value.trim();
        var phone = document.getElementById("phone").value.trim();
        var email = document.getElementById("email").value.trim();
        var password = document.getElementById("password").value;
        var confirmPassword = document.getElementById("confirmPassword").value;

        if (!fullName || !phone || !email || !password || !confirmPassword) {
            showError("register-error", "All fields are required.");
            return;
        }
        if (!isValidEmail(email)) {
            showError("register-error", "Please enter a valid email address.");
            return;
        }
        if (!isValidPhone(phone)) {
            showError("register-error", "Please enter a valid phone number.");
            return;
        }
        if (password.length < 6) {
            showError("register-error", "Password must be at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            showError("register-error", "The two passwords do not match.");
            return;
        }

        // FUTURE DJANGO API
        // fetch('/api/auth/register/', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ fullName, phone, email, password })
        // });

        localStorage.setItem("cdd_user", JSON.stringify({
            fullName: fullName,
            email: email,
            phone: phone
        }));

        window.location.href = "dashboard.html";
    });
}

document.addEventListener("DOMContentLoaded", function () {
    initLogin();
    initRegister();
});
