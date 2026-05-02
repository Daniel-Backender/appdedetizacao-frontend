document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm"); // ID conforme seu HTML
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
        btn.innerHTML = "VERIFICANDO..."; // Toque industrial/neon
        btn.disabled = true;

        try {
            // AQUI ESTÁ A IMPLEMENTAÇÃO QUE VOCÊ PEDIU INTEGRADA:
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, senha: senha })
            });

            if (response.ok) {
                const data = await response.json();

                // SALVAMENTO CRÍTICO: Usa 'emailTemp' para a tela de token reconhecer o usuário
                localStorage.setItem("emailTemp", email);
                localStorage.setItem("tipoTemp", data.tipo || "");

                // Exibe o código no console se estiver em modo desenvolvimento
                if (data.codigo_dev) {
                    console.log("Código DEV:", data.codigo_dev);
                }

                // REDIRECIONA PARA A TELA DE TOKEN!
                window.location.href = "token.html"; 

            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.message || "Credenciais incorretas ou erro no servidor.");
                btn.innerHTML = btnOriginalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro crítico ao conectar com o servidor. Verifique sua conexão.");
            btn.innerHTML = btnOriginalText;
            btn.disabled = false;
        }
    });
});