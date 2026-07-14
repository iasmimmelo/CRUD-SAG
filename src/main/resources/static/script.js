const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "login.html";
}

const usuarioId = usuario.id;

const API_URL = `/api/movimentacoes?usuarioId=${usuarioId}`;

const form = document.getElementById('movimentacaoForm');
const tabelaCorpo = document.getElementById('tabelaCorpo');
const mensagemVazia = document.getElementById('mensagemVazia');
const btnCancelar = document.getElementById('btnCancelar');
const formTitulo = document.getElementById('formTitulo');

document.addEventListener("DOMContentLoaded", () => {
    const nomeUsuario = document.getElementById("nomeUsuario");
    if(nomeUsuario){
        nomeUsuario.innerHTML = "Olá, " + usuario.nome;
    }
    carregarMovimentacoes();
    document.getElementById('data').value = new Date().toISOString().split('T')[0];
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await salvarMovimentacao();
});

btnCancelar.addEventListener('click', resetarFormulario);

async function carregarMovimentacoes() {
    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) {
            const erro = await resposta.text();
            throw new Error(erro);
        }
        const movimentacoes = await resposta.json();
        renderizarTabela(movimentacoes);
        atualizarResumo(movimentacoes);
    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar movimentações");
    }
}

function renderizarTabela(movimentacoes){
    tabelaCorpo.innerHTML = "";
    if(movimentacoes.length === 0){
        mensagemVazia.style.display = "block";
        return;
    }
    mensagemVazia.style.display = "none";
    movimentacoes.forEach(mov => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
        <td>${mov.descricao}</td>
        <td>${formatarMoeda(mov.valor)}</td>
        <td>${mov.tipo}</td>
        <td>${formatarData(mov.data)}</td>
        <td>
        <button onclick="editarMovimentacao(${mov.id})">Editar</button>
        <button onclick="excluirMovimentacao(${mov.id})">Excluir</button>
        </td>
        `;
        tabelaCorpo.appendChild(linha);
    });
}

function atualizarResumo(movimentacoes){
    const receitas = movimentacoes
        .filter(m => m.tipo === "RECEITA")
        .reduce((s,m) => s + Number(m.valor), 0);

    const despesas = movimentacoes
        .filter(m => m.tipo === "DESPESA")
        .reduce((s,m) => s + Number(m.valor), 0);

    document.getElementById("totalReceitas").innerHTML = formatarMoeda(receitas);
    document.getElementById("totalDespesas").innerHTML = formatarMoeda(despesas);
    document.getElementById("totalSaldo").innerHTML = formatarMoeda(receitas - despesas);
}

async function salvarMovimentacao(){
    const id = document.getElementById("movimentacaoId").value;

    const movimentacao = {
        descricao: document.getElementById("descricao").value,
        valor: Number(document.getElementById("valor").value),
        tipo: document.getElementById("tipo").value,
        data: document.getElementById("data").value,
        usuario: { id: usuarioId }
    };

    const url = id ? `/api/movimentacoes/${id}` : "/api/movimentacoes";
    const metodo = id ? "PUT" : "POST";

    const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movimentacao)
    });

    if(resposta.ok){
        resetarFormulario();
        carregarMovimentacoes();
    }else{
        alert("Erro ao salvar");
    }
}

async function editarMovimentacao(id){
    const resposta = await fetch(`/api/movimentacoes/${id}`);
    const mov = await resposta.json();

    document.getElementById("movimentacaoId").value = mov.id;
    document.getElementById("descricao").value = mov.descricao;
    document.getElementById("valor").value = mov.valor;
    document.getElementById("tipo").value = mov.tipo;
    document.getElementById("data").value = mov.data;

    formTitulo.innerHTML = "Editar movimentação";
}

async function excluirMovimentacao(id){
    if(!confirm("Excluir movimentação?")) return;

    await fetch(`/api/movimentacoes/${id}`, { method: "DELETE" });
    carregarMovimentacoes();
}

function resetarFormulario(){
    form.reset();
    document.getElementById("movimentacaoId").value = "";
    formTitulo.innerHTML = "Nova movimentação";
}

function formatarMoeda(valor){
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(dataStr){
    if(!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
}

function toggleChat(){
    const corpo = document.getElementById("chat-body");
    corpo.style.display = (corpo.style.display === "none") ? "block" : "none";
}

function adicionarMensagem(texto, classe){
    const mensagens = document.getElementById("chat-mensagens");
    const div = document.createElement("div");
    div.className = classe;
    div.innerHTML = texto;
    mensagens.appendChild(div);
    mensagens.scrollTop = mensagens.scrollHeight;
}

function gerarResposta(pergunta){
    const receitas = document.getElementById("totalReceitas").innerText;
    const despesas = document.getElementById("totalDespesas").innerText;
    const saldo = document.getElementById("totalSaldo").innerText;

    pergunta = pergunta.toLowerCase();

    if(pergunta.includes("saldo")) return `Seu saldo atual é ${saldo}`;
    if(pergunta.includes("despesa") || pergunta.includes("gastei")) return `Você possui ${despesas} em despesas cadastradas.`;
    if(pergunta.includes("receita") || pergunta.includes("recebi")) return `Você possui ${receitas} em receitas cadastradas.`;
    if(pergunta.includes("editar")) return "Clique no botão Editar da movimentação desejada.";
    if(pergunta.includes("excluir")) return "Clique em Excluir na movimentação que deseja remover.";

    return "Ainda não sei responder essa pergunta.";
}

function enviarMensagem(){
    const input = document.getElementById("chat-input");
    const pergunta = input.value.trim();

    if(pergunta === "") return;

    adicionarMensagem(pergunta, "user-msg");

    const resposta = gerarResposta(pergunta);

    setTimeout(() => {
        adicionarMensagem(resposta, "bot-msg");
    }, 300);

    input.value = "";
    input.focus();
}

function sair(){
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}