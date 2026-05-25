// ==========================================
// CONFIGURAÇÕES GLOBAIS E INICIALIZAÇÃO
// ==========================================
const API_URL = "https://appdedetizacao.onrender.com";
const token = localStorage.getItem("tokenJWT");
const empresaId = localStorage.getItem("empresaId") || "1"; // Ajuste conforme necessário

document.addEventListener("DOMContentLoaded", () => {
    // 1. Aplica o Tema
    if (localStorage.getItem("tema_pestcontrol") === "dark") {
        document.body.classList.add("dark-theme");
    }

    // 2. Identificação Visual Básica
    const userNameElement = document.getElementById("userName");
    if (userNameElement) userNameElement.innerText = localStorage.getItem("userEmail") || "Não Autenticado";

    // 3. Verificação de Segurança
    if (!token) {
        console.warn("Usuário não autenticado. Redirecionando...");
        // window.location.href = "index.html"; // Descomente se quiser forçar o login
    } else {
        // Inicializa serviços
        conectarWebSocketReal();
        carregarSolicitacoes();
    }
});

// ==========================================
// CHAMADAS API (UNIFICADAS)
// ==========================================

/**
 * Função única para carregar as solicitações (Substitui os duplicados)
 */
async function carregarSolicitacoes() {
    const errorMsg = document.getElementById("os-error-msg");
    if (errorMsg) errorMsg.style.display = "none";

    try {
        // Ajuste a rota se necessário (ex: /api/solicitacoes ou /api/servicos/empresa/...)
        const response = await fetch(`${API_URL}/api/servicos/empresa/${empresaId}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`Erro ${response.status}: Falha ao buscar dados.`);

        const servicos = await response.json();
        renderizarKanban(servicos);

    } catch (err) {
        console.error("Erro na busca de OS:", err);
        if (errorMsg) {
            errorMsg.innerText = `Erro: ${err.message}`;
            errorMsg.style.display = "block";
        }
    }
}

/**
 * Responsável por desenhar os dados na tela
 */
function renderizarKanban(servicos) {
    const colPendentes = document.getElementById("coluna-pendentes");
    const colAndamento = document.getElementById("coluna-andamento");
    const colConcluidos = document.getElementById("coluna-concluidos");

    // Limpa colunas antes de renderizar
    if (colPendentes) colPendentes.innerHTML = "";
    if (colAndamento) colAndamento.innerHTML = "";
    if (colConcluidos) colConcluidos.innerHTML = "";

    servicos.forEach(s => {
        const cardHtml = `
            <div class="os-card" style="border-left: 5px solid ${s.status === 'PENDENTE' ? '#DC3545' : '#27B774'}; background: #fff; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4>OS #${s.id}</h4>
                <p><strong>Cliente:</strong> ${s.clienteNome || 'N/A'}</p>
                <p>${s.descricao || 'Sem descrição'}</p>
                <button class="btn-acao" onclick="avancarStatusReal(${s.id}, '${s.status}')">
                    Mudar Status
                </button>
            </div>
        `;

        if (s.status === "PENDENTE") colPendentes.innerHTML += cardHtml;
        else if (s.status === "EM_ANDAMENTO") colAndamento.innerHTML += cardHtml;
        else colConcluidos.innerHTML += cardHtml;
    });
}

async function avancarStatusReal(id, statusAtual) {
    let novoStatus = statusAtual === "PENDENTE" ? "EM_ANDAMENTO" : "CONCLUIDO";
    
    try {
        const response = await fetch(`${API_URL}/api/solicitacoes/${id}/status`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: novoStatus })
        });

        if (response.ok) {
            carregarSolicitacoes(); // Recarrega a tabela após sucesso
        } else {
            alert("Falha ao atualizar status.");
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
}

// ==========================================
// WEBSOCKET (STOMP)
// ==========================================
let stompClientReal = null;

function conectarWebSocketReal() {
    const statusText = document.getElementById("status-chat");
    if (!statusText) return;

    const socket = new SockJS(`${API_URL}/ws-pestcontrol`);
    stompClientReal = Stomp.over(socket);
    
    stompClientReal.connect({'Authorization': `Bearer ${token}`}, () => {
        statusText.innerHTML = `<i class="fa-solid fa-circle-check"></i> Online`;
        statusText.style.color = "#27B774";
        
        stompClientReal.subscribe('/topic/public', (mensagem) => {
            const display = document.getElementById("chat-box-display");
            if (display) display.innerHTML += `<div class="msg">${mensagem.body}</div>`;
        });
    }, (error) => {
        statusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Offline`;
        statusText.style.color = "#DC3545";
    });
}

// ==========================================
// FUNÇÕES AUXILIARES / UI
// ==========================================
function toggleVisualTheme() {
    const isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("tema_pestcontrol", isDark ? "dark" : "light");
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}