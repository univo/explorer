import clsx from "clsx";
import { getAddress } from "viem";

import { Hoverable } from "./hoverable";
import { AddViewButton } from "./views";
import type { Chain } from "@/constants";
import { getEnsNameForAccount } from "@/cache/ens/ens";
import { getAccount, getAccountName } from "@/state/account";

export async function Account(props: { chain: Chain; address: `0x${string}` }) {
	const [account, ens] = await Promise.all([
		getAccount({ chain: props.chain, address: props.address }),
		getEnsNameForAccount({ chain: props.chain, address: props.address }),
	]);

	const name = account ? getAccountName(account) : ens;
	const showAddress = account === null && ens === null;

	return (
		<Hoverable id={`${props.chain}:${props.address}`}>
			<AddViewButton
				view={props.address}
				className={clsx(
					"select-none cursor-pointer truncate", //
					showAddress && "inline-block align-top w-18 lg:w-24",
				)}
			>
				{showAddress ? getAddress(props.address) : name}
			</AddViewButton>
		</Hoverable>
	);
}
