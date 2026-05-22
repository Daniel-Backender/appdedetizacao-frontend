document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-token");
    const BASE_URL = "https://appdedetizacao.onrender.com";

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        validarToken();
    });

    async function validarToken() {
        const codigo = document.getElementById("codigo").value.trim();
        const email = localStorage.getItem("emailTemp");

        if (!email) {
            alert("Sessão expirada. Faça login novamente.");
            // 🔥 CORREÇÃO: Apontando para o arquivo correto (index.html)
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

            console.log("DEBUG: Estrutura da resposta do servidor:", data);

            if (!response.ok) throw new Error(data.message || "Código inválido");

            // 🔥 CORREÇÃO CRÍTICA: Salvando todos os dados que a Dashboard precisa!
            localStorage.setItem("token", data.token);
            localStorage.setItem("tipoUsuario", data.tipo);
            localStorage.setItem("userName", data.nome || "Usuário");
            
            // Grava o ID da empresa e o Email (Garante que a Dashboard funcione)
            localStorage.setItem("empresaId", data.id || data.empresaId || data.usuarioId || "");
            localStorage.setItem("userEmail", email);

            // Limpeza
            localStorage.removeItem("emailTemp");
            localStorage.removeItem("tipoTemp");

            const tipoFinal = data.tipo.toUpperCase();

            if (tipoFinal === "EMPRESA") {
                window.location.href = "dashboard_empresa.html";
            } else if (tipoFinal === "ADMINISTRADOR" || tipoFinal === "ADMIN") {
                window.location.href = "dashboard_admin.html";
            } else {
                alert("Acesso permitido apenas via aplicativo para este tipo de conta.");
                window.location.href = "index.html";
            }

        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    }
});