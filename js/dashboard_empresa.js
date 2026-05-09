// 1. Configuração de URL - Mude para a sua URL do Render!
const API_URL = "https://appdedetizacao.onrender.com";
const token = localStorage.getItem("token");

// 2. Verificação de Segurança Imediata
if (!token) {
    window.location.href = "login.html";
}

// 3. Carregamento de Dados do Usuário
document.addEventListener("DOMContentLoaded", () => {
    const nome = localStorage.getItem("userEmail") || "Usuário Logado";
    const elNome = document.getElementById("userName");
    
    if (elNome) {
        elNome.innerText = nome; // Isso tira o "Carregando..."
    }

    // Valida o token no backend (Render)
    fetch(`${API_URL}/auth/validar`, {
        headers: { "Authorization": "Bearer " + token }
    })
    .then(res => {
        if (!res.ok) {
            logout();
        }
    })
    .catch(err => console.error("Erro de conexão com API:", err));
});

// 4. Lógica de Troca de Abas (Botões da Lateral)
function mostrarSecao(idSecao) {
    // Esconde todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostra a seção clicada
    const secaoAtiva = document.getElementById(idSecao);
    if (secaoAtiva) {
        secaoAtiva.style.display = 'block';
    }

    // Remove classe 'active' de todos os botões e adiciona no clicado
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    // Opcional: Adicione lógica para destacar o botão selecionado
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}