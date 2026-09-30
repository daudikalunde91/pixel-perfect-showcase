/* =========================================================
   auth-pages.js — page handlers for login, register,
   forgot-password and reset-password.
   All real logic lives in js/auth.js; this file only wires
   forms to it (validation, loading states, redirects).
   ========================================================= */

/* ---------------- Login ---------------- */
function initLogin() {
    var form = document.getElementById("login-form");
    if (!form) {
        return;
    }

    consumeLoginNotice();

    /* If already authenticated, go straight to the dashboard. */
    authCheckSession().then(function (user) {
        if (user) {
            window.location.href = "dashboard.html";
        }
    }).catch(function () { /* backend not available yet: stay on login */ });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        hideError("login-error");

        var email = document.getElementById("email").value.trim();
        var password = document.getElementById("password").value;
        var remember = document.getElementById("remember").checked;
        var button = form.querySelector("button[type='submit']");

        if (!email || !password) {
            showError("login-error", "Please fill in both email and password.");
            return;
        }
        if (!isValidEmail(email)) {
            showError("login-error", "Please enter a valid email address.");
            return;
        }

        setButtonLoading(button, true, "Signing in…");
        authLogin(email, password, remember).then(function () {
            window.location.href = "dashboard.html";
        }).catch(function (error) {
            setButtonLoading(button, false);
            showError("login-error", authErrorMessage(error));
        });
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
        var terms = document.getElementById("terms").checked;
        var button = form.querySelector("button[type='submit']");

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
        var strengthError = passwordStrengthError(password);
        if (strengthError) {
            showError("register-error", strengthError);
            return;
        }
        if (password !== confirmPassword) {
            showError("register-error", "The two passwords do not match.");
            return;
        }
        if (!terms) {
            showError("register-error", "Please accept the terms to create an account.");
            return;
        }

        setButtonLoading(button, true, "Creating account…");
        authRegister({
            fullName: fullName,
            email: email,
            phone: phone,
            password: password
        }).then(function () {
            window.location.href = "dashboard.html";
        }).catch(function (error) {
            setButtonLoading(button, false);
            showError("register-error", authErrorMessage(error));
        });
    });
}

/* ---------------- Forgot password ---------------- */
function initForgotPassword() {
    var form = document.getElementById("forgot-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        hideError("forgot-error");
        hideError("forgot-success");

        var email = document.getElementById("email").value.trim();
        var button = form.querySelector("button[type='submit']");

        if (!email) {
            showError("forgot-error", "Please enter your email address.");
            return;
        }
        if (!isValidEmail(email)) {
            showError("forgot-error", "Please enter a valid email address.");
            return;
        }

        setButtonLoading(button, true, "Sending…");
        authRequestPasswordReset(email).then(function (result) {
            setButtonLoading(button, false);
            /* DEMO ONLY: no email service exists yet, so the demo
               reset link is shown on screen. In production Django
               emails the link and this message just says so. */
            if (result.demoToken) {
                showSuccess("forgot-success",
                    "Demo mode: no email is sent. Use this reset link: ");
                var link = document.createElement("a");
                link.href = "reset-password.html?token=" + encodeURIComponent(result.demoToken);
                link.textContent = "Reset my password";
                link.className = "alert-link";
                document.getElementById("forgot-success").appendChild(link);
            } else {
                showSuccess("forgot-success",
                    "If an account exists for this email, a reset link has been sent.");
            }
        }).catch(function (error) {
            setButtonLoading(button, false);
            showError("forgot-error", authErrorMessage(error));
        });
    });
}

/* ---------------- Reset password ---------------- */
function initResetPassword() {
    var form = document.getElementById("reset-form");
    if (!form) {
        return;
    }

    var token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
        showError("reset-error", "This reset link is invalid. Please request a new one.");
        form.querySelector("button[type='submit']").disabled = true;
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        hideError("reset-error");

        var password = document.getElementById("password").value;
        var confirmPassword = document.getElementById("confirmPassword").value;
        var button = form.querySelector("button[type='submit']");

        var strengthError = passwordStrengthError(password);
        if (strengthError) {
            showError("reset-error", strengthError);
            return;
        }
        if (password !== confirmPassword) {
            showError("reset-error", "The two passwords do not match.");
            return;
        }

        setButtonLoading(button, true, "Updating…");
        authConfirmPasswordReset(token, password).then(function () {
            showSuccess("reset-success", "Your password has been updated. You can now log in.");
            form.classList.add("d-none");
        }).catch(function (error) {
            setButtonLoading(button, false);
            showError("reset-error", authErrorMessage(error));
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    initLogin();
    initRegister();
    initForgotPassword();
    initResetPassword();
});
