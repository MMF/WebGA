class GeneticAlgorithm {
    // Initialize GA
    constructor(generationsCount, solutionsCount, genesCount, fitnessFunc,
        crossoverProbability, mutationprobability, enableElitism, tournamentSize, plotFunc) {
        // get control parameters
        this.generationsCount = generationsCount;
        this.solutionsCount = solutionsCount;
        this.genesCount = genesCount;
        this.crossoverProbability = crossoverProbability;
        this.mutationprobability = mutationprobability;
        this.fitnessFunction = fitnessFunc;
        this.enableElitism = enableElitism;
        this.tournamentSize = tournamentSize;
        this.plotFunc = plotFunc;

        // default parent selection technique
        this.parentSelectionMethod = this.rouletteWheel_Selection;

        // default crossover technique
        this.crossoverMethod = this.singlePoint_Corssover;

        // initialize variables
        this.population = [];
        this.tempPopulation = [];
        this.fitness_values = [];
        this.convergence = [];
        this.bestSolution = [];
        this.bestFitness = NaN;
    }

    // Start the optimization process
    async start() {
        this.initializePopulation();

        // Iterations
        var currentGeneration = 1
        while (currentGeneration <= this.generationsCount) {
            // reset Temp population
            this.tempPopulation = [];

            // Fitness Evaluation
            await this.evaluateFitness();
            await this.sortSolutionsDescending();
            await this.updateBestSolutionAndFitness();

            // add to convergence
            this.convergence.push(this.bestFitness);

            // log current generation
            this.log(currentGeneration);

            // real-time plotting
            this.plot(currentGeneration);

            // Elitism
            var elitismCount = 0;
            if (this.enableElitism == 1) {
                this.elitism();
                elitismCount = 1;
            }

            for (let s = elitismCount; s < this.solutionsCount; s++) {
                // Parent Selection
                var parent1 = this.selectParent();
                var parent2 = this.selectParent();
                var offspring = [];

                // Crossover
                let randNum = Math.random();
                if (this.crossoverProbability >= randNum) {
                    // perform crossover
                    offspring = this.doCrossOver(parent1, parent2)
                } else {
                    // take current solution
                    offspring = this.population[s];
                }

                // Mutation
                let randNum2 = Math.random();
                if (this.mutationprobability >= randNum2) {
                    // perform mutation
                    offspring = this.mutation(offspring);
                }

                // add child to temp population
                this.tempPopulation.push(offspring);
            }

            // update current population - will be used as a start for next generation
            this.population = this.tempPopulation

            // increament generations
            currentGeneration += 1;
        }

        // return best solution and its fitness
        return {
            bestSolution: this.bestSolution,
            bestFitness: this.bestFitness,
            Convergence: []
        }
    }

    // estimate parent selection technique based on user's choice
    async setParentSelectionTechnique(parentSelectionTechnique) {
        // default parent selection method
        var parentSelectionMethod = this.rouletteWheel_Selection;

        if (parentSelectionTechnique == 1) {
            parentSelectionMethod = this.rouletteWheel_Selection;
        }
        else if (parentSelectionTechnique == 2) {
            parentSelectionMethod = this.rank_Selection;
        }
        else if (parentSelectionTechnique == 3) {
            parentSelectionMethod = this.tournament_Selection
        }

        this.parentSelectionMethod = parentSelectionMethod;
    }

    async setCrossoverTechnique(crossOverTechnique) {
        // default crossover technique
        var crossover = this.singlePoint_Corssover;

        if (crossOverTechnique == 1) {
            crossover = this.singlePoint_Corssover;
        }
        else if (crossOverTechnique == 2) {
            crossover = this.twoPoints_Crossover;
        }
        else if (crossOverTechnique == 3) {
            crossover = this.uniform_Crossover;
        }

        this.crossoverMethod = crossover;
    }

    /*
     * initialize population before starting the optimization process
     * Binary encoding is used to represent solutions
     */
    initializePopulation() {
        for (let i = 0; i < this.solutionsCount; i++) {
            // solution
            this.population.push(this.getRandomSolution())

            // fitness value
            this.fitness_values.push(NaN);
        }
    }

    // get a random solution
    getRandomSolution() {
        var sol = []
        for (let g = 0; g < this.genesCount; g++) {
            // 0 or 1 randomly
            sol.push(Math.round(Math.random()))
        }

        return sol;
    }

    // Calcualte fitness values for all individuals
    async evaluateFitness() {
        for (let s = 0; s < this.solutionsCount; s++) {
            this.fitness_values[s] = this.fitnessFunction(this.population[s]);
        }
    }

    // sort solutions based on their fitness value
    async sortSolutionsDescending() {
        var sortedIndexes = Array.from(this.population.keys())
            .sort((a, b) => this.fitness_values[a] < this.fitness_values[b] ? -1 : (this.fitness_values[b] < this.fitness_values[a]) | 0)
            .reverse();

        var sortedPopulation = []
        for (let idx of sortedIndexes) {
            sortedPopulation.push(this.population[idx])
        }

        this.population = sortedPopulation;

        // sort fitness values descending
        this.fitness_values.sort((a, b) => b - a)
    }

    // update best solution and best fitness 
    // should be called after fitness eval and sorting
    async updateBestSolutionAndFitness() {
        this.bestSolution = this.population[0];
        this.bestFitness = this.fitness_values[0];
    }

    // perform elitism
    elitism() {
        // copy first [best] solution to temporary population
        this.tempPopulation.push(this.population[0])
    }

    // select a new parent using the selected parent selection technique
    selectParent() {
        return this.parentSelectionMethod();
    }

    /*
     * RouletteWheel Selection Technique
     * The fitter individual has greater chance to be selected.
     * May lead to premature convergence and loss of diversity.
     */
    rouletteWheel_Selection() {
        // Total sum of fitness values
        let sumFitness = this.fitness_values.reduce((a, b) => a + b);

        // random point on the circle (random sum) 
        var randomPoint = Math.random() * sumFitness;

        var currentSum = 0;
        // Loop through solutions and add their sum
        for (let s = 0; s < this.solutionsCount; s++) {
            // add sum of the current solution
            currentSum += this.fitness_values[s];

            // if currenSum exceed the random sum -> select solution
            if (currentSum > randomPoint) {
                return this.population[s];
            }
        }

        // return the first solution otherwise
        return this.population[0];
    }

    /*
     * Rank Selection Technique
     * A parent selection technique to overcome the limitation of Roulette Wheel Selection.
     * Each individual has an almost equal share of the pie.
     */
    rank_Selection() {
        // generate ranks (n, n-1, n-2, n-3, .., 1)
        var ranks = [...Array(this.solutionsCount).keys()].map(n => n + 1).reverse();
        var sumRank = ranks.reduce((a, b) => a + b);

        // random point on the circle (random sum) 
        var randomPoint = Math.random() * sumRank;

        var currentSum = 0;

        // Loop through solutions and add their sum
        for (let s = 0; s < this.solutionsCount; s++) {
            // add sum of the current solution
            currentSum += ranks[s];

            // if currenSum exceed the random sum -> select solution
            if (currentSum > randomPoint) {
                return this.population[s];
            }
        }

        // return the first solution otherwise
        return this.population[0];
    }

    /* 
     * Tournament Selection Technique
     * Select K individuals from the population at random and select the best out to become a parent.
     */
    tournament_Selection() {
        // get random subset of solutions
        var randIndexSubset = [...Array(this.solutionsCount).keys()].sort(() => 0.5 - Math.random()).slice(0, this.tournamentSize)

        // sort by fitness desc
        randIndexSubset.sort((a, b) => this.fitness_values[a] < this.fitness_values[b] ? -1 : (this.fitness_values[b] < this.fitness_values[a]) | 0).reverse();

        // return best
        return this.population[randIndexSubset[0]]
    }

    // perform crossover
    doCrossOver(parent1, parent2) {
        // single-point crossover
        return this.crossoverMethod(parent1, parent2);
    }

    // single-point crossover
    singlePoint_Corssover(parent1, parent2) {
        var randomPoint = Math.floor(Math.random() * this.genesCount)

        var child = [];
        for (let g = 0; g < this.genesCount; g++) {
            if (g < randomPoint) {
                child.push(parent1[g])
            } else {
                child.push(parent2[g])
            }
        }

        return child;
    }

    // two points crossover
    twoPoints_Crossover(parent1, parent2) {
        // get random two points
        var points = [...Array(6).keys()].sort(() => 0.5 - Math.random()).slice(0, 2).sort()

        var child = [];
        for (let g = 0; g < this.genesCount; g++) {
            if (g < points[0] || g > points[1]) {
                child.push(parent1[g]);
            } else {
                child.push(parent2[g]);
            }
        }

        return child;
    }

    // uniform crossover
    uniform_Crossover(parent1, parent2) {
        var child = [];
        for (let g = 0; g < this.genesCount; g++) {
            if (Math.random() >= 0.5) {
                child.push(parent1[g]);
            } else {
                child.push(parent2[g]);
            }
        }

        return child;
    }

    // perform mutation
    mutation(solution) {
        // flip mutation
        var randomPoint = Math.floor(Math.random() * this.genesCount);
        solution[randomPoint] = (solution[randomPoint] == 1) ? 0 : 1;

        return solution;
    }

    // log current generation
    log(generationNum) {
        console.log("Generation = " + generationNum + ", Best Fitness = " + this.bestFitness, ', Best Solution = ' + this.bestSolution);
        console.log("---------------------------------------------------")
    }

    /*
     * call external plot/log function
     * used for plotting convergence curve and logging
     */
    plot(generationNum) {
        if (typeof this.plotFunc == 'function') {
            this.plotFunc(generationNum, this.bestFitness)
        }
    }
}