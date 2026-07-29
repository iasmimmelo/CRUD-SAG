const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "login.html";
}

const usuarioId = usuario.id;

let listaMovimentacoes = [];
let receitasGeral = "R$ 0,00";
let despesasGeral = "R$ 0,00";
let saldoGeral = "R$ 0,00";

// Estados de controle do fluxo interativo
let aguardandoEscopoGeralOuMes = null; // Guarda "saldo", "receita" ou "despesa"
let aguardandoQualMes = null;         // Guarda "saldo", "receita" ou "despesa" para saber qual mês buscar depois

document.addEventListener("DOMContentLoaded", async () => {
    await carregarDados();
});

async function carregarDados(){
    try {
        const resposta = await fetch(`/api/movimentacoes?usuarioId=${usuarioId}`);
        if (!resposta.ok) {
            throw new Error("Erro ao carregar movimentações do assistente");
        }

        listaMovimentacoes = await resposta.json();

        let r = 0;
        let d = 0;

        listaMovimentacoes.forEach(m => {
            const valor = Number(m.valor) || 0;
            if (m.tipo === "RECEITA") {
                r += valor;
            } else if (m.tipo === "DESPESA") {
                d += valor;
            }
        });

        receitasGeral = r.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        despesasGeral = d.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        saldoGeral = (r - d).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    } catch (error) {
        console.error("Erro no resumo do assistente:", error);
    }
}

// Identifica meses aceitando com ou sem acento (ex: março ou marco)
function identificarMesNaPergunta(pergunta) {
    const mesesMap = {
        "janeiro": "01", "jan": "01",
        "fevereiro": "02", "fev": "02",
        "março": "03", "marco": "03", "mar": "03",
        "abril": "04", "abr": "04",
        "maio": "05", "mai": "05",
        "junho": "06", "jun": "06",
        "julho": "07", "jul": "07",
        "agosto": "08", "ago": "08",
        "setembro": "09", "set": "09",
        "outubro": "10", "out": "10",
        "novembro": "11", "nov": "11",
        "dezembro": "12", "dez": "12"
    };

    const perguntaNormalizada = pergunta.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const [nomeMes, numMes] of Object.entries(mesesMap)) {
        const nomeNormalizado = nomeMes.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (perguntaNormalizada.includes(nomeNormalizado)) {
            return numMes;
        }
    }
    return null;
}

// Calcula valores filtrados por mês
function calcularResumoMes(mesAlvo) {
    let r = 0;
    let d = 0;

    listaMovimentacoes.forEach(m => {
        if (!m.data) return;
        const dataStr = String(m.data).substring(0, 10);
        const [ano, mes, dia] = dataStr.split("-");

        if (mes === mesAlvo || dataStr.includes(`-${mesAlvo}-`)) {
            const valor = Number(m.valor) || 0;
            if (m.tipo === "RECEITA") {
                r += valor;
            } else if (m.tipo === "DESPESA") {
                d += valor;
            }
        }
    });

    const recStr = r.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const desStr = d.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const salStr = (r - d).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return { receitas: recStr, despesas: desStr, saldo: salStr };
}

function gerarResposta(perguntaOriginal){
    const pergunta = perguntaOriginal.toLowerCase();
    const perguntaNormalizada = pergunta.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // PASSO 3: O usuário respondeu qual mês específico ele quer ver
    if (aguardandoQualMes) {
        const tipoAtual = aguardandoQualMes;
        aguardandoQualMes = null; // Reseta o estado

        const mesIdentificado = identificarMesNaPergunta(pergunta);
        if (mesIdentificado) {
            const dadosMes = calcularResumoMes(mesIdentificado);
            if (tipoAtual === "saldo") return "O saldo do mês solicitado é de " + dadosMes.saldo + " (Receitas: " + dadosMes.receitas + " | Despesas: " + dadosMes.despesas + ").";
            if (tipoAtual === "receita") return "Suas receitas no mês solicitado somam " + dadosMes.receitas + ".";
            if (tipoAtual === "despesa") return "Suas despesas no mês solicitado somam " + dadosMes.despesas + ".";
        }

        return "Não consegui identificar o mês informado. Por favor, faça a pergunta novamente.";
    }

    // PASSO 2: O usuário respondeu se quer "mes" (com ou sem acento) ou "geral"
    if (aguardandoEscopoGeralOuMes) {
        const tipoAtual = aguardandoEscopoGeralOuMes;
        aguardandoEscopoGeralOuMes = null; // Reseta o estado

        // Se respondeu "geral" -> exibe apenas o total geral acumulado
        if (perguntaNormalizada.includes("geral") || perguntaNormalizada.includes("todo")) {
            if (tipoAtual === "saldo") return "O saldo geral (total de todos os meses) é de " + saldoGeral + ".";
            if (tipoAtual === "receita") return "O total geral de receitas de todos os meses é de " + receitasGeral + ".";
            if (tipoAtual === "despesa") return "O total geral de despesas de todos os meses é de " + despesasGeral + ".";
        }

        // Se respondeu "mes" ou "mês" (aceita com ou sem acento)
        if (perguntaNormalizada.includes("mes")) {
            aguardandoQualMes = tipoAtual; // Ativa a espera pelo mês específico
            return "Qual mês em específico você deseja ver?";
        }

        return "Não consegui entender. Por favor, responda se deseja ver por 'mês' ou 'geral'.";
    }

    // PASSO 1: O usuário digitou o mês direto na primeira pergunta (ex: "quanto gastei em março")
    const mesIdentificadoDireto = identificarMesNaPergunta(pergunta);
    if (mesIdentificadoDireto) {
        const dadosMes = calcularResumoMes(mesIdentificadoDireto);

        if (pergunta.includes("receita") || pergunta.includes("ganhei") || pergunta.includes("recebi")) {
            return "No mês solicitado, você possui " + dadosMes.receitas + " em receitas.";
        }
        if (pergunta.includes("despesa") || pergunta.includes("gastei") || pergunta.includes("gastos") || pergunta.includes("contas")) {
            return "No mês solicitado, você possui " + dadosMes.despesas + " em despesas.";
        }
        if (pergunta.includes("saldo") || pergunta.includes("quanto tenho") || pergunta.includes("sobrou")) {
            return "O saldo do mês solicitado é de " + dadosMes.saldo + " (Receitas: " + dadosMes.receitas + " | Despesas: " + dadosMes.despesas + ").";
        }

        return "Resumo para o mês solicitado:\n\nReceitas: " + dadosMes.receitas + "\nDespesas: " + dadosMes.despesas + "\nSaldo: " + dadosMes.saldo;
    }

// ===========================
// PERGUNTAS DE SALDO, RECEITA OU DESPESA SEM MÊS (DISPARA A PERGUNTA INTERATIVA)
// ===========================

    if (
        pergunta.includes("saldo") ||
        pergunta.includes("quanto tenho") ||
        pergunta.includes("dinheiro") ||
        pergunta.includes("quanto sobrou") ||
        pergunta.includes("quanto resta")
    ){
        aguardandoEscopoGeralOuMes = "saldo";
        return "Você deseja ver o saldo por mês ou geral?";
    }

    if (
        pergunta.includes("receita") ||
        pergunta.includes("ganhei") ||
        pergunta.includes("recebi") ||
        pergunta.includes("entrada") ||
        pergunta.includes("salário") ||
        pergunta.includes("salario")
    ){
        aguardandoEscopoGeralOuMes = "receita";
        return "Você deseja ver as receitas por mês ou geral?";
    }

    if (
        pergunta.includes("despesa") ||
        pergunta.includes("gastei") ||
        pergunta.includes("gastos") ||
        pergunta.includes("saída") ||
        pergunta.includes("saida") ||
        pergunta.includes("contas")
    ){
        aguardandoEscopoGeralOuMes = "despesa";
        return "Você deseja ver as despesas por mês ou geral?";
    }

// ===========================
// SAUDAÇÕES
// ===========================
    if(
        pergunta.includes("oi") ||
        pergunta.includes("olá") ||
        pergunta.includes("ola") ||
        pergunta.includes("bom dia") ||
        pergunta.includes("boa tarde") ||
        pergunta.includes("boa noite") ||
        pergunta.includes("eae") ||
        pergunta.includes("hey")
    ){
        return "Olá! Sou o Assistente Financeiro. Posso ajudar com seu saldo, receitas, despesas, Dashboard e dicas financeiras.";
    }
    if(
        pergunta.includes("tudo bem") ||
        pergunta.includes("como vai") ||
        pergunta.includes("como está")
    ){
        return "Estou muito bem! E pronto para ajudar você a controlar melhor suas finanças.";
    }

// ===========================
// RESUMO GERAL
// ===========================
    if(
        pergunta.includes("resumo") ||
        pergunta.includes("relatório") ||
        pergunta.includes("relatorio")
    ){
        return "Resumo financeiro geral:\n\nReceitas: " + receitasGeral + "\nDespesas: " + despesasGeral + "\nSaldo: " + saldoGeral;
    }

// ===========================
// SITUAÇÃO
// ===========================
    if(
        pergunta.includes("lucro") ||
        pergunta.includes("positivo") ||
        pergunta.includes("estou no lucro")
    ){
        return "Seu saldo atual é " + saldoGeral + ". Compare receitas e despesas para acompanhar sua situação financeira.";
    }

    if(
        pergunta.includes("prejuízo") ||
        pergunta.includes("prejuizo") ||
        pergunta.includes("vermelho") ||
        pergunta.includes("negativo")
    ){
        return "Caso o saldo esteja negativo, procure diminuir despesas e aumentar receitas.";
    }

// ===========================
// CADASTRO
// ===========================
    if(
        pergunta.includes("cadastrar") ||
        pergunta.includes("adicionar") ||
        pergunta.includes("nova movimentação") ||
        pergunta.includes("nova movimentacao")
    ){
        return "Na página Início preencha descrição, valor, tipo e data. Depois clique em Salvar.";
    }

    if(pergunta.includes("como cadastrar receita")){
        return "Escolha o tipo Receita, informe descrição, valor e data e clique em Salvar.";
    }

    if(pergunta.includes("como cadastrar despesa")){
        return "Escolha o tipo Despesa, informe descrição, valor e data e clique em Salvar.";
    }

// ===========================
// EDITAR / EXCLUIR
// ===========================
    if(
        pergunta.includes("editar") ||
        pergunta.includes("alterar") ||
        pergunta.includes("modificar")
    ){
        return "Na tabela da página Início clique em Editar. O formulário será preenchido automaticamente.";
    }

    if(
        pergunta.includes("excluir") ||
        pergunta.includes("apagar") ||
        pergunta.includes("deletar") ||
        pergunta.includes("remover")
    ){
        return "Clique em Excluir na movimentação desejada.";
    }

// ===========================
// DASHBOARD
// ===========================
    if(
        pergunta.includes("dashboard") ||
        pergunta.includes("gráfico") ||
        pergunta.includes("grafico")
    ){
        return "O Dashboard apresenta gráficos de receitas, despesas, evolução do saldo e movimentações mensais.";
    }

    if(pergunta.includes("gráfico de pizza") || pergunta.includes("pizza")){
        return "O gráfico de pizza mostra a porcentagem entre receitas e despesas.";
    }

    if(pergunta.includes("gráfico de barras") || pergunta.includes("barras")){
        return "O gráfico de barras compara o total das receitas e despesas.";
    }

// ===========================
// MENU / LOGIN
// ===========================
    if(
        pergunta.includes("menu") ||
        pergunta.includes("navegação") ||
        pergunta.includes("navegacao")
    ){
        return "O menu permite acessar Início, Dashboard e Assistente Financeiro.";
    }

    if(
        pergunta.includes("login") ||
        pergunta.includes("entrar")
    ){
        return "Faça login utilizando seu e-mail e senha cadastrados.";
    }

// ===========================
// EDUCAÇÃO FINANCEIRA
// ===========================
    if(pergunta.includes("economizar")){
        return "Anote todos os gastos, evite compras por impulso e mantenha um planejamento financeiro.";
    }

    if(pergunta.includes("investir")){
        return "Antes de investir, organize suas finanças e tenha uma reserva de emergência.";
    }

    if(pergunta.includes("reserva")){
        return "O ideal é possuir uma reserva equivalente entre 3 e 6 meses das suas despesas.";
    }

    if(pergunta.includes("dica")){
        return "Evite gastar mais do que ganha, consulte o Dashboard regularmente e registre todas as movimentações.";
    }

// ===========================
// SOBRE O SISTEMA
// ===========================
    if(
        pergunta.includes("quem desenvolveu")||
        pergunta.includes("desenvolveu")||
        pergunta.includes("desenvolvedores")
    ){
        return "Este sistema foi desenvolvido como um projeto acadêmico de Controle Financeiro por Iasmim Melo e Mônica Lima.";
    }

// ===========================
// PADRÃO
// ===========================
    return "Desculpe, não consegui entender sua pergunta.\n\nVocê pode perguntar sobre saldo, receitas, despesas, dashboard ou dicas financeiras!";
}

async function enviarMensagem(){
    const input = document.getElementById("chat-input");
    const pergunta = input.value.trim();

    if(pergunta === "") return;

    adicionarMensagem(pergunta, "user-msg");
    input.value = "";

    await carregarDados();

    const resposta = gerarResposta(pergunta);

    setTimeout(() => {
        adicionarMensagem(resposta, "bot-msg");
    }, 300);
}

function adicionarMensagem(texto, classe){
    const mensagens = document.getElementById("chat-mensagens");
    mensagens.innerHTML += `<div class="${classe}" style="white-space: pre-line;">${texto}</div>`;
    mensagens.scrollTop = mensagens.scrollHeight;
}

function toggleMenu() {
    const menu = document.getElementById("menuOpcoes");
    if (menu) {
        menu.classList.toggle("mostrar");
    }
}

window.addEventListener("click", function(e) {
    const menu = document.getElementById("menuOpcoes");
    const btn = document.querySelector(".menu-btn");
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove("mostrar");
    }
});

function sair() {
    if (confirm("Deseja sair do sistema?")) {
        localStorage.removeItem("usuario");
        window.location.href = "login.html";
    }
}

window.sair = sair;
window.toggleMenu = toggleMenu;
window.enviarMensagem = enviarMensagem;