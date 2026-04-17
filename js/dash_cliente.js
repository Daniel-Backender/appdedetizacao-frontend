const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

document.getElementById("userName").innerText =
    localStorage.getItem("userEmail");