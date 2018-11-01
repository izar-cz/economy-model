export class Settlement {
	constructor(state, economy) {
		for (var key in state) {
			this[key] = state[key];
		}
		// precompute total of input /output comodities for each job
		this.infrastructure.forEach(i => {
			if (i.recipe) {
				i.inputs = 0;
				i.outputs = 0;
				for (var comodityName in i.recipe) {
					var delta = i.recipe[comodityName];
					delta < 0
						? (i.inputs -= delta)
						: (i.outputs += delta);
				}
			}
		});
		this.economy = economy;
		this.economy.init(this);
		this.age = 0;
	}
	tick() {
		console.log(`=== TICK ${++this.age}===`);
		console.log(this.debugInfo());
		
		this.forEachComodity((_,comodity) => comodity.missing = 0); // reset "missing" counters
		
		this.doInfrastructure();
		this.satisfyNeeds();
		
		this.refreshPrices();
		this.reorganizeJobs();
	}

	doInfrastructure() {
		this.infrastructure.forEach(i => {
			if ('recipe' in i) {
				this.applyEffect(i.recipe, i.jobs);
			}
			if ('effect' in i) {
				this.applyEffect(i.effect);
			}
		});
	}
	
	satisfyNeeds() {
		this.forEachComodity((name, comodity) => {
			if (comodity.need) {
				//TODO
				let needPerCapita = comodity.need[1]
					? comodity.need[1]
					: 50 / comodity.price;
				if (comodity.stock > this.population * needPerCapita) {
					comodity.stock -= Math.round(this.population * needPerCapita);
				} else {
					if (comodity.stock < this.population * comodity.need[0]) {
						comodity.missing -= this.population * comodity.need[0] - comodity.stock;
						console.warn(`not enough ${name} to satisfy basic needs (${comodity.stock}/${this.population * comodity.need[0]})`);
					}
					comodity.stock = 0;
				}
			}
		});
	}
	refreshJobBilance(priceCallback = undefined) {
		if (undefined === priceCallback) {
			priceCallback = comodityName => this.comodity[comodityName].price;
		}
		this.forEachInfrastructureJob(job => {
			job.bilance = 0;
			for (let comodityName in job.recipe) {
				job.bilance += job.recipe[comodityName] * priceCallback(comodityName);
			}
		});
	}

	refreshPrices() {
		this.economy.refreshPrices();
	}
	reorganizeJobs() {
		this.economy.reorganizeJobs();
	}
	applyEffect(effect, count = 1) {
		//console.log('effect:', effect, ' * ', count);
		let maxCount = Infinity;
		let missing = 0;
		for (var comodity in effect) {
			if (effect[comodity] < 0) {
				maxCount = Math.min(maxCount,
					Math.floor(-this.comodity[comodity].stock / effect[comodity])
				);
			}
		}
		if (maxCount < count) {
			console.warn("not enough resources for", effect, `doing only ${maxCount}/${count}`);
			missing = count - maxCount;
			count = maxCount;
		}
		for (var comodity in effect) {
			this.comodity[comodity].stock += effect[comodity] * count;
			if (effect[comodity] < 0) {
				// missing should be non-positive
				this.comodity[comodity].missing += effect[comodity] * missing;
			}
			if (this.comodity[comodity].stock < 0) {
				console.error("comodity underflow", comodity, this.comodity[comodity].stock);
			}
		}
	}
	forEachInfrastructureJob(cb) {
		return this.infrastructure.forEach(i => i.recipe && cb(i));
	}
	forEachComodity(cb) {
		return Object.entries(this.comodity).forEach(([cn,c]) => cb(cn,c));
	}
	debugInfo() {
		function formatNumber(number) {
			if (!number) return 0;
			return number.toFixed( // use at least two signifficant digits
				Math.max(0, 1+Math.ceil(Math.log10(1/number)))
			);
		}
		return this.infrastructure.map(i => i.recipe
			? `${i.name}: ${i.jobs}@${formatNumber(i.bilance)}`
			: i.name
		).join(', ') +
		"\n" +
		Object.entries(this.comodity).map(([name, c]) => {
			return `${name}: ${c.stock}@${formatNumber(c.price)}`
		}).join(', ');
		
	}
}


export var settlement1 = {
	comodity: {
		water: {
			stock: 1000,
			price: 10,
			need: [8, 10, 20],
		},
		grain: {
			stock: 300,
			price: 30,
		},
		food: {
			stock: 200,
			price: 60,
			need: [4, 10, 20],
		},
		booze: {
			stock: 100,
			//price: 80,
			price: 30,
			need: [0,  0, 20],
		},
		goods: {
			stock: 100,
			price: 100,
			need: [0,  0, 20],
		},
	},
	population: 100,
	infrastructure: [{
		name: 'well',
		effect: {
			water: +1200,
		},
	}, {
		name: 'field',
		jobs: 45,
		maxJobs: 80,
		recipe: {
			grain: +40, //  +1200
			// food: +10,
		},
	}, {
		name: 'bakery',
		jobs: 30,
		maxJobs: 50,
		recipe: {
			grain: -40, //  -1200
			food: +40,  //  +2400
		},              //= +1200
	}, {
		name: 'still',
		jobs: 15,
		maxJobs: 40,
		recipe: {
			grain: -20, //   -600
			water: -40, //   -400
			booze: +40, //  +4000
		},              //= +3000
	}, {
		name: 'workshop',
		jobs: 10,
		maxJobs: 40,
		recipe: {
			goods: +30,
		},
	}],
};
