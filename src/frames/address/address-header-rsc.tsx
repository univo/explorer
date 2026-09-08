import { getAddress } from "viem";

import type { Account } from "@/state/account";
import { EtherscanIcon } from "@/components/icons";
import { IconButton } from "@/components/icon-button";
import { CopyButton } from "@/components/copy-button";
import { getEnsNameForAccount } from "@/cache/ens/ens";
import { CloseFrameButton } from "@/components/frames";
import { AddressEventFilters } from "./address-event-filters";
import { getAccount, getAccountName } from "@/state/account";

// TODO
// On the server we should query for a list of distinct table ids for this account and provide that to
// the event filters. This header can be cached very aggressively and is okay if it's stale. This query
// should be reasonably fast anyway with Postgres 18 index skip scans of our timestamp column. This requires
// a select distinct query which is probably best implemented as a standalone table with a pk index over
// each (account, table_id) using on conflict ignore

export async function AddressHeaderRsc(props: { address: `0x${string}` }) {
	const [account, ens] = await Promise.all([
		getAccount({ chain: 1, address: props.address }),
		getEnsNameForAccount({ chain: 1, address: props.address }),
	]);

	const showAddress = account === null && ens === null;

	return (
		<div className="bg-white p-3 border-b border-gray-200">
			<div className="flex items-center justify-between">
				<AddressOrName address={props.address} account={account} ens={ens} />

				<div className="flex items-center gap-2">
					{showAddress === false && <CopyButton value={props.address} />}

					<IconButton href={`https://etherscan.io/address/${props.address}`}>
						<EtherscanIcon className="shrink-0 size-4" />
					</IconButton>

					<CloseFrameButton />
				</div>
			</div>

			<AddressEventFilters address={props.address} />
		</div>
	);
}

function AddressOrName(props: { address: `0x${string}`; account: Account | null; ens: string | null }) {
	const name = props.account ? getAccountName(props.account) : props.ens;
	const showAddress = props.account === null && props.ens === null;

	if (showAddress) {
		return (
			<div className="flex items-center gap-2 overflow-hidden">
				<p className="text-gray-900 font-semibold text-base select-all">Account</p>
				<p className="text-gray-500 text-base select-all truncate">{getAddress(props.address)}</p>
			</div>
		);
	}

	return <p className="text-gray-900 font-semibold text-base select-all truncate">{name}</p>;
}
