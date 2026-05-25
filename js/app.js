// =========================================================
// 1. CONFIGURAÇÕES GLOBAIS E ESTADO
// =========================================================
const API_URL = "https://appdedetizacao.onrender.com";
const RENDER_URL = `${API_URL}/ws-pestcontrol`;
let stompClient = null;

let currentChatClienteId = null;
let currentChatSubscription = null;
const empresaId = localStorage.getItem("empresaId") || "1"; // Fallback para testes
const token = localStorage.getItem("token");

// =========================================================
// 2. INICIALIZAÇÃO DA INTERFACE E SEGURANÇA
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Aplica o tema salvo (Padrão: Claro/Branco conforme o site)
    const temaSalvo = localStorage.getItem("tema_pestcontrol");
    const themeCheckbox = document.getElementById("theme-toggle-checkbox");
    
    if (temaSalvo === "dark") {
        document.body.classList.add("dark-theme");
        if(themeCheckbox) themeCheckbox.checked = true;
    } else {
        document.body.classList.remove("dark-theme"); // Força o branco padrão
        if(themeCheckbox) themeCheckbox.checked = false;
    }

    // 2. Carrega os dados do usuário logado
    const email = localStorage.getItem("userEmail") || "admin@pestcontrolx.com";
    const elNome = document.getElementById("userName");
    if (elNome) elNome.innerText = email;

    // 3. Inicia conexões e dados visuais
    if (token && empresaId) {
        conectarServidorWebSocket();
    } else {
        console.warn("Modo de visualização (Sem Token). Funcionalidades de API limitadas.");
    }
    
    renderizarTabelaClientes(); // Preenche a tabela inicial
});

// =========================================================
// 3. FUNCIONALIDADES DO MENU E TELA (UI/UX)
// =========================================================

// Alternar entre as abas (Clientes, Sobre, Chat, Configurações)
function showSection(sectionId, btnElement) {
    // Remove classe 'active' de todas as seções e esconde
    document.querySelectorAll('.section-view').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });
    
    // Remove classe 'active' de todos os botões do menu
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Ativa a seção alvo
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Ativa o botão clicado
    if (btnElement) {
        btnElement.classList.add('active');
    }
}

// Retrair e Expandir Menu Lateral
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Alternar Tema (Claro Corporativo / Dark Cyber)
function toggleVisualTheme() {
    const isDark = document.body.classList.toggle("dark-theme");
    
    if (isDark) {
        localStorage.setItem("tema_pestcontrol", "dark");
    } else {
        localStorage.setItem("tema_pestcontrol", "light");
    }
}

// =========================================================
// 4. MÓDULO DE CLIENTES (TABELA E FICHA)
// =========================================================

// Dados simulados para a tabela não ficar vazia até você ligar a API
const clientesMock = [
    { id: 1, nome: "Carlos Silva", cpf: "123.456.789-00", contato: "(11) 98985-0000", status: "Ativo" },
    { id: 2, nome: "Maria Souza", cpf: "664.852.361-00", contato: "maria.souza@gmail.com", status: "Inativo" },
    { id: 3, nome: "Pedro Jesus", cpf: "187.326.739-00", contato: "(11) 75405-9800", status: "Ativo" }
];

function renderizarTabelaClientes() {
    const tbody = document.getElementById("tabelaClientes");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    clientesMock.forEach(cli => {
        const isAtivo = cli.status === "Ativo";
        const statusHtml = isAtivo 
            ? `<span style="color: #27B774; font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Ativo / ${cli.contato}</span>`
            : `<span style="color: #DC3545; font-weight: bold;"><i class="fa-solid fa-ban"></i> Cadastro Inativo</span>`;
            
        tbody.innerHTML += `
            <tr>
                <td><strong>${cli.nome}</strong></td>
                <td>${cli.cpf}</td>
                <td>${statusHtml}</td>
                <td>
                    <button class="btn-abrir-ficha" onclick="abrirFichaCliente(${cli.id}, '${cli.nome}')" style="padding: 6px 12px; background: #e8f5e9; color: #27b774; border: 1px solid #27b774; border-radius: 4px; cursor: pointer;">
                        <i class="fa-solid fa-address-card"></i> Abrir Ficha
                    </button>
                </td>
            </tr>
        `;
    });
}

function abrirFichaCliente(id, nome) {
    document.getElementById("view-lista-clientes").style.display = "none";
    document.getElementById("view-detalhes-cliente").style.display = "block";
    
    const detalhe = document.getElementById("detalheGeral");
    if(detalhe) {
        detalhe.innerHTML = `
            <h3>${nome}</h3>
            <p><strong>Registro/ID:</strong> ${id}</p>
            <p><strong>Status Operacional:</strong> Em monitoramento</p>
        `;
    }
}

function fecharFichaCliente() {
    document.getElementById("view-lista-clientes").style.display = "block";
    document.getElementById("view-detalhes-cliente").style.display = "none";
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// =========================================================
// 5. MÓDULO WEBSOCKETS (CHAT E NOTIFICAÇÕES)
// =========================================================
function conectarServidorWebSocket() {
    atualizarStatusInterface("SISTEMA CONECTANDO...", "#ffaa00");
    const socket = new SockJS(RENDER_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = null; 

    stompClient.connect({}, function (frame) {
        atualizarStatusInterface("SERVIDOR DE MENSAGENS ONLINE", "#27B774");
        
        stompClient.subscribe(`/topic/empresa/${empresaId}/notificacoes`, function(msg) {
            tocarSomNotificacao();
            console.log("Notificação Global:", msg.body);
        });

    }, function(error) {
        atualizarStatusInterface("FALHA - RECONECTANDO...", "#DC3545");
        setTimeout(conectarServidorWebSocket, 5000);
    });
}

function enviarMensagemChat() {
    const input = document.getElementById('msg-input');
    const texto = input.value.trim();
    
    if (texto === "") return;
    
    printMensagem(texto, "sent");
    input.value = '';
    
    // Simula a resposta do sistema se não houver conexão real
    if (!stompClient || !stompClient.connected) {
        setTimeout(() => {
            printMensagem("Sistema offline. Mensagem guardada no log local.", "received");
        }, 1000);
    }
}

function printMensagem(txt, tipo) {
    const box = document.getElementById('chat-box-display');
    if (!box) return;
    
    // Classes CSS determinam as cores (definidas no CSS)
    const alinhamento = tipo === 'sent' ? 'right' : 'left';
    const corFundo = tipo === 'sent' ? '#e8f5e9' : '#f8f9fa';
    const corBorda = tipo === 'sent' ? '#27B774' : '#dee2e6';
    const corTexto = '#212529';
    
    box.innerHTML += `
        <div style="text-align: ${alinhamento}; margin: 8px 0;">
            <div style="display: inline-block; padding: 10px 15px; border-radius: 8px; background: ${corFundo}; border: 1px solid ${corBorda}; color: ${corTexto}; max-width: 70%; text-align: left;">
                ${txt}
            </div>
        </div>
    `;
    box.scrollTop = box.scrollHeight; 
}

function tocarSomNotificacao() {
    const checkboxSom = document.getElementById("sound-alerts");
    if (checkboxSom && !checkboxSom.checked) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } catch (err) {}
}

function atualizarStatusInterface(texto, corHex) {
    const el = document.getElementById('status-chat');
    if (el) {
        el.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> ${texto}`;
        el.style.color = corHex;
    }
}