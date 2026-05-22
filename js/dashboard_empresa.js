// =========================================================
// 1. CONFIGURAÇÕES E CONSTANTES GLOBAIS
// =========================================================
const API_URL = "https://appdedetizacao.onrender.com";
const RENDER_URL = `${API_URL}/ws-pestcontrol`;
let stompClient = null;

// =========================================================
// 2. VERIFICAÇÃO DE SEGURANÇA IMEDIATA
// =========================================================
if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
}

// =========================================================
// 3. INICIALIZAÇÃO GERAL
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    // Carrega dados do usuário
    const email = localStorage.getItem("userEmail") || "empresa@pestcontrolx.com";
    const elNome = document.getElementById("userName");
    if (elNome) elNome.innerText = email;

    // Preenche cache local no formulário
    const inputSobre = document.getElementById("inputSobre");
    const inputMsgBot = document.getElementById("inputMensagemBot");
    if (inputSobre) inputSobre.value = localStorage.getItem("empresaSobre") || "";
    if (inputMsgBot) inputMsgBot.value = localStorage.getItem("empresaBotMsg") || "";

    // Inicializa o chat WebSocket
    conectarChat();
});

// =========================================================
// 4. LÓGICA DE INTERFACE (MENU E ABAS)
// =========================================================
function toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
}

function showSection(idSecao, btn) {
    document.querySelectorAll('.section-view').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(idSecao).classList.add('active');
    if (btn) btn.classList.add('active');
}

// =========================================================
// 5. SALVAR DADOS NO BANCO DO RENDER (FETCH PUT)
// =========================================================
async function salvarDadosPerfil(e) {
    if (e) e.preventDefault();
    
    const tokenAtual = localStorage.getItem("token");
    const idEmpresaAtual = localStorage.getItem("empresaId");

    // Validação agressiva
    if (!idEmpresaAtual || idEmpresaAtual === "null" || idEmpresaAtual === "undefined") {
        console.error("FALHA: ID da empresa está nulo. LocalStorage:", localStorage);
        alert("Sua sessão está corrompida. O sistema não sabe quem é sua empresa. Por favor, faça login novamente.");
        logout();
        return;
    }

    const sobre = document.getElementById("inputSobre").value;
    const botMsg = document.getElementById("inputMensagemBot").value;

    try {
        // A URL agora só será chamada se o ID for válido
        const response = await fetch(`${API_URL}/api/empresas/${idEmpresaAtual}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenAtual}`
            },
            body: JSON.stringify({ sobre: sobre, mensagemAutomatica: botMsg })
        });

        if (response.ok) {
            alert("Perfil atualizado com sucesso! 🚀");
        } else {
            const erroText = await response.text();
            alert("Erro do Servidor: " + erroText);
        }
    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Falha de conexão com o servidor.");
    }
}

// =========================================================
// 6. EFEITOS ESPECIAIS DO CHAT (ÁUDIO E VISUAL NEON)
// =========================================================
function atualizarStatusInterface(texto, corHex) {
    const el = document.getElementById('status-chat');
    if (el) {
        el.innerText = texto;
        el.style.borderColor = corHex;
        el.style.color = corHex;
        el.style.boxShadow = `0 0 10px ${corHex}`;
    }
}

function tocarSomNotificacao() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        let osc1 = audioCtx.createOscillator();
        let gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.1);
        
        setTimeout(() => {
            let osc2 = audioCtx.createOscillator();
            let gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
            gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.15);
        }, 70);
    } catch (err) {
        console.warn("Áudio bloqueado pelo navegador.", err);
    }
}

function piscarJanelaTerminal() {
    const painelChat = document.getElementById('terminal-container');
    if (painelChat) {
        painelChat.style.boxShadow = "0 0 35px #3DDC84";
        painelChat.style.borderColor = "#3DDC84";
        setTimeout(() => {
            painelChat.style.boxShadow = "none";
            painelChat.style.borderColor = "var(--border-color)"; 
        }, 350);
    }
}

// =========================================================
// 7. WEBSOCKET STOMP (LÓGICA PRINCIPAL DO CHAT)
// =========================================================
function conectarChat() {
    atualizarStatusInterface("CONECTANDO...", "#ffaa00");
    const socket = new SockJS(RENDER_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = null; 

    stompClient.connect({}, function (frame) {
        atualizarStatusInterface("SISTEMA ONLINE", "#3DDC84");
        printMensagem("SISTEMA DE ATENDIMENTO CONECTADO.", "received");
        
        stompClient.subscribe('/topic/mensagens', function (msg) {
            const dados = JSON.parse(msg.body);
            
            if (dados.remetente !== 'EMPRESA') {
                printMensagem(`[${dados.remetente}]: ${dados.texto}`, "received");
                atualizarTabelaClientes(dados.remetente);
                
                tocarSomNotificacao();
                piscarJanelaTerminal();
            }
        });
    }, function(error) {
        atualizarStatusInterface("SISTEMA OFFLINE", "#ff3333");
        console.error('Queda de conexão WebSocket. Nova tentativa em 5s...', error);
        setTimeout(conectarChat, 5000);
    });
}

function enviarMsgStomp() {
    const input = document.getElementById('msg-input');
    if (!input) return;

    const textoDigitado = input.value.trim();
    
    if (textoDigitado !== "") {
        if (stompClient && stompClient.connected) {
            const payload = JSON.stringify({
                'remetente': 'EMPRESA',
                'texto': textoDigitado 
            });
            stompClient.send("/app/enviar", {}, payload);
            
            printMensagem(`VOCÊ: ${textoDigitado}`, "sent");
            input.value = '';
            input.focus();
        } else {
            console.warn("Bloqueado: WebSocket desconectado.");
            atualizarStatusInterface("RECONECTANDO...", "#ffaa00");
        }
    }
}

function printMensagem(txt, tipo) {
    const box = document.getElementById('chat-box');
    if (box) {
        box.innerHTML += `<div class="msg ${tipo}">${txt}</div>`;
        box.scrollTop = box.scrollHeight; 
    }
}

function atualizarTabelaClientes(clienteNome) {
    const corpo = document.getElementById("lista-clientes-corpo");
    if (corpo) {
        corpo.innerHTML = `<tr>
            <td>#1024</td>
            <td>${clienteNome}</td>
            <td><span class="status-badge" style="color: #000; background: #3DDC84; box-shadow: 0 0 5px #3DDC84;">Nova Mensagem</span></td>
        </tr>`;
    }
}

// =========================================================
// 8. LOGOUT
// =========================================================
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}