document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const cepInput = document.getElementById("cep");
    const ruaInput = document.getElementById("rua");
    const bairroInput = document.getElementById("bairro");
    const tipoSelect = document.getElementById("tipo");
    const cnpjGroup = document.getElementById("cnpjGroup");

    const BASE_URL = "https://appdedetizacao.onrender.com";

    // --- LÓGICA DO VIA CEP ---
    cepInput.addEventListener("blur", () => {
        let cep = cepInput.value.replace(/\D/g, ''); // Remove traços e pontos

        if (cep.length === 8) {
            // Preenche com "..." enquanto busca
            ruaInput.value = "...";
            bairroInput.value = "...";

            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(dados => {
                    if (!dados.erro) {
                        ruaInput.value = dados.logradouro;
                        bairroInput.value = dados.bairro;
                        document.getElementById("numero").focus(); // Pula para o número
                    } else {
                        alert("CEP não encontrado.");
                        limparCamposEndereco();
                    }
                })
                .catch(() => {
                    alert("Erro ao buscar CEP.");
                    limparCamposEndereco();
                });
        }
    });

    function limparCamposEndereco() {
        ruaInput.value = "";
        bairroInput.value = "";
    }

    // --- CONTROLE DE EXIBIÇÃO DO CNPJ ---
    tipoSelect.addEventListener("change", () => {
        cnpjGroup.style.display = (tipoSelect.value === "EMPRESA") ? "block" : "none";
    });

    // --- NAVEGAÇÃO ENTRE PASSOS (Funções Globais) ---
    window.nextStep = function() {
        if (!tipoSelect.value || !document.getElementById("nome").value) {
            alert("Preencha o tipo de perfil e o nome!");
            return;
        }
        document.getElementById("step1").classList.remove("active");
        document.getElementById("step2").classList.add("active");
    };

    window.prevStep = function() {
        document.getElementById("step2").classList.remove("active");
        document.getElementById("step1").classList.add("active");
    };

    // --- SUBMIT DO FORMULÁRIO ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const body = {
            nome: document.getElementById("nome").value,
            email: document.getElementById("email").value,
            senha: document.getElementById("senha").value,
            tipo: tipoSelect.value,
            cep: cepInput.value,
            rua: ruaInput.value,
            bairro: bairroInput.value,
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro no registro");
            }

            alert("Cadastro realizado com sucesso!");
            window.location.href = "login.html";
        } catch (err) {
            alert(err.message);
        }
    });
});