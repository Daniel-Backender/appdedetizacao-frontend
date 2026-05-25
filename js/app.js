// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================
const API_URL = "https://appdedetizacao.onrender.com";
const token = localStorage.getItem("tokenJWT"); // VERIFIQUE SE O NOME DA CHAVE ESTÁ CERTO AQUI

document.addEventListener("DOMContentLoaded", () => {
    // Aplica o tema
    if (localStorage.getItem("tema_pestcontrol") === "dark") {
        document.body.classList.add("dark-theme");
    }

    // Identificação visual
    const email = localStorage.getItem("userEmail");
    document.getElementById("userName").innerText = email ? email : "Não Autenticado";
    document.getElementById("debugToken").value = token ? token : "NENHUM TOKEN ENCONTRADO NO LOCALSTORAGE";

    // Bloqueia se não tiver token
    if (!token) {
        alert("ALERTA: Você não está logado ou perdeu o token. As chamadas para a API retornarão 401.");
    } else {
        // Tenta conectar no Chat STOMP real
        conectarWebSocketReal();
        // Chama a API das ordens de serviço
        carregarSolicitacoes();
    }
});

// ==========================================
// UI / NAVEGAÇÃO SPA
// ==========================================
function showSection(sectionId, btnElement) {
    document.querySelectorAll('.section-view').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    btnElement.classList.add('active');
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
    document.querySelector('.main-content').classList.toggle('expanded');
}

function toggleVisualTheme() {
    const isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("tema_pestcontrol", isDark ? "dark" : "light");
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// ==========================================
// CHAMADAS REAIS À API (SEM MOCKS)
// ==========================================

async function carregarSolicitacoes() {
    const errorMsg = document.getElementById("os-error-msg");
    errorMsg.style.display = "none";
    
    // Limpa os painéis antes de buscar
    document.getElementById("coluna-pendentes").innerHTML = "";
    document.getElementById("coluna-andamento").innerHTML = "";
    document.getElementById("coluna-concluidos").innerHTML = "";

    try {
        // ROTA PARA BUSCAR AS OS - AJUSTE SE NECESSÁRIO
        const response = await fetch(`${API_URL}/api/solicitacoes`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error("Erro 401 Unauthorized: Seu Token JWT é inválido ou o Spring Security bloqueou a rota.");
        }
        
        if (!response.ok) {
            throw new Error(`Erro do Servidor: ${response.status}`);
        }

        const ordens = await response.json();
        renderizarKanbanReal(ordens);

    } catch (error) {
        console.error(error);
        errorMsg.innerText = `FALHA AO CARREGAR DADOS DA API: ${error.message}`;
        errorMsg.style.display = "block";
    }
}

function renderizarKanbanReal(ordens) {
    ordens.forEach(os => {
        let corBorda = os.status === "PENDENTE" ? "#DC3545" : (os.status === "EM_ANDAMENTO" ? "#ffaa00" : "#27B774");
        
        const cardHtml = `
            <div class="os-card" style="border-left-color: ${corBorda}">
                <h4>OS #${os.id}</h4>
                <p><strong>Cliente:</strong> ${os.clienteNome || os.cliente_id || 'Não Cadastrado'}</p>
                <p><i class="fa-solid fa-align-left"></i> ${os.descricao}</p>
                <button class="btn-acao" onclick="avancarStatusReal(${os.id}, '${os.status}')">
                    Mudar Status <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;

        if (os.status === "PENDENTE" || !os.status) document.getElementById("coluna-pendentes").innerHTML += cardHtml;
        else if (os.status === "EM_ANDAMENTO") document.getElementById("coluna-andamento").innerHTML += cardHtml;
        else document.getElementById("coluna-concluidos").innerHTML += cardHtml;
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

        if (response.ok) carregarSolicitacoes(); // Recarrega a tela
        else alert(`Falha na atualização. Erro HTTP: ${response.status}`);
    } catch (e) {
        alert("Erro de conexão ao tentar atualizar a OS.");
    }
}

async function salvarSobreEmpresa() {
    const texto = document.getElementById("txtSobreEmpresa").value;
    try {
        const response = await fetch(`${API_URL}/api/empresa/sobre`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descricao: texto })
        });
        if(response.ok) alert("Informações da empresa atualizadas na API!");
        else alert("Erro 401/403: Verifique as permissões de CORS e Token.");
    } catch (e) {
        alert("Erro de rede.");
    }
}

// ==========================================
// WEBSOCKET REAL (STOMP)
// ==========================================
let stompClientReal = null;

function conectarWebSocketReal() {
    const statusText = document.getElementById("status-chat");
    
    const socket = new SockJS(`${API_URL}/ws-pestcontrol`);
    stompClientReal = Stomp.over(socket);
    
    // Passa o Token no header da conexão STOMP
    stompClientReal.connect({'Authorization': `Bearer ${token}`}, function (frame) {
        statusText.innerHTML = `<i class="fa-solid fa-circle-check"></i> Conectado ao STOMP!`;
        statusText.style.color = "#27B774";
        
        // Inscreve no tópico para receber mensagens
        stompClientReal.subscribe('/topic/public', function (mensagem) {
            const display = document.getElementById("chat-box-display");
            display.innerHTML += `<div style="text-align: left; margin: 10px 0;"><span style="background: #374151; color: #fff; padding: 8px 12px; border-radius: 8px;">${mensagem.body}</span></div>`;
        });
        
    }, function(error) {
        statusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Conexão STOMP Recusada (Verifique o Token/CORS)`;
        statusText.style.color = "#DC3545";
    });
}

function enviarMensagemChat() {
    const input = document.getElementById("msg-input");
    if (input.value.trim() !== "" && stompClientReal && stompClientReal.connected) {
        // Manda pro back
        stompClientReal.send("/app/chat.sendMessage", {}, JSON.stringify({conteudo: input.value}));
        
        // Pinta na tela
        const display = document.getElementById("chat-box-display");
        display.innerHTML += `<div style="text-align: right; margin: 10px 0;"><span style="background: #27B774; color: #fff; padding: 8px 12px; border-radius: 8px;">${input.value}</span></div>`;
        input.value = "";
    } else {
        alert("WebSocket desconectado. Falha ao enviar.");
    }
}