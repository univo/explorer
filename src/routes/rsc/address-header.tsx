import * as v from "valibot";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { renderToReadableStream } from "@tanstack/react-start/rsc";

import { AddressSchema } from "@/schema";
import { AddressHeaderRsc } from "@/frames/address/address-header-rsc";

const getFlightStream = createServerFn({ method: "GET" })
	.inputValidator(v.object({ address: AddressSchema }))
	.handler(({ data }) => renderToReadableStream(<AddressHeaderRsc address={data.address} />));

export const Route = createFileRoute("/rsc/address-header")({
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
