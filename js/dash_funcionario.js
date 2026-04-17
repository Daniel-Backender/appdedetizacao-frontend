const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

document.getElementById("userName").innerText =
    localStorage.getItem("userEmail");

const tabela = document.getElementById("ordens");

tabela.innerHTML = `
<tr>
<td>1</td>
<td>João</td>
<td>Pendente</td>
<td><button onclick="finalizar(1)">Finalizar</button></td>
</tr>
`;

function finalizar(id) {
    alert("Serviço " + id + " finalizado!");
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}