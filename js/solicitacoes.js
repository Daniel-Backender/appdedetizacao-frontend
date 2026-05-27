const API_URL = "https://appdedetizacao.onrender.com/api"; // Ajuste para sua rota

async function carregarOrdens() {
    try {
        const response = await fetch(`${API_URL}/solicitacoes`); // ou /ordens dependendo do seu Java
        if (!response.ok) return;
        const ordens = await response.json();
        
        document.getElementById('col-pendentes').innerHTML = '';
        document.getElementById('col-campo').innerHTML = '';
        document.getElementById('col-concluidas').innerHTML = '';

        ordens.forEach(os => {
            let btnAcao = '';
            if (os.status === 'PENDENTE') {
                btnAcao = `<button class="os-action-btn" onclick="atualizarStatus(${os.id}, 'EM_ANDAMENTO')">ACEITAR CHAMADO</button>`;
            } else if (os.status === 'EM_ANDAMENTO') {
                btnAcao = `<button class="os-action-btn" onclick="atualizarStatus(${os.id}, 'CONCLUIDA')">FINALIZAR</button>`;
            } else {
                btnAcao = `<span style="color:var(--text-muted); font-size:11px; font-weight:bold;">ARQUIVADA</span>`;
            }

            const card = `
                <div class="os-card">
                    <h4 style="color: var(--text-main); margin-bottom: 5px;">#${os.id} - ${os.descricao}</h4>
                    <p style="color: var(--text-muted); font-size: 12px;">Cliente: ${os.clienteNome || 'App'}</p>
                    ${btnAcao}
                </div>
            `;
            
            if (os.status === 'PENDENTE') document.getElementById('col-pendentes').innerHTML += card;
            else if (os.status === 'EM_ANDAMENTO') document.getElementById('col-campo').innerHTML += card;
            else document.getElementById('col-concluidas').innerHTML += card;
        });
    } catch (e) {
        console.error("Erro:", e);
    }
}

async function atualizarStatus(id, novoStatus) {
    try {
        await fetch(`${API_URL}/ordens/${id}`, { // Rota do seu Spring Boot para atualizar
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        carregarOrdens(); // Recarrega a tela instantaneamente
    } catch(err) {
        alert("Erro de conexão.");
    }
}

// Inicia e atualiza a cada 10s
carregarOrdens();
setInterval(carregarOrdens, 10000);