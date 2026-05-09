var stompClient = null;
const RENDER_URL = 'https://appdedetizacao.onrender.com/ws-pestcontrol';

function conectar() {
    var socket = new SockJS(RENDER_URL);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log('Conectado ao Protocolo PestControlX');
        
        stompClient.subscribe('/topic/mensagens', function (msg) {
            var dados = JSON.parse(msg.body);
            var chat = document.getElementById('chat');
            
            // Define a cor: Verde para empresa, Branco para cliente
            let cor = dados.remetente === 'EMPRESA' ? '#3DDC84' : '#ffffff';
            
            chat.innerHTML += `<p><span style="color: ${cor}">[${dados.remetente}]</span>: ${dados.texto}</p>`;
            chat.scrollTop = chat.scrollHeight;
        });
    }, function(error) {
        setTimeout(conectar, 5000); // Tenta reconectar se cair
    });
}

function enviar() {
    var input = document.getElementById('msg');
    var textoDigitado = input.value.trim();
    
    if (textoDigitado !== "" && stompClient) {
        var payload = JSON.stringify({
            'remetente': 'EMPRESA',
            'texto': textoDigitado // AGORA BATE COM O JAVA
        });
        stompClient.send("/app/enviar", {}, payload);
        input.value = '';
    }
}

// ... manter o resto do seu código de escuta de teclado ...