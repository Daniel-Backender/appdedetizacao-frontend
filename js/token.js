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
        console.log("RESPOSTA COMPLETA DO SERVIDOR:", data);

        if (!response.ok) throw new Error(data.message || "Código inválido");

        // --- VERIFICAÇÃO DE ID ---
        const idEncontrado = data.id || data.empresaId || data.usuarioId;
        
        if (!idEncontrado) {
            console.error("CRÍTICO: O servidor não retornou o ID. Verifique o AuthController no Java!");
            alert("Erro de configuração: O servidor não enviou o ID da empresa. Verifique o console (F12).");
            return; // Interrompe para você ver o erro
        }

        // Se chegou aqui, o ID existe
        localStorage.setItem("token", data.token);
        localStorage.setItem("tipoUsuario", data.tipo);
        localStorage.setItem("userName", data.nome || "Usuário");
        localStorage.setItem("empresaId", idEncontrado);
        localStorage.setItem("userEmail", email);

        localStorage.removeItem("emailTemp");
        
        window.location.href = data.tipo.toUpperCase() === "EMPRESA" ? "dashboard_empresa.html" : "dashboard_admin.html";

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
});