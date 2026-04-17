document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");
    const tipo = document.getElementById("tipo");
    const cnpjGroup = document.getElementById("cnpjGroup");
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");

    const BASE_URL = "https://appdedetizacao.onrender.com";

    // ======== Passo ========
    window.nextStep = function () {
        if (!tipo.value) {
            alert("Selecione o tipo de conta!");
            return;
        }
        step1.classList.remove("active");
        step2.classList.add("active");
        tipo.disabled = true;
    };

    window.prevStep = function () {
        step2.classList.remove("active");
        step1.classList.add("active");
        tipo.disabled = false;
    };

    // ======== TIPO / CNPJ ========
    tipo.addEventListener("change", () => {
        const t = tipo.value;
        cnpjGroup.style.display = (t === "EMPRESA" || t === "FUNCIONARIO") ? "block" : "none";
    });

    // ======== VIA CEP ========
    const cepInput = document.getElementById("cep");
    cepInput?.addEventListener("blur", async function () {
        let cep = this.value.replace(/\D/g, "");
        if (cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) { alert("CEP não encontrado!"); return; }

            document.getElementById("rua").value = data.logradouro || "";
            document.getElementById("bairro").value = data.bairro || "";
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
        }   
    });

    // ======== SUBMIT ========
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const body = {
            email: document.getElementById("email").value,
            senha: document.getElementById("senha").value,
            tipo: tipo.value,
            cep: document.getElementById("cep").value,
            rua: document.getElementById("rua").value,
            bairro: document.getElementById("bairro").value,
            numero: document.getElementById("numero").value
        };

        if (body.tipo === "EMPRESA" || body.tipo === "FUNCIONARIO") {
            body.cnpj = document.getElementById("cnpj").value;
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Erro no registro");

            alert("Registrado com sucesso! Agora faça login.");
            window.location.href = "login.html";

        } catch (err) {
            console.error("ERRO REGISTER:", err);
            alert(err.message);
        }
    });
});