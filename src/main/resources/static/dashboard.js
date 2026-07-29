(function() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const usuarioId = usuario.id;
    let listaMovimentacoes = [];

    let graficoBarra = null;
    let graficoPizzaChart = null;
    let graficoMesChart = null;
    let graficoSaldoChart = null;

    document.addEventListener("DOMContentLoaded", () => {
        const inputMes = document.getElementById("mesSelecionado");

        // Define o mês atual (AAAA-MM) obrigatoriamente
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const mesAtualStr = `${ano}-${mes}`;

        if (inputMes) {
            inputMes.value = mesAtualStr;
            inputMes.addEventListener("change", atualizarDashboard);
        }

        carregarMovimentacoes();
    });

    async function carregarMovimentacoes() {
        try {
            const resposta = await fetch(`/api/movimentacoes?usuarioId=${usuarioId}`);
            if (!resposta.ok) throw new Error("Erro ao buscar dados do servidor");

            listaMovimentacoes = await resposta.json();
            console.log("Movimentações carregadas do backend:", listaMovimentacoes); // Verifique no F12 se os dados chegam aqui
            atualizarDashboard();
        } catch (erro) {
            console.error("Erro ao carregar movimentações:", erro);
        }
    }

    function atualizarDashboard() {
        const inputMes = document.getElementById("mesSelecionado");
        const mesSelecionado = inputMes ? inputMes.value : ""; // Ex: "2026-07"

        let receitasMes = 0;
        let despesasMes = 0;
        let receitasTotal = 0;
        let despesasTotal = 0;

        const meses = {};
        const saldoDatas = [];
        const saldoValores = [];
        let saldo = 0;

        // Ordena as movimentações por data
        listaMovimentacoes.sort((a, b) => new Date(a.data) - new Date(b.data));

        listaMovimentacoes.forEach(m => {
            const valor = Number(m.valor) || 0;

            // Extrai a parte da data com segurança (independente de vir ISO string ou "YYYY-MM-DD")
            let dataStr = "";
            if (m.data) {
                dataStr = String(m.data).substring(0, 10);
            }
            const mesAnoMov = dataStr.substring(0, 7); // "YYYY-MM"

            // Totais Gerais
            if (String(m.tipo).toUpperCase() === "RECEITA") {
                receitasTotal += valor;
                saldo += valor;
            } else {
                despesasTotal += valor;
                saldo -= valor;
            }

            saldoDatas.push(formatarData(dataStr));
            saldoValores.push(saldo);

            // Resumo do Mês Selecionado (compara de forma flexível)
            if (mesSelecionado && mesAnoMov === mesSelecionado) {
                if (String(m.tipo).toUpperCase() === "RECEITA") {
                    receitasMes += valor;
                } else {
                    despesasMes += valor;
                }
            }

            // Gráfico por Mês
            if (mesAnoMov) {
                if (!meses[mesAnoMov]) meses[mesAnoMov] = 0;
                if (String(m.tipo).toUpperCase() === "RECEITA") {
                    meses[mesAnoMov] += valor;
                } else {
                    meses[mesAnoMov] -= valor;
                }
            }
        });

        // Atualiza os elementos na tela com segurança
        setTexto("receitaMes", formatarMoeda(receitasMes));
        setTexto("despesaMes", formatarMoeda(despesasMes));
        setTexto("saldoMes", formatarMoeda(receitasMes - despesasMes));

        setTexto("cardReceita", formatarMoeda(receitasTotal));
        setTexto("cardDespesa", formatarMoeda(despesasTotal));
        setTexto("cardSaldo", formatarMoeda(receitasTotal - despesasTotal));
        setTexto("totalMovimentacoes", listaMovimentacoes.length);

        desenharGraficos(receitasMes, despesasMes, meses, saldoDatas, saldoValores);
    }

    function setTexto(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }

    function desenharGraficos(receitas, despesas, meses, datas, saldos) {
        if (graficoBarra) graficoBarra.destroy();
        if (graficoPizzaChart) graficoPizzaChart.destroy();
        if (graficoMesChart) graficoMesChart.destroy();
        if (graficoSaldoChart) graficoSaldoChart.destroy();

        const ctxBarra = document.getElementById("graficoBarra");
        if (ctxBarra) {
            graficoBarra = new Chart(ctxBarra, {
                type: "bar",
                data: {
                    labels: ["Receitas", "Despesas"],
                    datasets: [{
                        label: "Valor (R$)",
                        data: [receitas, despesas],
                        backgroundColor: ["#22c55e", "#ef4444"]
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        const ctxPizza = document.getElementById("graficoPizza");
        if (ctxPizza) {
            graficoPizzaChart = new Chart(ctxPizza, {
                type: "pie",
                data: {
                    labels: ["Receitas", "Despesas"],
                    datasets: [{
                        data: [receitas, despesas],
                        backgroundColor: ["#22c55e", "#ef4444"]
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        const ctxMes = document.getElementById("graficoMes");
        if (ctxMes) {
            graficoMesChart = new Chart(ctxMes, {
                type: "bar",
                data: {
                    labels: Object.keys(meses),
                    datasets: [{
                        label: "Saldo do Mês",
                        data: Object.values(meses),
                        backgroundColor: "#3b82f6"
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        const ctxSaldo = document.getElementById("graficoSaldo");
        if (ctxSaldo) {
            graficoSaldoChart = new Chart(ctxSaldo, {
                type: "line",
                data: {
                    labels: datas,
                    datasets: [{
                        label: "Saldo Acumulado",
                        data: saldos,
                        borderColor: "#2563eb",
                        backgroundColor: "rgba(37,99,235,0.2)",
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    function formatarMoeda(valor) {
        return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function formatarData(dataStr) {
        if (!dataStr) return "";
        const partes = dataStr.split("-");
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataStr;
    }

    function toggleMenu() {
        const menu = document.getElementById("menuOpcoes");
        if (menu) menu.classList.toggle("mostrar");
    }

    function sair() {
        if (confirm("Deseja sair do sistema?")) {
            localStorage.removeItem("usuario");
            window.location.href = "login.html";
        }
    }

    window.toggleMenu = toggleMenu;
    window.sair = sair;
})();