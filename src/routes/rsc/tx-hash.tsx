import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { ChainStringSchema, TxHashSchema } from "@/schema";
import { TxHashRsc } from "@/frames/4-chain-tx-hash/4-chain-tx-hash-rsc";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(
		v.object({
			chain: ChainStringSchema,
			tx_hash: TxHashSchema,
		}),
	)
	.handler(({ data }) => {
		return renderToReadableStream(<TxHashRsc chain={data.chain} tx_hash={data.tx_hash} />);
	});

export const Route = createFileRoute("/rsc/tx-hash")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const tx_hash = search.get("tx_hash");
				if (tx_hash === null) throw new Error("Expected tx_hash");

				const chain = search.get("chain");
				if (chain === null) throw new Error("Expected chain");

				const stream = await getFlightStream({ data: { chain, tx_hash } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
