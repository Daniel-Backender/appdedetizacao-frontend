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
        const tipoLogin = (localStorage.getItem("tipoTemp") || "").toUpperCase();

        if (!email) {
            alert("Faça login novamente");
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

            if (!response.ok) throw new Error(data.message);

            // 🔥 valida consistência
            if (data.tipo.toUpperCase() !== tipoLogin) {
                alert("Erro de segurança: tipo inconsistente");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("tipoUsuario", data.tipo);

            localStorage.removeItem("emailTemp");
            localStorage.removeItem("tipoTemp");

            // 🔥 REDIRECIONAMENTO CORRETO
            switch (tipoLogin) {
                case "CLIENTE":
                    window.location.href = "dash_cliente.html";
                    break;
                case "FUNCIONARIO":
                    window.location.href = "dash_funcionario.html";
                    break;
                case "EMPRESA":
                    window.location.href = "dashboard.html";
                    break;
                case "ADMINISTRADOR":
                    window.location.href = "dashboard_admin.html";
                    break;
                default:
                    alert("Tipo inválido");
            }

        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    }
});