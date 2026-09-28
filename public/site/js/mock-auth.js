/* =========================================================
   mock-auth.js — DEMO / DEVELOPMENT ONLY
   =========================================================
   This file exists ONLY so the authentication UI can be
   tested before the Django backend exists. It is clearly
   isolated from the production logic in js/auth.js.

   To go live: set CDD_CONFIG.USE_MOCK_DATA = false in
   js/app.js and implement the Django endpoints. This file
   can then be deleted without touching any page.

   DEMO LIMITATIONS (by design):
   - "Accounts" live in localStorage under "cdd_demo_accounts".
   - Passwords are stored as a trivial demo hash so the UI
     flow can be tested. This is NOT security. In production,
     Django hashes passwords server-side and nothing
     password-related ever touches the browser.
   - Google sign-in cannot be verified without a backend, so
     in demo mode the Google button explains that a Django
     backend is required (see js/google-auth.js).
   ========================================================= */

var MockAuth = (function () {
    var ACCOUNTS_KEY = "cdd_demo_accounts";
    var SESSION_KEY = "cdd_demo_session";
    var RESET_KEY = "cdd_demo_resets";

    function load(key) {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    }

    function save(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    /* Demo-only obfuscation. NOT a real hash, NOT secure. */
    function demoHash(value) {
        var h = 0;
        for (var i = 0; i < value.length; i++) {
            h = (h * 31 + value.charCodeAt(i)) >>> 0;
        }
        return "demo$" + h.toString(16);
    }

    function publicUser(account) {
        return {
            id: account.id,
            name: account.fullName,
            email: account.email,
            phone: account.phone,
            role: account.role || "farmer",
            provider: account.provider || "email",
            createdAt: account.createdAt
        };
    }

    function findByEmail(email) {
        var accounts = load(ACCOUNTS_KEY);
        for (var i = 0; i < accounts.length; i++) {
            if (accounts[i].email.toLowerCase() === email.toLowerCase()) {
                return accounts[i];
            }
        }
        return null;
    }

    function findByPhone(phone) {
        var accounts = load(ACCOUNTS_KEY);
        for (var i = 0; i < accounts.length; i++) {
            if (accounts[i].phone === phone) {
                return accounts[i];
            }
        }
        return null;
    }

    function fail(code, message) {
        return Promise.reject(new AuthError(code, message));
    }

    function delay(value) {
        /* Simulate network latency so loading states are visible. */
        return new Promise(function (resolve) {
            setTimeout(function () { resolve(value); }, 500);
        });
    }

    return {
        register: function (input) {
            if (findByEmail(input.email)) {
                return fail("DUPLICATE_EMAIL", "An account with this email already exists.");
            }
            if (findByPhone(input.phone)) {
                return fail("DUPLICATE_PHONE", "An account with this phone number already exists.");
            }
            var accounts = load(ACCOUNTS_KEY);
            var account = {
                id: accounts.length + 1,
                fullName: input.fullName,
                email: input.email,
                phone: input.phone,
                passwordHash: demoHash(input.password),
                role: "farmer",
                provider: "email",
                createdAt: new Date().toISOString()
            };
            accounts.push(account);
            save(ACCOUNTS_KEY, accounts);
            var user = publicUser(account);
            save(SESSION_KEY, user);
            return delay(user);
        },

        login: function (email, password, remember) {
            var account = findByEmail(email);
            if (!account) {
                return fail("UNKNOWN_EMAIL", "Invalid email or password.");
            }
            if (account.passwordHash !== demoHash(password)) {
                return fail("WRONG_PASSWORD", "Invalid email or password.");
            }
            var user = publicUser(account);
            /* "Remember me" only changes where the demo session
               marker lives; production persistence is a Django
               session/cookie setting, never a stored password. */
            if (remember) {
                save(SESSION_KEY, user);
                sessionStorage.removeItem(SESSION_KEY);
            } else {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
                localStorage.removeItem(SESSION_KEY);
            }
            return delay(user);
        },

        google: function (credential) {
            /* A Google ID token can only be verified by a server.
               There is no honest way to complete this flow in a
               browser-only demo, so we refuse instead of faking it. */
            return fail("GOOGLE_NEEDS_BACKEND",
                "Google sign-in requires the Django backend to verify the credential. It will work once the backend is connected.");
        },

        logout: function () {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
            return delay(true);
        },

        session: function () {
            var raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
            return delay(raw ? JSON.parse(raw) : null);
        },

        requestPasswordReset: function (email) {
            if (!findByEmail(email)) {
                return fail("UNKNOWN_EMAIL", "No account exists with this email address.");
            }
            /* DEMO ONLY: no email is sent. We mint a demo reset
               token and surface it on the page so the flow can be
               tested end-to-end. Production: Django emails a link. */
            var token = "demo-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
            var resets = load(RESET_KEY);
            resets.push({ token: token, email: email, expires: Date.now() + 30 * 60 * 1000 });
            save(RESET_KEY, resets);
            return delay({ sent: true, demoToken: token });
        },

        confirmPasswordReset: function (token, password) {
            var resets = load(RESET_KEY);
            for (var i = 0; i < resets.length; i++) {
                if (resets[i].token === token) {
                    if (Date.now() > resets[i].expires) {
                        return fail("TOKEN_EXPIRED", "This reset link has expired. Please request a new one.");
                    }
                    var account = findByEmail(resets[i].email);
                    if (!account) {
                        return fail("UNKNOWN_EMAIL", "No account exists with this email address.");
                    }
                    var accounts = load(ACCOUNTS_KEY);
                    for (var j = 0; j < accounts.length; j++) {
                        if (accounts[j].email.toLowerCase() === account.email.toLowerCase()) {
                            accounts[j].passwordHash = demoHash(password);
                        }
                    }
                    save(ACCOUNTS_KEY, accounts);
                    resets.splice(i, 1);
                    save(RESET_KEY, resets);
                    return delay({ changed: true });
                }
            }
            return fail("TOKEN_INVALID", "This reset link is invalid. Please request a new one.");
        },

        changePassword: function (currentPassword, newPassword) {
            var raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
            if (!raw) {
                return fail("SESSION_EXPIRED", "Your session has expired. Please log in again.");
            }
            var user = JSON.parse(raw);
            var account = findByEmail(user.email);
            if (!account || account.passwordHash !== demoHash(currentPassword)) {
                return fail("WRONG_PASSWORD", "Your current password is incorrect.");
            }
            var accounts = load(ACCOUNTS_KEY);
            for (var j = 0; j < accounts.length; j++) {
                if (accounts[j].email.toLowerCase() === user.email.toLowerCase()) {
                    accounts[j].passwordHash = demoHash(newPassword);
                }
            }
            save(ACCOUNTS_KEY, accounts);
            return delay({ changed: true });
        }
    };
})();
