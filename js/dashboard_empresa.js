document.addEventListener("DOMContentLoaded", () => {
    // Busca dados reais gravados na autenticação
    const email = localStorage.getItem("userEmail") || "central@pestcontrolx.com";
    const nome = localStorage.getItem("empresaNome") || "PestControlX Matriz";
    
    document.getElementById("userName").innerText = nome;
    document.getElementById("userEmail").innerText = email;

    // Carrega foto de perfil do cache se existir
    const fotoSalva = localStorage.getItem("pfpBase64");
    if(fotoSalva) {
        document.getElementById("imgPfpSidebar").src = fotoSalva;
        document.getElementById("imgPfpTopbar").src = fotoSalva;
    }
});

function navegar(btnElement, url) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    document.getElementById('telaExterna').src = url;
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('mainContent').classList.toggle('expanded');
}

function uploadFotoPerfil(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            localStorage.setItem("pfpBase64", base64);
            document.getElementById("imgPfpSidebar").src = base64;
            document.getElementById("imgPfpTopbar").src = base64;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

window.addEventListener('message', function(event) {
    if (event.data === 'toggleTheme') {
        document.body.classList.toggle('dark-theme');
    }
});