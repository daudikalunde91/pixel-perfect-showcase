/* =========================================================
   scan.js — image selection, preview, validation and the
   simulated analysis flow.
   NOTE: no AI runs here. Django + TensorFlow will do that later.
   ========================================================= */

var MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
var ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
var selectedFile = null;

function formatSize(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

function validateImage(file) {
    if (!file) {
        return "Please choose a crop image first.";
    }
    if (ALLOWED_TYPES.indexOf(file.type) === -1) {
        return "Please use a JPG, PNG or WEBP image.";
    }
    if (file.size > MAX_FILE_SIZE) {
        return "The image is too large. Please use an image under 5 MB.";
    }
    return "";
}

function previewImage(file) {
    var reader = new FileReader();
    reader.onload = function (event) {
        document.getElementById("preview-img").src = event.target.result;
        localStorage.setItem("cdd_last_image", event.target.result);
    };
    reader.readAsDataURL(file);

    document.getElementById("file-name").textContent = file.name;
    document.getElementById("file-size").textContent = formatSize(file.size);
    document.getElementById("preview-section").classList.remove("d-none");
    document.getElementById("choose-section").classList.add("d-none");
}

function removeImage() {
    selectedFile = null;
    document.getElementById("camera-input").value = "";
    document.getElementById("upload-input").value = "";
    document.getElementById("preview-section").classList.add("d-none");
    document.getElementById("choose-section").classList.remove("d-none");
    document.getElementById("scan-error").classList.add("d-none");
}

function handleFileChange(input) {
    var file = input.files[0];
    var message = validateImage(file);

    if (message) {
        var box = document.getElementById("scan-error");
        box.textContent = message;
        box.classList.remove("d-none");
        input.value = "";
        return;
    }

    document.getElementById("scan-error").classList.add("d-none");
    selectedFile = file;
    previewImage(file);
}

/* Simulated loading stages — replaced by a real request later. */
function handleScan() {
    var message = validateImage(selectedFile);
    if (message) {
        var box = document.getElementById("scan-error");
        box.textContent = message;
        box.classList.remove("d-none");
        return;
    }

    document.getElementById("preview-section").classList.add("d-none");
    document.getElementById("loading-section").classList.remove("d-none");

    var stages = document.querySelectorAll(".loading-stage");
    var index = 0;

    var timer = setInterval(function () {
        if (index < stages.length) {
            stages[index].classList.add("done");
            index++;
            return;
        }
        clearInterval(timer);

        // FUTURE DJANGO API
        // var formData = new FormData();
        // formData.append('image', selectedFile);
        // fetch('/api/predict/', { method: 'POST', body: formData })
        //     .then(function (r) { return r.json(); })
        //     .then(function (prediction) { /* store and redirect */ });

        window.location.href = "result.html";
    }, 900);
}

document.addEventListener("DOMContentLoaded", function () {
    requireLogin();

    document.getElementById("camera-input").addEventListener("change", function () {
        handleFileChange(this);
    });
    document.getElementById("upload-input").addEventListener("change", function () {
        handleFileChange(this);
    });
    document.getElementById("btn-camera").addEventListener("click", function () {
        document.getElementById("camera-input").click();
    });
    document.getElementById("btn-upload").addEventListener("click", function () {
        document.getElementById("upload-input").click();
    });
    document.getElementById("btn-remove").addEventListener("click", removeImage);
    document.getElementById("btn-analyze").addEventListener("click", handleScan);
});
