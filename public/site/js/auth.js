/* =========================================================
   auth.js — centralized authentication helper.

   PRODUCTION ARCHITECTURE (Django + MySQL):
   Every function below maps 1:1 to a future Django endpoint.
   While CDD_CONFIG.USE_MOCK_DATA is true, calls are delegated
   to js/mock-auth.js (DEMO ONLY). To go live, set
   USE_MOCK_DATA = false and implement the Django endpoints —
   no UI changes are needed.

   API CONTRACT (JSON request/response):
     POST /api/auth/register/                { fullName, email, phone, password }
     POST /api/auth/login/                   { email, password, remember }
     POST /api/auth/google/                  { credential: "GOOGLE_ID_TOKEN" }
     POST /api/auth/logout/
     GET  /api/auth/session/                 -> { authenticated, user }
     POST /api/auth/password-reset/          { email }
     POST /api/auth/password-reset-confirm/  { token, password }
     POST /api/auth/change-password/         { currentPassword, newPassword }
     GET  /api/auth/me/                      -> { user }

   Authenticated user shape:
     { id, name, email, phone, role: "farmer"|"admin",
       provider: "email"|"google", createdAt }

   SECURITY RULES (enforced here):
     - Passwords are NEVER stored in localStorage/JSON/variables.
     - No fake session tokens: the session is a Django cookie.
     - Role/authorization decisions belong to the backend.
   ========================================================= */

/* ---------------------------------------------------------
   1. Authentication states (section 7 of the spec)
   --------------------------------------------------------- */
var AuthState = {
    UNAUTHENTICATED: "UNAUTHENTICATED",
    AUTHENTICATING: "AUTHENTICATING",
    AUTHENTICATED: "AUTHENTICATED",
    SESSION_EXPIRED: "SESSION_EXPIRED",
    LOGGING_OUT: "LOGGING_OUT",
    AUTH_ERROR: "AUTH_ERROR"
};

var Auth = {
    state: AuthState.UNAUTHENTICATED,
    user: null
};

/* ---------------------------------------------------------
   2. CSRF-ready fetch wrapper (section 19)
   Reads Django's csrftoken cookie and sends it as
   X-CSRFToken. Credentials are always included so the
   Django session cookie travels with every request.
   --------------------------------------------------------- */
function getCsrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
}

function apiFetch(url, options) {
    var opts = options || {};
    opts.credentials = "same-origin";
    opts.headers = Object.assign({
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken()
    }, opts.headers || {});
    if (opts.body && typeof opts.body !== "string") {
        opts.body = JSON.stringify(opts.body);
    }
    return fetch(url, opts).then(function (response) {
        if (response.status === 401) {
            Auth.state = AuthState.SESSION_EXPIRED;
            throw new AuthError("SESSION_EXPIRED", "Your session has expired. Please log in again.");
        }
        return response.json().then(function (data) {
            if (!response.ok) {
                throw new AuthError(data.code || "AUTH_ERROR", data.message || "Unable to connect to the server.");
            }
            return data;
        });
    });
}

function AuthError(code, message) {
    this.code = code;
    this.message = message;
}

/* ---------------------------------------------------------
   3. Backend selection: mock (demo) vs Django (production)
   --------------------------------------------------------- */
function useMock() {
    return typeof CDD_CONFIG !== "undefined" && CDD_CONFIG.USE_MOCK_DATA;
}

/* ---------------------------------------------------------
   4. Public authentication API
   Each function returns a Promise resolving to the user
   object (or a status object for password flows).
   --------------------------------------------------------- */

function authRegister(input) {
    Auth.state = AuthState.AUTHENTICATING;
    if (useMock()) {
        return MockAuth.register(input).then(afterAuthSuccess).catch(afterAuthError);
    }
    return apiFetch("/api/auth/register/", { method: "POST", body: input })
        .then(function (data) { return afterAuthSuccess(data.user); })
        .catch(afterAuthError);
}

function authLogin(email, password, remember) {
    Auth.state = AuthState.AUTHENTICATING;
    if (useMock()) {
        return MockAuth.login(email, password, remember).then(afterAuthSuccess).catch(afterAuthError);
    }
    return apiFetch("/api/auth/login/", {
        method: "POST",
        body: { email: email, password: password, remember: !!remember }
    }).then(function (data) { return afterAuthSuccess(data.user); })
      .catch(afterAuthError);
}

/* Google: the ID token from Google Identity Services is sent
   to Django for server-side verification. It is NEVER used
   as the application session itself. */
function authGoogle(credential) {
    Auth.state = AuthState.AUTHENTICATING;
    if (useMock()) {
        return MockAuth.google(credential).then(afterAuthSuccess).catch(afterAuthError);
    }
    return apiFetch("/api/auth/google/", { method: "POST", body: { credential: credential } })
        .then(function (data) { return afterAuthSuccess(data.user); })
        .catch(afterAuthError);
}

function authLogout() {
    Auth.state = AuthState.LOGGING_OUT;
    var done = function () {
        Auth.state = AuthState.UNAUTHENTICATED;
        Auth.user = null;
        clearSessionCache();
    };
    if (useMock()) {
        return MockAuth.logout().then(done);
    }
    return apiFetch("/api/auth/logout/", { method: "POST" }).then(done).catch(done);
}

/* Session verification — used by protected pages. */
function authCheckSession() {
    if (useMock()) {
        return MockAuth.session().then(function (user) {
            if (user) {
                Auth.state = AuthState.AUTHENTICATED;
                Auth.user = user;
            } else {
                Auth.state = AuthState.UNAUTHENTICATED;
                Auth.user = null;
            }
            return user;
        });
    }
    return apiFetch("/api/auth/session/", { method: "GET" }).then(function (data) {
        if (data.authenticated) {
            Auth.state = AuthState.AUTHENTICATED;
            Auth.user = data.user;
            return data.user;
        }
        Auth.state = AuthState.UNAUTHENTICATED;
        Auth.user = null;
        return null;
    });
}

function authRequestPasswordReset(email) {
    if (useMock()) {
        return MockAuth.requestPasswordReset(email);
    }
    return apiFetch("/api/auth/password-reset/", { method: "POST", body: { email: email } });
}

function authConfirmPasswordReset(token, password) {
    if (useMock()) {
        return MockAuth.confirmPasswordReset(token, password);
    }
    return apiFetch("/api/auth/password-reset-confirm/", {
        method: "POST",
        body: { token: token, password: password }
    });
}

function authChangePassword(currentPassword, newPassword) {
    if (useMock()) {
        return MockAuth.changePassword(currentPassword, newPassword);
    }
    return apiFetch("/api/auth/change-password/", {
        method: "POST",
        body: { currentPassword: currentPassword, newPassword: newPassword }
    });
}

/* ---------------------------------------------------------
   5. Session cache (non-sensitive UI state only)
   --------------------------------------------------------- */
function cacheSessionUser(user) {
    localStorage.setItem("cdd_user", JSON.stringify(user));
}

function clearSessionCache() {
    localStorage.removeItem("cdd_user");
}

function afterAuthSuccess(user) {
    Auth.state = AuthState.AUTHENTICATED;
    Auth.user = user;
    cacheSessionUser(user);
    return user;
}

function afterAuthError(error) {
    Auth.state = AuthState.AUTH_ERROR;
    throw error;
}

/* ---------------------------------------------------------
   6. Validation helpers (shared by all auth pages)
   --------------------------------------------------------- */
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
    return /^[0-9+\s-]{9,15}$/.test(value);
}

/* Minimum strength: 8+ chars, at least one letter and one digit. */
function passwordStrengthError(password) {
    if (password.length < 8) {
        return "Password must be at least 8 characters.";
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return "Password must contain at least one letter and one number.";
    }
    return null;
}

/* ---------------------------------------------------------
   7. UI helpers: loading state, errors, success
   --------------------------------------------------------- */
function setButtonLoading(button, isLoading, loadingText) {
    if (!button) {
        return;
    }
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>' +
            (loadingText || "Please wait…");
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

function showError(id, message) {
    var box = document.getElementById(id);
    if (box) {
        box.textContent = message;
        box.classList.remove("d-none");
        box.setAttribute("role", "alert");
    }
}

function hideError(id) {
    var box = document.getElementById(id);
    if (box) {
        box.classList.add("d-none");
    }
}

function showSuccess(id, message) {
    var box = document.getElementById(id);
    if (box) {
        box.textContent = message;
        box.classList.remove("d-none");
        box.setAttribute("role", "status");
    }
}

/* Password visibility toggle — accessible. */
function initPasswordToggles() {
    var toggles = document.querySelectorAll("[data-toggle-password]");
    for (var i = 0; i < toggles.length; i++) {
        toggles[i].addEventListener("click", function () {
            var input = document.getElementById(this.getAttribute("data-toggle-password"));
            if (!input) {
                return;
            }
            var show = input.type === "password";
            input.type = show ? "text" : "password";
            this.setAttribute("aria-label", show ? "Hide password" : "Show password");
            this.innerHTML = show ? '<i class="bi bi-eye-slash" aria-hidden="true"></i>'
                                  : '<i class="bi bi-eye" aria-hidden="true"></i>';
        });
    }
}

/* Human-readable message for an AuthError. */
function authErrorMessage(error) {
    if (error && error.message) {
        return error.message;
    }
    return "Unable to connect to the server.";
}

document.addEventListener("DOMContentLoaded", initPasswordToggles);
