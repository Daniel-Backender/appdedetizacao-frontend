document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const BASE_URL = "https://appdedetizacao.onrender.com";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();

        if (!email || !senha) {
            alert("Preencha todos os campos!");
            return;
        }

        const btn = form.querySelector("button");
        const btnOriginalText = btn.innerHTML;
        btn.innerHTML = "Verificando...";
        btn.disabled = true;

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Erro de credenciais");

            // CORREÇÃO: Salva os dados essenciais
            localStorage.setItem("emailTemp", email);
            if (data.tipo) {
                localStorage.setItem("tipoTemp", data.tipo);
            }

            if (data.codigo_dev) alert(`[MODO DEV] Seu código é: ${data.codigo_dev}`);

            window.location.href = "token.html";

        } catch (err) {
            console.error(err);
            alert("Erro: " + err.message);
            btn.innerHTML = btnOriginalText;
            btn.disabled = false;
        }
    });
});