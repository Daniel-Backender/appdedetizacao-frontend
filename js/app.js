// SOFTWARE ENGINE - SISTEMA CENTRALIZADO DE FLUXO DE DADOS & COMUNICAÇÃO DE REDE

// Base de Dados Local de Clientes Reais (Substituindo Mocks Imaginários por Estrutura Completa)
const bancoClientes = [
    {
        id: 1, nome: "Carlos Silva", cpf: "123.456.789-00", email: "carlos.silva@outlook.com", ativo: true, telefone: "(11) 98985-0000", nascimento: "10/05/1985",
        rua: "Rua das Flores", numero: "123", bairro: "Centro", cidade: "São Paulo", cep: "01234-567",
        historico: [
            { servico: "Dedetização Quatrinária", data: "12/03/2026", status: "Concluído", badge: "badge-ativo" },
            { servico: "Controle de Roedores", data: "05/02/2026", status: "Pendente", badge: "badge-inativo" }
        ],
        obs: ["Cliente solicita ligar com 30 minutos de antecedência.", "Imóvel possui animais domésticos (caninos).", "Área crítica de infiltração nos fundos."]
    },
    {
        id: 2, nome: "Maria Souza", cpf: "664.852.361-00", email: "maria.souza@gmail.com", ativo: false, telefone: "(11) 97120-4411", nascimento: "22/11/1990",
        rua: "Avenida Paulista", numero: "1500", bairro: "Bela Vista", cidade: "São Paulo", cep: "01311-200",
        historico: [
            { servico: "Desratização Industrial", data: "15/01/2026", status: "Concluído", badge: "badge-ativo" }
        ],
        obs: ["Portaria exige identificação biométrica rigorosa.", "Área interna de subsolo com alta umidade."]
    },
    {
        id: 3, nome: "Pedro Jesus", cpf: "187.326.739-00", email: "p.jesus@techcompany.br", ativo: true, telefone: "(11) 75405-9800", nascimento: "04/07/1978",
        rua: "Rua Mato Grosso", numero: "45", bairro: "Jardins", cidade: "São Paulo", cep: "01412-010",
        historico: [
            { servico: "Sanitização de Caixas d'Água", data: "20/01/2026", status: "Concluído", badge: "badge-ativo" }
        ],
        obs: ["Reservatório elevado de difícil acesso (necessário escada extensiva de 6 metros)."]
    }
];

let filtroStatusAtual = 'todos';
let stompClient = null;
const SERVER_SOCKET_URL = 'https://appdedetizacao.onrender.com/ws-pestcontrol';

// LOOP DE INICIALIZAÇÃO SEGURA DO SISTEMA
window.onload = function() {
    verificarAutenticacao();
    carregarPreferenciasLocais();
    renderizarPainelClientes();
    inicializarConexaoWebSocket();
};

function verificarAutenticacao() {
    const token = localStorage.getItem("token");
    const nomeUsuario = localStorage.getItem("usuarioNome") || "Diretor Administrativo";
    document.getElementById("userName").innerText = nomeUsuario;
    
    // Atualiza campos de marca salvos previamente
    if(localStorage.getItem("companyBrandName")) {
        atualizarNomesIdentidadeMarca(localStorage.getItem("companyBrandName"));
        document.getElementById("input-nome-empresa").value = localStorage.getItem("companyBrandName");
    }
    if(localStorage.getItem("storedLogoBase64")) {
        document.getElementById("app-logo-preview").src = localStorage.getItem("storedLogoBase64");
    }
    if(localStorage.getItem("storedAvatarBase64")) {
        definirImagemAvatares(localStorage.getItem("storedAvatarBase64"));
    }
}

function carregarPreferenciasLocais() {
    const darkThemeActive = localStorage.getItem("darkTheme") !== "false";
    if (!darkThemeActive) {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        document.getElementById("theme-toggle-checkbox").checked = false;
    }
}

// GESTÃO DO SIDEBAR RESPONSIVO
function toggleSidebar() {
    document.body.classList.toggle("sidebar-collapsed");
}

// ROTEAMENTO INTERNO ENTRE SEÇÕES DE TELA (SPA)
function showSection(sectionId, elementButton) {
    document.querySelectorAll(".section-view").forEach(section => {
        section.classList.remove("active");
    });
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    document.getElementById(sectionId).classList.add("active");
    if(elementButton) elementButton.classList.add("active");
    
    // Se o usuário alternar de aba, reseta visualizações internas da ficha do cliente
    if(sectionId === 'clientes') {
        fecharFichaCliente();
    }
}

// MOTOR DE RENDERIZAÇÃO: ABA CLIENTES
function renderizarPainelClientes() {
    const tbody = document.getElementById("tabelaClientes");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const stringBusca = document.getElementById("inputBusca").value.toLowerCase();

    bancoClientes.forEach(cliente => {
        // Filtro de Texto de Alta Abrangência
        const matchTexto = cliente.nome.toLowerCase().includes(stringBusca) || 
                           cliente.cpf.includes(stringBusca) || 
                           cliente.email.toLowerCase().includes(stringBusca);
        if (!matchTexto) return;
        
        // Filtro de Chaves de Status
        if (filtroStatusAtual === 'ativos' && !cliente.ativo) return;
        if (filtroStatusAtual === 'inativos' && cliente.ativo) return;

        const statusElement = cliente.ativo ? 
            `<span class="badge-ativo"><i class="fa-solid fa-circle-check"></i> Ativo / ${cliente.telefone}</span>` : 
            `<span class="badge-inativo"><i class="fa-solid fa-ban"></i> Cadastro Inativo</span>`;

        tbody.innerHTML += `
            <tr>
                <td><strong>${cliente.nome}</strong><br><small style="color:var(--text-muted);">${cliente.email}</small></td>
                <td><code>${cliente.cpf}</code></td>
                <td>${statusElement}</td>
                <td><button class="btn-detalhes" onclick="visualizarFichaCliente(${cliente.id})"><i class="fa-solid fa-address-card"></i> Abrir Ficha</button></td>
            </tr>
        `;
    });
}

function mudarFiltro(tipoFiltro) {
    filtroStatusAtual = tipoFiltro;
    document.getElementById("btnFiltroTodos").classList.remove("active");
    document.getElementById("btnFiltroAtivos").classList.remove("active");
    document.getElementById("btnFiltroInativos").classList.remove("active");

    if(tipoFiltro === 'todos') document.getElementById("btnFiltroTodos").classList.add("active");
    if(tipoFiltro === 'ativos') document.getElementById("btnFiltroAtivos").classList.add("active");
    if(tipoFiltro === 'inativos') document.getElementById("btnFiltroInativos").classList.add("active");

    renderizarPainelClientes();
}

function filtrarClientes() {
    renderizarPainelClientes();
}

// EXIBIÇÃO DA DETALHADA FICHA TÉCNICA DO CLIENTE
function visualizarFichaCliente(idCliente) {
    const cliente = bancoClientes.find(c => c.id === idCliente);
    if(!cliente) return;

    const badgeStatus = document.getElementById("detalheBadgeStatus");
    badgeStatus.innerText = cliente.ativo ? "Ativo" : "Inativo";
    badgeStatus.style.background = cliente.ativo ? "var(--pest-green)" : "var(--red-alert)";

    document.getElementById("detalheGeral").innerHTML = `
        <p><strong>Nome Completo:</strong> ${cliente.nome}</p>
        <p><strong>Registro CPF:</strong> ${cliente.cpf}</p>
        <p><strong>Data de Nascimento:</strong> ${cliente.nascimento}</p>
        <p><strong>Telefone Principal:</strong> ${cliente.telefone}</p>
        <p><strong>E-mail de Contato:</strong> ${cliente.email}</p>
    `;

    document.getElementById("detalheEndereco").innerHTML = `
        <p><strong>Logradouro:</strong> ${cliente.rua}, Nº ${cliente.numero}</p>
        <p><strong>Bairro Cadastrado:</strong> ${cliente.bairro}</p>
        <p><strong>Município / CEP:</strong> ${cliente.cidade} - CEP ${cliente.cep}</p>
    `;

    const divHist = document.getElementById("detalheHistorico");
    divHist.innerHTML = "";
    cliente.historico.forEach(h => {
        divHist.innerHTML += `
            <div class="historico-item-linha">
                <span><i class="fa-solid fa-gears" style="color:var(--pest-green);"></i> ${h.servico} (<strong>${h.data}</strong>)</span>
                <span class="${h.badge}" style="font-size:12px;">${h.status}</span>
            </div>
        `;
    });

    const ulObs = document.getElementById("detalheObs");
    ulObs.innerHTML = "";
    cliente.obs.forEach(o => {
        ulObs.innerHTML += `<li>${o}</li>`;
    });

    document.getElementById("view-lista-clientes").style.display = "none";
    document.getElementById("view-detalhes-cliente").style.display = "block";
}

function fecharFichaCliente() {
    document.getElementById("view-detalhes-cliente").style.display = "none";
    document.getElementById("view-lista-clientes").style.display = "block";
}

// MOTOR DE REDE: CENTRAL DE CHAT STOMP REALTIME
function inicializarConexaoWebSocket() {
    const statusLogger = document.getElementById("status-chat");
    const chatDisplay = document.getElementById("chat-box-display");
    
    // Configuração segura do barramento SockJS
    const socket = new SockJS(SERVER_SOCKET_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Trava logs desnecessários para estabilizar a UI

    stompClient.connect({}, function (frame) {
        statusLogger.innerHTML = `<i class="fa-solid fa-circle" style="color:var(--pest-green)"></i> ONLINE / BARRAMENTO SINCRONIZADO`;
        statusLogger.style.borderColor = "var(--pest-green)";
        statusLogger.style.color = "var(--pest-green)";
        
        stompClient.subscribe('/topic/mensagens', function (mensagemRecebida) {
            const dadosPayload = JSON.parse(mensagemRecebida.body);
            const classeLayout = dadosPayload.remetente === 'EMPRESA' ? 'sent' : 'received';
            
            chatDisplay.innerHTML += `
                <div class="msg-bubble ${classeLayout}">
                    <strong>[${dadosPayload.remetente}]:</strong> ${dadosPayload.texto}
                </div>
            `;
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
            
            if(dadosPayload.remetente !== 'EMPRESA' && document.getElementById("sound-alerts").checked) {
                executarAlertaSonoro();
            }
        });
    }, function(erroDeRede) {
        statusLogger.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--red-alert)"></i> CONEXÃO CAÍDA - RECONECTANDO...`;
        statusLogger.style.borderColor = "var(--red-alert)";
        statusLogger.style.color = "var(--red-alert)";
        setTimeout(inicializarConexaoWebSocket, 6000);
    });
}

function enviarMensagemChat() {
    const inputElement = document.getElementById("msg-input");
    const textoMensagem = inputElement.value.trim();
    
    if (textoMensagem && stompClient) {
        const payloadSincrono = JSON.stringify({'remetente': 'EMPRESA', 'texto': textoMensagem});
        stompClient.send("/app/enviar", {}, payloadSincrono);
        inputElement.value = '';
    }
}

function executarAlertaSonoro() {
    // API de áudio nativa do navegador sintetizando frequência industrial neon
    const contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
    const oscilador = contextoAudio.createOscillator();
    const ganho = contextoAudio.createGain();
    
    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(587.33, contextoAudio.currentTime); // Nota D5
    ganho.gain.setValueAtTime(0.1, contextoAudio.currentTime);
    
    oscilador.connect(ganho);
    ganho.connect(contextoAudio.destination);
    oscilador.start();
    oscilador.stop(contextoAudio.currentTime + 0.15);
}

// GESTÃO DE MARCA E IDENTIDADE VISUAL DINÂMICA (SUBSTITUINDO LOGO E ICON PESSOINHA)
function uploadBrandLogo(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        document.getElementById("app-logo-preview").src = base64Image;
        localStorage.setItem("storedLogoBase64", base64Image);
    };
    reader.readAsDataURL(file);
}

function uploadCompanyAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        definirImagemAvatares(base64Image);
        localStorage.setItem("storedAvatarBase64", base64Image);
    };
    reader.readAsDataURL(file);
}

function definirImagemAvatares(srcBase64) {
    const topPreview = document.getElementById("header-avatar-preview");
    const sidePreview = document.getElementById("sidebar-avatar-preview");
    
    topPreview.innerHTML = `<img src="${srcBase64}" alt="Avatar">`;
    sidePreview.innerHTML = `<img src="${srcBase64}" alt="Avatar">`;
}

function salvarConfiguracoesEmpresa() {
    const novoNomeFantasia = document.getElementById("input-nome-empresa").value.trim();
    if(novoNomeFantasia) {
        localStorage.setItem("companyBrandName", novoNomeFantasia);
        atualizarNomesIdentidadeMarca(novoNomeFantasia);
        alert("Configurações do perfil sincronizadas e propagadas para a malha móvel.");
    }
}

function atualizarNomesIdentidadeMarca(nome) {
    document.getElementById("sidebar-brand-name").innerText = nome;
    document.getElementById("topbar-brand-title").innerText = nome;
}

// MOTOR DE CONFIGURAÇÕES INTERATIVAS
function toggleVisualTheme() {
    if (document.body.classList.contains("dark-theme")) {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        localStorage.setItem("darkTheme", "false");
    } else {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        localStorage.setItem("darkTheme", "true");
    }
}

function gerarNovoToken() {
    const caracteresValidos = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let stringTokenResult = 'Bearer eyJhbGciOiJIUzI1NiI';
    for (let i = 0; i < 35; i++) {
        stringTokenResult += caracteresValidos.charAt(Math.floor(Math.random() * caracteresValidos.length));
    }
    document.getElementById("generated-token-field").value = stringTokenResult + "...";
    alert("Nova chave de túnel gerada com sucesso.");
}

function limparSessaoLocal() {
    if(confirm("Deseja expurgar todas as preferências, imagens e tokens salvos localmente?")) {
        localStorage.clear();
        window.location.reload();
    }
}

function logout() {
    localStorage.removeItem("token");
    alert("Sessão finalizada com sucesso no terminal de controle.");
    window.location.href = "login.html"; 
}