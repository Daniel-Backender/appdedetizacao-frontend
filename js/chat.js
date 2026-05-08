
var stompClient = null;
const RENDER_URL = 'https://appdedetizacao.onrender.com/ws-pestcontrol';

function conectar() {
    console.log("Iniciando sequência de conexão...");
    var socket = new SockJS(RENDER_URL);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        document.getElementById('chat').innerHTML += "<p style='color: #888'>> PROTOCOLO DE CONEXÃO ESTABELECIDO.</p>";
        
        stompClient.subscribe('/topic/mensagens', function (msg) {
            var dados = JSON.parse(msg.body);
            var chat = document.getElementById('chat');
            
    
            let cor = dados.remetente === 'EMPRESA' ? '#3DDC84' : '#ffffff';
            
            chat.innerHTML += `<p><span style="color: ${cor}">[${dados.remetente}]</span>: ${dados.conteudo}</p>`;
            chat.scrollTop = chat.scrollHeight;
        });
    }, function(error) {
        console.error("Falha na conexão: ", error);
        setTimeout(conectar, 10000);
    });
}

function enviar() {
    var input = document.getElementById('msg');
    var texto = input.value.trim();
    
    if (texto !== "" && stompClient) {
        var payload = JSON.stringify({
            'remetente': 'EMPRESA',
            'conteudo': texto
        });
        stompClient.send("/app/enviar", {}, payload);
        input.value = '';
    }
}

// Escutar a tecla ENTER para enviar
document.getElementById('msg').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        enviar();
    }
});

// Executa a conexão
conectar();