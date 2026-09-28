/* =========================================================
   app.js — shared behaviour for every page
   Vanilla JavaScript only.
   ========================================================= */

/* ---------------------------------------------------------
   1. Language support (English / Kiswahili)
   The selected language is stored in localStorage.
   Any element with data-i18n="key" gets translated.
   --------------------------------------------------------- */
var TRANSLATIONS = {
    en: {
        brand: "Crop Disease Detector",
        home: "Home",
        about: "About",
        howItWorks: "How It Works",
        supportedCrops: "Supported Crops",
        login: "Login",
        register: "Register",
        logout: "Logout",
        heroTitle: "Detect Crop Diseases with AI",
        heroText: "Upload or capture a crop image and get an AI-assisted disease prediction.",
        scanCrop: "Scan Your Crop",
        learnMore: "Learn More",
        dashboard: "Dashboard",
        newScan: "New Scan",
        scanHistory: "Scan History",
        profile: "Profile",
        welcome: "Welcome, Farmer",
        totalScans: "Total Scans",
        healthyCrops: "Healthy Crops",
        diseasesDetected: "Diseases Detected",
        lastScan: "Last Scan",
        recentScans: "Recent Scans",
        takePhoto: "Take Photo",
        uploadImage: "Upload Image",
        analyze: "Analyze Image",
        remove: "Remove",
        result: "Result",
        confidence: "Confidence",
        symptoms: "Symptoms",
        management: "Management",
        prevention: "Prevention"
    },
    sw: {
        brand: "Kigunduzi cha Magonjwa ya Mazao",
        home: "Mwanzo",
        about: "Kuhusu",
        howItWorks: "Jinsi Inavyofanya Kazi",
        supportedCrops: "Mazao Yanayohudumiwa",
        login: "Ingia",
        register: "Jisajili",
        logout: "Toka",
        heroTitle: "Gundua Magonjwa ya Mazao kwa AI",
        heroText: "Pakia au piga picha ya zao lako upate utabiri wa ugonjwa kwa msaada wa AI.",
        scanCrop: "Skani Zao Lako",
        learnMore: "Jifunze Zaidi",
        dashboard: "Dashibodi",
        newScan: "Skani Mpya",
        scanHistory: "Historia ya Skani",
        profile: "Wasifu",
        welcome: "Karibu, Mkulima",
        totalScans: "Jumla ya Skani",
        healthyCrops: "Mazao Yenye Afya",
        diseasesDetected: "Magonjwa Yaliyogundulika",
        lastScan: "Skani ya Mwisho",
        recentScans: "Skani za Karibuni",
        takePhoto: "Piga Picha",
        uploadImage: "Pakia Picha",
        analyze: "Chambua Picha",
        remove: "Ondoa",
        result: "Matokeo",
        confidence: "Uhakika",
        symptoms: "Dalili",
        management: "Udhibiti",
        prevention: "Kinga"
    }
};

function getLanguage() {
    return localStorage.getItem("cdd_language") || "en";
}

function setLanguage(lang) {
    localStorage.setItem("cdd_language", lang);
    applyLanguage();
}

function applyLanguage() {
    var lang = getLanguage();
    var dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
        var key = nodes[i].getAttribute("data-i18n");
        if (dictionary[key]) {
            nodes[i].textContent = dictionary[key];
        }
    }

    var buttons = document.querySelectorAll("[data-lang]");
    for (var j = 0; j < buttons.length; j++) {
        var isActive = buttons[j].getAttribute("data-lang") === lang;
        buttons[j].classList.toggle("btn-green", isActive);
        buttons[j].classList.toggle("btn-outline-green", !isActive);
    }
}

/* ---------------------------------------------------------
   2. Simple frontend-only "session"
   Real authentication will be handled by Django later.
   --------------------------------------------------------- */
function getCurrentUser() {
    var raw = localStorage.getItem("cdd_user");
    return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function logout() {
    localStorage.removeItem("cdd_user");
    // FUTURE DJANGO API
    // fetch('/api/auth/logout/', { method: 'POST' });
    window.location.href = "../index.html";
}

/* Used by the landing page "Scan Your Crop" button. */
function goToScan(pathPrefix) {
    var prefix = pathPrefix || "";
    window.location.href = isLoggedIn()
        ? prefix + "scan.html"
        : prefix + "login.html";
}

/* Redirect guests away from farmer pages (frontend-only guard). */
function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
    }
}

/* ---------------------------------------------------------
   3. Helpers
   --------------------------------------------------------- */
function loadJSON(url) {
    // FUTURE DJANGO API
    // Replace the mock file with a real endpoint, e.g. fetch('/api/history/')
    return fetch(url).then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load " + url);
        }
        return response.json();
    });
}

function statusBadge(status) {
    if (status === "healthy") {
        return '<span class="badge badge-healthy">Healthy</span>';
    }
    if (status === "low") {
        return '<span class="badge badge-low">Low confidence</span>';
    }
    return '<span class="badge badge-disease">Disease</span>';
}

/* ---------------------------------------------------------
   4. Boot
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
    applyLanguage();

    var langButtons = document.querySelectorAll("[data-lang]");
    for (var i = 0; i < langButtons.length; i++) {
        langButtons[i].addEventListener("click", function () {
            setLanguage(this.getAttribute("data-lang"));
        });
    }

    var logoutButtons = document.querySelectorAll("[data-action='logout']");
    for (var j = 0; j < logoutButtons.length; j++) {
        logoutButtons[j].addEventListener("click", function (event) {
            event.preventDefault();
            logout();
        });
    }
});
