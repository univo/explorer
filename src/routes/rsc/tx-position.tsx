import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { TxPositionRsc } from "@/frames/1-chain-tx-position/1-chain-tx-position-rsc";
import { BlockNumberSchema, ChainStringSchema, TxIndexSchema } from "@/schema";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(
		v.object({
			chain: ChainStringSchema,
			block: BlockNumberSchema,
			tx: TxIndexSchema,
		}),
	)
	.handler(({ data }) => {
		return renderToReadableStream(<TxPositionRsc chain={data.chain} block={data.block} tx={data.tx} />);
	});

export const Route = createFileRoute("/rsc/tx-position")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const block = search.get("block");
				if (block === null) throw new Error("Expected block");

				const tx = search.get("tx");
				if (tx === null) throw new Error("Expected tx");

				const chain = search.get("chain");
				if (chain === null) throw new Error("Expected chain");

				const stream = await getFlightStream({ data: { chain, block, tx } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
