import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { getAccount } from "@/state/account";
import { Fragment } from "react/jsx-runtime";
import { AddressSchema } from "@/components/views";
import { EtherscanIcon } from "@/components/icons";
import { IconButton } from "@/components/icon-button";
import { CloseViewButton } from "@/components/close-view-button";

async function AddressHeader(props: { address: `0x${string}` }) {
	const account = await getAccount({ chain: 1, address: props.address });

	return (
		<div className="bg-white px-3 py-3 flex items-center justify-between border-b border-gray-200">
			<div className="flex items-center gap-2 overflow-hidden">
				{account.name_tag === null ? (
					<Fragment>
						<p className="text-gray-900 font-semibold text-base select-all">Account</p>
						<p className="text-gray-500 text-base select-all truncate">{account.address}</p>
					</Fragment>
				) : (
					<p className="text-gray-900 font-semibold text-base select-all truncate">{account.name_tag}</p>
				)}
			</div>

			<div className="flex items-center gap-2">
				<IconButton href={`https://etherscan.io/address/${account.address}`}>
					<EtherscanIcon className="shrink-0 size-4" />
				</IconButton>

				<CloseViewButton view={account.address} />
			</div>
		</div>
	);
}

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ address: AddressSchema }))
	.handler(({ data }) => renderToReadableStream(<AddressHeader address={data.address} />));

export const Route = createFileRoute("/rsc/AddressHeader")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const address = search.get("address");
				if (address === null) throw new Error("Expected request address");

				const stream = await getFlightStream({ data: { address } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
