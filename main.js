import { Settlement, settlement1 } from "./settlement.js";
//import { Economy } from "./economy01.js";
//import { Economy } from "./economy02.js";
import { Economy } from "./economy03.js";

function main() {

	var economy = new Economy();
	var settlement = new Settlement(settlement1, economy);
	var ticks = 100; // number of ticks to generate
	var view = new SettlementView();
	var timer = window.setInterval(() => {
		try {
			settlement.tick();
			view.display(settlement);
		} catch (e) {
			window.clearInterval(timer);
			throw e;
		}
		if (!--ticks) {
			window.clearInterval(timer);
		}
	}, 500);
}

class SettlementView {
	constructor() {
		this.elJob = document.getElementById('job');
		this.elMarket = document.getElementById('market');
		this.elStock = document.getElementById('stock');
	}
	displayRow(prefix, el, data) {
		let marks = data.map(([name, value]) =>
			`<div class="mark ${prefix}${name}" style="flex-basis: ${value}em"></div>`
		).join('');

		var div = document.createElement('div');
		div.className = "tick";
		div.innerHTML = marks;
		el.append(div);
	}
	display(settlement) {
		this.displayRow('j-', this.elJob,
			settlement.infrastructure.map(i => i.jobs && [i.name, i.jobs]).filter(Boolean)
		);
		this.displayRow('c-', this.elMarket,
			Object.entries(settlement.comodity).map(([cn,c]) => [cn,c.price])
		);
		this.displayRow('c-', this.elStock,
			Object.entries(settlement.comodity).map(([cn,c]) => [cn,c.stock])
		);
	}
}

main();

