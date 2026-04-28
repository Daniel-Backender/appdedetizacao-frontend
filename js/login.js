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

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Erro ao fazer login");

            // SALVANDO AS INFORMAÇÕES NECESSÁRIAS PARA O TOKEN
            localStorage.setItem("emailTemp", email);
            localStorage.setItem("tipoTemp", data.tipo); // Isso aqui estava faltando!

            // Alerta de debug (pode remover depois que testar)
            alert("Código enviado! Verifique seu email.");
            
            // Redireciona
            window.location.href = "token.html";

        } catch (err) {
            console.error(err);
            alert("Erro: " + err.message);
        }
    });
});