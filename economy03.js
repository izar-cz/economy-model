

export class Economy {
	init (settlement) {
		this.settlement = settlement;
		let dynamic = window.location.search.substr(1)
		this.dynamic = '' === dynamic ? 0.5 : +dynamic;
		
		// initial "old stock" equals to current stock
		this.oldStock = {};
		this.settlement.forEachComodity((name, comodity) => {
			this.oldStock[name] = comodity.stock;
		});
	}
	refreshPrice(price, comodityStock, delta) {
		if ( 0 >= comodityStock ) {
			if ( 0 > delta ) {
				let missingPerCapita = (-delta / this.settlement.population);
				console.warn(`missing comodity, increasing price ${price} by factor ${2 + 1.05 ** missingPerCapita}`)
				return price * (2 + 1.05 ** missingPerCapita);
			} else {
				return price;
			}
		}

		/**
		 * time in ticks => price changing factor
		 */		 		
		var factor = ticks => 1/(ticks+1) + 1;

		// stock is not completly depleted
		if ( 0 == delta ) {
			return price;
		} else if (0 > delta) { // decreasing stock
			let remainingTicks = (comodityStock / -delta);
			return price * factor(remainingTicks);
		} else { // increasing stock
			let ticksFromZero = (comodityStock / delta);
			return price / factor(ticksFromZero);
		}
	}
	refreshPrices() {
		this.settlement.forEachComodity((name, comodity) => {
			let delta = comodity.stock + comodity.missing - this.oldStock[name];
			// comodity.missing should be non-positive
			let newPrice = this.refreshPrice(comodity.price, comodity.stock, delta);
			console.log(`updating price of ${name} : ${comodity.price} -> ${newPrice} (${comodity.stock} + ${delta})`);
			
			comodity.price = newPrice;
			this.oldStock[name] = comodity.stock;
		});
	}
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
				job._rating = 3;
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
			job.jobs = Math.floor((1-this.dynamic) * job.jobs + this.dynamic * newJobs);
			if (job.jobs < 0) {
				throw new Error("negative jobs");
			}
			totalWorkers += job.jobs;
		});
		if (bestJob) {
			bestJob.jobs += this.settlement.population - totalWorkers;
			if (bestJob.jobs < 0) {
				throw new Error("negative jobs");
			}
		}
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






















