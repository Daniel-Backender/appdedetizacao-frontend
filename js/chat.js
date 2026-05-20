var stompClient = null;
// Mantenha o endpoint exatamente como configurado no seu WebSocket do backend
const RENDER_URL = 'https://appdedetizacao.onrender.com/ws-pestcontrol'; 

// Inicializa os escutadores assim que a janela carregar
document.addEventListener("DOMContentLoaded", () => {
    // Escuta o teclado no campo de mensagem
    const campoTexto = document.getElementById('msg');
    if (campoTexto) {
        campoTexto.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                enviar();
            }
        });
    }
    // Inicia a conexão automática do chat
    conectar();
});

// Função Auxiliar para Atualizar o Indicador Visual de Conexão na Tela
function atualizarStatusInterface(texto, corHex) {
    // Procura por ID ou classe comum, senão varre o elemento que contém o texto de sistema
    let el = document.getElementById('status-chat') || document.querySelector('.status-chat');
    if (!el) {
        const elementos = document.querySelectorAll('div, span, button');
        for (let item of elementos) {
            if (item.innerText.includes("SISTEMA")) {
                el = item;
                break;
            }
        }
    }
    if (el) {
        el.innerText = texto;
        el.style.borderColor = corHex;
        el.style.color = corHex;
        el.style.boxShadow = `0 0 15px ${corHex}`;
    }
}

// Efeito de Notificação 1: Som Sintetizado (Estilo Alerta Cyber-Industrial)
function tocarSomNotificacao() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Primeiro bip (Grave)
        let osc1 = audioCtx.createOscillator();
        let gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Nota C5
        gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.1);
        
        // Segundo bip rápido (Agudo)
        setTimeout(() => {
            let osc2 = audioCtx.createOscillator();
            let gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(783.99, audioCtx.currentTime); // Nota G5
            gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.15);
        }, 70);
    } catch (err) {
        console.warn("Áudio bloqueado pelo navegador até interação do usuário.", err);
    }
}

// Efeito de Notificação 2: Flash Neon na Janela do Terminal do Chat
function piscarJanelaTerminal() {
    const painelChat = document.getElementById('chat') || document.querySelector('.terminal-window');
    if (painelChat) {
        painelChat.style.transition = "box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out";
        painelChat.style.boxShadow = "0 0 35px #3DDC84";
        painelChat.style.borderColor = "#3DDC84";
        
        setTimeout(() => {
            painelChat.style.boxShadow = "none";
            painelChat.style.borderColor = ""; 
        }, 350);
    }
}

function conectar() {
    atualizarStatusInterface("CONECTANDO...", "#ffaa00");
    var socket = new SockJS(RENDER_URL);
    stompClient = Stomp.over(socket);
    
    // Desativa os logs repetitivos do STOMP no console para deixar limpo
    stompClient.debug = null; 

    stompClient.connect({}, function (frame) {
        console.log('Conectado ao Protocolo PestControlX');
        atualizarStatusInterface("SISTEMA ONLINE", "#3DDC84");
        
        stompClient.subscribe('/topic/mensagens', function (msg) {
            var dados = JSON.parse(msg.body);
            var chat = document.getElementById('chat');
            
            if (!chat) return;

            // Define a cor: Verde Android para a empresa, Branco para o cliente
            let cor = dados.remetente === 'EMPRESA' ? '#3DDC84' : '#ffffff';
            
            // Renderiza a mensagem na janela do terminal
            chat.innerHTML += `<p><span style="color: ${cor}">[${dados.remetente}]</span>: ${dados.texto}</p>`;
            chat.scrollTop = chat.scrollHeight;

            // Dispara as notificações se a mensagem vier de fora (Cliente/Técnico)
            if (dados.remetente !== 'EMPRESA') {
                tocarSomNotificacao();
                piscarJanelaTerminal();
            }
        });
    }, function(error) {
        console.error('Queda de conexão detetada. Nova tentativa em 5s...', error);
        atualizarStatusInterface("SISTEMA OFFLINE", "#ff3333");
        setTimeout(conectar, 5000); // Loop de reconexão automática estável
    });
}

function enviar() {
    var input = document.getElementById('msg');
    if (!input) return;

    var textoDigitado = input.value.trim();
    
    // CORREÇÃO CRÍTICA: Só envia se houver texto E o cliente STOMP estiver conectado com sucesso!
    if (textoDigitado !== "") {
        if (stompClient && stompClient.connected) {
            var payload = JSON.stringify({
                'remetente': 'EMPRESA',
                'texto': textoDigitado 
            });
            stompClient.send("/app/enviar", {}, payload);
            input.value = '';
            input.focus();
        } else {
            console.warn("Tentativa de envio bloqueada: WebSocket desconectado.");
            atualizarStatusInterface("RECONECTANDO...", "#ffaa00");
        }
    }
}