// =========================================================
// 1. CONFIGURAÇÕES GLOBAIS E ESTADO
// =========================================================
const API_URL = "https://appdedetizacao.onrender.com";
const RENDER_URL = `${API_URL}/ws-pestcontrol`;
let stompClient = null;

let currentChatClienteId = null;
let currentChatSubscription = null;
const empresaId = localStorage.getItem("empresaId");
const token = localStorage.getItem("token");

// =========================================================
// 2. SEGURANÇA E INICIALIZAÇÃO
// =========================================================
if (!token || !empresaId) {
    alert("Sessão inválida. Redirecionando para login.");
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const email = localStorage.getItem("userEmail") || "admin@pestcontrolx.com";
    const elNome = document.getElementById("userName");
    if (elNome) elNome.innerText = email;

    // Conecta o núcleo do WebSockets
    conectarServidorWebSocket();
    // Carrega a lista de clientes para a barra lateral do chat
    carregarListaClientesParaChat();

    carregarOrdensDoServidor(); 

    setInterval(() => {
    carregarOrdensDoServidor();
}, 30000);
});

// =========================================================
// 3. NÚCLEO WEBSOCKET (ESTILO TELEGRAM)
// =========================================================
function conectarServidorWebSocket() {
    atualizarStatusInterface("SISTEMA CONECTANDO...", "#ffaa00");
    const socket = new SockJS(RENDER_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = null; 

    // 1. Recupere o token salvo no login
    // Ajuste 'meu_token_chave' para o nome exato que você usa no localStorage
    const token = localStorage.getItem('meu_token_chave'); 

    // 2. Prepare o cabeçalho de autorização
    const headers = {
        'Authorization': 'Bearer ' + token
    };

    // 3. Passe o headers no connect
    stompClient.connect(headers, function (frame) {
        atualizarStatusInterface("SERVIDOR ONLINE", "#3DDC84");
        
        stompClient.subscribe(`/topic/empresa/${empresaId}/notificacoes`, function(msg) {
            tocarSomNotificacao();
            console.log("Notificação Global:", msg.body);
        });

    }, function(error) {
        // Se a autenticação falhar, este erro será disparado
        console.error("Erro na conexão STOMP:", error);
        atualizarStatusInterface("FALHA CRÍTICA - RECONECTANDO...", "#ff3333");
        setTimeout(conectarServidorWebSocket, 5000);
    });
}

// =========================================================
// 4. LÓGICA DE SALAS DE CHAT (O "TELEGRAM")
// =========================================================
async function abrirChatComCliente(clienteId, clienteNome) {
    currentChatClienteId = clienteId;
    
    // Atualiza a UI para mostrar com quem estamos falando
    const headerChat = document.getElementById('chat-header-title');
    if(headerChat) headerChat.innerText = `Chat: ${clienteNome}`;
    
    const box = document.getElementById('chat-box');
    box.innerHTML = `<div class="msg system" style="color:#00ffcc; text-align:center;">Carregando banco de dados criptografado...</div>`;

    // 1. Desconecta da sala anterior (se existir)
    if (currentChatSubscription) {
        currentChatSubscription.unsubscribe();
    }

    // 2. Carrega o Histórico do Banco de Dados via REST
    try {
        const response = await fetch(`${API_URL}/api/chat/historico/${empresaId}/${clienteId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const historico = await response.json();
        
        box.innerHTML = ""; // Limpa a tela
        historico.forEach(msg => {
            const tipo = msg.remetente === "EMPRESA" ? "sent" : "received";
            printMensagem(msg.texto, tipo);
        });
    } catch(err) {
        console.error("Erro ao carregar histórico", err);
    }

    // 3. Conecta na Nova Sala Exclusiva (WebSocket)
    const topicPath = `/topic/chat/${empresaId}/${clienteId}`;
    currentChatSubscription = stompClient.subscribe(topicPath, function (msg) {
        const dados = JSON.parse(msg.body);
        
        // Se a mensagem que chegou NÃO for nossa, pinta na tela e toca som
        if (dados.remetente !== 'EMPRESA') {
            printMensagem(dados.texto, "received");
            tocarSomNotificacao();
            piscarJanelaTerminal();
        }
    });
}

function enviarMsgStomp() {
    const input = document.getElementById('msg-input');
    if (!input || !currentChatClienteId) {
        alert("Selecione um cliente na lista primeiro para iniciar a transmissão.");
        return;
    }

    const textoDigitado = input.value.trim();
    
    if (textoDigitado !== "" && stompClient && stompClient.connected) {
        // Envia para a sala privada: /app/chat/{empresaId}/{clienteId}
        const destination = `/app/chat/${empresaId}/${currentChatClienteId}`;
        const payload = JSON.stringify({
            remetente: 'EMPRESA',
            texto: textoDigitado 
        });
        
        stompClient.send(destination, {}, payload);
        
        // Exibe imediatamente na nossa tela
        printMensagem(textoDigitado, "sent");
        input.value = '';
        input.focus();
    }
}

// =========================================================
// 5. RENDERIZAÇÃO E UI/UX CYBER-INDUSTRIAL
// =========================================================
function printMensagem(txt, tipo) {
    const box = document.getElementById('chat-box');
    if (box) {
        // Usa o estilo de box do PestControlX
        box.innerHTML += `<div class="msg ${tipo}" style="margin: 8px 0; padding: 10px; border-radius: 5px; ${tipo === 'sent' ? 'background:#1a4d33; border: 1px solid #3DDC84; text-align:right;' : 'background:#222; border: 1px solid #444; text-align:left;'}">${txt}</div>`;
        box.scrollTop = box.scrollHeight; 
    }
}

function tocarSomNotificacao() {
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

function piscarJanelaTerminal() {
    const painelChat = document.getElementById('terminal-container');
    if (painelChat) {
        painelChat.style.boxShadow = "0 0 40px #3DDC84";
        setTimeout(() => painelChat.style.boxShadow = "none", 400);
    }
}

function atualizarStatusInterface(texto, corHex) {
    const el = document.getElementById('status-chat');
    if (el) {
        el.innerText = texto;
        el.style.color = corHex;
        el.style.textShadow = `0 0 10px ${corHex}`;
    }
}

// =========================================================
// 6. SOLICITAÇÕES E CLIENTES (PREPARAÇÃO P/ ORDEM DE SERVIÇO)
// =========================================================
async function carregarListaClientesParaChat() {
    // Essa função simula a busca de clientes cadastrados no banco para montar o menu lateral
    try {
        const response = await fetch(`${API_URL}/api/clientes/empresa/${empresaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const clientes = await response.json();
            const container = document.getElementById('lista-contatos-chat'); // Precisa existir no HTML
            if(!container) return;
            
            container.innerHTML = "";
            clientes.forEach(cli => {
                container.innerHTML += `
                    <div class="contato-chat-item" onclick="abrirChatComCliente(${cli.id}, '${cli.nome}')" style="padding: 10px; border-bottom: 1px solid #333; cursor: pointer; color: #3DDC84;">
                        ${cli.nome}
                    </div>
                `;
            });
        }
    } catch (e) {
        console.error("Erro ao carregar clientes para o chat", e);
    }
}

async function carregarOrdensDoServidor() {
    try {
        const response = await fetch(`${API_URL}/api/solicitacoes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const ordens = await response.json();
        
        // Limpa os containers
        document.querySelectorAll('.os-cards-container').forEach(el => el.innerHTML = '');

        ordens.forEach(os => {
            const card = `
                <div class="os-card">
                    <h4>#${os.id} - ${os.descricao}</h4>
                    <p>Cliente: ${os.clienteNome || 'Cliente não identificado'}</p>
                    <p>Status: ${os.status}</p>
                </div>
            `;
            
            // Distribuição real por status
            if (os.status === 'PENDENTE') {
                document.querySelector('#col-pendentes .os-cards-container').innerHTML += card;
            } else if (os.status === 'EM_ANDAMENTO') {
                document.querySelector('#col-campo .os-cards-container').innerHTML += card;
            } else if (os.status === 'CONCLUIDO') {
                document.querySelector('#col-concluidas .os-cards-container').innerHTML += card;
            }
        });
    } catch (e) {
        console.error("Falha ao sincronizar OS com o servidor:", e);
    }

    
}


// Controle limpo de navegação do iFrame
function navegar(btnElement, url) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    document.getElementById('telaExterna').src = url;
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// Escuta eventos vindos do iframe (ex: quando as configurações mudam o tema)
window.addEventListener('message', function(event) {
    if (event.data === 'toggleTheme') {
        document.body.classList.toggle('dark-theme');
    }
});