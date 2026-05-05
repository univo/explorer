import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { BlockNumberSchema } from "@/schema";
import { BlockNumberView } from "@/views/block-number-view";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ number: BlockNumberSchema }))
	.handler(({ data }) => renderToReadableStream(<BlockNumberView number={data.number} />));

export const Route = createFileRoute("/api/block-number/$number")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const stream = await getFlightStream({ data: { number: params.number } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
