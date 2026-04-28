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
        const tipoLogin = localStorage.getItem("tipoTemp"); // Pegando o que salvamos no login

        if (!email || !tipoLogin) {
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

            // ✅ SALVANDO DADOS OFICIAIS DE ACESSO
            localStorage.setItem("token", data.token);
            localStorage.setItem("tipoUsuario", data.tipo);
            localStorage.setItem("userName", data.nome || "Usuário");

            // Limpa os temporários
            localStorage.removeItem("emailTemp");
            localStorage.removeItem("tipoTemp");

            // REDIRECIONAMENTO BASEADO NO TIPO VOLTADO PELO BACKEND
            const tipoFinal = data.tipo.toUpperCase();

            if (tipoFinal === "EMPRESA") {
                window.location.href = "dashboard.html";
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