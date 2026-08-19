import { Fragment } from "react";
import { getAddress } from "viem";

import { EtherscanIcon } from "@/components/icons";
import { CloseViewButton } from "@/components/views";
import { IconButton } from "@/components/icon-button";
import { getEnsNameForAccount } from "@/cache/ens/ens";
import { getAccount, getAccountName } from "@/state/account";

export async function AddressHeaderRsc(props: { address: `0x${string}` }) {
	const [account, ens] = await Promise.all([
		getAccount({ chain: 1, address: props.address }),
		getEnsNameForAccount({ chain: 1, address: props.address }),
	]);

	const name = account ? getAccountName(account) : ens;
	const showAddress = account === null && ens === null;

	return (
		<div className="bg-white px-3 py-3 flex items-center justify-between border-b border-gray-200">
			<div className="flex items-center gap-2 overflow-hidden">
				{showAddress ? (
					<Fragment>
						<p className="text-gray-900 font-semibold text-base select-all">Account</p>
						<p className="text-gray-500 text-base select-all truncate">{getAddress(props.address)}</p>
					</Fragment>
				) : (
					<p className="text-gray-900 font-semibold text-base select-all truncate">{name}</p>
				)}
			</div>

			<div className="flex items-center gap-2">
				<IconButton href={`https://etherscan.io/address/${props.address}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseViewButton />
			</div>
		</div>
	);
}
