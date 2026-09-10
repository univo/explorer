import { aggregate } from "./aggregate";

import { event as log_erc20_transfer_v1 } from "@/events/log_erc20_transfer_v1/event";

export const balances_v1 = aggregate({
	id: "balances_v1",

	events: [log_erc20_transfer_v1],

	handlers: {
		map: (transfer) => {
			return [
				[[transfer.to_address, "erc20", transfer.token_address].join(":"), BigInt(transfer.quantity)],
				[[transfer.from_address, "erc20", transfer.token_address].join(":"), -BigInt(transfer.quantity)],
			];
		},

		reduce: (result, value) => {
			return result + value;
		},
	},
});
