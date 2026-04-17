const token = localStorage.getItem("token");

if (!token) {
    alert("Acesso negado!");
    window.location.href = "login.html";
}

fetch("http://localhost:8080/auth/validar", {
    headers: {
        "Authorization": "Bearer " + token
    }
})
.then(res => {
    if (!res.ok) {
        localStorage.clear();
        window.location.href = "login.html";
    }
});
const tipo = localStorage.getItem("tipoUsuario");
const nome = localStorage.getItem("userEmail");

document.getElementById("userName").innerText = nome;
if (tipo === "CLIENTE") esconderAdmin();
if (tipo === "FUNCIONARIO") {
    esconderAdmin();
    esconderFinanceiro();
}

function esconderAdmin() {
    document.getElementById("qtdFuncionarios").parentElement.style.display = "none";
}

function esconderFinanceiro() {
    document.getElementById("qtdCriticos").parentElement.style.display = "none";
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}