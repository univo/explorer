import { aggregate } from "./aggregate";

import { event as log_erc20_transfer_v2 } from "@/events/log_erc20_transfer_v2/event";
import { event as log_erc721_transfer_v2 } from "@/events/log_erc721_transfer_v2/event";

export const balances_v1 = aggregate({
	id: "balances_v1",

	events: [log_erc20_transfer_v2, log_erc721_transfer_v2],

	handlers: {
		map: (transfer) => {
			if (transfer.tag === "log_erc721_transfer_v2") {
				return [
					[[transfer.to_address, "erc721", transfer.token_address, transfer.token_id].join(":"), 1n],
					[[transfer.from_address, "erc721", transfer.token_address, transfer.token_id].join(":"), -1n],
				];
			}

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
