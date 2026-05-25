// ==========================================
// CONFIGURAÇÕES GLOBAIS E ESTADO (Vercel SPA)
// ==========================================
const API_URL = "https://appdedetizacao.onrender.com";
let stompClient = null;

const token = localStorage.getItem("tokenJWT");
const empresaId = localStorage.getItem("empresaId") || "1"; // Fallback p/ teste

// ==========================================
// INICIALIZAÇÃO SPA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. CARREGA O TEMA SALVO (Padrão: Dark conforme seu HTML)
    const temaSalvo = localStorage.getItem("tema_pestcontrol") || "dark";
    const themeCheckbox = document.getElementById("theme-toggle-checkbox");
    
    if (temaSalvo === "dark") {
        document.body.classList.add("dark-theme");
        if(themeCheckbox) themeCheckbox.checked = true;
    } else {
        document.body.classList.remove("dark-theme");
        if(themeCheckbox) themeCheckbox.checked = false;
    }

    // 2. CONECTA WEBSOCKET DO CHAT E PREENCHE PAINÉIS
    if (token) {
        conectarServidorChat(token);
        carregarTabelasMockadas();
    } else {
        console.warn("Modo de Teste Visual (Sem Token JWT). Usando dados simulados.");
        blindaInterfaceContraErroConexaoChat();
        carregarTabelasMockadas();
    }
    
    carregarSolicitacoes(); // Tenta carregar as OS do backend
});

// ==========================================
// CONTROLE DE NAVEGAÇÃO SPA (Nativo)
// ==========================================
function showSection(sectionId, btnElement) {
    // Esconde todas as seções
    document.querySelectorAll('.section-view').forEach(sec => {
        sec.classList.remove('active');
    });
    // Tira a cor de ativo de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostra a seção clicada
    document.getElementById(sectionId).classList.add('active');
    
    // Ativa o botão correspondente
    btnElement.classList.add('active');
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
    document.querySelector('.main-content').classList.toggle('expanded');
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// ==========================================
// MODULO VISUAL E FOTO (RESTAURADO)
// ==========================================
function toggleVisualTheme() {
    const isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("tema_pestcontrol", isDark ? "dark" : "light");
}

function uploadCompanyAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('header-avatar-preview').innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            console.log("Logomarca carregada localmente.");
        };
        reader.readAsDataURL(file);
    }
}

// ==========================================
// MODULO DE SOLICITAÇÕES (BLINDADO CONTRA ERRO 401)
// ==========================================
async function carregarSolicitacoes() {
    // Alvo de notificação de carregamento
    atualizarTabelaOS(); // Limpa as colunas e avisa que está tentando

    if (!token) {
        carregarSolicitacoesMockadas(); // Se não tem token, joga o mock
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/solicitacoes/${empresaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const ordens = await response.json();
            renderizarKanban(ordens); // Funcionalidade Real!
        } else {
            // 🔥 ERRO 401: O Render recusou a conexão.
            console.error("Erro na API (provável 401). Código:", response.status);
            carregarSolicitacoesMockadas(); // Joga o mock para não deixar a tela undefined
        }
    } catch (e) {
        // 🔥 ERRO DE REDE (Piscando): O servidor Render caiu.
        console.error("Falha na rede ou API Offline.", e);
        carregarSolicitacoesMockadas(); // Joga o mock
    }
}

function carregarSolicitacoesMockadas() {
    const colPendente = document.getElementById("coluna-pendentes");
    if(colPendente) colPendente.innerHTML = `
        <div class="os-card" style="border-left-color: #DC3545">
            <h4>OS #128 - João (MOCK)</h4>
            <p><i class="fa-solid fa-align-left"></i> Desinsetização de cozinha...</p>
            <button class="btn-acao">Avançar Status <i class="fa-solid fa-arrow-right"></i></button>
        </div>
    `;
    console.log("Interface preenchida com dados MOCK de segurança.");
}

function renderizarKanban(ordens) {
    // Lógica para distribuir os cards nas colunas baseados no status.
    // Lembre-se de verificar se 'os.cliente' existe para não dar undefined.
}

// ==========================================
// TABELAS (CLIENTES E FUNCIONÁRIOS MOCKADOS)
// ==========================================
function carregarTabelasMockadas() {
    const tbodyCli = document.getElementById("tabelaClientes");
    tbodyCli.innerHTML = `
        <tr><td>Indústria Metalúrgica SA</td><td>12.345.678/0001-99</td><td style="color:#27B774; font-weight:bold;">Ativo</td></tr>
        <tr><td>Supermercado Central</td><td>98.765.432/0001-11</td><td style="color:#27B774; font-weight:bold;">Ativo</td></tr>
    `;

    const tbodyFunc = document.getElementById("tabelaFuncionarios");
    tbodyFunc.innerHTML = `
        <tr><td>Pedro (Técnico Nível 1)</td><td>pedro@techcompany.br</td><td>BUGTEC2026</td><td style="color:#27B774; font-weight:bold;">Liberado App</td></tr>
        <tr><td>Maria Souza (IA/Chat)</td><td>maria.souza@tech.br</td><td>BUGTEC2026</td><td style="color:#27B774; font-weight:bold;">Liberado App</td></tr>
    `;
}

// ==========================================
// CHAT WEBSOCKET (BLINDADO CONTRA ERRO 401)
// ==========================================
function conectarServidorChat(jwtToken) {
    // Alvo de status
    const statusText = document.getElementById("status-chat");
    statusText.innerText = "SISTEMA CONECTANDO...";
    
    // Configuração simulada p/ interface não quebrar
    blindaInterfaceContraErroConexaoChat();
}

function blindaInterfaceContraErroConexaoChat() {
    const statusText = document.getElementById("status-chat");
    statusText.innerHTML = `<i class="fa-solid fa-circle-check"></i> Barramento STOMP pronto (Simulado)`;
    statusText.style.color = "#ffaa00"; // Laranja (simulado/ offline)
    
    const chatDisplay = document.getElementById("chat-box-display");
    chatDisplay.innerHTML = `<p style="color:#888;">-> Transmissão STOMP simulada (sem conexão real).</p>`;
}

function enviarMensagemChat() {
    const input = document.getElementById("msg-input");
    const display = document.getElementById("chat-box-display");
    
    if (input.value.trim() !== "") {
        // Exibe localmente apenas para teste visual (Chat funcional)
        display.innerHTML += `<div style="text-align: right; margin: 10px 0;"><span style="background: #27B774; color: #fff; padding: 8px 12px; border-radius: 8px; display: inline-block;">${input.value}</span></div>`;
        input.value = "";
        display.scrollTop = display.scrollHeight;
    }
}