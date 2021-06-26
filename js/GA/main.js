$(function () {
    // control parameters
    function getControlParams() {
        return {
            GenerationsCount: $("#GenerationsCount").val(),
            SolutionsCount: $("#SolutionsCount").val(),
            GenesCount: $("#GenesCount").val(),
            SelectionTechnique: $("#SelectionTechnique").val(),
            CrossoverProbability: $("#CrossoverProbability").val(),
            MutationProbability: $("#MutationProbability").val(),
            ElitismStatus: $("#ElitismStatus").val(),
            PlotFunc: plotConvergence,
            fitnessFunc: sphere
        };
    }

    async function RunGA() {
        var params = getControlParams()

        var ga = new GeneticAlgorithm(
            generationsCount = params.GenerationsCount,
            solutionsCount = params.SolutionsCount,
            genesCount = params.GenesCount,
            fitnessFunc = params.fitnessFunc,
            parentSelectionTechnique = params.SelectionTechnique,
            crossoverProbability = params.CrossoverProbability,
            mutationprobability = params.MutationProbability,
            enableElitism = params.ElitismStatus,
            plotFunc = params.PlotFunc
        );

        var result = await ga.start();

        // show best solution
        $("#BestSolution").html(ga.bestSolution)
        $("#BestSolutionContainer").slideDown()
    }

    // run GA on button click
    $("#RunGABtn").click(function () {
        resetView()

        RunGA();
    })

    function resetView() {
        $("#ConvergenceValues").html("")
        clearChart()
        $("#BestSolutionContainer").slideUp()
    }

    function sphere(sol) {
        // convert from binary to decimal
        var num = parseInt(sol.join(""), 2)

        return num ^ 2;
    }

    function plotConvergence(generationNum, bestFitness) {
        var row = "<tr><td>" + generationNum + "</td><td>" + bestFitness + "</td></tr>"
        $("#ConvergenceValues").prepend(row)

        // append to chart
        convChart.data.datasets[0].data[generationNum - 1] = bestFitness;
        convChart.data.labels[generationNum - 1] = generationNum;
        convChart.update();
    }

    function clearChart() {
        convChart.data.datasets[0].data = [];
        convChart.data.labels = [];
        convChart.update();
    }
})

var convChart = new Chart($("#ConvergenceCurve"), {
    type: 'line',
    options: {
        showLines: true
    },
    data: {
        labels: [],
        datasets: [{
            label: 'best fitness',
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 5,
            pointHitRadius: 10,
            data: [],
        }]
    }
});