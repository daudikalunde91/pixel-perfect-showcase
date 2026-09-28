/* =========================================================
   profile.js — profile view/edit (frontend only).
   FUTURE DJANGO API: GET/PUT /api/profile/
   ========================================================= */
document.addEventListener("DOMContentLoaded", function () {
    requireLogin();

    var user = getCurrentUser() || {};
    document.getElementById("fullName").value = user.fullName || "";
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("email").value = user.email || "";

    document.getElementById("profile-form").addEventListener("submit", function (event) {
        event.preventDefault();

        var updated = {
            fullName: document.getElementById("fullName").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim()
        };

        // FUTURE DJANGO API
        // fetch('/api/profile/', { method: 'PUT', body: JSON.stringify(updated) });

        localStorage.setItem("cdd_user", JSON.stringify(updated));
        document.getElementById("profile-saved").classList.remove("d-none");
    });
});
