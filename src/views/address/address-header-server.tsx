import { EtherscanIcon } from "@/components/icons";
import { CloseViewButton } from "@/components/views";
import { IconButton } from "@/components/icon-button";
import { getAccount, getAccountName, type Account } from "@/state/account";

export async function AddressHeaderServer(props: { address: `0x${string}` }) {
	const account = await getAccount({ chain: 1, address: props.address });

	if (account === null) {
		return (
			<div className="bg-white px-3 py-3 flex items-center justify-between border-b border-gray-200">
				<div className="flex items-center gap-2 overflow-hidden">
					<p className="text-gray-900 font-semibold text-base select-all">Account</p>
					<p className="text-gray-500 text-base select-all truncate">{props.address}</p>
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

	return <AccountHeader account={account} />;
}

function AccountHeader(props: { account: Account }) {
	return (
		<div className="bg-white px-3 py-3 flex items-center justify-between border-b border-gray-200">
			<div className="flex items-center gap-1 overflow-hidden">
				<p className="text-gray-900 font-semibold text-base select-all truncate">{getAccountName(props.account)}</p>
			</div>

			<div className="flex items-center gap-2">
				<IconButton href={`https://etherscan.io/address/${props.account.address}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseViewButton />
			</div>
		</div>
	);
}
