# Authentication — Crop Disease Detector

This document describes the frontend authentication architecture and the
exact contract the Django + MySQL backend must implement. The visual design
is unchanged; only authentication functionality was added.

## 1. Architecture

```text
Frontend (HTML + Bootstrap + Vanilla JS)
   ├── Email/Password ─┐
   └── Google Sign-In ─┴──> Django Backend ──> Django Session ──> MySQL
```

- `js/auth.js` — central helper: auth states, CSRF-ready `apiFetch`, all
  auth functions, validation, loading/error UI helpers.
- `js/mock-auth.js` — **DEMO / DEVELOPMENT ONLY**. Lets the UI be tested
  before Django exists. Delete this file and set
  `CDD_CONFIG.USE_MOCK_DATA = false` in `js/app.js` to go live.
- `js/session.js` — session checks, protected pages, logout, navbar state.
- `js/google-auth.js` — real Google Identity Services integration.
- `js/auth-pages.js` — form wiring for login/register/forgot/reset pages.

## 2. Authentication states

`UNAUTHENTICATED → AUTHENTICATING → AUTHENTICATED`, plus `SESSION_EXPIRED`,
`LOGGING_OUT`, `AUTH_ERROR` (see `AuthState` in `js/auth.js`).

## 3. Google authentication flow

1. User clicks the official "Continue with Google" button (rendered by
   Google Identity Services in `js/google-auth.js`).
2. Google returns an ID token (`credential`).
3. Frontend POSTs `{ credential }` to `/api/auth/google/`.
4. **Django verifies the token server-side** (Google `id_token.verify_oauth2_token`
   or equivalent) and performs find-or-create / account linking by verified
   email. Account linking is a backend decision, never frontend.
5. Django creates its own session; the Google ID token is never used as the
   application session.

**Configuration:** set `GOOGLE_CLIENT_ID` in `js/google-auth.js` (create one
in Google Cloud Console → APIs & Services → Credentials). Until a real
Client ID is set, the button renders disabled with a "needs backend setup"
label — it never fakes a login. The Google **client secret** must only live
in Django environment variables, never in frontend code or GitHub.

## 4. Session architecture

- Production: Django session cookie (HttpOnly, Secure, SameSite). The
  frontend stores no tokens and no passwords.
- `GET /api/auth/session/` is the source of truth; every protected page
  calls it on load (`requireAuth()` in `js/session.js`).
- "Remember me" only selects session persistence — implemented by Django
  session expiry settings, never by storing credentials.
- Logout calls `POST /api/auth/logout/`, clears the cached UI user, and
  redirects. Protected pages re-check the session on load, so the back
  button cannot restore them after logout.
- A `401` from any API call sets `SESSION_EXPIRED` and redirects to login
  with an explanatory message.

## 5. API endpoints (contract for Django)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register/` | `{ fullName, email, phone, password }` | `{ user }` |
| POST | `/api/auth/login/` | `{ email, password, remember }` | `{ user }` |
| POST | `/api/auth/google/` | `{ credential }` | `{ user }` |
| POST | `/api/auth/logout/` | — | `{}` |
| GET | `/api/auth/session/` | — | `{ authenticated, user }` |
| GET | `/api/auth/me/` | — | `{ user }` |
| POST | `/api/auth/password-reset/` | `{ email }` | `{ sent: true }` |
| POST | `/api/auth/password-reset-confirm/` | `{ token, password }` | `{ changed: true }` |
| POST | `/api/auth/change-password/` | `{ currentPassword, newPassword }` | `{ changed: true }` |

User shape: `{ id, name, email, phone, role: "farmer"|"admin",
provider: "email"|"google", createdAt }`.

Error shape: HTTP 4xx/5xx with `{ code, message }`, e.g. `DUPLICATE_EMAIL`,
`DUPLICATE_PHONE`, `WRONG_PASSWORD`, `UNKNOWN_EMAIL`, `TOKEN_INVALID`,
`TOKEN_EXPIRED`, `SESSION_EXPIRED`.

## 6. Security requirements

- Passwords are never stored in localStorage/sessionStorage/JSON/variables.
- No fake session tokens — the session is a Django cookie.
- Role/authorization checks are enforced by the backend; the frontend
  `requireAdmin()` gate is UX only.
- CSRF: `apiFetch` sends the `csrftoken` cookie as `X-CSRFToken` and always
  uses `credentials: "same-origin"`.
- Password rule: 8+ characters, at least one letter and one number
  (enforce again server-side).

## 7. Database concepts for Django/MySQL

`User`, `UserProfile`, `AuthenticationProvider`, `PasswordReset`, `Session`
(standard Django session table covers the last).

## 8. Environment variables (backend stage)

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Django settings)
- Django `SECRET_KEY`, database credentials
- Frontend: `GOOGLE_CLIENT_ID` constant in `js/google-auth.js`

## 9. Testing checklist

- Register: valid, invalid email, weak password, mismatch, duplicate
  email/phone, missing fields.
- Login: correct, wrong password, unknown email, empty fields.
- Google: button visible; full flow requires the Django backend.
- Session: login → dashboard; refresh stays logged in; protected page while
  logged out redirects to login; logout destroys session; back button after
  logout cannot open protected pages.
- Password: forgot → reset link → reset → login with new password; change
  password from profile.
