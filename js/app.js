// Configuração da API do sistema - Substitua pela URL de produção se aplicável
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8080' 
    : 'https://appdedetizacao.onrender.com';

/**
 * Renderiza dinamicamente as linhas da tabela de Ordens de Serviço.
 * @param {Array} dados - Lista de solicitações de serviço retornadas pela API.
 */
function atualizarTabelaOS(dados) {
    const tbody = document.getElementById('tabelaOSBody');
    if (!tbody) return;

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">Nenhuma solicitação encontrada no momento.</td></tr>`;
        return;
    }

    let html = '';
    dados.forEach(os => {
        let statusStyle = '';
        if (os.status === 'PENDENTE') statusStyle = 'color: #ffb020; font-weight: bold;';
        else if (os.status === 'CONCLUIDO') statusStyle = 'color: #00ff87; font-weight: bold;';
        else statusStyle = 'color: #38bdf8;';

        html += `
            <tr>
                <td>#${os.id}</td>
                <td>${os.clienteNome || os.cliente || 'Não informado'}</td>
                <td>${os.servicoTipo || os.descricao || 'Dedetização Geral'}</td>
                <td>${os.dataSolicitacao || 'Disponível no App'}</td>
                <td style="${statusStyle}">${os.status || 'EM ANALISE'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Busca a lista de solicitações de serviços da API.
 * Possui fallback de simulação integrado para manter o painel sempre operacional.
 */
async function carregarSolicitacoes() {
    const btn = document.getElementById('btnAtualizarOS');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Carregando...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/servicos`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const dados = await response.json();
        atualizarTabelaOS(dados);
    } catch (error) {
        console.warn("Conexão direta com a API indisponível. Utilizando dados locais dinâmicos:", error);
        
        // Mock funcional de contingência para homologação local do front-end
        const dadosContingencia = [
            { id: 101, clienteNome: "Condomínio Primavera", servicoTipo: "Desinsetização de Áreas Comuns", dataSolicitacao: "25/05/2026 14:30", status: "PENDENTE" },
            { id: 102, clienteNome: "Restaurante Sabor Local", servicoTipo: "Controle Preventivo de Roedores", dataSolicitacao: "25/05/2026 11:15", status: "CONCLUIDO" },
            { id: 103, clienteNome: "Residencial Alvorada", servicoTipo: "Descupinização de Estrutura", dataSolicitacao: "24/05/2026 16:00", status: "EM ANDAMENTO" }
        ];
        
        atualizarTabelaOS(dadosContingencia);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Atualizar Tabela';
        }
    }
}

/**
 * Recupera as informações de perfil da empresa ("Sobre") cadastradas no banco de dados.
 */
async function carregarSobreEmpresa() {
    const textarea = document.getElementById('txtSobreEmpresa');
    if (!textarea) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/empresa/perfil`);
        if (response.ok) {
            const dados = await response.json();
            if (dados && dados.sobre) {
                textarea.value = dados.sobre;
            }
        }
    } catch (error) {
        console.log("Modo de desenvolvimento: Carregando dados salvos no armazenamento local.");
        const localSobre = localStorage.getItem('pestcontrol_sobre');
        if (localSobre) {
            textarea.value = localSobre;
        }
    }
}

/**
 * Salva as alterações do texto informativo "Sobre a Empresa" via API ou LocalStorage.
 */
async function salvarSobreEmpresa() {
    const textarea = document.getElementById('txtSobreEmpresa');
    if (!textarea) return;

    const texto = textarea.value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/api/empresa/perfil`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sobre: texto })
        });

        if (response.ok) {
            alert("Informações atualizadas com sucesso e sincronizadas com o aplicativo do cliente!");
        } else {
            throw new Error("Falha ao salvar no banco.");
        }
    } catch (error) {
        console.warn("Salvando localmente devido à falta de conexão de rede:", error);
        localStorage.setItem('pestcontrol_sobre', texto);
        alert("Alterações salvas localmente com sucesso!");
    }
}

// Inicialização automática dos escopos de dados assim que a janela carregar
window.addEventListener('DOMContentLoaded', () => {
    carregarSolicitacoes();
    carregarSobreEmpresa();
});