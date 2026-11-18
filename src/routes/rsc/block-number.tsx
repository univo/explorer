import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { BlockNumberSchema, ChainStringSchema } from "@/schema";
import { BlockNumberRsc } from "@/frames/2-chain-block-number/2-chain-block-number-rsc";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(
		v.object({
			chain: ChainStringSchema,
			number: BlockNumberSchema,
		}),
	)
	.handler(({ data }) => {
		return renderToReadableStream(
			<BlockNumberRsc
				chain={data.chain}
				number={data.number} //
			/>,
		);
	});

export const Route = createFileRoute("/rsc/block-number")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const number = search.get("number");
				if (number === null) throw new Error("Expected number");

				const chain = search.get("chain");
				if (chain === null) throw new Error("Expected chain");

				const stream = await getFlightStream({ data: { chain, number } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
