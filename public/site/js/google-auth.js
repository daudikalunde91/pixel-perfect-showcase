/* =========================================================
   google-auth.js — REAL Google Identity Services integration.
   =========================================================
   This uses Google's official Sign In With Google button.
   It is NOT a fake button and does NOT simulate anything
   with localStorage.

   FLOW (section 4 of the spec):
     User clicks "Continue with Google"
       -> Google Identity Services
       -> Google returns an ID token (credential)
       -> Frontend POSTs { credential } to /api/auth/google/
       -> Django verifies the token server-side
       -> Django finds-or-creates the user (account linking
          by verified email is a BACKEND decision)
       -> Django creates the application session
       -> Frontend redirects to the dashboard

   The Google ID token is NEVER used as the app session.

   CONFIGURATION (section 29):
   Set your real Google Client ID below (create one in the
   Google Cloud Console under APIs & Services > Credentials).
   Never put a Google client SECRET in frontend code or in
   GitHub — the secret stays in Django environment variables.
   ========================================================= */

var GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

function isGoogleConfigured() {
    return GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID";
}

/* Called by Google with the verified ID token. */
function handleGoogleCredential(response) {
    var button = document.querySelector("[data-google-button]");
    authGoogle(response.credential).then(function () {
        window.location.href = "dashboard.html";
    }).catch(function (error) {
        showError("login-error", authErrorMessage(error));
        showError("register-error", authErrorMessage(error));
    });
}

function initGoogleSignIn() {
    var containers = document.querySelectorAll("[data-google-button]");
    if (!containers.length) {
        return;
    }

    if (!isGoogleConfigured()) {
        /* Honest placeholder: explain that a real Client ID and
           the Django backend are required. No fake login. */
        for (var i = 0; i < containers.length; i++) {
            containers[i].innerHTML =
                '<button type="button" class="btn btn-outline-green w-100" disabled>' +
                '<i class="bi bi-google me-2" aria-hidden="true"></i>' +
                '<span data-i18n="googleNeedsSetup">Continue with Google (needs backend setup)</span>' +
                '</button>';
        }
        applyLanguage();
        return;
    }

    /* Load the official Google Identity Services script. */
    var script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = function () {
        /* global google */
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            cancel_on_tap_outside: true
        });
        for (var i = 0; i < containers.length; i++) {
            google.accounts.id.renderButton(containers[i], {
                type: "standard",
                theme: "outline",
                size: "large",
                width: containers[i].offsetWidth || 320,
                text: "continue_with"
            });
        }
        /* Google One Tap (section 25): opt-in, never auto-creates
           users — the backend decides find-or-create. Disabled
           until the backend exists so it cannot interfere. */
        // google.accounts.id.prompt();
    };
    script.onerror = function () {
        showError("login-error", "Google sign-in could not be loaded. Please check your connection.");
    };
    document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", initGoogleSignIn);
