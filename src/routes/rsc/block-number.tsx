import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { BlockNumberSchema } from "@/schema";
import { BlockNumberServer } from "@/views/block-number/block-number-server";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ number: BlockNumberSchema }))
	.handler(({ data }) => renderToReadableStream(<BlockNumberServer number={data.number} />));

export const Route = createFileRoute("/rsc/block-number")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const search = new URL(request.url).searchParams;

				const number = search.get("number");
				if (number === null) throw new Error("Expected number");

				const stream = await getFlightStream({ data: { number } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
