const token = localStorage.getItem("token");

// Verifica se está logado
if (!token) {
    alert("Acesso negado! Faça o login primeiro.");
    window.location.href = "login.html"; // Mude para o nome correto do seu arquivo HTML de login
}

// Valida o token no backend
// No seu dash empresa.js, altere a URL do fetch:
const API_URL = "https://appdedetizacao.onrender.com";

fetch(`${API_URL}/auth/validar`, {
    headers: { "Authorization": "Bearer " + token }
})
// ... resto do seu código
.then(res => {
    if (!res.ok) {
        localStorage.clear();
        window.location.href = "login.html";
    }
});

// Puxa as infos do localStorage
const tipo = localStorage.getItem("tipoUsuario");
const nome = localStorage.getItem("userEmail") || "Usuário Logado";

// Atualiza o nome na Sidebar
document.getElementById("userName").innerText = nome;

// Lógica de Permissões
if (tipo === "CLIENTE") {
    esconderAdmin();
} else if (tipo === "FUNCIONARIO") {
    esconderAdmin();
    esconderFinanceiro();
}

function esconderAdmin() {
    const cardFunc = document.getElementById("cardFuncionarios");
    if (cardFunc) cardFunc.style.display = "none";
}

function esconderFinanceiro() {
    const cardCritico = document.getElementById("cardFinanceiro");
    if (cardCritico) cardCritico.style.display = "none";
}

// Única função de Logout
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}