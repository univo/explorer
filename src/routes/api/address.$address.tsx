import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { AddressView } from "@/views/address-view";
import { AddressSchema } from "@/components/views";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ address: AddressSchema }))
	.handler(({ data }) => renderToReadableStream(<AddressView address={data.address} />));

export const Route = createFileRoute("/api/address/$address")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const stream = await getFlightStream({ data: { address: params.address } });

				return new Response(stream, {
					headers: {
						"Content-Type": "text/x-component",
					},
				});
			},
		},
	},
});
