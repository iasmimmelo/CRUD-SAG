const usuarioStorage = localStorage.getItem("usuario");
const usuario = usuarioStorage ? JSON.parse(usuarioStorage) : null;

if (!usuario) {
    window.location.href = "login.html";
}

const usuarioId = usuario.id;
const API_URL = "/api/movimentacoes?usuarioId=" + usuarioId;

const form = document.getElementById("movimentacaoForm");
const tabelaCorpo = document.getElementById("tabelaCorpo");
const mensagemVazia = document.getElementById("mensagemVazia");
const btnCancelar = document.getElementById("btnCancelar");
const formTitulo = document.getElementById("formTitulo");
const mesSelecionado = document.getElementById("mesSelecionado");

let movimentacoes = [];
let listaFiltradaAtual = [];

document.addEventListener("DOMContentLoaded", () => {
    // Nome do usuário em maiúsculo (conforme solicitado anteriormente)
    const nomeEl = document.getElementById("nomeUsuario");
    if (nomeEl && usuario.nome) {
        nomeEl.innerHTML = `Olá, ${usuario.nome.toUpperCase()}!`;
    }

    const campoData = document.getElementById("data");
    if (campoData) {
        campoData.value = new Date().toISOString().split("T")[0];
    }

    if (mesSelecionado) {
        mesSelecionado.value = new Date().toISOString().slice(0, 7);
        mesSelecionado.addEventListener("change", carregarMovimentacoes);
    }

    carregarMovimentacoes();
});

async function carregarMovimentacoes(){
    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error("Erro ao carregar");
        movimentacoes = await resposta.json();
        atualizarTela();
    } catch (e) {
        console.error(e);
    }
}

function atualizarTela(){
    const mes = mesSelecionado ? mesSelecionado.value : "";
    const listaMes = movimentacoes.filter(m => m.data.startsWith(mes));

    listaFiltradaAtual = listaMes;
    renderizarTabela(listaFiltradaAtual);
    atualizarResumoMes(listaMes);
    atualizarResumoTotal(movimentacoes);
}

function renderizarTabela(lista){
    tabelaCorpo.innerHTML = "";

    if(lista.length === 0){
        mensagemVazia.style.display = "block";
        return;
    }
    mensagemVazia.style.display = "none";

    lista.forEach(m => {
        tabelaCorpo.innerHTML += `
            <tr>
                <td>${m.descricao}</td>
                <td>${formatarMoeda(m.valor)}</td>
                <td>${m.tipo}</td>
                <td>${formatarData(m.data)}</td>
                <td>
                    <button onclick="editarMovimentacao(${m.id})">Editar</button>
                    <button onclick="excluirMovimentacao(${m.id})">Excluir</button>
                </td>
            </tr>
        `;
    });
}

function atualizarResumoMes(lista){
    let receitas = 0;
    let despesas = 0;

    lista.forEach(m => {
        if(m.tipo === "RECEITA") receitas += Number(m.valor);
        else despesas += Number(m.valor);
    });

    document.getElementById("receitasMes").innerHTML = formatarMoeda(receitas);
    document.getElementById("despesasMes").innerHTML = formatarMoeda(despesas);
    document.getElementById("saldoMes").innerHTML = formatarMoeda(receitas - despesas);
}

function atualizarResumoTotal(lista){
    let receitas = 0;
    let despesas = 0;

    lista.forEach(m => {
        if(m.tipo === "RECEITA") receitas += Number(m.valor);
        else despesas += Number(m.valor);
    });

    document.getElementById("totalReceitas").innerHTML = formatarMoeda(receitas);
    document.getElementById("totalDespesas").innerHTML = formatarMoeda(despesas);
    document.getElementById("totalSaldo").innerHTML = formatarMoeda(receitas - despesas);
    document.getElementById("totalMovimentacoes").innerHTML = lista.length;
}

// ==========================================
// FILTRO DE PESQUISA POR DESCRIÇÃO (ITEM 3)
// ==========================================
function filtrarPorDescricao() {
    const termo = document.getElementById("inputPesquisa").value.toLowerCase();
    const filtrados = listaFiltradaAtual.filter(m => m.descricao.toLowerCase().includes(termo));
    renderizarTabela(filtrados);
}

// ==========================================
// ORDENAÇÃO DA TABELA (ITEM 4)
// ==========================================
function ordenarTabela(criterio) {
    let lista = [...listaFiltradaAtual];

    if (criterio === "recente") {
        lista.sort((a, b) => new Date(b.data) - new Date(a.data));
    } else if (criterio === "antigo") {
        lista.sort((a, b) => new Date(a.data) - new Date(b.data));
    } else if (criterio === "maior_valor") {
        lista.sort((a, b) => Number(b.valor) - Number(a.valor));
    } else if (criterio === "menor_valor") {
        lista.sort((a, b) => Number(a.valor) - Number(b.valor));
    } else if (criterio === "receitas") {
        lista = lista.filter(m => m.tipo === "RECEITA");
    } else if (criterio === "despesas") {
        lista = lista.filter(m => m.tipo === "DESPESA");
    }

    renderizarTabela(lista);
}

// ==========================================
// EXPORTAÇÃO (ITEM 7)
// ==========================================
function imprimirPagina() {
    window.print();
}

function exportarExcel() {
    let csv = "Descricao,Valor,Tipo,Data\n";
    listaFiltradaAtual.forEach(m => {
        csv += `"${m.descricao}",${m.valor},${m.tipo},${m.data}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movimentacoes.csv';
    a.click();
}

// ==========================================
// FORMULÁRIO E AÇÕES
// ==========================================
form.addEventListener("submit", function(e){
    e.preventDefault();
    salvarMovimentacao();
});

if(btnCancelar) btnCancelar.addEventListener("click", resetarFormulario);

async function salvarMovimentacao() {
    const id = document.getElementById("movimentacaoId").value;
    const movimentacao = {
        descricao: document.getElementById("descricao").value,
        valor: Number(document.getElementById("valor").value),
        tipo: document.getElementById("tipo").value,
        data: document.getElementById("data").value,
        usuario: { id: usuarioId }
    };

    const url = id ? "/api/movimentacoes/" + id : "/api/movimentacoes";
    const metodo = id ? "PUT" : "POST";

    const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movimentacao)
    });

    if (resposta.ok) {
        alert(id ? "✔ Movimentação atualizada." : "✔ Movimentação salva.");
        resetarFormulario();
        carregarMovimentacoes();
    } else {
        alert("Erro ao salvar movimentação.");
    }
}

async function editarMovimentacao(id) {
    const resposta = await fetch("/api/movimentacoes/" + id);
    const mov = await resposta.json();

    document.getElementById("movimentacaoId").value = mov.id;
    document.getElementById("descricao").value = mov.descricao;
    document.getElementById("valor").value = mov.valor;
    document.getElementById("tipo").value = mov.tipo;
    document.getElementById("data").value = mov.data;

    formTitulo.innerHTML = "Editar Movimentação";
    btnCancelar.style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirMovimentacao(id) {
    if (!confirm("Deseja realmente excluir?\n\n[Cancelar] [Excluir]")) return;

    await fetch("/api/movimentacoes/" + id, { method: "DELETE" });
    carregarMovimentacoes();
}

function resetarFormulario() {
    form.reset();
    document.getElementById("movimentacaoId").value = "";
    document.getElementById("data").value = new Date().toISOString().split("T")[0];
    formTitulo.innerHTML = "Nova Movimentação";
    btnCancelar.style.display = "none";
}

function formatarMoeda(valor){
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data){
    const partes = data.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function toggleMenu() {
    const menu = document.getElementById("menuOpcoes");
    if(menu) menu.classList.toggle("mostrar");
}

window.addEventListener("click", function(e){
    const menu = document.getElementById("menuOpcoes");
    const btn = document.querySelector(".menu-btn");
    if(menu && btn && !menu.contains(e.target) && !btn.contains(e.target)){
        menu.classList.remove("mostrar");
    }
});

function sair(){
    if(confirm("Deseja sair do sistema?")) {
        localStorage.removeItem("usuario");
        window.location.href = "login.html";
    }
}

window.sair = sair;
window.toggleMenu = toggleMenu;
window.filtrarPorDescricao = filtrarPorDescricao;
window.ordenarTabela = ordenarTabela;
window.imprimirPagina = imprimirPagina;
window.exportarExcel = exportarExcel;