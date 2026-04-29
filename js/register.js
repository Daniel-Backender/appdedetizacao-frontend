form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        senha: document.getElementById("senha").value,
        tipo: document.getElementById("tipo").value,
        cep: document.getElementById("cep").value,
        rua: document.getElementById("rua").value,
        bairro: document.getElementById("bairro").value,
        numero: document.getElementById("numero").value
    };

    if (body.tipo === "EMPRESA") {
        body.cnpj = document.getElementById("cnpj").value;
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error("Erro no registro");
        alert("Cadastrado! Faça login.");
        window.location.href = "login.html";
    } catch (err) {
        alert(err.message);
    }
});