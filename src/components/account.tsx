import clsx from "clsx";
import { getAddress } from "viem";

import { Hoverable } from "./hoverable";
import type { Chain } from "@/constants";
import { AddFrameButton } from "./frames";
import { getEnsNameForAccount } from "@/cache/ens/ens";
import { getAccount, getAccountName } from "@/state/account";

export async function Account(props: { chain: Chain; address: `0x${string}` }) {
	const [account, ens] = await Promise.all([
		getAccount({ chain: props.chain, address: props.address }),
		getEnsNameForAccount({ chain: props.chain, address: props.address }),
	]);

	const address = getAddress(props.address);
	const name = account ? getAccountName(account) : ens;
	const showAddress = account === null && ens === null;

	return (
		<Hoverable id={`${props.chain}:${address}`}>
			<AddFrameButton
				frame={address}
				className={clsx(
					"select-none cursor-pointer truncate", //
					showAddress && "inline-block align-top w-18 lg:w-24",
				)}
			>
				{showAddress ? address : name}
			</AddFrameButton>
		</Hoverable>
	);
}
