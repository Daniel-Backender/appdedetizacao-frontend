var stompClient = null;
const RENDER_URL = 'https://appdedetizacao.onrender.com/ws-pestcontrol'; 
const tokenAuth = localStorage.getItem("tokenJWT") || localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
    const campoTexto = document.getElementById('msg');
    if (campoTexto) {
        campoTexto.addEventListener("keypress", (e) => {
            if (e.key === "Enter") enviar();
        });
    }
    
    if(!tokenAuth) {
        atualizarStatusInterface("ERRO: TOKEN AUSENTE", "#DC3545");
        console.error("Impossível conectar WebSocket sem Token JWT.");
        return;
    }

    conectar();
});

function atualizarStatusInterface(texto, corHex) {
    let el = document.getElementById('status-chat') || document.querySelector('.status-chat');
    if (!el) {
        const elementos = document.querySelectorAll('div, span, button, p');
        for (let item of elementos) {
            if (item.innerText && item.innerText.includes("SISTEMA") || item.innerText.includes("Conectando")) {
                el = item; break;
            }
        }
    }
    if (el) {
        el.innerText = texto;
        el.style.color = corHex;
    }
}

function tocarSomNotificacao() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } catch (err) {}
}

function conectar() {
    atualizarStatusInterface("AUTENTICANDO...", "#ffaa00");
    var socket = new SockJS(RENDER_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = null; 

    // A MÁGICA ACONTECE AQUI: Passando o JWT para o Spring Boot aceitar a conexão STOMP
    const headers = {
        'Authorization': 'Bearer ' + tokenAuth
    };

    stompClient.connect(headers, function (frame) {
        console.log('Conectado de forma segura ao Servidor STOMP');
        atualizarStatusInterface("BARRAMENTO ONLINE", "#3DDC84");
        
        stompClient.subscribe('/topic/mensagens', function (msg) {
            var dados = JSON.parse(msg.body);
            var chat = document.getElementById('chat');
            if (!chat) return;

            let cor = dados.remetente === 'EMPRESA' ? '#3DDC84' : '#ffffff';
            chat.innerHTML += `<p style="margin: 4px 0;"><span style="color: ${cor}">[${dados.remetente}]</span>: ${dados.texto}</p>`;
            chat.scrollTop = chat.scrollHeight;

            if (dados.remetente !== 'EMPRESA') tocarSomNotificacao();
        });
    }, function(error) {
        console.error('Falha de Segurança/Rede STOMP.', error);
        atualizarStatusInterface("CONEXÃO RECUSADA", "#ff3333");
        setTimeout(conectar, 10000); 
    });
}

function enviar() {
    var input = document.getElementById('msg');
    if (!input) return;

    var textoDigitado = input.value.trim();
    
    if (textoDigitado !== "" && stompClient && stompClient.connected) {
        var payload = JSON.stringify({
            'remetente': 'EMPRESA',
            'texto': textoDigitado 
        });
        stompClient.send("/app/enviar", {}, payload);
        input.value = '';
        input.focus();
    } else {
        alert("Aguarde a conexão com o servidor ser estabelecida.");
    }
}