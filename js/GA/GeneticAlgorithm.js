class GeneticAlgorithm {
    constructor(generationsCount, solutionsCount, genesCount, fitnessFunc, parentSelectionTechnique, 
                crossoverProbability, mutationprobability, enableElitism, LogFunc) {
        // get control parameters
        this.generationsCount = generationsCount;
        this.solutionsCount = solutionsCount;
        this.genesCount = genesCount;
        this.parentSelectionTechnique = parentSelectionTechnique;
        this.crossoverProbability = crossoverProbability;
        this.mutationprobability = mutationprobability;
        this.fitnessFunction = fitnessFunc;
        this.enableElitism = enableElitism;
        this.plotFunc = plotFunc;

        // estimate parent selection technique
        this.parentSelectionMethod = undefined;
        this.setParentSelectionTechnique()

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
                    offspring = this.crossOver(parent1, parent2)
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
    setParentSelectionTechnique() {
        // default parent selection method
        var parentSelectionMethod = this.rouletteWheel_Selection;

        if (this.parentSelectionTechnique == 1) {
            parentSelectionMethod = this.rouletteWheel_Selection;
        }
        else if (this.parentSelectionTechnique == 2) {
            parentSelectionMethod = this.Rank_Selection;
        }
        else if (this.parentSelectionTechnique == 3) {
            parentSelectionMethod = this.Tournament_Selection
        }

        this.parentSelectionMethod = parentSelectionMethod;
    }

    // initialize population before starting the optimization process
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

    // perform crossover
    crossOver(parent1, parent2) {
        // single-point crossover
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

    plot(generationNum) {
        if (typeof this.plotFunc == 'function') {
            this.plotFunc(generationNum, this.bestFitness)
        }
    }

    // RouletteWheel Selection Technique
    rouletteWheel_Selection() {
        let sumFitness = this.fitness_values.reduce((a, b) => a + b);
        var randomPoint = Math.random() * sumFitness;

        var currentSum = 0;
        for (let s = 0; s < this.solutionsCount; s++) {
            currentSum += this.fitness_values[s];
            if (currentSum > randomPoint) {
                return this.population[s];
            }
        }

        return this.population[0];
    }

    // Rank Selection Technique
    rank_Selection() {

    }

    // Tournament Selection Technique
    tournament_Selection() {

    }
}