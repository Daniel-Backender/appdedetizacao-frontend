/**
 * PESTCONTROLX - APP.JS
 * Lógica funcional do Dashboard Corporativo
 */

const API_BASE_URL = "https://appdedetizacao.onrender.com";
let stompClient = null;
let clientesCache = []; // Cache local para evitar requests desnecessários ao filtrar

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    showSection('clientes', document.getElementById('btn-section-clientes'));
    carregarDadosUsuario();
});

function verificarAutenticacao() {
    const token = localStorage.getItem('token_jwt'); // Ajuste a chave conforme seu login salvou
    if (!token) {
        alert("Sessão inválida! Redirecionando para login.");
        // window.location.href = 'login.html'; // Descomente em produção
    }
}

function carregarDadosUsuario() {
    // Simula a carga do JWT ou localStorage
    const nome = localStorage.getItem('user_nome') || "Administrador Sistema";
    document.getElementById('userName').innerText = nome;
    document.getElementById('generated-token-field').value = "Bearer " + (localStorage.getItem('token_jwt') || "Token_Ausente...");
}

// ==========================================
// NAVEGAÇÃO DE ABAS
// ==========================================
function showSection(sectionId, btnElement) {
    // Esconde todas as seções
    document.querySelectorAll('.section-view').forEach(sec => sec.classList.remove('active'));
    // Remove classe ativa de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Mostra a seção desejada e ativa o botão
    document.getElementById(sectionId).classList.add('active');
    btnElement.classList.add('active');

    // Gatilhos de carregamento preguiçoso (Lazy Load)
    if (sectionId === 'clientes' && clientesCache.length === 0) fetchClientes();
    if (sectionId === 'chat' && stompClient === null) iniciarConexaoChat();
}

// ==========================================
// MÓDULO: CLIENTES (REST API)
// ==========================================
async function fetchClientes() {
    const tbody = document.getElementById('tabelaClientes');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Buscando dados no servidor...</td></tr>`;

    try {
        const token = localStorage.getItem('token_jwt');
        // REQUISITO BACKEND: Certifique-se de que o ClienteController.java tem a rota GET /api/clientes
        const response = await fetch(`${API_BASE_URL}/api/clientes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            clientesCache = await response.json();
            renderizarTabelaClientes(clientesCache);
        } else {
            // Fallback de demonstração caso a API não esteja pronta
            console.warn("API de clientes retornou erro. Carregando dados de fallback.");
            mockClientesFallback();
        }
    } catch (error) {
        console.error("Erro de rede:", error);
        mockClientesFallback();
    }
}

function renderizarTabelaClientes(lista) {
    const tbody = document.getElementById('tabelaClientes');
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhum cliente encontrado.</td></tr>`;
        return;
    }

    lista.forEach(cliente => {
        const statusClass = cliente.ativo !== false ? 'badge-ativo' : 'badge-inativo';
        const statusTexto = cliente.ativo !== false ? 'Ativo' : 'Inativo';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cliente.nome}</strong><br><small style="color: var(--text-secondary)">${cliente.email || 'Sem e-mail'}</small></td>
            <td>${cliente.cnpj || cliente.cpf || 'Não informado'}</td>
            <td><span class="badge ${statusClass}">${statusTexto}</span><br><small>${cliente.telefone || ''}</small></td>
            <td>
                <button class="btn-salvar" style="padding: 6px 12px; font-size: 0.85rem;" onclick="abrirFichaCliente(${cliente.id})">
                    <i class="fa-solid fa-eye"></i> Analisar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarClientes() {
    const termo = document.getElementById('inputBusca').value.toLowerCase();
    
    // Pega qual aba está ativa (Todos, Ativos, Inativos)
    const filtroAtivoBtn = document.querySelector('.filtros-abas button.active').id;
    
    let filtrados = clientesCache.filter(cli => {
        const matchBusca = cli.nome.toLowerCase().includes(termo) || 
                           (cli.cnpj && cli.cnpj.includes(termo)) || 
                           (cli.email && cli.email.toLowerCase().includes(termo));
                           
        if (!matchBusca) return false;

        if (filtroAtivoBtn === 'btnFiltroAtivos') return cli.ativo !== false;
        if (filtroAtivoBtn === 'btnFiltroInativos') return cli.ativo === false;
        return true; // Todos
    });

    renderizarTabelaClientes(filtrados);
}

function mudarFiltro(tipo) {
    document.querySelectorAll('.filtros-abas button').forEach(b => b.classList.remove('active'));
    
    if (tipo === 'todos') document.getElementById('btnFiltroTodos').classList.add('active');
    if (tipo === 'ativos') document.getElementById('btnFiltroAtivos').classList.add('active');
    if (tipo === 'inativos') document.getElementById('btnFiltroInativos').classList.add('active');
    
    filtrarClientes();
}

// Lógica de Visão de Detalhes
function abrirFichaCliente(id) {
    const cliente = clientesCache.find(c => c.id === id);
    if (!cliente) return;

    document.getElementById('view-lista-clientes').style.display = 'none';
    document.getElementById('view-detalhes-cliente').style.display = 'block';
    
    document.getElementById('detalheGeral').innerHTML = `
        <h2>${cliente.nome}</h2>
        <p>ID Sistema: #${cliente.id} | Documento: ${cliente.cnpj || cliente.cpf}</p>
        <p><i class="fa-solid fa-envelope"></i> ${cliente.email || 'N/A'}</p>
        <p><i class="fa-solid fa-phone"></i> ${cliente.telefone || 'N/A'}</p>
    `;

    document.getElementById('detalheEndereco').innerHTML = `
        <p><strong>CEP:</strong> ${cliente.cep || 'N/A'}</p>
        <p><strong>Rua:</strong> ${cliente.rua || 'N/A'}, Nº ${cliente.numero || 'N/A'}</p>
        <p><strong>Bairro:</strong> ${cliente.bairro || 'N/A'}</p>
    `;
}

function fecharFichaCliente() {
    document.getElementById('view-lista-clientes').style.display = 'block';
    document.getElementById('view-detalhes-cliente').style.display = 'none';
}

// ==========================================
// MÓDULO: CHAT TEMPO REAL (STOMP / WEBSOCKET)
// ==========================================
function iniciarConexaoChat() {
    const chatBox = document.getElementById('chat-box-display');
    const statusHeader = document.getElementById('status-chat');
    
    // O SockJS se encarrega de achar o melhor protocolo disponível (WebSocket, XHR Streaming, etc)
    const socket = new SockJS(`${API_BASE_URL}/ws-pestcontrol`);
    stompClient = Stomp.over(socket);
    
    // Desativar logs excessivos do STOMP no console do navegador
    stompClient.debug = null; 

    const token = localStorage.getItem('token_jwt');

    stompClient.connect({'Authorization': `Bearer ${token}`}, function(frame) {
        statusHeader.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--neon-green)"></i> Link STOMP Estabelecido`;
        registrarMensagemTerminal(`Conexão segura estabelecida com ${API_BASE_URL}. Aguardando tráfego...`, 'sys');
        
        // REQUISITO BACKEND: Certifique-se de que o MessageBroker do Spring está enviando para /topic/mensagens
        stompClient.subscribe('/topic/mensagens', function(messageOutput) {
            const mensagem = JSON.parse(messageOutput.body);
            // Verifica se a mensagem não foi enviada por mim mesmo
            if(mensagem.remetente !== localStorage.getItem('user_nome')) {
                registrarMensagemTerminal(`${mensagem.remetente}: ${mensagem.conteudo}`, 'in');
                tocarAlertaSonoro();
            }
        });
    }, function(error) {
        statusHeader.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger)"></i> Falha de Conexão STOMP`;
        registrarMensagemTerminal(`Erro catastrófico no barramento: ${error}`, 'sys');
    });
}

function enviarMensagemChat() {
    const input = document.getElementById('msg-input');
    const texto = input.value.trim();
    
    if (texto && stompClient && stompClient.connected) {
        const nomeUsuario = localStorage.getItem('user_nome') || "Central Admin";
        
        const payload = {
            remetente: nomeUsuario,
            conteudo: texto,
            tipo: 'CHAT'
        };

        // REQUISITO BACKEND: O @MessageMapping no ChatController deve ser /app/chat.enviar
        stompClient.send("/app/chat.enviar", {}, JSON.stringify(payload));
        
        registrarMensagemTerminal(texto, 'out');
        input.value = '';
    } else if (!stompClient || !stompClient.connected) {
        alert("Sistema offline. Aguarde a conexão com o servidor WebSocket.");
    }
}

function registrarMensagemTerminal(texto, tipo) {
    const chatBox = document.getElementById('chat-box-display');
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${tipo}`;
    
    if (tipo === 'sys') {
        wrapper.innerHTML = `<p class="status-log-terminal">-> ${texto}</p>`;
    } else {
        wrapper.innerHTML = `<div class="msg-bubble">${texto}</div>`;
    }
    
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll para baixo
}

function tocarAlertaSonoro() {
    if (document.getElementById('sound-alerts').checked) {
        // Usa um bip nativo simples em Base64 para não precisar de arquivos externos
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Frequência A5
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }
}

// ==========================================
// UTILITÁRIOS E CONFIGURAÇÕES
// ==========================================
function logout() {
    if(stompClient) stompClient.disconnect();
    localStorage.clear();
    window.location.reload();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main-content');
    const topbar = document.querySelector('.topbar');
    
    if (sidebar.style.transform === 'translateX(-100%)') {
        sidebar.style.transform = 'translateX(0)';
        main.style.marginLeft = 'var(--sidebar-width)';
        main.style.width = 'calc(100% - var(--sidebar-width))';
        topbar.style.left = 'var(--sidebar-width)';
    } else {
        sidebar.style.transform = 'translateX(-100%)';
        main.style.marginLeft = '0';
        main.style.width = '100%';
        topbar.style.left = '0';
    }
}

function gerarNovoToken() {
    alert("Para gerar um novo token JWT, você precisará re-autenticar por medidas de segurança da API.");
    logout();
}

// Mock apenas para não deixar a tela vazia caso a API do backend demore a responder
function mockClientesFallback() {
    clientesCache = [
        { id: 1, nome: "Indústria de Alimentos Alpha", cnpj: "12.345.678/0001-90", email: "contato@alpha.com", telefone: "(11) 9999-8888", ativo: true, cep: "01000-000", rua: "Av. Paulista", numero: "1000", bairro: "Bela Vista" },
        { id: 2, nome: "Condomínio Residencial Ômega", cnpj: "98.765.432/0001-10", email: "sindico@omega.com", telefone: "(11) 5555-4444", ativo: false, cep: "02000-000", rua: "Rua das Flores", numero: "50", bairro: "Jardins" },
        { id: 3, nome: "Carlos Eduardo Silva", cpf: "123.456.789-00", email: "carlos@gmail.com", telefone: "(11) 97777-6666", ativo: true, cep: "03000-000", rua: "Rua do Comércio", numero: "15", bairro: "Centro" }
    ];
    renderizarTabelaClientes(clientesCache);
}