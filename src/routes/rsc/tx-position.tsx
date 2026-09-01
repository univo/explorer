import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { BlockNumberSchema, TxIndexSchema } from "@/schema";
import { TxPositionRsc } from "@/frames/tx-position/tx-position-rsc";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ block: BlockNumberSchema, tx: TxIndexSchema }))
	.handler(({ data }) => renderToReadableStream(<TxPositionRsc block={data.block} tx={data.tx} />));

export const Route = createFileRoute("/rsc/tx-position")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const block = search.get("block");
				if (block === null) throw new Error("Expected block");

				const tx = search.get("tx");
				if (tx === null) throw new Error("Expected tx");

				const stream = await getFlightStream({ data: { block, tx } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
