import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { TransactionSchema } from "@/schema";
import { TransactionView } from "@/views/tx-view";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ tx: TransactionSchema }))
	.handler(({ data }) => renderToReadableStream(<TransactionView tx={data.tx} />));

export const Route = createFileRoute("/api/tx/$tx")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const stream = await getFlightStream({ data: { tx: params.tx } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
