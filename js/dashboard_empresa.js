document.addEventListener("DOMContentLoaded", () => {
    const email = localStorage.getItem("userEmail") || "Administrador";
    document.getElementById("userName").innerText = email;
});

function navegar(btnElement, url) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    document.getElementById('telaExterna').src = url;
}

// A mágica do Menu Retrátil Clean Tech
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('mainContent').classList.toggle('expanded');
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// Ouve quando a página de configurações muda o tema e aplica no painel pai
window.addEventListener('message', function(event) {
    if (event.data === 'toggleTheme') {
        document.body.classList.toggle('dark-theme');
    }
});