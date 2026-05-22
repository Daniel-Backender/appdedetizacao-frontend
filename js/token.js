document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-token");
    // Certifique-se de que a URL está correta (recomendo usar a variável de ambiente se possível)
    const BASE_URL = "https://appdedetizacao.onrender.com";

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        validarToken();
    });

    async function validarToken() {
        const codigo = document.getElementById("codigo").value.trim();
        const email = localStorage.getItem("emailTemp");

        if (!email) {
            window.location.href = "index.html";
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/validar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, codigo })
            });

            const data = await response.json();
            console.log("RESPOSTA DO SERVIDOR:", data);

            if (!response.ok) {
                throw new Error(data.message || "Código inválido");
            }

            // --- LÓGICA DE ATUALIZAÇÃO ---
            // Captura o ID retornado pelo backend (seja ele .id, .empresaId ou .usuarioId)
            const idEncontrado = data.id || data.empresaId || data.usuarioId;
            
            if (!idEncontrado) {
                console.error("CRÍTICO: O servidor não retornou o ID.");
                alert("Erro: O servidor não enviou a identificação da empresa. Verifique o console.");
                return;
            }

            // Limpa IDs antigos para evitar conflitos antes de salvar o novo
            localStorage.removeItem("empresaId");

            // Salva as novas informações
            localStorage.setItem("token", data.token);
            localStorage.setItem("tipoUsuario", data.tipo);
            localStorage.setItem("userName", data.nome || "Usuário");
            localStorage.setItem("empresaId", idEncontrado);
            localStorage.setItem("userEmail", email);

            // Remove o temporário
            localStorage.removeItem("emailTemp");
            
            // Redireciona
            const destino = data.tipo.toUpperCase() === "EMPRESA" ? "dashboard_empresa.html" : "dashboard_admin.html";
            window.location.href = destino;

        } catch (err) {
            console.error("Erro na validação:", err);
            alert(err.message);
        }
    }
});