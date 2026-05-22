// =========================================================
// 1. CONFIGURAÇÕES E CONSTANTES GLOBAIS
// =========================================================
const API_URL = "https://appdedetizacao.onrender.com";
const token = localStorage.getItem("token");
const empresaId = localStorage.getItem("empresaId");

// =========================================================
// 2. VERIFICAÇÃO DE SEGURANÇA IMEDIATA
// =========================================================
if (!token) {
    window.location.href = "login.html";
}

// =========================================================
// 3. INICIALIZAÇÃO DA PÁGINA
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    // Carrega dados do usuário no painel
    const email = localStorage.getItem("userEmail") || "empresa@pestcontrolx.com";
    const elNome = document.getElementById("userName");
    if (elNome) elNome.innerText = email;

    // Preenche os campos do perfil com dados do cache local (para a tela carregar rápido)
    const inputSobre = document.getElementById("inputSobre");
    const inputMsgBot = document.getElementById("inputMensagemBot");
    if (inputSobre) inputSobre.value = localStorage.getItem("empresaSobre") || "";
    if (inputMsgBot) inputMsgBot.value = localStorage.getItem("empresaBotMsg") || "";

    // Valida o token silenciosamente no backend do Render
    fetch(`${API_URL}/auth/validar`, {
        headers: { "Authorization": "Bearer " + token }
    })
    .then(res => {
        if (!res.ok) logout();
    })
    .catch(err => console.error("Erro de conexão com API:", err));

    // Inicia a conexão com o servidor de Chat (WebSockets)
    conectarChat();
});

// =========================================================
// 4. LÓGICA DE NAVEGAÇÃO E UI (MENU RECLINÁVEL E ABAS)
// =========================================================
function toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
}

function mostrarSecao(idSecao, btn) {
    // Esconde todas as seções (cobre tanto classes .section-view quanto .content-section)
    document.querySelectorAll('.section-view, .content-section').forEach(secao => {
        secao.classList.remove('active');
        secao.style.display = 'none';
    });
    
    // Remove classe 'active' de todos os botões do menu
    document.querySelectorAll('.nav-btn, .nav-link').forEach(b => {
        b.classList.remove('active');
    });
    
    // Mostra a seção alvo
    const secaoAtiva = document.getElementById(idSecao);
    if (secaoAtiva) {
        secaoAtiva.classList.add('active');
        secaoAtiva.style.display = 'block';
    }
    
    // Deixa o botão clicado "aceso"
    if (btn) btn.classList.add('active');
}

// =========================================================
// 5. SALVAR DADOS DO PERFIL (SOBRE E BOT MENSAGEM)
// =========================================================
async function salvarDadosPerfil(e) {
    e.preventDefault();
    
    const sobre = document.getElementById("inputSobre").value;
    const botMsg = document.getElementById("inputMensagemBot").value;

    // Atualiza o cache local para a interface não piscar na próxima vez
    localStorage.setItem("empresaSobre", sobre);
    localStorage.setItem("empresaBotMsg", botMsg);

    if (!empresaId || !token) {
        alert("Erro de autenticação: ID da empresa ou Token ausente. Faça login novamente.");
        return logout();
    }

    try {
        // Dispara o PUT para o Spring Boot no Render
        const response = await fetch(`${API_URL}/api/empresas/${empresaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sobre: sobre,
                mensagemAutomatica: botMsg
            })
        });

        if (response.ok) {
            alert("Perfil salvo com sucesso no banco de dados! 🚀 Os dados já aparecerão no App.");
        } else {
            const erro = await response.text();
            alert("Erro ao salvar no servidor: " + erro);
            console.error("HTTP Status:", response.status);
        }
    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Falha ao se comunicar com o servidor Render.");
    }
}

// =========================================================
// 6. LÓGICA DO CHAT (STOMP WEBSOCKETS)
// =========================================================
let stompClient = null;

function conectarChat() {
    // Conecta ao endpoint configurado no seu WebSocketConfig.java
    const socket = new SockJS(`${API_URL}/ws-pestcontrol`);
    stompClient = Stomp.over(socket);
    
    // Desativa os logs gigantes do Stomp no console (opcional, mas deixa limpo)
    stompClient.debug = null; 

    stompClient.connect({}, function (frame) {
        printMensagem("SISTEMA DE ATENDIMENTO CONECTADO", "received");
        
        // Fica ouvindo as mensagens que chegam no tópico
        stompClient.subscribe('/topic/mensagens', function (msg) {
            const dados = JSON.parse(msg.body);
            
            // Impede que a tela duplique a mensagem que a própria empresa acabou de mandar
            if(dados.remetente !== 'EMPRESA') {
                printMensagem(dados.remetente + ": " + dados.texto, "received");
                atualizarTabelaClientes(dados.remetente);
            }
        });
    }, function(err) {
        console.error("Queda no WebSocket. Tentando reconectar em 5 segundos...", err);
        setTimeout(conectarChat, 5000);
    });
}

function enviarMsgStomp() {
    const input = document.getElementById('msg-input');
    const texto = input.value.trim();
    
    if(texto && stompClient) {
        // Monta o objeto DTO que o seu ChatController.java está esperando
        const payload = JSON.stringify({
            'remetente': 'EMPRESA', 
            'texto': texto
        });
        
        // Dispara para o @MessageMapping("/enviar")
        stompClient.send("/app/enviar", {}, payload);
        
        // Imprime na tela imediatamente
        printMensagem("VOCÊ: " + texto, "sent");
        input.value = '';
    } else if (!stompClient) {
        alert("O chat está desconectado. Aguarde a reconexão automática.");
    }
}

function printMensagem(txt, tipo) {
    const box = document.getElementById('chat-box');
    if (box) {
        box.innerHTML += `<div class="msg ${tipo}">${txt}</div>`;
        // Desce a barra de rolagem automaticamente para a última mensagem
        box.scrollTop = box.scrollHeight; 
    }
}

function atualizarTabelaClientes(clienteNome) {
    const corpo = document.getElementById("lista-clientes-corpo");
    if (corpo) {
        // Atualiza a tabela com um aviso visual (pode ser estilizado com neon/glow no CSS)
        corpo.innerHTML = `<tr>
            <td>#1024</td>
            <td>${clienteNome}</td>
            <td><span class="status-badge" style="color: #0f0; text-shadow: 0 0 5px #0f0;">Nova Mensagem</span></td>
        </tr>`;
    }
}

// =========================================================
// 7. ENCERRAMENTO DE SESSÃO
// =========================================================
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}