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

        // CORREÇÃO: Removida a trava que causava o recarregamento infinito da página
        if (!email) {
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/validar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, codigo })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Código inválido");

            localStorage.setItem("token", data.token);
            localStorage.setItem("tipoUsuario", data.tipo);
            localStorage.setItem("userName", data.nome || "Usuário");

            localStorage.removeItem("emailTemp");
            localStorage.removeItem("tipoTemp");

            const tipoFinal = data.tipo.toUpperCase();

            if (tipoFinal === "EMPRESA") {
                window.location.href = "dashboard_empresa.html";
            } else if (tipoFinal === "ADMINISTRADOR" || tipoFinal === "ADMIN") {
                window.location.href = "dashboard_admin.html";
            } else {
                alert("Acesso permitido apenas via aplicativo para este tipo de conta.");
                window.location.href = "login.html";
            }

        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    }
});