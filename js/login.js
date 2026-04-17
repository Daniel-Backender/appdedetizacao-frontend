document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    const tipoSelect = document.getElementById("userType");
    const cnpjGroup = document.getElementById("cnpjGroup");
    const BASE_URL = "https://appdedetizacao.onrender.com";

    tipoSelect.addEventListener("change", () => {
        const tipo = tipoSelect.value;
        cnpjGroup.style.display = (tipo === "EMPRESA" || tipo === "FUNCIONARIO") ? "block" : "none";
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const tipo = tipoSelect.value;
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;
        const cnpj = document.getElementById("cnpj").value;

        let body = { email, senha, tipo };
        if (tipo === "EMPRESA" || tipo === "FUNCIONARIO") body.cnpj = cnpj;

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message);

            // 🔥 salva tipo escolhido
            localStorage.setItem("emailTemp", email);
            localStorage.setItem("tipoTemp", tipo);

            window.location.href = "token.html";

        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
});