# Development Roadmap — Crop Disease Detector

## M1 — Frontend (current)
- [x] Public pages: Home, About, How It Works, Supported Crops
- [x] Farmer dashboard, Scan, Result, History, Profile, Admin dashboard
- [x] English / Kiswahili toggle (js/language.js, saved in localStorage)
- [x] Mock JSON data (data/*.json) — clearly marked as demo
- [x] Configurable low-confidence threshold (CDD_CONFIG in js/app.js)
- [x] Complete authentication frontend (see docs/AUTHENTICATION.md):
      register/login/logout, remember-me, forgot/reset/change password,
      real Google Identity Services button, session states, protected
      pages, role-based UI, CSRF-ready API contracts, isolated demo mode

## M2 — Django backend
- Django project, MySQL database, Django templates serving these pages
- Real auth: POST /api/auth/login/, /api/auth/register/, /api/auth/logout/
- GET/PUT /api/profile/, GET /api/history/, GET /api/predictions/<id>/
- Image upload via Django Media Storage: POST /api/predict/

## M3 — AI model
- OpenCV preprocessing (resize, normalise, quality checks)
- TensorFlow/Keras transfer-learning model (e.g. MobileNetV2)
- Tune LOW_CONFIDENCE_THRESHOLD from validation results
- Replace placeholder management/prevention text with verified agronomy content
