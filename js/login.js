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

            if (!response.ok) throw new Error(data.message);

            localStorage.setItem("emailTemp", email);

            // DEBUG
            alert("Código (DEV): " + data.codigo_dev);

            window.location.href = "token.html";

        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
});