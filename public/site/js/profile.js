/* =========================================================
   profile.js — profile view/edit + change password.
   FUTURE DJANGO API: GET/PUT /api/profile/,
   POST /api/auth/change-password/
   ========================================================= */
document.addEventListener("DOMContentLoaded", function () {
    requireAuth().then(function (user) {
        if (!user) {
            return;
        }

        /* Profile details from the authenticated session. */
        document.getElementById("fullName").value = user.name || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("accountType").value =
            user.role === "admin" ? "Admin" : "Farmer";
        document.getElementById("provider").value =
            user.provider === "google" ? "Google" : "Email";
        if (user.createdAt) {
            document.getElementById("createdAt").value =
                new Date(user.createdAt).toLocaleDateString();
        }

        /* Google accounts have no local password to change. */
        if (user.provider === "google") {
            document.getElementById("change-password-card").classList.add("d-none");
        }

        document.getElementById("profile-form").addEventListener("submit", function (event) {
            event.preventDefault();
            hideError("profile-error");

            var updated = {
                name: document.getElementById("fullName").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                email: document.getElementById("email").value.trim()
            };

            if (!updated.name || !updated.phone || !updated.email) {
                showError("profile-error", "All fields are required.");
                return;
            }
            if (!isValidEmail(updated.email)) {
                showError("profile-error", "Please enter a valid email address.");
                return;
            }

            /* FUTURE DJANGO API: PUT /api/profile/ */
            var merged = Object.assign({}, user, updated);
            cacheSessionUser(merged);
            Auth.user = merged;
            showSuccess("profile-saved", "Profile updated on this device.");
        });

        var changeForm = document.getElementById("change-password-form");
        if (changeForm) {
            changeForm.addEventListener("submit", function (event) {
                event.preventDefault();
                hideError("change-error");
                hideError("change-success");

                var current = document.getElementById("currentPassword").value;
                var next = document.getElementById("newPassword").value;
                var confirm = document.getElementById("confirmNewPassword").value;
                var button = changeForm.querySelector("button[type='submit']");

                if (!current || !next || !confirm) {
                    showError("change-error", "All fields are required.");
                    return;
                }
                var strengthError = passwordStrengthError(next);
                if (strengthError) {
                    showError("change-error", strengthError);
                    return;
                }
                if (next !== confirm) {
                    showError("change-error", "The two passwords do not match.");
                    return;
                }

                setButtonLoading(button, true, "Updating…");
                authChangePassword(current, next).then(function () {
                    setButtonLoading(button, false);
                    changeForm.reset();
                    showSuccess("change-success", "Your password has been changed.");
                }).catch(function (error) {
                    setButtonLoading(button, false);
                    showError("change-error", authErrorMessage(error));
                });
            });
        }
    });
});
