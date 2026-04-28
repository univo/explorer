import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { TransactionView } from "@/views/tx-view";
import { TransactionSchema } from "@/components/views";

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
