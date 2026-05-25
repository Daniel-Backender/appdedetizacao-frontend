/**
 * PESTCONTROLX - APP.JS
 * Lógica funcional do Dashboard Corporativo (Branco & Verde)
 */

// =========================================================
// 1. CONFIGURAÇÕES GLOBAIS E ESTADO
// =========================================================
const API_URL = "https://appdedetizacao.onrender.com";
const RENDER_URL = `${API_URL}/ws-pestcontrol`;
let stompClient = null;

// ESTADO DO CHAT (Estilo Telegram)
let currentChatClienteId = null;
let currentChatSubscription = null;
const empresaId = localStorage.getItem("empresaId");
const token = localStorage.getItem("token_jwt"); // Ajuste se seu app salvar com nome diferente

// =========================================================
// 2. SEGURANÇA E INICIALIZAÇÃO
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    // Se quiser ligar a trava de segurança, descomente abaixo:
    // if (!token || !empresaId) {
    //     alert("Sessão inválida. Redirecionando para login.");
    //     window.location.href = "index.html";
    // }

    const email = localStorage.getItem("user_email") || "admin@pestcontrolx.com";
    document.getElementById("userName").innerText = email;
    
    // Mostra o token na aba configurações apenas para verificação
    const tokenField = document.getElementById("generated-token-field");
    if(tokenField) tokenField.value = "Bearer " + (token || "Nenhum token encontrado");

    // Inicia na aba de clientes
    showSection('clientes', document.getElementById('btn-section-clientes'));
    carregarTabelaClientesRest();
    
    // Conecta o núcleo do WebSockets
    conectarServidorWebSocket();
    
    // Carrega a lista de clientes para a barra lateral do chat
    carregarListaClientesParaChat();
});

// NAVEGAÇÃO ENTRE ABAS
function showSection(sectionId, btnElement) {
    document.querySelectorAll('.section-view').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    btnElement.classList.add('active');
}

// =========================================================
// MÓDULO DE CLIENTES (REST API)
// =========================================================
async function carregarTabelaClientesRest() {
    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Carregando banco de dados...</td></tr>`;

    try {
        // Rota oficial do seu Spring Boot
        const response = await fetch(`${API_URL}/api/clientes/empresa/${empresaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const clientes = await response.json();
            tbody.innerHTML = "";

            if (clientes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhum cliente associado.</td></tr>`;
                return;
            }

            clientes.forEach(cli => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${cli.nome}</strong><br><small style="color:var(--text-secondary)">${cli.email || 'Sem e-mail'}</small></td>
                        <td>${cli.cnpj || cli.cpf || 'N/A'}</td>
                        <td><span class="badge-ativo">Ativo</span></td>
                        <td>
                            <button class="btn-salvar" style="padding: 6px 12px; font-size: 0.85rem;" onclick="irParaChat(${cli.id}, '${cli.nome}')">
                                <i class="fa-solid fa-comment-dots"></i> Atender
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color:red;">Erro ao processar dados da API. HTTP ${response.status}</td></tr>`;
        }
    } catch (e) {
        console.error("Erro na listagem de clientes", e);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color:red;">Servidor offline ou falha de CORS.</td></tr>`;
    }
}

// =========================================================
// 3. NÚCLEO WEBSOCKET (ESTILO TELEGRAM)
// =========================================================
function conectarServidorWebSocket() {
    atualizarStatusInterface("CONECTANDO...", "#ffaa00");
    const socket = new SockJS(RENDER_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = null; 

    stompClient.connect({}, function (frame) {
        atualizarStatusInterface("SISTEMA ONLINE E CONECTADO", "var(--primary-green)");
        
        // Inscreve no tópico global da empresa para notificações gerais
        stompClient.subscribe(`/topic/empresa/${empresaId}/notificacoes`, function(msg) {
            tocarSomNotificacao();
            console.log("Notificação Global Recebida:", msg.body);
        });

    }, function(error) {
        atualizarStatusInterface("FALHA CRÍTICA - RECONECTANDO...", "var(--danger)");
        setTimeout(conectarServidorWebSocket, 5000);
    });
}

// =========================================================
// 4. LÓGICA DE SALAS DE CHAT (O "TELEGRAM")
// =========================================================
async function abrirChatComCliente(clienteId, clienteNome, elementoClicado) {
    currentChatClienteId = clienteId;
    
    // Atualiza a UI para mostrar quem está ativo na barra lateral
    document.querySelectorAll('.contato-chat-item').forEach(el => el.classList.remove('active-chat'));
    if(elementoClicado) elementoClicado.classList.add('active-chat');

    const headerChat = document.getElementById('chat-header-title');
    if(headerChat) headerChat.innerText = `Atendimento: ${clienteNome}`;
    
    const box = document.getElementById('chat-box');
    box.innerHTML = `<div class="msg system">Carregando histórico seguro de mensagens...</div>`;

    // 1. Desconecta da sala do cliente anterior (para não receber mensagens cruzadas)
    if (currentChatSubscription) {
        currentChatSubscription.unsubscribe();
    }

    // 2. Carrega o Histórico do BD via REST
    try {
        const response = await fetch(`${API_URL}/api/chat/historico/${empresaId}/${clienteId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const historico = await response.json();
            box.innerHTML = ""; // Limpa a tela
            if (historico.length === 0) box.innerHTML = `<div class="msg system">Nenhuma mensagem anterior. Inicie o atendimento.</div>`;
            
            historico.forEach(msg => {
                const tipo = msg.remetente === "EMPRESA" ? "sent" : "received";
                printMensagem(msg.texto, tipo);
            });
        }
    } catch(err) {
        console.error("Histórico não carregado", err);
        box.innerHTML = `<div class="msg system" style="color:var(--danger)">Erro ao puxar histórico do banco.</div>`;
    }

    // 3. Inscreve na Sala Exclusiva (WebSocket Privado)
    const topicPath = `/topic/chat/${empresaId}/${clienteId}`;
    currentChatSubscription = stompClient.subscribe(topicPath, function (msg) {
        const dados = JSON.parse(msg.body);
        
        // Se a mensagem vier do Cliente (App), a gente pinta na tela e toca som!
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
        alert("Selecione um cliente na lista à esquerda para iniciar o envio.");
        return;
    }

    const textoDigitado = input.value.trim();
    
    if (textoDigitado !== "" && stompClient && stompClient.connected) {
        // Envia a mensagem pro Spring Boot distribuir para o App do Cliente
        const destination = `/app/chat/${empresaId}/${currentChatClienteId}`;
        const payload = JSON.stringify({
            remetente: 'EMPRESA',
            texto: textoDigitado 
        });
        
        stompClient.send(destination, {}, payload);
        
        // Exibe imediatamente na tela do painel
        printMensagem(textoDigitado, "sent");
        input.value = '';
        input.focus();
    } else if (!stompClient || !stompClient.connected) {
        atualizarStatusInterface("RECONECTANDO BARRAMENTO...", "#ffaa00");
    }
}

// =========================================================
// 5. INTERFACE DO CHAT E UTILITÁRIOS
// =========================================================
function printMensagem(txt, tipo) {
    const box = document.getElementById('chat-box');
    if (box) {
        // Usando o flexbox do CSS para posicionar as mensagens perfeitamente
        const clearSystemMsg = box.querySelector('.system');
        if(clearSystemMsg) clearSystemMsg.remove();

        box.innerHTML += `<div class="msg ${tipo}">${txt}</div>`;
        box.scrollTop = box.scrollHeight; 
    }
}

async function carregarListaClientesParaChat() {
    try {
        const response = await fetch(`${API_URL}/api/clientes/empresa/${empresaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const clientes = await response.json();
            const container = document.getElementById('lista-contatos-chat');
            if(!container) return;
            
            container.innerHTML = "";
            if (clientes.length === 0) container.innerHTML = `<div style="padding:15px; color:#666; text-align:center;">Nenhum cliente cadastrado.</div>`;

            clientes.forEach(cli => {
                container.innerHTML += `
                    <div class="contato-chat-item" onclick="abrirChatComCliente(${cli.id}, '${cli.nome}', this)">
                        <i class="fa-solid fa-user-circle"></i> ${cli.nome}
                    </div>
                `;
            });
        }
    } catch (e) {
        console.error("Erro na lista lateral do chat", e);
    }
}

// Atalho do botão da Tabela de Clientes direto para o Chat
function irParaChat(id, nome) {
    showSection('chat', document.getElementById('btn-section-chat'));
    abrirChatComCliente(id, nome, null);
}

// Efeitos de Notificação Funcionais (Sem arquivos externos)
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
    const painelChat = document.querySelector('.terminal-window');
    if (painelChat) {
        painelChat.style.transition = "box-shadow 0.15s";
        painelChat.style.boxShadow = "inset 0 0 15px rgba(61, 220, 132, 0.4)";
        setTimeout(() => painelChat.style.boxShadow = "none", 300);
    }
}

function atualizarStatusInterface(texto, corCss) {
    const el = document.getElementById('status-chat');
    if (el) {
        el.innerText = texto;
        el.style.color = corCss;
    }
}

function logout() {
    if(stompClient) stompClient.disconnect();
    localStorage.clear();
    window.location.href = "index.html";
}