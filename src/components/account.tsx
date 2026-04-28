import { Hoverable } from "./hoverable";
import { getAccount } from "@/state/account";
import { AddViewButton } from "./add-view-button";

export async function Account(props: { chain: number; address: `0x${string}` }) {
	const account = await getAccount({ chain: props.chain, address: props.address });

	if (account.name_tag) {
		return (
			<Hoverable id={props.chain + props.address}>
				<AddViewButton view={props.address} className="select-none cursor-pointer">
					{account.name_tag}
				</AddViewButton>
			</Hoverable>
		);
	}

	return (
		<Hoverable id={props.chain + props.address}>
			<AddViewButton
				view={props.address}
				className="select-none cursor-pointer truncate inline-block align-top w-18 lg:w-24"
			>
				{props.address}
			</AddViewButton>
		</Hoverable>
	);
}
