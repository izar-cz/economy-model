

export class Economy {
	init (settlement) {
		this.settlement = settlement;
	}
	refreshPrices() {
		// // compute total price of all comodities in stock
		// Check satisfied needs. Increase prices of missing comodities.
		// Check stocks. Reduce price of superfluous comodities.
		// ?? check inputs/outputs of most/least profitable jobs

		var newPrices = {};
		this.settlement.forEachComodity(comodityName => newPrices[comodityName] = 0);

		var priceEstimate = (comodityName) => {
			let newPrice = comodityName in newPrices ? newPrices[comodityName] : 0;
			let oldPrice = this.settlement.comodity[comodityName].price;
			return (oldPrice + newPrice) / 2;
		}

		// consider basic needs
		this.settlement.forEachComodity((name, comodity) => {
			if (comodity.need) {
				var [toSurvive, toLive, toLuxury] = comodity.need;
				var stockPerCapita = comodity.stock / this.settlement.population;
				// TODO: smooth the function
				if (stockPerCapita < toSurvive) {
					newPrices[name] = 100;
				} else if (stockPerCapita < toLive) {
					newPrices[name] = 50 + 50 * (toLive - stockPerCapita) / (toLive - toSurvive);
				} else if (stockPerCapita < toLuxury) {
					newPrices[name] = 5 + 45 * (toLuxury - stockPerCapita) / (toLuxury - toLive);
				} else {
					newPrices[name] = Math.min(0.001, 5 * toLuxury / stockPerCapita);
				}
			}
		});
		//console.log("newPrices<", newPrices)

		// industry needds
		this.settlement.refreshJobBilance(priceEstimate);
		this.settlement.forEachInfrastructureJob(job => {
			//console.log("JOB", job.recipe, bilance)
			if (job.bilance > 0) {
				for (var comodityName in job.recipe) {
					var delta = job.recipe[comodityName];
					if (delta < 0) {
						let inputPrice = 0.5 * job.bilance * (-delta / job.inputs) / job.outputs;
						//console.log("JOB price", comodityName, inputPrice);
						newPrices[comodityName] += inputPrice;
					}
				}
			}
		});

		// apply new prices (average with previous prices)
		console.log("newPrices<", newPrices)
		this.settlement.forEachComodity((comodityName, comodity) => comodity.price = priceEstimate(comodityName));

	}
// 	refreshJobBilance(priceCallback = undefined) {
// 		if (undefined === priceCallback) {
// 			priceCallback = comodityName => this.settlement.comodity[comodityName].price;
// 		}
// 		this.settlement.forEachInfrastructureJob(job => {
// 			job.bilance = 0;
// 			for (let comodityName in job.recipe) {
// 				job.bilance += job.recipe[comodityName] * priceCallback(comodityName);
// 			}
// 		});
// 	}
	reorganizeJobs() {
		var newJobs = {};
		this.settlement.refreshJobBilance();
		var maxBilance = 0;
		var bestJob = null;
		this.settlement.forEachInfrastructureJob(job => {
			if (job.bilance > maxBilance) {
				maxBilance = job.bilance;
				bestJob = job;
			}
		});
		var totalRating = 0;
		this.settlement.forEachInfrastructureJob(job => {
			if (job.bilance < 0.2 * maxBilance) {
				job._rating = 1;
			} else if (job.bilance < 0.4 * maxBilance) {
				job._rating = job.jobs / 2;
			} else if (job.bilance < 0.8 * maxBilance) {
				job._rating = job.jobs;
			} else {
				job._rating = job.jobs * 2;
			}
			totalRating += job._rating;
		});
		var totalWorkers = 0;
		this.settlement.forEachInfrastructureJob(job => {
			let newJobs = job._rating * this.settlement.population / totalRating;
			job.jobs = Math.ceil((job.jobs + newJobs) / 2);
			totalWorkers += job.jobs;
		});
		bestJob.jobs += this.settlement.population - totalWorkers;
		console.log('working: ', totalWorkers, ' total:', this.settlement.population);
		
		// compute net profit for each infrastructure with job
// 		jobProfits = {bakery: +1200, still: +3000, field: +1200};
// 		minProfit = +1200;
// 		maxProfit = +3000;
// 		for (job in jobProfits) {
// 			// relocate some peaople from non-profitable jobs to the more profitable
// 		}
		//
// 		/// transfer given number of workers from one guild to another
// 		function migrate(number, fromGuild, toGuild) {
// 			let transferWorkers = Math.min(number, fromGuild.workers, toGuild.maxWorkers - toGuild.workers);
// 			if (transferWorkers != number) {
// 				console.warn("TODO");
// 			}
// 			let transferWelth = fromGuild.wealth / fromGuild.workers * transferWorkers;
// 			fromGuild.workers -= transferWorkers;
// 			toGuild.workers += transferWorkers;
// 			fromGuild.wealth -= transferWelth;
// 			toGuild.wealth += transferWelth;
// 		}

	}


}

