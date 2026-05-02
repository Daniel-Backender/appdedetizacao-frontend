document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forgotForm");
    const BASE_URL = "https://appdedetizacao.onrender.com";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("emailForgot").value.trim();
        const btn = document.getElementById("btnForgot");

        // UI Feedback - Estilo Industrial
        btn.innerHTML = "SOLICITANDO...";
        btn.disabled = true;

        try {
            // Utilizando o endpoint de recuperação do seu backend
            const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                alert("Protocolo enviado! Verifique seu e-mail para obter o novo token.");
                // Salva o e-mail para que a tela de token saiba quem validar
                localStorage.setItem("emailTemp", email);
                window.location.href = "token.html";
            } else {
                const data = await response.json();
                throw new Error(data.message || "E-mail não encontrado na base de dados.");
            }

        } catch (err) {
            alert("ERRO DE SISTEMA: " + err.message);
            btn.innerHTML = "Solicitar Token";
            btn.disabled = false;
        }
    });
});